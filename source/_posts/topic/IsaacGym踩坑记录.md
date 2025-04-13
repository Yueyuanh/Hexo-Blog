---
title: Isaac Gym踩坑记录
date: 2025-04-06 13:34:31
topic: RL
tags: RL
cover: /assets/RL/CartpoleCmd.png
banner: /assets/RL/CartpoleCmd.png
poster:    # 海报
  topic: RL学习记录  # 可选
  headline:   # 必选
  caption:  # 可选
  color: black 
index_topic:
  menu_id: topic  
---

Isaac Gym 是由Nvidia推出的机器人强化学习训练框架，可以实现多智能体并行训练，可快速实现自定义机器人模型训练和迁移。

<!-- more -->

# Isaac Gym踩坑记录

## TODO List


- [x] Catpole
- [x] cfg yaml
- [x] capture_video
- [x] wandb
- [ ] - [ ] mujoco
- [ ] @torch.jit.script
- [ ] torch API

### Temp ideas

- [x] [神经网络可视化](https://netron.app/)  (ONNX)



## NVIDIA ISAAC

​	在NVIDIA官网的IsaacGym安装包是Python中`isaacgym`的安装包，同时应当在本地建立conda环境(bash:rl)，方便环境管理，若在远程部署则可以使用docker完成快速部署训练。

​	除此之外，NVIDIA推出了新的机器人强化学习仿真平台，IsaacSim & IsaacLab，相较于IsaacGym，IS&IL有类似Unity的可视化的操作界面，方便资产管理与开发，同时能够更好的与其硬件做适配，也有更加丰富的功能，同时对硬件的要求也更高(>RTX 3070)。

​	尽管，IsaacGym已经逐渐落伍，但有前辈借助其完成了很多出色的任务([legged_gym](https://github.com/Yueyuanh/legged_gym.git))，并以此打开了笔者学习强化学习的大门，其还是有很大的学习必要的，作为初学和了解强化学习的基本流程是很合适的（限于3050的老破小）。

## IsaacGymEnvs



​	于此同时，NVIDIA也开源了其基于IsaacGym的开发框架即`IsaacGymEnvs`，其中包含一些利用IsaacGym实现机器人强化学习训练的丰富例程，都是采用PPO进行训练，以供学习者进行开发、实验。

​	为了方便管理学习记录和开发流程，在自己的Github下fork了官方的IsaacGymEnvs（Github：https://github.com/Yueyuanh/IsaacGymEnvs.git）。

# IsaacGymEnvs Note

## IsaacGymEnvs 代码框架

### 1.文件结构

.
├── `assets`  //资产文件:URDF、MJCF(mujoco) 
│   ├── asset_templates
│   ├── mjcf
│   │   └── open_ai_assets
│   │       ├── fetch
│   │       ├── hand
│   │       ├── stls
│   │       │   ├── fetch
│   │       │   └── hand
│   │       └── textures
│   ├── trifinger
│   └── `urdf`
│       ├── anymal_c
│       │   ├── meshes
│       │   └── urdf
│       ├── franka_description
│       ├── kuka_allegro_description
│       ├── sektion_cabinet_model
│       ├── tray
│       └── ycb
├── docs  //官方文档
└── `isaacgymenvs`      //训练主环境
    ├── `cfg`		//配置文件
    │   ├── pbt
    │   ├── runs          //训练网络
    │   ├── task	  //训练环境配置文件 eg.Cartpole.yaml
    │   ├── train 	//强化学习参数配置文件eg.CartpolePPO.yaml
    │   └──` config.yaml` //默认参数
    ├── learning	//？？？
    ├── pbt			//？？？
    ├── `tasks`		//训练任务代码：加载环境、配置奖励、训练过程
    │   ├── `__init__.py`	//训练任务注册
    │   ├── amp
    │   ├── base
    │   └── utils
    ├── utils    //其他模块
    ├── __init__.py    //命令arg初始化
    └── `train.py`       //训练代码

### 2.Hardy Config（参数管理）

#### Hardy

> Hydra 能通过解析和覆写 `config`文件和 `command`命令动态构建多层次配置。

- 可以从多个来源组合的分层配置

- 可以从命令行指定或覆盖配置

- 动态命令行选项卡完成

- 在本地运行您的应用程序或启动它以远程运行

- 使用单个命令以不同的参数运行多个作业
```
  #文件结构
  ├── conf
  │   ├── config.yaml
  │   └── __init__.py  
  └── my_app.py
```

#### OmegaConf

- 支持 [YAML](https://zhida.zhihu.com/search?content_id=239760308&content_type=Article&match_order=1&q=YAML&zhida_source=entity)、[JSON](https://zhida.zhihu.com/search?content_id=239760308&content_type=Article&match_order=1&q=JSON&zhida_source=entity)、[INI](https://zhida.zhihu.com/search?content_id=239760308&content_type=Article&match_order=1&q=INI&zhida_source=entity) 等多种配置文件格式。
- 支持配置文件的嵌套和继承，使配置更具结构和可维护性。
- 提供了强大的[命令行参数解析](https://zhida.zhihu.com/search?content_id=239760308&content_type=Article&match_order=1&q=命令行参数解析&zhida_source=entity)功能，使应用程序可以轻松接受和处理命令行参数。
- 具有友好的 API，可以方便地访问和修改配置信息。

​	OmegaConf 还提供了强大的**命令行参数解析**功能，可以轻松地将命令行参数与配置文件结合使用。要使用命令行参数，需要在配置文件中定义参数，并使用 `@` 符号将其标记为可从命令行接受的参数。

​	例如：

```ymal
training:
  batch_size: 128
  learning_rate: 0.001
  @epochs: 10
```

​	在这个示例中，`@epochs` 是一个可以从命令行接受的参数。

​	使用 OmegaConf 的 `from_cli` 方法，可以轻松解析命令行参数并将其与配置文件合并：

```python
import sys
from omegaconf import OmegaConf

# 解析命令行参数
overrides = OmegaConf.from_cli(sys.argv[1:])

# 将命令行参数与配置文件合并
config = OmegaConf.merge(config, overrides)
```

​	这将能够通过命令行传递参数来修改配置，例如：

```bash
python my_script.py training.@epochs=20
```

​	**这有助于将配置与应用程序逻辑分离，提高了可维护性。  **



### 3.args 训练参数

We use [Hydra](https://hydra.cc/docs/intro/) to manage the config. Note that this has some differences from previous incarnations in older versions of Isaac Gym.

Key arguments to the `train.py` script are:
关键参数为 `train.py` 脚本：

- `task=TASK` 
  选择要使用的任务（这些对应于文件夹 `isaacgymenvs/config/task` 中每个环境的配置）

- `train=TRAIN` 
  选择要使用的训练配置。将自动默认为环境正确的配置（即 `<TASK>PPO` ）。

- `num_envs=NUM_ENVS` 
  选择要使用的环境数量（覆盖任务配置中设置的默认环境数量）。

- `seed=SEED` 

  设置随机化的种子值，并覆盖任务配置中设置的默认种子

- `sim_device=SIM_DEVICE_TYPE`

   用于物理模拟的设备。设置为 `cuda:0` （默认）以使用 GPU，或设置为 `cpu` 以使用 CPU。遵循 PyTorch-like 设备语法。

- `rl_device=RL_DEVICE`

  用于 RL 算法的设备/ID。默认为 `cuda:0` ，也遵循 PyTorch-like 设备语法。

- `graphics_device_id=GRAPHICS_DEVICE_ID`

  用于渲染的 Vulkan 图形设备 ID。默认为 0。注意 - 这可能与 CUDA 设备 ID 不同，并且不遵循 PyTorch 类似的设备语法。

- `pipeline=PIPELINE`
  选择要使用的 API 管道。默认为 `gpu` ，也可以设置为 `cpu` 。当使用 `gpu` 管道时，所有数据都保留在 GPU 上，并且尽可能快地运行。当使用 `cpu` 管道时，模拟可以在 CPU 或 GPU 上运行，具体取决于 `sim_device` 设置，但每一步都会在 CPU 上制作数据的副本。

- `test=TEST`
  如果设置为 `True` ，则仅运行策略推理，不进行任何训练。

- `checkpoint=CHECKPOINT_PATH` 
  设置用于训练或测试的检查点路径。

- `headless=HEADLESS` 
  是否以无头模式运行。

- `experiment=EXPERIMENT`
  设置实验名称。

- `max_iterations=MAX_ITERATIONS` 
  设置运行迭代次数。为提供的环境提供了合理的默认值。

​	hardy还允许在配置文件中直接将变量作为命令行参数设置。例如，要设置 rl_games 训练运行的折扣率，可以使用 `train.params.config.gamma=0.999` 。同样，任务配置中的变量也可以设置。例如， `task.env.enableDebugVis=True` 。

eg:

```bash
#以无渲染模式运行Ant训练任务
python train.py task=Ant headlss=True

#载入已经训练过的模型并继续训练
python train.py task=Ant checkpoint=runs/Ant/nn/Ant.pth

#以回放（play）模式载入训练好的网络，并开启渲染，数量为10
python train.py task=Ant checkpoint=runs/Ant/nn/Ant.pth test=True num_envs=10

```

### 4.代码流程

> Sim ：是指模拟器（ simulator ），是仿真的核心组件。它负责处理物理计算和仿真的所有细节，如动力学、碰撞检测和其他物理交互。 Isaac Gym 使用 NVIDIA PhysX 作为其后端物理引擎，可以高效地在 GPU 上运行。在代码中的体现是，调用 sim 可以完成对模拟器的 step 。

> Env：是指环境（environment），是Agent进行学习和互动的擦和功能所。每个环境包含了特定的任务或场景设置，Agent需要在这些环境中执行操作并获取奖励并学习策略。

> Actor: “Actor”是在仿真中表示具有物理属性的对象，如机器人、物体等。每个Actor包括了用于描述其形状、质量、动力学属性等的各种参数。Actors是智能体与环境互动的主体，例如一个机器人的手臂或车辆。 

> Rigid: “Rigid”，刚体，是一种物理对象，其形状在仿真过程中不会发生变化。在Isaac Gym中，刚体用来表示那些不需要弹性或变形特性的实体。刚体动力学是计算这些对象如何在力和碰撞作用下移动和反应的基础。 

> Index / indcies: 这是一个很容易混淆的概念，特别是在多env多actor，每个actor拥有1个以上rigid时。理解index的索引获取和它代表的对象非常重要。

RL项目整体框架代码流程：

```python
def create_sim(self):
    # implement sim set up and environment creation here
    #    - set up-axis 设置坐标系朝向z-up!
    #    - call super().create_sim with device args (see docstring) 调用super().create_sim，并传入参数
    #    - create ground plane  创建地平面
    #    - set up environments  设置环境
    
#在执行仿真前需要计算的内容，比如智能体的动作计算。我们在这里设置了目标agent受到3个坐标系方向的推力，并且每次增加的是推力的变化量，同时对最大推力进行了限幅。
def pre_physics_step(self, actions):#前处理完成期望和绕道增加
    # implement pre-physics simulation code here
    # 预物理动作
    #    - e.g. apply actions
    #    应用动作等

def post_physics_step(self):#后处理完成观测和奖励更新
    # implement post-physics simulation code here
    #    - e.g. compute reward, compute observations
    #    计算奖励，计算观测值
```

通过reset_buf标志位来判断哪个环境复位，复位条件一般为到达复位摔倒状态或者满足这次回合训练次数：

```python
    # adjust reward for reset agents 复位奖励
    reward = torch.where(torch.abs(cart_pos) > reset_dist, torch.ones_like(reward) * -2.0, reward)#小车位置超出偏差给负数奖励
    reward = torch.where(torch.abs(pole_angle) > np.pi / 2, torch.ones_like(reward) * -2.0, reward)#倒立摆摔倒 给负奖励

    reset = torch.where(torch.abs(cart_pos) > reset_dist, torch.ones_like(reset_buf), reset_buf) #当达到前面条件 reset_buf进行赋值 
    reset = torch.where(torch.abs(pole_angle) > np.pi / 2, torch.ones_like(reset_buf), reset)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)
```

在post后处理时会实时检测那个reset_buf为1，则对对应环境复位：

```python
    def post_physics_step(self):
        self.progress_buf += 1
  
        self.gym.refresh_actor_root_state_tensor(self.sim)#刷新tensor相关数据
        self.gym.refresh_net_contact_force_tensor(self.sim)
        self.gym.refresh_rigid_body_state_tensor(self.sim)
        env_ids = self.reset_buf.nonzero(as_tuple=False).squeeze(-1)
        if len(env_ids) > 0:#检测满足复位标志位1的环境ID
            self.reset_idx(env_ids)
```

常规配置文件：

- 最大训练步骤在PPO.yamll中：

  ```yaml
      score_to_win: 20000
      max_epochs: ${resolve_default:10000,${....max_iterations}}
  ```

  

- 设置环境参数，如个数、控制范围等，在env的yaml中：

	```yaml
    env:
      numEnvs: ${resolve_default:512,${...num_envs}}
      envSpacing: 4.0  #空间尺寸
      resetDist: 3.0   #小车位置复位判断
      maxEffort: 400.0 #最大控制量扭矩
  
      clipObservations: 5.0
      clipActions: 1.0
  
      randomCommandPosRanges: 1 #控制范围
  ```

观测器，读取Agent当前状态：

```python
def compute_observations(self, env_ids=None):
        if env_ids is None:
            env_ids = np.arange(self.num_envs)

        self.gym.refresh_dof_state_tensor(self.sim) #从仿真器获取数据

        self.obs_buf[env_ids, 0] = self.dof_pos[env_ids, 0].squeeze()
        self.obs_buf[env_ids, 1] = self.dof_vel[env_ids, 0].squeeze()
        self.obs_buf[env_ids, 2] = self.dof_pos[env_ids, 1].squeeze()
        self.obs_buf[env_ids, 3] = self.dof_vel[env_ids, 1].squeeze()
```



### 5.Gym API

**API说明：**

(API介绍在isaacgym/docs/api/python/gym_py.html这个文件中，用浏览器打开这个文件查看即可。)

**1) isaacgym.gymapi.Gym.acquire_actor_root_state_tensor()**

检索Actor root states缓冲区，包含位置[0:3], 旋转[3:7], 线速度[7:10], 角速度[10:13]

isaacgym.gymapi.Gym.refresh_actor_root_state_tensor()

更新actor root state缓冲区

**2) saacgym.gymapi.Gym.acquire_dof_state_tensor()**

检索DoF state缓冲区，维度为(num_dofs,2), 每一个dof state包含位置和速度

isaacgym.gymapi.Gym.refresh_dof_state_tensor()

更新DOF state缓冲区

**3) isaacgym.gymapi.Gym.acquire_net_contact_force_tensor()**

检索net contact forces缓冲区，维度为(num_rigid_bodies,3), 每个接触力状态包含x,y,z轴的一个值。

isaacgym.gymapi.Gym.refresh_net_contact_force_tensor()

更新net contact forces缓冲区

**4) isaacgym.gymapi.Gym.acquire_rigid_body_state_tensor()**

检索rigid body states缓冲区，维度为(num_rigid_bodies,13), 每个刚体的状态包含位置[0:3], 旋转[3:7], 线速度[7:10], 角速度[10:13]

isaacgym.gymapi.Gym.refresh_rigid_body_state_tensor()

更新rigid body state缓冲区

**5) saacgym.gymapi.Gym.acquire_force_sensor_tensor()**

检索force sensors缓冲区，维度为(num_force_sensor, 6)，每个力传感器状态包含3维力，3维力矩。

isaacgym.gymapi.Gym.refresh_force_sensor_tensor

更新force sensors缓冲区



### 6.新建任务

`确保同一环境下只有一个IsaacGymEnvs`，注意看key error中的_init_.py文件位置。

```
  ├── isaacgymenvs
  │   ├── cfg
  |   |  ├── task  Cartpole.yaml #新建{task}.yaml,并修改name为{task}
  |   |  └── train CartpolePPO.yaml #新建{task}PPO.yaml
  │   └── tasks    
  |      ├── __init__.py 	 #导入文件，更新字典isaacgym_task_map
  |   	 └── Cartpole_cmd.py #新建训练文件，继承VecTask，新建class CartpoleCmd
  └── train.py
```

### 7.Capture Video

```bash
python train.py task=Cartpole capture_video=True
```

初次有报错：*No such file or directory: 'Xvfb'*

解决：

```bash
pip install fbxsdk

sudo apt update
sudo apt install xvfb

```

`ffmpeg`
在conda环境中：

```
conda install -c conda-forge ffmpeg
```

- 启用快照模式

  ```bash
  python train.py task=CartpoleCmd capture_video=True
  ```

  在启用本模式后会开启无头模式，并会生成每50步的视频

- 调整摄像头角度



### 8.Wandb

wandb（weight and bias）,即权重和偏置，用来观察神经网络训练过程中的数据。

- 安装wandb

  ```bash
  pip install wandb
  ```

- 登陆

  ```bash
  wandb login
  ```

- 在web端创建project，并与cfg/config.yaml中的`wandb_project`的名称一致

  ```python
  wandb_activate: False
  wandb_group: ''
  wandb_name: ${train.params.config.name}
  wandb_entity: ''
  wandb_project: 'isaacgymenvs'
  wandb_tags: []
  wandb_logcode_dir: '' 
  
  ```

- 启用训练并开启wandb调试

    ```bash
    python train.py task=CartpoleCmd wandb_activate=True
    ```



## Examples

### 1.Carpole

==Cartpole.yaml==

```yaml
# used to create the object
name: Cartpole

physics_engine: ${..physics_engine}

if given, will override the device setting in gym.

env:

  numEnvs: ${resolve_default:512,${...num_envs}}

  envSpacing: 4.0

  resetDist: 3.0

  maxEffort: 400.0

  clipObservations: 5.0

  clipActions: 1.0
```

| 参数               | 含义                   | 默认值/示例值 |
| :----------------- | :--------------------- | :------------ |
| `numEnvs`          | 并行环境的数量         | 512           |
| `envSpacing`       | 并行环境之间的间距     | 4.0           |
| `resetDist`        | 环境重置时的初始距离   | 3.0           |
| `maxEffort`        | 智能体可以施加的最大力 | 400.0         |
| `clipObservations` | 观测值的裁剪范围       | 5.0           |
| `clipActions`      | 动作值的裁剪范围       | 1.0           |

#### ==reward==

##### 奖励函数:

```python
# Cartpole 
reward = 1.0 - pole_angle * pole_angle - 0.01 * torch.abs(cart_vel) - 0.005 * torch.abs(pole_vel)

```

$$
R=1-\phi_{pole}^2-0.01 \cdot \mid v_{cart} \mid -0.005 \cdot \mid \omega_{pole} \mid
$$

```python
#CartpoleCmd
reward = 1.0 - pole_angle * pole_angle*0.5 - 0.01 * torch.abs(cart_vel) - 0.01 * torch.abs(pole_vel) - torch.abs(command-cart_pos)*0.8
```
$$
R=1-\phi_{pole}^2-0.01 \cdot \mid v_{cart} \mid -0.005 \cdot \mid \omega_{pole} \mid - \mid x_{set} - x_{cart} \mid \cdot 0.8
$$

- `1.0`: 这是基础奖励，每个时间步都开始时都会有这个奖励。

- `pole_angle * pole_angle * 0.5`: 这个部分表示摆杆的角度偏离竖直状态时的惩罚。`pole_angle`越大，`pole_angle * pole_angle`值越大，所以这个项会对偏离竖直的角度进行惩罚，确保摆杆保持尽可能接近垂直。

- `0.01 * torch.abs(cart_vel)`: 这部分惩罚小车的速度，确保小车尽量保持稳定，避免过快的移动。

- `0.01 * torch.abs(pole_vel)`: 惩罚摆杆的角速度，确保摆杆不会晃动得太厉害。

- `torch.abs(command - cart_pos) * 0.8`: 惩罚小车当前位置与期望位置之间的偏差，`command`代表期望的小车位置。这样可以鼓励智能体控制小车朝着目标位置移动。



##### 调整奖励:

```python
reward = torch.where(torch.abs(cart_pos) > reset_dist, torch.ones_like(reward) * -2.0, reward)
reward = torch.where(torch.abs(pole_angle) > np.pi / 2, torch.ones_like(reward) * -2.0, reward)

```

如果小车的位置超出了`reset_dist`（即小车跑得太远），

或者摆杆的角度超过了`π/2`（即摆杆完全倒下），

则奖励会变为-2，表示回合结束，智能体失败。

>==torch.where()常规用法==
>
>torch.where(condition, x, y)
>
>根据条件，也就是condiction，返回从x或y中选择的元素的张量（这里会创建一个新的张量，新张量的元素就是从x或y中选的，形状要符合x和y的广播条件）。
>
>Parameters解释如下：
>
>1、condition (bool型张量) ：当condition为真，返回x的值，否则返回y的值
>
>2、x (张量或标量)：当condition=True时选x的值
>
>2、y (张量或标量)：当condition=False时选y的值



##### 重置标志

```python
reset = torch.where(torch.abs(cart_pos) > reset_dist, torch.ones_like(reset_buf), reset_buf)
reset = torch.where(torch.abs(pole_angle) > np.pi / 2, torch.ones_like(reset_buf), reset)
reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

```

如果小车的位置超出了`reset_dist`，或者摆杆的角度超出了`π/2`，或者回合已经走到了最大步数（`max_episode_length`），那么`reset`标志就会被设为1，表示当前回合需要复位（失败）。否则保持原来的`reset_buf`值。
