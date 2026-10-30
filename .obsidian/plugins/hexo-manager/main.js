const { Plugin, ItemView, Modal, Notice, Setting, TFile, MarkdownView } = require('obsidian');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIEW_TYPE_HEXO_PREVIEW = 'hexo-manager-preview';

class HexoPreviewView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.frame = null;
    this.url = plugin.previewUrl;
    this.syncButton = null;
  }

  getViewType() {
    return VIEW_TYPE_HEXO_PREVIEW;
  }

  getDisplayText() {
    return 'Hexo 实时预览';
  }

  getIcon() {
    return 'globe';
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.frame = null;
    this.contentEl.empty();
  }

  render() {
    this.contentEl.empty();
    this.contentEl.addClass('hexo-manager-preview-view');
    const toolbar = this.contentEl.createDiv({ cls: 'hexo-manager-preview-toolbar' });
    toolbar.createEl('span', { text: 'Hexo 本地网站' });
    const actions = toolbar.createDiv({ cls: 'hexo-manager-preview-actions' });
    this.syncButton = actions.createEl('button', { text: '' });
    this.syncButton.addEventListener('click', () => this.plugin.toggleScrollSync());
    this.setSyncButtonLabel();
    const reload = actions.createEl('button', { text: '刷新' });
    reload.addEventListener('click', () => this.reload());
    this.frame = this.contentEl.createEl('iframe', {
      cls: 'hexo-manager-preview-frame',
      attr: {
        title: 'Hexo 本地网站预览',
        src: this.url,
        sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
        loading: 'eager',
      },
    });
    this.frame.addEventListener('load', () => this.plugin.syncPreviewScroll());
  }

  setSyncButtonLabel() {
    if (this.syncButton) {
      this.syncButton.setText(this.plugin.syncScrollEnabled ? '同步滚动：开' : '同步滚动：关');
    }
  }

  setUrl(url, force = false) {
    const nextUrl = url || this.plugin.homeUrl;
    const changed = nextUrl !== this.url;
    this.url = nextUrl;
    if (this.frame && (changed || force)) this.reload();
  }

  reload() {
    if (!this.frame) return;
    const separator = this.url.includes('?') ? '&' : '?';
    this.frame.src = `${this.url}${separator}_=${Date.now()}`;
  }

  sendScrollRatio(ratio) {
    if (this.frame?.contentWindow) {
      this.frame.contentWindow.postMessage({ type: 'hexo-manager-scroll', ratio }, '*');
    }
  }
}

function openExternal(url) {
  try {
    const electron = require('electron');
    if (electron.shell && electron.shell.openExternal) {
      void electron.shell.openExternal(url);
      return;
    }
  } catch (_) {
    // Fall back to the browser context when Electron is unavailable.
  }
  window.open(url, '_blank');
}

class TextInputModal extends Modal {
  constructor(app, title, placeholder, onSubmit) {
    super(app);
    this.titleText = title;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
    this.value = '';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: this.titleText });
    new Setting(contentEl)
      .setName('文本')
      .addText((text) => {
        text.setPlaceholder(this.placeholder);
        text.onChange((value) => (this.value = value));
        text.inputEl.focus();
        text.inputEl.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.submit();
          }
        });
      });
    new Setting(contentEl).addButton((button) =>
      button.setButtonText('确定').setCta().onClick(() => this.submit()),
    );
  }

  submit() {
    const value = this.value.trim();
    if (!value) return;
    this.close();
    void this.onSubmit(value);
  }
}

class ConfirmModal extends Modal {
  constructor(app, commitMessage, entries, onConfirm) {
    super(app);
    this.commitMessage = commitMessage;
    this.entries = entries;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('p', { text: '将构建网站、提交并推送以下变更：' });
    const list = contentEl.createDiv({ cls: 'hexo-manager-status-list' });
    for (const entry of this.entries) {
      const row = list.createDiv({ cls: 'hexo-manager-status-row' });
      row.createEl('span', { text: entry.code, cls: 'hexo-manager-status-code' });
      row.createEl('span', { text: entry.path, cls: 'hexo-manager-status-path' });
    }
    contentEl.createEl('p', { text: `提交说明：${this.commitMessage}` });
    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText('取消').onClick(() => this.close()),
      )
      .addButton((button) =>
        button.setButtonText('确认').setWarning().onClick(() => {
          this.close();
          void this.onConfirm();
        }),
      );
  }
}

module.exports = class HexoManagerPlugin extends Plugin {
  async onload() {
    this.settings = (await this.loadData()) || {};
    this.syncScrollEnabled = this.settings.syncScrollEnabled === true;
    this.serverProcess = null;
    this.root = this.app.vault.adapter.getBasePath();
    this.homeUrl = 'http://localhost:4000/';
    this.previewUrl = this.homeUrl;
    this.previewSourcePath = null;
    this.previewRefreshTimer = null;
    this.editorScrollElement = null;
    this.editorScrollHandler = null;
    this.editorAttachTimer = null;
    this.scrollSyncRaf = null;
    this.registerView(VIEW_TYPE_HEXO_PREVIEW, (leaf) => new HexoPreviewView(leaf, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
      if (leaf && leaf.view && leaf.view.getViewType?.() === VIEW_TYPE_HEXO_PREVIEW) return;
      this.updatePreviewTarget();
      this.attachEditorScroll();
    }));
    this.registerEvent(this.app.vault.on('modify', (file) => {
      if (file.path === this.previewSourcePath) this.schedulePreviewRefresh();
    }));

    this.addCommand({
      id: 'hexo-new-post',
      name: 'Hexo: 新建文章',
      callback: () =>
        new TextInputModal(this.app, '新建 Hexo 文章', '文章标题', (title) =>
          this.newPost(title),
        ).open(),
    });

    this.addCommand({
      id: 'hexo-build',
      name: 'Hexo: 构建网站',
      callback: () => this.runHexo(['generate'], '网站构建'),
    });

    this.addCommand({
      id: 'hexo-start-server',
      name: 'Hexo: 启动本地预览',
      callback: () => this.startServer(),
    });

    this.addCommand({
      id: 'hexo-stop-server',
      name: 'Hexo: 停止本地预览',
      callback: () => this.stopServer(),
    });

    this.addCommand({
      id: 'hexo-open-server',
      name: 'Hexo: 打开本地网站',
      callback: () => openExternal('http://localhost:4000'),
    });

    this.addCommand({
      id: 'hexo-open-sidebar-preview',
      name: 'Hexo: 打开侧边栏预览',
      callback: () => this.openPreviewView(),
    });

    this.addCommand({
      id: 'hexo-publish',
      name: 'Hexo: 发布到 Git 远程仓库',
      callback: () => this.openPublishDialog(),
    });

    this.registerDomEvent(window, 'message', (event) => this.handlePreviewMessage(event));

    this.registerMarkdownPostProcessor((element) => {
      for (const image of Array.from(element.querySelectorAll('img[src]'))) {
        const vaultPath = this.assetVaultPath(image.getAttribute('src'));
        if (!vaultPath) continue;
        const file = this.app.vault.getAbstractFileByPath(vaultPath);
        if (file instanceof TFile) {
          image.setAttribute('src', this.app.vault.getResourcePath(file));
        }
      }
    });

    this.addRibbonIcon('rocket', 'Hexo 本地预览', () => this.startServer());
    this.addRibbonIcon('panel-right', 'Hexo 侧边栏预览', () => this.openPreviewView());
    this.updatePreviewTarget();
    this.attachEditorScroll();
    this.refreshScrollSyncControls();
  }

  onunload() {
    if (this.previewRefreshTimer) window.clearTimeout(this.previewRefreshTimer);
    if (this.editorAttachTimer) window.clearTimeout(this.editorAttachTimer);
    if (this.scrollSyncRaf) window.cancelAnimationFrame(this.scrollSyncRaf);
    this.detachEditorScroll();
    this.stopServer();
  }

  openPublishDialog() {
    new TextInputModal(
      this.app,
      '发布说明',
      '例如：更新论文笔记',
      (message) => this.confirmPublish(message),
    ).open();
  }

  handlePreviewMessage(event) {
    if (event.data?.type !== 'hexo-manager-publish') return;
    const fromPreview = this.app.workspace
      .getLeavesOfType(VIEW_TYPE_HEXO_PREVIEW)
      .some((leaf) => leaf.view instanceof HexoPreviewView && leaf.view.frame?.contentWindow === event.source);
    if (fromPreview) this.openPublishDialog();
  }

  async toggleScrollSync() {
    this.syncScrollEnabled = !this.syncScrollEnabled;
    this.settings.syncScrollEnabled = this.syncScrollEnabled;
    await this.saveData(this.settings);
    if (this.syncScrollEnabled) {
      this.attachEditorScroll();
      this.syncPreviewScroll();
    } else {
      this.detachEditorScroll();
    }
    this.refreshScrollSyncControls();
  }

  refreshScrollSyncControls() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_HEXO_PREVIEW)) {
      if (leaf.view instanceof HexoPreviewView) leaf.view.setSyncButtonLabel();
    }
  }

  findEditorScrollElement() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    return view.editor?.cm?.scrollDOM || view.contentEl.querySelector('.cm-scroller');
  }

  attachEditorScroll() {
    this.detachEditorScroll();
    if (!this.syncScrollEnabled) return;
    const element = this.findEditorScrollElement();
    if (!element) {
      if (this.editorAttachTimer) window.clearTimeout(this.editorAttachTimer);
      this.editorAttachTimer = window.setTimeout(() => this.attachEditorScroll(), 250);
      return;
    }
    this.editorScrollElement = element;
    this.editorScrollHandler = () => this.scheduleScrollSync();
    element.addEventListener('scroll', this.editorScrollHandler, { passive: true });
    this.scheduleScrollSync();
  }

  detachEditorScroll() {
    if (this.editorScrollElement && this.editorScrollHandler) {
      this.editorScrollElement.removeEventListener('scroll', this.editorScrollHandler);
    }
    this.editorScrollElement = null;
    this.editorScrollHandler = null;
  }

  scheduleScrollSync() {
    if (!this.syncScrollEnabled || this.scrollSyncRaf) return;
    this.scrollSyncRaf = window.requestAnimationFrame(() => {
      this.scrollSyncRaf = null;
      this.syncPreviewScroll();
    });
  }

  syncPreviewScroll() {
    if (!this.syncScrollEnabled) return;
    const element = this.editorScrollElement || this.findEditorScrollElement();
    if (!element) return;
    const max = Math.max(0, element.scrollHeight - element.clientHeight);
    const ratio = max > 0 ? Math.min(1, Math.max(0, element.scrollTop / max)) : 0;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_HEXO_PREVIEW)) {
      if (leaf.view instanceof HexoPreviewView) leaf.view.sendScrollRatio(ratio);
    }
  }

  previewUrlForFile(file) {
    if (!file || file.extension !== 'md' || !file.path.startsWith('source/_posts/')) {
      return this.homeUrl;
    }
    const cache = this.app.metadataCache.getFileCache(file);
    const value = cache && cache.frontmatter && cache.frontmatter.date;
    const dateText = String(value || '');
    const match = dateText.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const date = match
      ? { year: match[1], month: match[2].padStart(2, '0'), day: match[3].padStart(2, '0') }
      : (() => {
          const fallback = new Date(file.stat.mtime);
          return {
            year: String(fallback.getFullYear()),
            month: String(fallback.getMonth() + 1).padStart(2, '0'),
            day: String(fallback.getDate()).padStart(2, '0'),
          };
        })();
    const relative = file.path
      .slice('source/_posts/'.length)
      .replace(/\.md$/i, '')
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${this.homeUrl}${date.year}/${date.month}/${date.day}/${relative}/`;
  }

  updatePreviewTarget() {
    const file = this.app.workspace.getActiveFile();
    this.previewSourcePath = file && file.path.startsWith('source/_posts/') ? file.path : null;
    this.previewUrl = this.previewUrlForFile(file);
    this.refreshPreviewViews();
  }

  schedulePreviewRefresh() {
    if (this.previewRefreshTimer) window.clearTimeout(this.previewRefreshTimer);
    this.previewRefreshTimer = window.setTimeout(() => {
      this.previewRefreshTimer = null;
      this.refreshPreviewViews(true);
    }, 800);
  }

  assetVaultPath(source) {
    if (!source) return null;
    let value = source.trim();
    if (!value || /^data:/i.test(value) || /^https?:\/\//i.test(value)) return null;
    if (value.startsWith('//assets/')) value = value.slice(1);
    try {
      value = decodeURIComponent(value);
    } catch (_) {
      return null;
    }
    value = value.replace(/\\/g, '/').split(/[?#]/, 1)[0];
    const match = value.match(/(?:^|\/)(?:source\/)?assets\/(.+)$/i);
    return match ? `source/assets/${match[1]}` : null;
  }

  async openPreviewView() {
    this.updatePreviewTarget();
    this.startServer(false);
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice('无法打开侧边栏预览');
      return;
    }
    await leaf.setViewState({ type: VIEW_TYPE_HEXO_PREVIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
    window.setTimeout(() => this.refreshPreviewViews(), 1500);
  }

  refreshPreviewViews(force = false) {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_HEXO_PREVIEW)) {
      if (leaf.view instanceof HexoPreviewView) leaf.view.setUrl(this.previewUrl, force);
    }
  }

  command(name, args) {
    if (process.platform === 'win32' && ['npm', 'npx', 'hexo'].includes(name)) {
      return { file: `${name}.cmd`, args };
    }
    return { file: name, args };
  }

  hexoCommand() {
    const script = path.join(this.root, 'node_modules', 'hexo', 'bin', 'hexo');
    if (!fs.existsSync(script)) {
      throw new Error(`找不到 Hexo：${script}\n请先在博客目录运行 npm install。`);
    }
    return { file: this.nodeBinary(), args: [script] };
  }

  run(name, args, label) {
    const command = this.command(name, args);
    return this.runFile(command.file, command.args, label);
  }

  nodeBinary() {
    const candidates = [];
    if (process.env.NODE_BINARY) candidates.push(process.env.NODE_BINARY);
    if (path.basename(process.execPath).toLowerCase() === 'node.exe') {
      candidates.push(process.execPath);
    }
    const pathValue = process.env.PATH || process.env.Path || '';
    for (const entry of pathValue.split(path.delimiter)) {
      if (entry) candidates.push(path.join(entry, process.platform === 'win32' ? 'node.exe' : 'node'));
    }
    if (process.platform === 'win32') {
      for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
        if (!base || !fs.existsSync(base)) continue;
        try {
          for (const name of fs.readdirSync(base)) {
            if (/^node(?:-v.*)?$/i.test(name)) candidates.push(path.join(base, name, 'node.exe'));
          }
        } catch (_) {
          // Ignore inaccessible installation directories.
        }
      }
    }
    return candidates.find((candidate) => fs.existsSync(candidate)) || 'node';
  }

  runFile(file, args, label) {
    return new Promise((resolve, reject) => {
      const child = spawn(file, args, {
        cwd: this.root,
        windowsHide: true,
        shell: false,
      });
      let output = '';
      child.stdout.on('data', (data) => (output += data.toString()));
      child.stderr.on('data', (data) => (output += data.toString()));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`${label}失败（退出码 ${code}）\n${output.slice(-2000)}`));
      });
    });
  }

  async runHexo(args, label) {
    new Notice(`${label}中...`);
    try {
      const hexo = this.hexoCommand();
      await this.runFile(hexo.file, [...hexo.args, ...args], label);
      this.refreshPreviewViews(true);
      new Notice(`${label}完成`);
    } catch (error) {
      new Notice(error.message, 10000);
    }
  }

  async newPost(title) {
    try {
      const hexo = this.hexoCommand();
      await this.runFile(hexo.file, [...hexo.args, 'new', 'post', title], '新建文章');
      new Notice(`已创建文章：${title}`);
    } catch (error) {
      new Notice(error.message, 10000);
    }
  }

  startServer(openBrowser = true) {
    if (this.serverProcess && !this.serverProcess.killed) {
      new Notice('本地预览已经在运行');
      if (openBrowser) openExternal('http://localhost:4000');
      return;
    }
    let command;
    try {
      const hexo = this.hexoCommand();
      command = { file: hexo.file, args: [...hexo.args, 'server'] };
    } catch (error) {
      new Notice(error.message, 10000);
      return;
    }
    this.serverProcess = spawn(command.file, command.args, {
      cwd: this.root,
      windowsHide: true,
      shell: false,
    });
    this.serverProcess.on('error', (error) => new Notice(`本地预览启动失败：${error.message}`, 10000));
    this.serverProcess.on('close', () => (this.serverProcess = null));
    new Notice('本地预览已启动：http://localhost:4000');
    if (openBrowser) window.setTimeout(() => openExternal('http://localhost:4000'), 1200);
  }

  stopServer() {
    if (!this.serverProcess || this.serverProcess.killed) return;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(this.serverProcess.pid), '/T', '/F'], {
        windowsHide: true,
      });
    } else {
      this.serverProcess.kill('SIGTERM');
    }
    this.serverProcess = null;
    new Notice('本地预览已停止');
  }

  async publish(message) {
    new Notice('正在构建并发布...');
    try {
      const hexo = this.hexoCommand();
      await this.runFile(hexo.file, [...hexo.args, 'generate'], '网站构建');
      this.refreshPreviewViews(true);
      await this.run('git', ['add', '-A'], '暂存变更');
      await this.run('git', ['commit', '-m', message], '创建提交');
      await this.run('git', ['push'], '推送远程仓库');
      new Notice('网站已构建并推送到远程仓库');
    } catch (error) {
      new Notice(error.message, 12000);
    }
  }

  async confirmPublish(message) {
    try {
      const status = await this.run(
        'git',
        ['-c', 'core.quotepath=false', 'status', '--short'],
        '读取 Git 状态',
      );
      if (!status.trim()) {
        new Notice('没有待发布的变更');
        return;
      }
      const entries = status
        .trim()
        .split(/\r?\n/)
        .map((line) => ({
          code: line.slice(0, 2).trim() || '??',
          path: line.slice(3).trim(),
        }))
        .filter((entry) => entry.path);
      new ConfirmModal(
        this.app,
        message,
        entries,
        () => this.publish(message),
      ).open();
    } catch (error) {
      new Notice(error.message, 10000);
    }
  }
};
