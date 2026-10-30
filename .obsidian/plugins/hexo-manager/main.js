const { Plugin, Modal, Notice, Setting, TFile } = require('obsidian');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    this.serverProcess = null;
    this.root = this.app.vault.adapter.getBasePath();

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
      id: 'hexo-publish',
      name: 'Hexo: 发布到 Git 远程仓库',
      callback: () =>
        new TextInputModal(
          this.app,
          '发布说明',
          '例如：更新论文笔记',
          (message) => this.confirmPublish(message),
        ).open(),
    });

    this.registerMarkdownPostProcessor((element) => {
      for (const image of Array.from(element.querySelectorAll('img[src]'))) {
        const source = image.getAttribute('src');
        const match = source && source.match(/^(?:\.\/|\/)?(?:source\/)?assets\/(.+)$/);
        if (!match) continue;
        const file = this.app.vault.getAbstractFileByPath(`source/assets/${match[1]}`);
        if (file instanceof TFile) {
          image.setAttribute('src', this.app.vault.getResourcePath(file));
        }
      }
    });

    this.addRibbonIcon('rocket', 'Hexo 本地预览', () => this.startServer());
  }

  onunload() {
    this.stopServer();
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

  startServer() {
    if (this.serverProcess && !this.serverProcess.killed) {
      new Notice('本地预览已经在运行');
      openExternal('http://localhost:4000');
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
    window.setTimeout(() => openExternal('http://localhost:4000'), 1200);
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
        entries,
        () => this.publish(message),
      ).open();
    } catch (error) {
      new Notice(error.message, 10000);
    }
  }
};
