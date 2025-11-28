// 获取系统信息
const systemInfo = tt.getSystemInfoSync();
const canvas = tt.createCanvas();
const ctx = canvas.getContext('2d');

// 屏幕尺寸
const screenWidth = systemInfo.windowWidth;
const screenHeight = systemInfo.windowHeight;

// 游戏常量
const PLAYER_SIZE = 50;
const BULLET_SIZE = 6;
const ENEMY_SIZE = 40;
const BULLET_SPEED = 8; // 降低子弹速度
const ENEMY_SPEED = 2.5; // 降低敌机速度
const SPAWN_RATE = 40;
const PLAYER_MAX_HP = 100;
const MAX_WEAPON_LEVEL = 4;
const MAX_SKILL_COUNT = 5;

// 游戏状态
// 游戏状态
let player = {
    x: screenWidth / 2 - PLAYER_SIZE / 2,
    y: screenHeight - PLAYER_SIZE - 50,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: '#409EFF',
    hp: PLAYER_MAX_HP,
    weaponLevel: 1,
    skills: {
        fire: 0, // 火力加强
        bomb: 0  // 全屏伤害
    },
    buffs: {
        fireTime: 0, // 火力加强剩余时间
        bombTime: 0  // 全屏伤害剩余时间
    }
};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let bgObjects = [];
let powerups = []; // 道具
let score = 0;
let frameCount = 0;
let isGameOver = false;

// 按钮区域
const btnSize = 60;
const btnMargin = 20;
const btnY = screenHeight - btnSize - btnMargin;
const btnFireRect = { x: btnMargin, y: btnY, w: btnSize, h: btnSize };
const btnBombRect = { x: screenWidth - btnSize - btnMargin, y: btnY, w: btnSize, h: btnSize };

// 触摸事件处理
tt.onTouchStart((res) => {
    if (isGameOver) {
        restartGame();
        return;
    }

    const touch = res.touches[0];
    const tx = touch.clientX;
    const ty = touch.clientY;

    // 检测技能按钮点击
    if (isPointInRect(tx, ty, btnFireRect)) {
    if (player.skills.fire > 0 && player.buffs.fireTime <= 0) {
        player.skills.fire--;
        player.buffs.fireTime = 300; // 5秒 (60fps)
    }
    } else if (isPointInRect(tx, ty, btnBombRect)) {
        if (player.skills.bomb > 0 && player.buffs.bombTime <= 0) {
            player.skills.bomb--;
            player.buffs.bombTime = 180; // 3秒
        }
    }
});

tt.onTouchMove((res) => {
    if (isGameOver) return;
    const touch = res.touches[0];
    
    // 直接跟随手指移动，恢复精准控制
    player.x = touch.clientX - PLAYER_SIZE / 2;
    player.y = touch.clientY - PLAYER_SIZE / 2;

    if (player.x < 0) player.x = 0;
    if (player.x > screenWidth - PLAYER_SIZE) player.x = screenWidth - PLAYER_SIZE;
    if (player.y < 0) player.y = 0;
    if (player.y > screenHeight - PLAYER_SIZE) player.y = screenHeight - PLAYER_SIZE;
});

function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// 重置游戏
function restartGame() {
    player.x = screenWidth / 2 - PLAYER_SIZE / 2;
    player.y = screenHeight - PLAYER_SIZE - 50;
    player.hp = PLAYER_MAX_HP;
    player.weaponLevel = 1;
    player.skills = { fire: 0, bomb: 0 };
    player.buffs = { fireTime: 0, bombTime: 0 };
    
    bullets = [];
    enemyBullets = [];
    enemies = [];
    bgObjects = [];
    powerups = [];
    score = 0;
    frameCount = 0;
    isGameOver = false;
    
    for(let i=0; i<10; i++) {
        spawnBgObject(Math.random() * screenHeight);
    }
    
    loop();
}

// 游戏主循环
function loop() {
    if (isGameOver) {
        drawGameOver();
        return;
    }

    update();
    draw();
    
    requestAnimationFrame(loop);
}

// 更新逻辑
function update() {
    frameCount++;

    // 更新Buff
    if (player.buffs.fireTime > 0) player.buffs.fireTime--;
    if (player.buffs.bombTime > 0) {
        player.buffs.bombTime--;
        // 全屏伤害逻辑：每10帧造成一次伤害
        if (frameCount % 10 === 0) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                e.hp -= 2;
                if (e.hp <= 0) {
                    // 敌机死亡，概率掉落技能点
                    if (Math.random() < 0.5) {
                        spawnSkillDrop(e.x, e.y);
                    }
                    enemies.splice(i, 1);
                    score += 10;
                }
            }
        }
    }

    // 背景生成
    if (frameCount % 20 === 0) spawnBgObject(-100);
    updateBackground();

    // 敌机生成
    if (frameCount % SPAWN_RATE === 0) {
        const type = Math.floor(Math.random() * 6);
        // 根据类型设定血量
        let hp = 3;
        if (type === 2) hp = 8; // 重装
        if (type === 3) hp = 5; // 轰炸
        
        enemies.push({
            x: Math.random() * (screenWidth - ENEMY_SIZE),
            y: -ENEMY_SIZE,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE,
            type: type,
            hp: hp,
            maxHp: hp,
            vx: (Math.random() - 0.5) * 3, // 增加横向速度范围
            moveType: Math.random() < 0.2 ? 0 : (Math.random() < 0.6 ? 1 : 2) // 减少直飞(0)的概率，增加正弦(1)和斜向(2)
        });
    }

    // 道具生成 (小概率)
    if (frameCount % 600 === 0) {
        const r = Math.random();
        let type = 'health';
        if (r > 0.7) type = 'weapon';
        
        powerups.push({
            x: Math.random() * (screenWidth - 30),
            y: -30,
            width: 30,
            height: 30,
            type: type,
            speed: 2
        });
    }

    // 玩家射击
    let fireRate = 12;
    if (player.buffs.fireTime > 0) fireRate = 6; // 技能期间射速翻倍
    if (frameCount % fireRate === 0) {
        firePlayerBullet();
    }

    // 敌机射击
    enemies.forEach(e => {
        if (Math.random() < 0.01) { 
            enemyBullets.push({
                x: e.x + e.width / 2 - 3,
                y: e.y + e.height,
                width: 6,
                height: 10,
                color: '#FF0000',
                vx: 0,
                vy: 6
            });
        }
    });

    updateEntities();
    checkCollisions();
}

function firePlayerBullet() {
    const centerX = player.x + PLAYER_SIZE / 2;
    const topY = player.y;
    const color = player.buffs.fireTime > 0 ? '#FFD700' : '#409EFF'; // 技能期间金色子弹，平时蓝色
    // 技能期间强制最高级火力
    const level = player.buffs.fireTime > 0 ? 4 : player.weaponLevel;

    switch(level) {
        case 1:
            bullets.push({ x: centerX - 3, y: topY, width: 6, height: 12, color: color, vx: 0, vy: -BULLET_SPEED });
            break;
        case 2:
            bullets.push({ x: centerX - 8, y: topY, width: 6, height: 12, color: color, vx: -1, vy: -BULLET_SPEED });
            bullets.push({ x: centerX + 2, y: topY, width: 6, height: 12, color: color, vx: 1, vy: -BULLET_SPEED });
            break;
        case 3:
            bullets.push({ x: centerX - 3, y: topY - 5, width: 6, height: 12, color: color, vx: 0, vy: -BULLET_SPEED });
            bullets.push({ x: centerX - 10, y: topY, width: 6, height: 12, color: color, vx: -2, vy: -BULLET_SPEED * 0.9 });
            bullets.push({ x: centerX + 4, y: topY, width: 6, height: 12, color: color, vx: 2, vy: -BULLET_SPEED * 0.9 });
            break;
        case 4:
            bullets.push({ x: centerX - 5, y: topY - 5, width: 6, height: 12, color: color, vx: -0.5, vy: -BULLET_SPEED });
            bullets.push({ x: centerX + 1, y: topY - 5, width: 6, height: 12, color: color, vx: 0.5, vy: -BULLET_SPEED });
            bullets.push({ x: centerX - 15, y: topY, width: 6, height: 12, color: color, vx: -3, vy: -BULLET_SPEED * 0.85 });
            bullets.push({ x: centerX + 9, y: topY, width: 6, height: 12, color: color, vx: 3, vy: -BULLET_SPEED * 0.85 });
            break;
    }
}

function updateEntities() {
    // 玩家子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > screenWidth + 20) bullets.splice(i, 1);
    }

    // 敌机子弹
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y > screenHeight) enemyBullets.splice(i, 1);
    }

    // 敌机移动逻辑
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += ENEMY_SPEED;
        
        // 横向移动
        if (e.moveType === 1) { // 正弦
            e.x += Math.sin(frameCount * 0.05) * 3; // 加快摆动频率和幅度
        } else if (e.moveType === 2) { // 斜向
            e.x += e.vx;
            // 碰壁反弹
            if (e.x <= 0 || e.x >= screenWidth - e.width) e.vx *= -1;
        }

        if (e.y > screenHeight) enemies.splice(i, 1);
    }

    // 道具
    for (let i = powerups.length - 1; i >= 0; i--) {
        let p = powerups[i];
        p.y += p.speed;
        if (p.y > screenHeight) powerups.splice(i, 1);
    }
}

function checkCollisions() {
    // 1. 玩家子弹击中敌机
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (rectIntersect(b, e)) {
                bullets.splice(i, 1);
                e.hp--;
                if (e.hp <= 0) {
                    // 敌机死亡，概率掉落技能点
                    if (Math.random() < 0.5) { // 提高到 50% 掉落技能
                        spawnSkillDrop(e.x, e.y);
                    }
                    enemies.splice(j, 1);
                    score += 10;
                }
                break;
            }
        }
    }

    // 2. 敌机撞击玩家
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (rectIntersect(player, e)) {
            enemies.splice(i, 1);
            takeDamage(30);
        }
    }

    // 3. 敌机子弹击中玩家
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];
        if (rectIntersect(player, b)) {
            enemyBullets.splice(i, 1);
            takeDamage(20);
        }
    }

    // 4. 玩家拾取道具
    for (let i = powerups.length - 1; i >= 0; i--) {
        let p = powerups[i];
        if (rectIntersect(player, p)) {
            powerups.splice(i, 1);
            if (p.type === 'health') {
                player.hp = Math.min(player.hp + 30, PLAYER_MAX_HP);
            } else if (p.type === 'weapon') {
                if (player.weaponLevel < MAX_WEAPON_LEVEL) player.weaponLevel++;
            } else if (p.type === 'skill_fire') {
                if (player.skills.fire < MAX_SKILL_COUNT) player.skills.fire++;
            } else if (p.type === 'skill_bomb') {
                if (player.skills.bomb < MAX_SKILL_COUNT) player.skills.bomb++;
            }
        }
    }
}

function spawnSkillDrop(x, y) {
    const type = Math.random() > 0.5 ? 'skill_fire' : 'skill_bomb';
    powerups.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        type: type,
        speed: 2 // 减慢下落速度
    });
}

function takeDamage(amount) {
    player.hp -= amount;
    if (player.hp <= 0) {
        player.hp = 0;
        isGameOver = true;
    }
}

function spawnBgObject(y) {
    const isCloud = Math.random() > 0.5;
    bgObjects.push({
        x: Math.random() * screenWidth,
        y: y,
        width: isCloud ? 40 + Math.random() * 60 : 30 + Math.random() * 50,
        height: isCloud ? 20 + Math.random() * 30 : 40 + Math.random() * 60,
        speed: isCloud ? 1 : 2,
        type: isCloud ? 'cloud' : 'building',
        color: isCloud ? 'rgba(255, 255, 255, 0.3)' : `rgba(30, 40, 60, ${0.2 + Math.random() * 0.3})`
    });
}

function updateBackground() {
    for (let i = bgObjects.length - 1; i >= 0; i--) {
        let obj = bgObjects[i];
        obj.y += obj.speed;
        if (obj.y > screenHeight) {
            bgObjects.splice(i, 1);
        }
    }
}

function rectIntersect(r1, r2) {
    const padding = 5;
    return !(r2.x + padding > r1.x + r1.width - padding || 
             r2.x + r2.width - padding < r1.x + padding || 
             r2.y + padding > r1.y + r1.height - padding ||
             r2.y + r2.height - padding < r1.y + padding);
}

// 绘制画面
function draw() {
    // 1. 背景
    const skyGradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    skyGradient.addColorStop(0, '#FFFFFF');
    skyGradient.addColorStop(1, '#E6E9F0');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. 闪电特效 (全屏伤害)
    if (player.buffs.bombTime > 0) {
        if (frameCount % 5 === 0) { // 闪烁
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(0, 0, screenWidth, screenHeight);
            // 画几条随机闪电
            ctx.strokeStyle = '#409EFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(Math.random() * screenWidth, 0);
            ctx.lineTo(Math.random() * screenWidth, screenHeight);
            ctx.stroke();
        }
    }

    // 3. 背景物体
    bgObjects.forEach(obj => {
        ctx.fillStyle = obj.color;
        if (obj.type === 'cloud') {
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.scale(1, obj.height / obj.width);
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 10);
        }
    });

    // 4. 玩家
    drawPlayer(player.x, player.y, player.width, player.height);

    // 5. 子弹
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    enemyBullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // 6. 敌机
    enemies.forEach(e => {
        drawEnemy(e.x, e.y, e.width, e.height, e.type);
        drawEnemyHp(e);
    });

    // 7. 道具
    powerups.forEach(p => {
        drawPowerUp(p);
    });

    // 8. UI
    drawUI();
    drawSkillButtons();
}

function drawEnemyHp(e) {
    const barW = e.width;
    const barH = 4;
    const y = e.y - 8;
    
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(e.x, y, barW, barH);
    
    // 血量
    const pct = e.hp / e.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#67C23A' : '#F56C6C';
    ctx.fillRect(e.x, y, barW * pct, barH);
}

function drawSkillButtons() {
    // 技能：火力
    drawBtn(btnFireRect, '火力', player.skills.fire, '#E6A23C', player.buffs.fireTime > 0);
    // 技能：全屏
    drawBtn(btnBombRect, '雷', player.skills.bomb, '#409EFF', player.buffs.bombTime > 0);
}

function drawBtn(rect, text, count, color, isActive) {
    ctx.save();
    ctx.translate(rect.x, rect.y);
    
    // 按钮背景
    ctx.fillStyle = isActive ? '#FFFFFF' : 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // 圆角矩形
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.fill();
    ctx.stroke();
    
    // 文字
    ctx.fillStyle = isActive ? color : '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, rect.w/2, rect.h/2 - 5);
    
    // 数量
    ctx.font = '12px Arial';
    ctx.fillText(`${count}/${MAX_SKILL_COUNT}`, rect.w/2, rect.h/2 + 15);
    
    ctx.restore();
}

function drawUI() {
    // 分数
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('得分: ' + score, 20, 40);

    // 血量
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 60;
    
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = player.hp / PLAYER_MAX_HP;
    let hpColor = '#67C23A';
    if (hpPercent < 0.5) hpColor = '#E6A23C';
    if (hpPercent < 0.2) hpColor = '#F56C6C';

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = '#909399';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.fillText(`HP: ${player.hp}/${PLAYER_MAX_HP}`, barX + 5, barY + 15);
}

function drawPowerUp(p) {
    ctx.save();
    ctx.translate(p.x + p.width/2, p.y + p.height/2);
    const scale = 1 + Math.sin(frameCount * 0.1) * 0.1;
    ctx.scale(scale, scale);

    if (p.type === 'health') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#F56C6C';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.fillStyle = '#F56C6C';
        ctx.fillRect(-10, -3, 20, 6);
        ctx.fillRect(-3, -10, 6, 20);
    } else if (p.type === 'weapon') {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#409EFF';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 5);
        ctx.lineTo(3, 5);
        ctx.lineTo(3, 10);
        ctx.lineTo(-3, 10);
        ctx.lineTo(-3, 5);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();
    } else if (p.type === 'skill_fire') {
        // 火力技能点 (橙色)
        ctx.fillStyle = '#E6A23C';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2); // 变大
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial'; // 明确字体大小
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('火', 0, 2);
    } else if (p.type === 'skill_bomb') {
        // 全屏技能点 (蓝色)
        ctx.fillStyle = '#409EFF';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2); // 变大
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('雷', 0, 2);
    }
    ctx.restore();
}

function drawPlayer(x, y, w, h) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    const mainColor = '#409EFF';
    const wingColor = '#66b1ff';
    const detailColor = '#E6A23C';

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(0, -h/2);
    ctx.lineTo(w/4, h/2);
    ctx.lineTo(0, h/2 - h/8);
    ctx.lineTo(-w/4, h/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(0, -h/6);
    ctx.lineTo(w/2, h/3);
    ctx.lineTo(w/2, h/2);
    ctx.lineTo(0, h/4);
    ctx.lineTo(-w/2, h/2);
    ctx.lineTo(-w/2, h/3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.save();
    ctx.scale(1, 0.8);
    ctx.beginPath();
    ctx.arc(0, -h/6 / 0.8, w/8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.moveTo(-w/8, h/2 - h/8);
    ctx.lineTo(0, h/2 + h/8);
    ctx.lineTo(w/8, h/2 - h/8);
    ctx.fill();
    ctx.restore();
}

function drawEnemy(x, y, w, h, type) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(Math.PI);

    let color1, color2;
    switch(type) {
        case 0: color1 = '#67C23A'; color2 = '#95D475'; drawType0(w, h, color1, color2); break;
        case 1: color1 = '#A0CFFF'; color2 = '#409EFF'; drawType1(w, h, color1, color2); break;
        case 2: color1 = '#E6A23C'; color2 = '#F3D19E'; drawType2(w, h, color1, color2); break;
        case 3: color1 = '#F56C6C'; color2 = '#FAB6B6'; drawType3(w, h, color1, color2); break;
        case 4: color1 = '#909399'; color2 = '#C0C4CC'; drawType4(w, h, color1, color2); break;
        case 5: color1 = '#3dd1e6'; color2 = '#8ae4f0'; drawType5(w, h, color1, color2); break;
    }
    ctx.restore();
}

// 优化后的敌机模型绘制
function drawType0(w, h, c1, c2) {
    // 基础型：更复杂的三角形 + 引擎
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(0, h/2);
    ctx.lineTo(w/2, -h/2);
    ctx.lineTo(0, -h/4);
    ctx.lineTo(-w/2, -h/2);
    ctx.closePath();
    ctx.fill();
    
    // 机舱
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, h/4);
    ctx.lineTo(w/6, -h/6);
    ctx.lineTo(-w/6, -h/6);
    ctx.fill();

    // 装饰线条
    ctx.strokeStyle = c2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2, -h/2);
    ctx.lineTo(0, h/2);
    ctx.lineTo(w/2, -h/2);
    ctx.stroke();
}

function drawType1(w, h, c1, c2) {
    // 速度型：前掠翼
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(0, h/2);
    ctx.lineTo(w/4, -h/2);
    ctx.lineTo(w/2, 0);
    ctx.lineTo(0, -h/4);
    ctx.lineTo(-w/2, 0);
    ctx.lineTo(-w/4, -h/2);
    ctx.closePath();
    ctx.fill();
    
    // 引擎光
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(-w/4, -h/2, 3, 0, Math.PI*2);
    ctx.arc(w/4, -h/2, 3, 0, Math.PI*2);
    ctx.fill();
}

function drawType2(w, h, c1, c2) {
    // 重装型：重型装甲
    ctx.fillStyle = c1;
    // 主体
    ctx.beginPath();
    ctx.moveTo(-w/2, 0);
    ctx.lineTo(-w/3, h/2);
    ctx.lineTo(w/3, h/2);
    ctx.lineTo(w/2, 0);
    ctx.lineTo(w/3, -h/2);
    ctx.lineTo(-w/3, -h/2);
    ctx.closePath();
    ctx.fill();
    
    // 核心
    ctx.fillStyle = c2;
    ctx.fillRect(-w/4, -h/4, w/2, h/2);
    
    // 炮管
    ctx.fillStyle = '#333';
    ctx.fillRect(-w/6, h/2, w/3, h/6);
}

function drawType3(w, h, c1, c2) {
    // 轰炸机：双体结构
    ctx.fillStyle = c1;
    // 左机身
    ctx.fillRect(-w/2, -h/2, w/4, h);
    // 右机身
    ctx.fillRect(w/4, -h/2, w/4, h);
    // 连接处
    ctx.fillStyle = c2;
    ctx.fillRect(-w/2, -h/6, w, h/3);
    
    // 驾驶舱
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, 0, w/6, 0, Math.PI*2);
    ctx.fill();
}

function drawType4(w, h, c1, c2) {
    // 隐形机：X型
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w/2, h/2);
    ctx.lineTo(w/3, h/2);
    ctx.lineTo(0, h/4);
    ctx.lineTo(-w/3, h/2);
    ctx.lineTo(-w/2, h/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w/2, -h/2);
    ctx.lineTo(w/3, -h/2);
    ctx.lineTo(0, -h/4);
    ctx.lineTo(-w/3, -h/2);
    ctx.lineTo(-w/2, -h/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F56C6C'; // 核心红点
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI*2);
    ctx.fill();
}

function drawType5(w, h, c1, c2) {
    // 异形机：生物质感
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, 0, w/2, h/3, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(0, 0, w/4, 0, Math.PI*2);
    ctx.fill();
    
    // 触须
    ctx.strokeStyle = c2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2, 0);
    ctx.quadraticCurveTo(-w, h/2, -w/2, h);
    ctx.moveTo(w/2, 0);
    ctx.quadraticCurveTo(w, h/2, w/2, h);
    ctx.stroke();
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 40px Arial';
    ctx.fillText('游戏结束', screenWidth / 2, screenHeight / 2 - 20);
    
    ctx.font = '24px Arial';
    ctx.fillText('最终得分: ' + score, screenWidth / 2, screenHeight / 2 + 30);
    
    ctx.fillStyle = '#E6A23C';
    ctx.font = '20px Arial';
    ctx.fillText('点击屏幕重新开始', screenWidth / 2, screenHeight / 2 + 80);
}

// 预先生成背景
for(let i=0; i<10; i++) {
    spawnBgObject(Math.random() * screenHeight);
}
loop();
