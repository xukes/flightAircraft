import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private background!: Phaser.GameObjects.TileSprite;
    
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private powerups!: Phaser.Physics.Arcade.Group;
    
    private scoreText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private inventoryText!: Phaser.GameObjects.Text;
    private fpsText!: Phaser.GameObjects.Text;
    
    private score: number = 0;
    private playerHp: number = 100;
    private maxHp: number = 100;
    
    private isGameOver: boolean = false;
    
    private inventory: { [key: string]: number } = {};
    private keyQ!: Phaser.Input.Keyboard.Key;
    private keyE!: Phaser.Input.Keyboard.Key;
    private keyR!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    
    private hpBar!: Phaser.GameObjects.Graphics;
    
    private playerEnergy: number = 100; // Start with full energy for testing
    private maxEnergy: number = 100;
    private energyBar!: Phaser.GameObjects.Graphics;
    private energyText!: Phaser.GameObjects.Text;
    private laser!: Phaser.Physics.Arcade.Sprite;
    private isLaserActive: boolean = false;

    private lightningGroup!: Phaser.GameObjects.Group;
    private isLightningActive: boolean = false;
    private isWaveFireActive: boolean = false;

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('spritesheet', 'assets/spritesheet.png');
    }

    create() {
        this.createAnimations();
        
        this.score = 0;
        this.playerHp = 100;
        this.isGameOver = false;
        this.inventory = {
            'powerup_upgrade': 0,
            'powerup_strengthen': 0,
            'powerup_lightning': 0
        };

        // Background (TileSprite for scrolling)
        // Using scale.width/height to ensure it covers the whole screen
        this.background = this.add.tileSprite(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 'background');

        // Player
        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height - 100, 'spritesheet', 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        
        // Groups
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 30,
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 50,
            runChildUpdate: true
        });

        this.enemyBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 50,
            runChildUpdate: true
        });

        this.powerups = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            runChildUpdate: true
        });

        // Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
            this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
            this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        // UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', color: '#fff' });
        this.fpsText = this.add.text(this.scale.width - 10, 10, 'FPS: 0', { fontSize: '16px', color: '#00ff00' }).setOrigin(1, 0);
        
        // HP Bar
        this.hpBar = this.add.graphics();
        this.hpText = this.add.text(10, 40, 'HP: 100/100', { fontSize: '16px', color: '#fff' });
        this.updateHpBar();

        // Energy Bar
        this.energyBar = this.add.graphics();
        this.energyText = this.add.text(10, 70, 'MP: 0/100', { fontSize: '16px', color: '#00ffff' });
        this.updateEnergyBar();
        
        // Inventory at bottom
        this.inventoryText = this.add.text(10, this.scale.height - 30, '加强(Q): 0    闪电(E): 0    治疗(R): 0', { fontSize: '16px', color: '#ffff00' });
        
        this.scoreText.setDepth(100);
        this.hpText.setDepth(100);
        this.hpBar.setDepth(99);
        this.energyText.setDepth(100);
        this.energyBar.setDepth(99);
        this.inventoryText.setDepth(100);
        this.fpsText.setDepth(100);

        // Laser
        this.laser = this.physics.add.sprite(0, 0, 'spritesheet', 'laser');
        this.laser.setOrigin(0.5, 1); // Bottom Center
        this.laser.setVisible(false);
        this.laser.setActive(false);
        this.laser.setDepth(9); // Behind player (player is 10) to look like it comes from under/center
        this.laser.setTint(0x00ffff);
        
        // Timers
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 200,
            callback: this.fireBullet,
            callbackScope: this,
            loop: true
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, undefined, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayerBullet, undefined, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, undefined, this);
        this.physics.add.overlap(this.laser, this.enemies, this.hitEnemyWithLaser, undefined, this);
        
        // Lightning VFX Group
        this.lightningGroup = this.add.group({
            defaultKey: 'spritesheet',
            defaultFrame: 'lightning_vfx',
            maxSize: 10
        });

        // Hook into postupdate to sync laser position perfectly with player
        this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.handlePostUpdate, this);
    }

    handlePostUpdate() {
        if (this.isLaserActive && this.player.active && this.laser.active) {
            // Laser geometry
            // Start slightly inside the nose to ensure connection
            // Player nose tip is roughly y-27.
            // We set bottom of laser to y-20 to be safely inside the fuselage.
            const bottomY = this.player.y - 20;
            const topY = -50;
            const height = bottomY - topY;
            
            // Sync Sprite Position
            // Origin is (0.5, 1), so we set position to (x, bottomY)
            this.laser.setPosition(this.player.x, bottomY);
            this.laser.setDisplaySize(16, height);
            
            // Sync Body Position
            if (this.laser.body) {
                // Body is top-left based
                this.laser.body.reset(this.player.x - 8, topY);
                this.laser.body.setSize(16, height);
            }
        }
    }

    update(_time: number, delta: number) {
        // Update FPS
        this.fpsText.setText('FPS: ' + Math.round(this.game.loop.actualFps));

        if (this.isGameOver) return;

        // Scroll background (Time-based)
        // Previously 2px per frame @ 60fps = 120px/sec
        this.background.tilePositionY -= 0.12 * delta;
        
        // Player Movement (Keyboard)
        const speed = 300;
        this.player.setVelocity(0);
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }

        // Laser Logic
        if (this.keySpace.isDown && this.playerEnergy > 0) {
            this.isLaserActive = true;
            this.laser.setVisible(true);
            this.laser.setActive(true);
            if (this.laser.body) this.laser.body.enable = true;
            
            // Position update is now handled in postUpdate to prevent lag
            
            // Pulse effect
            this.laser.setAlpha(0.8 + 0.2 * Math.sin(this.time.now / 50));

            // Consume Energy (5% per second)
            // 5 units per 1000ms = 0.005 per ms
            this.playerEnergy -= 0.005 * delta;
            
            if (this.playerEnergy <= 0) {
                this.playerEnergy = 0;
                this.isLaserActive = false;
                this.laser.setVisible(false);
                this.laser.setActive(false);
                if (this.laser.body) this.laser.body.enable = false;
            }
            this.updateEnergyBar();
        } else {
            if (this.isLaserActive) {
                this.isLaserActive = false;
                this.laser.setVisible(false);
                this.laser.setActive(false);
                if (this.laser.body) this.laser.body.enable = false;
            }
        }
        
        // Lightning Effect Animation
        if (this.isLightningActive) {
            // Randomly spawn lightning bolts
            // Adjust probability based on delta to maintain rate
            // Base: 3/10 chance per frame @ 60fps
            // Rate ~= 0.3 * 60 = 18 bolts/sec (very high?)
            // Let's normalize. 
            // Chance P per ms. 
            // If delta is 33ms (30fps), chance should be higher.
            
            // Let's just use a time accumulator or simple delta scaling
            // 30% chance per 16ms frame -> ~1.8% chance per ms
            if (Phaser.Math.Between(0, 1000) < 18 * delta) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const bolt = this.lightningGroup.get(x, y);
                if (bolt) {
                    bolt.setActive(true);
                    bolt.setVisible(true);
                    bolt.setDepth(50);
                    bolt.setScale(Phaser.Math.FloatBetween(1, 2));
                    bolt.setAlpha(1);
                    
                    this.tweens.add({
                        targets: bolt,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            this.lightningGroup.killAndHide(bolt);
                        }
                    });
                }
            }
        }

        // Handle Input for Powerups
        if (this.input.keyboard) {
            if (Phaser.Input.Keyboard.JustDown(this.keyQ)) this.usePowerup('powerup_upgrade');
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.usePowerup('powerup_lightning');
            if (Phaser.Input.Keyboard.JustDown(this.keyR)) this.usePowerup('powerup_strengthen');
        }

        // Cleanup off-screen entities
        this.bullets.children.each((b: any) => {
            if (b.active && b.y < -50) {
                this.bullets.killAndHide(b);
                if (b.body) b.body.enable = false;
            }
            return true;
        });

        this.enemies.children.each((e: any) => {
            if (e.active) {
                // Update HP Text
                if (e.hpText) {
                    e.hpText.setPosition(e.x, e.y - 30);
                    e.hpText.setText(e.hp.toString());
                }

                // Enemy shooting
                // Base: 1% (10/1000) per frame @ 60fps
                // Rate: 0.01 * 60 = 0.6 shots/sec
                // New: 0.0006 per ms * delta
                // 0.0006 * 10000 = 6
                if (Phaser.Math.Between(0, 10000) < 6 * delta) {
                    this.fireEnemyBullet(e);
                }

                if (e.y > this.scale.height + 50) {
                    this.enemies.killAndHide(e);
                    if (e.body) e.body.enable = false;
                    if (e.hpText) {
                        e.hpText.destroy();
                        e.hpText = null;
                    }
                }
            }
            return true;
        });

        // Cleanup enemy bullets
        this.enemyBullets.children.each((b: any) => {
            if (b.active && b.y > this.scale.height + 50) {
                this.enemyBullets.killAndHide(b);
                if (b.body) b.body.enable = false;
            }
            return true;
        });
    }

    fireEnemyBullet(enemy: any) {
        const bullet = this.enemyBullets.get(enemy.x, enemy.y + 20);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            if (bullet.body) {
                bullet.body.enable = true;
                bullet.body.reset(enemy.x, enemy.y + 20);
            }
            bullet.setTexture('spritesheet', 'enemyBullet');
            bullet.setVelocityY(300);
        }
    }

    fireBullet() {
        if (this.isGameOver) return;

        if (this.isWaveFireActive) {
            // Wave Fire: 3 bullets
            const angles = [-15, 0, 15];
            angles.forEach(angle => {
                const bullet = this.bullets.get(this.player.x, this.player.y - 30);
                if (bullet) {
                    bullet.setActive(true);
                    bullet.setVisible(true);
                    if (bullet.body) {
                        bullet.body.enable = true;
                        bullet.body.reset(this.player.x, this.player.y - 30);
                    }
                    bullet.setTexture('spritesheet', 'bullet');
                    
                    // Calculate velocity based on angle
                    const vec = new Phaser.Math.Vector2(0, -400);
                    vec.rotate(Phaser.Math.DegToRad(angle));
                    bullet.setVelocity(vec.x, vec.y);
                }
            });
        } else {
            // Normal Fire
            const bullet = this.bullets.get(this.player.x, this.player.y - 30);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                if (bullet.body) {
                    bullet.body.enable = true;
                    bullet.body.reset(this.player.x, this.player.y - 30);
                }
                bullet.setTexture('spritesheet', 'bullet');
                bullet.setVelocity(0, -400);
            }
        }
    }

    spawnEnemy() {
        if (this.isGameOver) return;

        const x = Phaser.Math.Between(30, this.scale.width - 30);
        const enemy = this.enemies.get(x, -50);
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);
            
            if (enemy.body) {
                enemy.body.enable = true;
                // Reset body to ensure position is synced and velocity cleared
                enemy.body.reset(x, -50);
                // Shrink hitbox slightly to match visual plane better (64x64 -> 40x50)
                enemy.body.setSize(40, 50);
                enemy.body.setOffset(12, 7);
            }
            
            const type = Phaser.Math.Between(0, 5);
            enemy.setTexture('spritesheet', `enemy_${type}`);
            
            enemy.setVelocityY(150);
            // @ts-ignore
            enemy.hp = 3;
            
            // @ts-ignore
            if (enemy.hpText) enemy.hpText.destroy();
            // @ts-ignore
            enemy.hpText = this.add.text(x, -70, '3', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
        }
    }

    hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;

        this.bullets.killAndHide(bullet);
        if (bullet.body) bullet.body.enable = false;
        
        // @ts-ignore
        enemy.hp--;
        
        // Visual feedback for hit
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        // @ts-ignore
        if (enemy.hpText) enemy.hpText.setText(enemy.hp.toString());

        // @ts-ignore
        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    hitEnemyWithLaser(_laser: any, enemy: any) {
        if (!enemy.active) return;
        
        // Laser damage
        // @ts-ignore
        enemy.hp -= 0.2;
        
        enemy.setTint(0x00ffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // @ts-ignore
        if (enemy.hpText) enemy.hpText.setText(Math.ceil(enemy.hp).toString());

        // @ts-ignore
        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    destroyEnemy(enemy: any) {
        // Play explosion
        const explosion = this.add.sprite(enemy.x, enemy.y, 'spritesheet', 'explosion_0');
        explosion.play('explode');
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });

        this.enemies.killAndHide(enemy);
        if (enemy.body) enemy.body.enable = false;
        // @ts-ignore
        if (enemy.hpText) {
            // @ts-ignore
            enemy.hpText.destroy();
            // @ts-ignore
            enemy.hpText = null;
        }
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        
        // Collect Energy (10%)
        this.playerEnergy = Math.min(this.playerEnergy + 10, this.maxEnergy);
        this.updateEnergyBar();
        
        if (Math.random() > 0.8) { // Increased drop rate for testing
            this.spawnPowerup(enemy.x, enemy.y);
        }
    }

    hitPlayer(_player: any, enemy: any) {
        if (this.isGameOver || !enemy.active) return;
        
        this.enemies.killAndHide(enemy);
        if (enemy.body) enemy.body.enable = false;
        
        // @ts-ignore
        if (enemy.hpText) {
            // @ts-ignore
            enemy.hpText.destroy();
            // @ts-ignore
            enemy.hpText = null;
        }
        
        this.takeDamage(20);
    }

    hitPlayerBullet(_player: any, bullet: any) {
        if (this.isGameOver || !bullet.active) return;
        
        this.enemyBullets.killAndHide(bullet);
        if (bullet.body) bullet.body.enable = false;
        
        this.takeDamage(10);
    }

    takeDamage(amount: number) {
        this.playerHp -= amount;
        this.updateHpBar();
        
        // Visual feedback
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.player && this.player.active) {
                this.player.clearTint();
            }
        });

        if (this.playerHp <= 0) {
            this.gameOver();
        }
    }
    
    updateHpBar() {
        this.hpBar.clear();
        
        // Background
        this.hpBar.fillStyle(0x333333);
        this.hpBar.fillRect(10, 40, 200, 20);
        
        // Health
        const percent = Phaser.Math.Clamp(this.playerHp / this.maxHp, 0, 1);
        
        if (percent < 0.3) this.hpBar.fillStyle(0xff0000);
        else this.hpBar.fillStyle(0x00ff00);
        
        this.hpBar.fillRect(10, 40, 200 * percent, 20);
        
        // Text update
        this.hpText.setText(`HP: ${this.playerHp}/${this.maxHp}`);
        this.hpText.setPosition(15, 42); // Center text in bar
        this.hpText.setDepth(101); // Ensure text is above bar
    }

    updateEnergyBar() {
        this.energyBar.clear();
        
        // Background
        this.energyBar.fillStyle(0x333333);
        this.energyBar.fillRect(10, 70, 200, 20);
        
        // Energy
        const percent = Phaser.Math.Clamp(this.playerEnergy / this.maxEnergy, 0, 1);
        
        this.energyBar.fillStyle(0x00ffff);
        this.energyBar.fillRect(10, 70, 200 * percent, 20);
        
        // Text update
        this.energyText.setText(`MP: ${Math.floor(this.playerEnergy)}/${this.maxEnergy}`);
        this.energyText.setPosition(15, 72);
        this.energyText.setDepth(101);
    }

    spawnPowerup(x: number, y: number) {
        const p = this.powerups.get(x, y);
        if (p) {
            p.setActive(true);
            p.setVisible(true);
            if (p.body) p.body.enable = true;
            
            const types = ['powerup_upgrade', 'powerup_strengthen', 'powerup_lightning'];
            const type = Phaser.Utils.Array.GetRandom(types);
            p.setTexture('spritesheet', type);
            // @ts-ignore
            p.powerType = type;
            
            p.setVelocityY(100);
        }
    }

    collectPowerup(_player: any, powerup: any) {
        if (!powerup.active) return;
        
        // @ts-ignore
        const type = powerup.powerType;
        
        // Always collect (remove from screen)
        this.powerups.killAndHide(powerup);
        if (powerup.body) powerup.body.enable = false;

        // Init if undefined
        if (this.inventory[type] === undefined) this.inventory[type] = 0;

        // Only add to inventory if space available (Max 5 per type)
        if (this.inventory[type] < 5) {
            this.inventory[type]++;
            this.updateInventoryUI();
        } else {
            // Feedback for full stack
            const txt = this.add.text(this.player.x, this.player.y - 50, 'MAX!', { fontSize: '14px', color: '#ff0000' });
            this.tweens.add({
                targets: txt,
                y: txt.y - 30,
                alpha: 0,
                duration: 500,
                onComplete: () => txt.destroy()
            });
        }
    }
    
    updateInventoryUI() {
        const upg = this.inventory['powerup_upgrade'] || 0;
        const bomb = this.inventory['powerup_lightning'] || 0;
        const heal = this.inventory['powerup_strengthen'] || 0;
        
        this.inventoryText.setText(
            `加强(Q): ${upg}    闪电(E): ${bomb}    治疗(R): ${heal}`
        );
    }
    
    usePowerup(type: string) {
        if (!this.inventory[type] || this.inventory[type] <= 0) return;
        
        this.inventory[type]--;
        this.updateInventoryUI();
        
        // Apply Effect
        if (type === 'powerup_upgrade') {
            // Wave Fire Mode for 10 seconds
            this.isWaveFireActive = true;
            this.time.delayedCall(10000, () => {
                this.isWaveFireActive = false;
            });
            
            this.score += 50;
            this.scoreText.setText('Score: ' + this.score);
        } else if (type === 'powerup_strengthen') {
            // Heal
            this.playerHp = Math.min(this.playerHp + 30, this.maxHp);
            this.updateHpBar();
        } else if (type === 'powerup_lightning') {
            // Activate Lightning Mode
            if (!this.isLightningActive) {
                this.activateLightningMode();
            }
        }
    }
    
    activateLightningMode() {
        this.isLightningActive = true;
        
        // Flash screen
        this.cameras.main.flash(500, 255, 255, 200);
        
        // Duration: 3 seconds
        this.time.delayedCall(3000, () => {
            this.isLightningActive = false;
            this.lightningGroup.clear(true, true); // Clear all bolts
        });
        
        // Damage ticks: 0s, 1s, 2s (3 ticks)
        // Tick 1 (Immediate)
        this.damageAllEnemies(1);
        
        // Tick 2
        this.time.delayedCall(1000, () => {
            if (this.isLightningActive) {
                this.damageAllEnemies(1);
                this.cameras.main.shake(100, 0.01);
            }
        });
        
        // Tick 3
        this.time.delayedCall(2000, () => {
            if (this.isLightningActive) {
                this.damageAllEnemies(1);
                this.cameras.main.shake(100, 0.01);
            }
        });
    }
    
    damageAllEnemies(damage: number) {
        this.enemies.children.each((e: any) => {
            if (e.active) {
                e.hp -= damage;
                if (e.hpText) e.hpText.setText(e.hp.toString());
                
                if (e.hp <= 0) {
                    // Play explosion
                    const explosion = this.add.sprite(e.x, e.y, 'spritesheet', 'explosion_0');
                    explosion.play('explode');
                    explosion.once('animationcomplete', () => {
                        explosion.destroy();
                    });

                    this.enemies.killAndHide(e);
                    if (e.body) e.body.enable = false;
                    if (e.hpText) {
                        e.hpText.destroy();
                        e.hpText = null;
                    }
                    this.score += 10;
                }
            }
            return true;
        });
        this.scoreText.setText('Score: ' + this.score);
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
            fontSize: '40px',
            color: '#ff0000'
        }).setOrigin(0.5);
        
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, '请按空格重新开始', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart();
            });
        }
    }

    createAnimations() {
        const sheet = this.textures.get('spritesheet');
        
        // Player: (0, 0) 64x64
        if (!sheet.has('player')) sheet.add('player', 0, 0, 0, 64, 64);
        
        // Bullet Player: (70, 16) 16x32
        if (!sheet.has('bullet')) sheet.add('bullet', 0, 70, 16, 16, 32);
        
        // Bullet Enemy: (100, 22) 20x20
        if (!sheet.has('enemyBullet')) sheet.add('enemyBullet', 0, 100, 22, 20, 20);
        
        // Laser: (130, 0) 16x64
        if (!sheet.has('laser')) sheet.add('laser', 0, 130, 0, 16, 64);
        
        // Powerups (y=70)
        if (!sheet.has('powerup_upgrade')) sheet.add('powerup_upgrade', 0, 0, 70, 40, 40);
        if (!sheet.has('powerup_strengthen')) sheet.add('powerup_strengthen', 0, 50, 70, 40, 40);
        if (!sheet.has('powerup_lightning')) sheet.add('powerup_lightning', 0, 100, 70, 40, 40);
        
        // Lightning VFX (y=200)
        if (!sheet.has('lightning_vfx')) sheet.add('lightning_vfx', 0, 0, 200, 64, 256);
        
        // Enemies (y=120)
        for(let i=0; i<6; i++) {
            if (!sheet.has(`enemy_${i}`)) sheet.add(`enemy_${i}`, 0, i * 70, 120, 64, 64);
        }

        // Explosion (y=460)
        for(let i=0; i<8; i++) {
            if (!sheet.has(`explosion_${i}`)) sheet.add(`explosion_${i}`, 0, i * 64, 460, 64, 64);
        }

        // Create Explosion Animation
        if (!this.anims.exists('explode')) {
            this.anims.create({
                key: 'explode',
                frames: [
                    { key: 'spritesheet', frame: 'explosion_0' },
                    { key: 'spritesheet', frame: 'explosion_1' },
                    { key: 'spritesheet', frame: 'explosion_2' },
                    { key: 'spritesheet', frame: 'explosion_3' },
                    { key: 'spritesheet', frame: 'explosion_4' },
                    { key: 'spritesheet', frame: 'explosion_5' },
                    { key: 'spritesheet', frame: 'explosion_6' },
                    { key: 'spritesheet', frame: 'explosion_7' }
                ],
                frameRate: 15,
                hideOnComplete: true
            });
        }
    }
}
