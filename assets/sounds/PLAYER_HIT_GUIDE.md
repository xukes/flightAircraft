# 🎯 玩家被击中音效指南

## 新增功能
游戏现在为玩家被击中添加了专门的音效系统，提供不同类型的伤害反馈：

### 音效类型

#### 1. 碰撞伤害 (Collision)
**触发时机**: 玩家与敌人飞机直接碰撞
**音效特点**:
- 音调更低沉 (0.6-0.9 倍速)
- 更有冲击感
- 伤害值: 20点

**代码实现**:
```typescript
this.audioManager.playWithPitchVariation('playerHit', 0.6, 0.9);
```

#### 2. 子弹伤害 (Bullet)
**触发时机**: 被敌人子弹击中
**音效特点**:
- 标准音调 (0.8-1.1 倍速)
- 清晰的击中声
- 伤害值: 10点

**代码实现**:
```typescript
this.audioManager.playWithPitchVariation('playerHit', 0.8, 1.1);
```

#### 3. 激光伤害 (Laser)
**触发时机**: 被敌人激光击中（如果将来有敌人激光）
**音效特点**:
- 高音调 (1.2-1.5 倍速)
- 较低音量 (70%)
- 尖锐的灼烧感

**代码实现**:
```typescript
this.audioManager.playSound('playerHit', {
    rate: Phaser.Math.FloatBetween(1.2, 1.5),
    volume: 0.7
});
```

## 音效文件要求

### 文件名: `playerHit.wav`
- **格式**: WAV
- **长度**: 0.2-0.5秒
- **风格**: 建议使用金属撞击或电子受损音效
- **音调**: 中等音调，适合各种音调变化

### 制作建议 (使用Bfxr)
1. **基础音效**: 点击 "Hit" 或 "Explosion" 预设
2. **调整参数**:
   - 缩短 attack 时间让声音更干脆
   - 调整 decay 控制声音持续时间
   - 增加一些 bit crush 效果增加数字感
3. **音调**: 选择中等音调，便于后续变化

## 技术实现

### 音效管理器更新
```typescript
// AudioManager.ts 中已添加
const soundFiles = [
    'shoot', 'explosion', 'hit', 'playerHit', 'powerup',
    'laser', 'lightning', 'enemyShoot', 'gameOver'
];
```

### 游戏逻辑集成
```typescript
// MainScene.ts 中的伤害系统
takeDamage(amount: number, damageType: 'collision' | 'bullet' | 'laser' = 'bullet') {
    // 根据伤害类型播放不同音效
    if (damageType === 'collision') {
        this.audioManager.playWithPitchVariation('playerHit', 0.6, 0.9);
    } else if (damageType === 'bullet') {
        this.audioManager.playWithPitchVariation('playerHit', 0.8, 1.1);
    }
    // ... 视觉反馈和游戏逻辑
}
```

## 测试步骤

1. **基础测试**: 放置 `playerHit.wav` 文件到 `assets/sounds/`
2. **子弹测试**: 让敌人子弹击中玩家，应该听到标准击中音效
3. **碰撞测试**: 直接撞向敌人，应该听到低沉的碰撞音效
4. **音调变化**: 多次被击中，每次音调应该略有不同

## 音效设计要点

### 与敌人击中音效的区别
- `hit.wav` - 敌人被击中（清脆的破坏声）
- `playerHit.wav` - 玩家被击中（更有金属感的受损声）

### 音量平衡
- 玩家被击中音效应该比敌人被击中更引人注意
- 但不要过于响亮，避免干扰游戏体验

### 情感反馈
- **碰撞**: 低沉音调传达严重伤害
- **子弹**: 标准音调传达中等伤害
- **激光**: 高音调传达轻微但快速的伤害

现在玩家被击中时有了专门的音效反馈，提升了游戏的沉浸感！🎮✨