# 🚀 快速音效获取指南

## 最快的方法：Bfxr 在线生成器

### 步骤1：打开网站
访问 https://bfxr.net/

### 步骤2：生成基础音效

#### 🔫 射击音效 (shoot.wav)
1. 点击 "Randomize" 几次直到得到满意的效果
2. 或者点击预设按钮：
   - "Laser" - 激光射击
   - "Shoot" - 普通射击
3. 调整参数（可选）：
   - Attack: 调小一些让声音更干脆
   - Decay: 调整声音持续时间
4. 点击下载，保存为 `shoot.wav`

#### 💥 爆炸音效 (explosion.wav)
1. 点击 "Explosion" 预设
2. 如果不满意，点击 "Randomize"
3. 调整 "Bit Crush" 增加数字感
4. 下载为 `explosion.wav`

#### ⚡ 激光音效 (laser.wav)
1. 点击 "Laser" 预设
2. 增加 sustain 时间让激光持续
3. 降低 pitch 让声音更低沉
4. 下载为 `laser.wav`

#### 🔋 道具音效 (powerup.wav)
1. 点击 "Powerup" 预设
2. 增加 "Vibrato" 让声音更有趣
3. 提高 pitch 让声音更明亮
4. 下载为 `powerup.wav`

#### ⚡ 闪电音效 (lightning.wav)
1. 从 "Explosion" 开始
2. 增加 "Low Pass Filter"
3. 添加 "Delay" 效果
4. 下载为 `lightning.wav`

#### 🎯 敌人射击 (enemy_shoot.wav)
1. 类似玩家射击，但调低 pitch
2. 可以增加一些噪音
3. 下载为 `enemy_shoot.wav`

#### 😵 击中音效 (hit.wav)
1. 从 "Hit" 预设开始
2. 调整参数获得短促的击中声
3. 下载为 `hit.wav`

#### 💀 游戏结束 (game_over.wav)
1. 使用低沉的音调
2. 较长的持续时间
3. 可以组合几个音效
4. 下载为 `game_over.wav`

### 步骤3：背景音乐 (background_music.mp3)
推荐从以下免费资源获取：
- https://freemusicarchive.org/
- https://www.youtube.com/audiolibrary/music
- 搜索关键词： "8bit background", "chiptune music", "retro gaming music"

### 步骤4：放置文件
将所有下载的文件放入 `assets/sounds/` 文件夹：
```
assets/sounds/
├── shoot.wav
├── explosion.wav
├── hit.wav
├── powerup.wav
├── laser.wav
├── lightning.wav
├── enemy_shoot.wav
├── game_over.wav
└── background_music.mp3
```

## 替代方案：直接下载预制音效包

如果你不想自己制作，可以搜索以下关键词：

### 免费音效包
- "free 8bit sound effects pack"
- "retro game sounds free"
- "chiptune sound effects"

### 推荐网站
1. **OpenGameArt.org** - 专门的免费游戏资源
2. **itch.io** - 许多免费的音效包
3. **GameDev Market** - 有些免费资源

## 音效文件格式要求

- **格式**: WAV (音效), MP3 (音乐)
- **大小**: 尽量保持文件较小（<100KB per sound effect）
- **质量**: 16-bit, 44.1kHz 对于游戏音效来说足够了

## 快速测试

完成音效准备后，运行游戏并测试：
1. 启动游戏：`npm run dev`
2. 按M键测试静音/取消静音
3. 射击、收集道具、击败敌人测试各种音效

如果某个音效没有播放，检查：
1. 文件名是否正确
2. 文件是否在正确位置
3. 文件格式是否支持

## 质量提示

好的游戏音效应该：
- **短促**: 大部分游戏音效应该在0.1-1秒内
- **清晰**: 不要太复杂或嘈杂
- **有特色**: 不同音效应该容易区分
- **不突兀**: 音量适中，不会让玩家不舒服

现在你的游戏就可以拥有完整的音效了！🎮✨