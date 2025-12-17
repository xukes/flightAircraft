import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { GPUEffects } from '../shaders';

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
    private keyM!: Phaser.Input.Keyboard.Key;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    
    private hpBar!: Phaser.GameObjects.Graphics;
    
    private playerEnergy: number = 0; // Start with full energy for testing
    private maxEnergy: number = 100;
    private energyBar!: Phaser.GameObjects.Graphics;
    private energyText!: Phaser.GameObjects.Text;
    private laser!: Phaser.Physics.Arcade.Sprite;
    private laserGraphics!: Phaser.GameObjects.Graphics;
    private laserEffect!: any; // GPU-accelerated laser effect
    private isLaserActive: boolean = false;

    private lightningGroup!: Phaser.GameObjects.Group;
    private isLightningActive: boolean = false;
    private isWaveFireActive: boolean = false;

    private enemySpawnCount: number = 0;
    private nextBigEnemySpawn: number = 0;

    private fireLevel: number = 1; // Current fire level (1-5)
    private fireLevelText!: Phaser.GameObjects.Text; // Fire level display

    private audioManager!: AudioManager;
    private laserSound!: Phaser.Sound.BaseSound | null;
    private laserLoopSound!: Phaser.Sound.BaseSound | null;

    private gpuEffects!: GPUEffects;

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('spritesheet', 'assets/spritesheet.png');

        // Initialize and preload audio
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        this.createAnimations();
        this.audioManager.create();
        this.audioManager.playBGM();

        // Initialize GPU shader pipelines
        this.initShaderPipelines();
        
        this.score = 0;
        this.playerHp = 100;
        this.isGameOver = false;
        this.inventory = {
            'powerup_upgrade': 0,
            'powerup_strengthen': 0,
            'powerup_lightning': 0
        };
        
        this.enemySpawnCount = 0;
        this.nextBigEnemySpawn = Phaser.Math.Between(15, 23);

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
            maxSize: 100,
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 50,
            runChildUpdate: true
        });

        this.enemyBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 200, // Increased from 50 to accommodate Big Enemy bullet rings
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
            this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        }

        // UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', color: '#fff' });
        this.fpsText = this.add.text(this.scale.width - 10, 10, 'FPS: 0', { fontSize: '16px', color: '#00ff00' }).setOrigin(1, 0);

        // Audio control hint
        this.add.text(this.scale.width - 10, 30, 'M: Mute/Unmute', { fontSize: '12px', color: '#ffff00' }).setOrigin(1, 0).setDepth(100);
        
        // HP Bar
        this.hpBar = this.add.graphics();
        this.hpText = this.add.text(10, 40, 'HP: 100/100', { fontSize: '16px', color: '#fff' });
        this.updateHpBar();

        // Energy Bar
        this.energyBar = this.add.graphics();
        this.energyText = this.add.text(10, 70, 'MP: 0/100', { fontSize: '16px', color: '#fff' });
        this.updateEnergyBar();
        
        // Inventory at bottom
        this.inventoryText = this.add.text(10, this.scale.height - 30, '加强(Q): 0    闪电(E): 0    治疗(R): 0', { fontSize: '16px', color: '#ffff00' });

        // Fire level display
        this.fireLevelText = this.add.text(10, this.scale.height - 50, '火力 Lv.1', { fontSize: '14px', color: '#ffaa00' }).setDepth(100);

        this.scoreText.setDepth(100);
        this.hpText.setDepth(100);
        this.hpBar.setDepth(99);
        this.fireLevelText.setDepth(100);
        this.energyText.setDepth(100);
        this.energyBar.setDepth(99);
        this.inventoryText.setDepth(100);
        this.fpsText.setDepth(100);

        // Laser
        this.laser = this.physics.add.sprite(0, 0, 'spritesheet', 'laser');
        this.laser.setOrigin(0.5, 1); // Bottom Center
        this.laser.setVisible(false); // We use graphics for the laser beam
        this.laser.setActive(false);
        // this.laser.setDepth(9); // Not needed as it is invisible
        
        this.laserGraphics = this.add.graphics();
        this.laserGraphics.setDepth(9);
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
        // this.physics.add.overlap(this.laser, this.enemies, this.hitEnemyWithLaser, undefined, this); // Moved to postUpdate
        
        // Lightning VFX Group
        this.lightningGroup = this.add.group({
            defaultKey: 'spritesheet',
            defaultFrame: 'lightning_vfx',
            maxSize: 10
        });

        // Hook into postupdate to sync laser position perfectly with player
        this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.handlePostUpdate, this);

        // Initialize audio system
        this.audioManager.create();
        this.audioManager.playBGM();

        // Initialize laser sounds
        try {
            this.laserSound = this.sound.add('laser', { volume: 0.5 });
            this.laserLoopSound = this.sound.add('laser', {
                volume: 0.3,
                loop: true,
                rate: 0.8 // Slightly lower pitch for continuous effect
            });
        } catch (error) {
            console.warn('Laser sounds could not be loaded, skipping...');
            this.laserSound = null;
            this.laserLoopSound = null;
        }
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
            
            // Draw Laser using GPU effects
            this.laserGraphics.clear();

            // Destroy existing laser effect if any
            if (this.laserEffect) {
                if (this.laserEffect.main) this.laserEffect.main.destroy();
                if (this.laserEffect.glow) {
                    if (this.laserEffect.glow.core) this.laserEffect.glow.core.destroy();
                    if (this.laserEffect.glow.inner) this.laserEffect.glow.inner.destroy();
                    if (this.laserEffect.glow.middle) this.laserEffect.glow.middle.destroy();
                    if (this.laserEffect.glow.outer) this.laserEffect.glow.outer.destroy();
                }
                this.laserEffect = null;
            }

            // Create optimized GPU-accelerated laser effect with white core and blue glow
            // Position the container at the center point, but the laser will extend from aircraft nose to top
            this.laserEffect = this.gpuEffects.createLaserEffect(
                this.player.x,
                (topY + bottomY) / 2,
                20, // Thicker laser to get 3.2px core (8 * 0.4 = 3.2px)
                height,
                0x00ffff
            );
            
            // Sync Body Position
            if (this.laser.body) {
                // Body is top-left based
                // Make hitbox wider (16px) than visual (8px) for better feel
                const hitWidth = 16;
                this.laser.body.reset(this.player.x - hitWidth / 2, topY);
                this.laser.body.setSize(hitWidth, height);
                
                // Manual collision check to ensure sync with visual position
                this.physics.overlap(this.laser, this.enemies, this.hitEnemyWithLaser, undefined, this);
            }
        } else {
            this.laserGraphics.clear();
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
            if (!this.isLaserActive) {
                // Play laser activation sound
                if (this.laserSound) {
                    this.laserSound.play();
                }
                // Start continuous laser sound
                if (this.laserLoopSound) {
                    this.laserLoopSound.play();
                }
            }
            this.isLaserActive = true;
            // this.laser.setVisible(true); // Handled by graphics
            this.laser.setActive(true);
            if (this.laser.body) this.laser.body.enable = true;
            
            // Position update is now handled in postUpdate to prevent lag
            
            // Pulse effect (handled in graphics drawing)
            // this.laser.setAlpha(0.8 + 0.2 * Math.sin(this.time.now / 50));

            // Consume Energy (5% per second)
            // 5 units per 1000ms = 0.005 per ms
            this.playerEnergy -= 0.02 * delta;
            
            if (this.playerEnergy <= 0) {
                this.playerEnergy = 0;
                this.isLaserActive = false;
                this.laser.setVisible(false);
                this.laser.setActive(false);
                if (this.laser.body) this.laser.body.enable = false;

                // Clear laser graphics
                this.laserGraphics.clear();

                // Cleanup GPU laser effect when energy depletes
                if (this.laserEffect) {
                    if (this.laserEffect.main && this.laserEffect.main.destroy) {
                        this.laserEffect.main.destroy();
                    }
                    if (this.laserEffect.glow) {
                        if (this.laserEffect.glow.core && this.laserEffect.glow.core.destroy) {
                            this.laserEffect.glow.core.destroy();
                        }
                        if (this.laserEffect.glow.inner && this.laserEffect.glow.inner.destroy) {
                            this.laserEffect.glow.inner.destroy();
                        }
                        if (this.laserEffect.glow.middle && this.laserEffect.glow.middle.destroy) {
                            this.laserEffect.glow.middle.destroy();
                        }
                        if (this.laserEffect.glow.outer && this.laserEffect.glow.outer.destroy) {
                            this.laserEffect.glow.outer.destroy();
                        }
                    }
                    this.laserEffect = null;
                }

                // Stop laser sounds when energy depletes
                this.stopLaserSounds();
            }
            this.updateEnergyBar();
        } else {
            if (this.isLaserActive) {
                this.isLaserActive = false;
                // this.laser.setVisible(false);
                this.laser.setActive(false);
                if (this.laser.body) this.laser.body.enable = false;
                this.laserGraphics.clear();

                // Cleanup GPU laser effect
                if (this.laserEffect) {
                    if (this.laserEffect.main && this.laserEffect.main.destroy) {
                        this.laserEffect.main.destroy();
                    }
                    if (this.laserEffect.glow) {
                        if (this.laserEffect.glow.core && this.laserEffect.glow.core.destroy) {
                            this.laserEffect.glow.core.destroy();
                        }
                        if (this.laserEffect.glow.inner && this.laserEffect.glow.inner.destroy) {
                            this.laserEffect.glow.inner.destroy();
                        }
                        if (this.laserEffect.glow.middle && this.laserEffect.glow.middle.destroy) {
                            this.laserEffect.glow.middle.destroy();
                        }
                        if (this.laserEffect.glow.outer && this.laserEffect.glow.outer.destroy) {
                            this.laserEffect.glow.outer.destroy();
                        }
                    }
                    this.laserEffect = null;
                }

                // Stop laser sounds
                this.stopLaserSounds();
            }
        }
        
        // Lightning Effect Animation (GPU-accelerated)
        if (this.isLightningActive) {
            // Create random lightning bolts using GPU effects
            // Reduced frequency for better distribution: 15% chance per frame
            if (Phaser.Math.Between(0, 1000) < 15 * delta) {
                // Create multiple lightning bolts at once for better coverage
                const boltCount = Math.floor(Math.random() * 3) + 1; // 1-3 bolts

                for (let i = 0; i < boltCount; i++) {
                    // Create more varied lightning patterns
                    const pattern = Math.floor(Math.random() * 6); // 6 patterns now
                    let startX = 0, startY = 0, endX = 0, endY = 0;

                    switch (pattern) {
                        case 0: // Top to bottom (with outside margin)
                            startX = Phaser.Math.Between(-50, this.scale.width + 50);
                            startY = -50;
                            endX = Phaser.Math.Between(-50, this.scale.width + 50);
                            endY = this.scale.height + 50;
                            break;
                        case 1: // Side to side (with outside margin)
                            startX = -50;
                            startY = Phaser.Math.Between(-50, this.scale.height + 50);
                            endX = this.scale.width + 50;
                            endY = Phaser.Math.Between(-50, this.scale.height + 50);
                            break;
                        case 2: // Corner to corner
                            startX = Math.random() > 0.5 ? -50 : this.scale.width + 50;
                            startY = -50;
                            endX = Math.random() > 0.5 ? -50 : this.scale.width + 50;
                            endY = this.scale.height + 50;
                            break;
                        case 3: // Random to random (extended range)
                            startX = Phaser.Math.Between(-100, this.scale.width + 100);
                            startY = Phaser.Math.Between(-100, this.scale.height + 100);
                            endX = Phaser.Math.Between(-100, this.scale.width + 100);
                            endY = Phaser.Math.Between(-100, this.scale.height + 100);
                            break;
                        case 4: // From outside to inside
                            const side = Math.floor(Math.random() * 4);
                            switch (side) {
                                case 0: // Top
                                    startX = Phaser.Math.Between(0, this.scale.width);
                                    startY = -50;
                                    break;
                                case 1: // Right
                                    startX = this.scale.width + 50;
                                    startY = Phaser.Math.Between(0, this.scale.height);
                                    break;
                                case 2: // Bottom
                                    startX = Phaser.Math.Between(0, this.scale.width);
                                    startY = this.scale.height + 50;
                                    break;
                                case 3: // Left
                                    startX = -50;
                                    startY = Phaser.Math.Between(0, this.scale.height);
                                    break;
                            }
                            endX = Phaser.Math.Between(100, this.scale.width - 100);
                            endY = Phaser.Math.Between(100, this.scale.height - 100);
                            break;
                        case 5: // Center burst
                            const centerX = this.scale.width / 2 + (Math.random() - 0.5) * 200;
                            const centerY = this.scale.height / 2 + (Math.random() - 0.5) * 200;
                            startX = centerX;
                            startY = centerY;
                            const angle = Math.random() * Math.PI * 2;
                            const distance = 200 + Math.random() * 300;
                            endX = centerX + Math.cos(angle) * distance;
                            endY = centerY + Math.sin(angle) * distance;
                            break;
                    }

                    this.gpuEffects.createLightningEffect(
                        startX,
                        startY,
                        endX,
                        endY,
                        0xffff00
                    );
                }
            }
        }

        // Check for fire level upgrades
        this.checkFireLevelUpgrade();

        // Handle Input for Powerups
        if (this.input.keyboard) {
            if (Phaser.Input.Keyboard.JustDown(this.keyQ)) this.usePowerup('powerup_upgrade');
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.usePowerup('powerup_lightning');
            if (Phaser.Input.Keyboard.JustDown(this.keyR)) this.usePowerup('powerup_strengthen');
            if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
                const isMuted = this.audioManager.toggleMute();
                this.showMuteStatus(isMuted);
            }
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
                // Update HP bar position
                if (e.hpBar) {
                    this.updateEnemyHpBar(e);
                }

                // Big Enemy Logic
                if (e.isBig) {
                    // Movement: Sway left/right
                    // Use time to calculate sine wave velocity
                    const time = this.time.now;
                    e.setVelocityX(Math.sin(time / 1000) * 100);

                    // Shooting: Ring of bullets
                    e.shootTimer += delta;
                    if (e.shootTimer > 2000) { // Fire every 2 seconds
                        e.shootTimer = 0;
                        this.fireBigEnemyRing(e);
                    }
                } else {
                    // Small Enemy Movement Patterns
                    e.moveTimer += delta;

                    // Store movement direction state for smooth transitions
                    // @ts-ignore
                    if (e.moveDirection === undefined) {
                        // @ts-ignore
                        e.moveDirection = 1; // 1 for right, -1 for left
                    }

                    // @ts-ignore
                    switch (e.movePattern) {
                        case 1: // Sine wave movement
                            // @ts-ignore
                            const sineWave = Math.sin(e.moveTimer / 500) * 2;
                            let targetVelocityX = sineWave * 50;

                            // Boundary check - reverse direction when reaching edges
                            const enemyHalfWidth = e.width / 2 || 20; // Default half width if e.width not available
                            const leftBound = enemyHalfWidth + 10; // Add small margin
                            const rightBound = this.scale.width - enemyHalfWidth - 10;

                            if (e.x <= leftBound && e.moveDirection === -1) {
                                // @ts-ignore
                                e.moveDirection = 1; // Switch to moving right
                                // Smooth transition by adjusting the phase
                                // @ts-ignore
                                e.moveTimer = 250; // Set to quarter phase for rightward movement
                                // Force position away from boundary
                                e.x = leftBound + 1;
                            } else if (e.x >= rightBound && e.moveDirection === 1) {
                                // @ts-ignore
                                e.moveDirection = -1; // Switch to moving left
                                // Smooth transition by adjusting the phase
                                // @ts-ignore
                                e.moveTimer = 750; // Set to three-quarter phase for leftward movement
                                // Force position away from boundary
                                e.x = rightBound - 1;
                            }

                            // Apply movement based on current direction and sine wave
                            e.setVelocityX(targetVelocityX);
                            break;
                        case 2: // Horizontal sway
                            // @ts-ignore
                            const swayEnemyHalfWidth = e.width / 2 || 20;
                            const swayLeftBound = swayEnemyHalfWidth + 10;
                            const swayRightBound = this.scale.width - swayEnemyHalfWidth - 10;

                            // Check if enemy needs to change direction
                            // @ts-ignore
                            if (e.x <= swayLeftBound && e.moveDirection === -1) {
                                // @ts-ignore
                                e.moveDirection = 1; // Change direction to right
                                // Force position away from boundary
                                e.x = swayLeftBound + 1;
                            } else if (e.x >= swayRightBound && e.moveDirection === 1) {
                                // @ts-ignore
                                e.moveDirection = -1; // Change direction to left
                                // Force position away from boundary
                                e.x = swayRightBound - 1;
                            }

                            // Calculate smooth horizontal movement based on current direction
                            // Use a continuous sine wave but shift phase based on direction
                            // @ts-ignore
                            const directionPhase = e.moveDirection === 1 ? 0 : Math.PI;
                            // @ts-ignore
                            const swayPhase = ((e.moveTimer % 2000) / 2000) * Math.PI * 2 + directionPhase;
                            let targetSwayX = Math.sin(swayPhase) * 80;

                            e.setVelocityX(targetSwayX);
                            break;
                        default: // 0: Straight movement
                            e.setVelocityX(0);
                            // @ts-ignore
                            e.moveDirection = 1; // Reset direction
                            break;
                    }

                    // Additional boundary enforcement - clamp position to screen bounds
                    const currentEnemyHalfWidth = e.width / 2 || 20;
                    const minX = currentEnemyHalfWidth;
                    const maxX = this.scale.width - currentEnemyHalfWidth;

                    // Force clamping if somehow enemy gets outside bounds
                    if (e.x < minX) {
                        e.x = minX;
                        // @ts-ignore
                        e.moveDirection = 1; // Force move right
                    } else if (e.x > maxX) {
                        e.x = maxX;
                        // @ts-ignore
                        e.moveDirection = -1; // Force move left
                    }

                    // Shooting Logic
                    e.shootTimer += delta;

                    // @ts-ignore
                    if (e.hasRingShot) {
                        // Ring shot pattern: fire every 3 seconds
                        if (e.shootTimer > 3000) {
                            e.shootTimer = 0;
                            this.fireSmallEnemyRing(e);
                        }
                    } else {
                        // Normal shooting pattern
                        // Base: 1% (10/1000) per frame @ 60fps
                        // Rate: 0.01 * 60 = 0.6 shots/sec
                        // New: 0.0006 per ms * delta
                        // 0.0006 * 10000 = 6
                        if (Phaser.Math.Between(0, 10000) < 6 * delta) {
                            this.fireEnemyBullet(e);
                        }
                    }
                }

                if (e.y > this.scale.height + 100) {
                    this.enemies.killAndHide(e);
                    if (e.body) e.body.enable = false;
                    if (e.hpText) {
                        e.hpText.destroy();
                        e.hpText = null;
                    }
                    if (e.hpBar) {
                        e.hpBar.destroy();
                        e.hpBar = null;
                    }
                }
            }
            return true;
        });

        // Cleanup enemy bullets
        this.enemyBullets.children.each((b: any) => {
            if (b.active) {
                // Check bounds for all directions (since big enemy fires in a ring)
                if (b.y > this.scale.height + 50 || b.y < -50 || b.x < -50 || b.x > this.scale.width + 50) {
                    this.enemyBullets.killAndHide(b);
                    if (b.body) b.body.enable = false;
                }
            }
            return true;
        });
    }

    fireBigEnemyRing(enemy: any) {
        const numBullets = 12;
        const angleStep = 360 / numBullets;
        
        for (let i = 0; i < numBullets; i++) {
            const angle = i * angleStep;
            const bullet = this.enemyBullets.get(enemy.x, enemy.y);
            
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                if (bullet.body) {
                    bullet.body.enable = true;
                    bullet.body.reset(enemy.x, enemy.y);
                }
                bullet.setTexture('spritesheet', 'enemyBullet');
                
                // Calculate velocity vector
                const vec = new Phaser.Math.Vector2(0, 200); // Speed 200
                vec.rotate(Phaser.Math.DegToRad(angle));
                bullet.setVelocity(vec.x, vec.y);
            }
        }
        this.audioManager.playWithPitchVariation('enemyShoot', 0.5, 0.7); // Deeper sound
    }

    fireSmallEnemyRing(enemy: any) {
        const numBullets = 8; // Fewer bullets than big enemy
        const angleStep = 360 / numBullets;

        for (let i = 0; i < numBullets; i++) {
            const angle = i * angleStep;
            const bullet = this.enemyBullets.get(enemy.x, enemy.y);

            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                if (bullet.body) {
                    bullet.body.enable = true;
                    bullet.body.reset(enemy.x, enemy.y);
                }
                bullet.setTexture('spritesheet', 'enemyBullet');

                // Calculate velocity vector (slower than big enemy)
                const vec = new Phaser.Math.Vector2(0, 150); // Speed 150
                vec.rotate(Phaser.Math.DegToRad(angle));
                bullet.setVelocity(vec.x, vec.y);
            }
        }
        this.audioManager.playWithPitchVariation('enemyShoot', 0.9, 1.2); // Higher pitch for small enemy
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

            // Play enemy shoot sound with random pitch variation
            this.audioManager.playWithPitchVariation('enemyShoot', 0.8, 1.2);
        }
    }

    checkFireLevelUpgrade() {
        const scoreThresholds = [1000, 2000, 4000, 8000]; // Fire level thresholds

        for (let i = scoreThresholds.length - 1; i >= 0; i--) {
            if (this.score >= scoreThresholds[i] && this.fireLevel < i + 2) {
                this.fireLevel = i + 2;
                this.showFireLevelUpgrade();
                break;
            }
        }

        // Update fire level display
        this.fireLevelText.setText(`火力 Lv.${this.fireLevel}`);
    }

    showFireLevelUpgrade() {
        const upgradeText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, `火力升级！Lv.${this.fireLevel}`, {
            fontSize: '32px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(300);

        // Animate the text
        this.tweens.add({
            targets: upgradeText,
            alpha: 0,
            y: upgradeText.y - 50,
            scale: 1.5,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => upgradeText.destroy()
        });

        // Play upgrade sound
        this.audioManager.playSound('powerup');
    }

    fireBullet() {
        if (this.isGameOver) return;
        if (this.isLaserActive) return;

        if (this.isWaveFireActive) {
            // Wave Fire: Dynamic bullets based on fire level
            // Fire level 1: 3 bullets, level 2: 4 bullets, level 3-5: 5 bullets (max)
            const bulletCount = Math.min(this.fireLevel + 2, 5); // 3-5 bullets based on fire level
            const totalSpread = 40; // Total spread angle in degrees
            const angleStep = bulletCount > 1 ? totalSpread / (bulletCount - 1) : 0; // Calculate angle between bullets

            for (let i = 0; i < bulletCount; i++) {
                const angle = bulletCount > 1 ? -totalSpread / 2 + i * angleStep : 0; // Distribute bullets evenly
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
            }
            // Play wave fire sound with slight variation
            this.audioManager.playWithPitchVariation('shoot', 0.9, 1.1);
        } else {
            // Normal Fire with multiple rows based on fire level
            const rows = Math.min(this.fireLevel, 5); // Max 5 rows
            const horizontalSpacing = 12; // Space between bullets horizontally

            for (let row = 0; row < rows; row++) {
                const bullet = this.bullets.get(this.player.x, this.player.y - 30);
                if (bullet) {
                    bullet.setActive(true);
                    bullet.setVisible(true);
                    if (bullet.body) {
                        bullet.body.enable = true;
                        // Calculate position for this row
                        const xOffset = (row - (rows - 1) / 2) * horizontalSpacing;
                        bullet.body.reset(this.player.x + xOffset, this.player.y - 30);
                    }
                    bullet.setTexture('spritesheet', 'bullet');
                    bullet.setVelocity(0, -400);
                }
            }

            // Play normal shoot sound
            this.audioManager.playSound('shoot');
        }
    }

    spawnEnemy() {
        if (this.isGameOver) return;

        // Check for Big Enemy Spawn
        this.enemySpawnCount++;
        if (this.enemySpawnCount >= this.nextBigEnemySpawn) {
            this.spawnBigEnemy();
            this.enemySpawnCount = 0;
            this.nextBigEnemySpawn = Phaser.Math.Between(15, 23);
            return; // Skip normal spawn
        }

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

            // Flip enemy to fly head-first toward player
            enemy.setFlipY(false);

            // Random movement and attack patterns
            // @ts-ignore
            enemy.movePattern = Phaser.Math.Between(0, 2); // 0: straight, 1: sine wave, 2: horizontal sway
            // @ts-ignore
            enemy.hasRingShot = Phaser.Math.Between(0, 1) === 1; // 50% chance for ring shot
            // @ts-ignore
            enemy.shootTimer = 0;
            // @ts-ignore
            enemy.moveTimer = 0;
            // @ts-ignore
            enemy.moveDirection = Phaser.Math.Between(0, 1) === 1 ? 1 : -1; // Random initial direction

            // Visual distinction for ring shot enemies
            // @ts-ignore
            if (enemy.hasRingShot) {
                enemy.setTint(0xff9900); // Orange tint for ring shot enemies
            } else {
                enemy.clearTint(); // Normal color for regular enemies
            }

            enemy.setVelocityY(150);
            // @ts-ignore
            enemy.hp = 3.0; // Initialize with explicit float value
            // @ts-ignore
            enemy.isBig = false; // Reset big flag for recycled enemies
            // @ts-ignore
            enemy.maxHp = 3.0; // Store max HP for bar calculation

            // Ensure no leftover HP text from big enemy state
            // @ts-ignore
            if (enemy.hpText) {
                // @ts-ignore
                enemy.hpText.destroy();
                // @ts-ignore
                enemy.hpText = null;
            }

            // Create HP bar for enemy instead of text
            // @ts-ignore
            if (enemy.hpBar) enemy.hpBar.destroy();
            // @ts-ignore
            enemy.hpBar = this.add.graphics();
            this.updateEnemyHpBar(enemy);
        }
    }

    spawnBigEnemy() {
        const x = this.scale.width / 2;
        const enemy = this.enemies.get(x, -100);
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);
            
            if (enemy.body) {
                enemy.body.enable = true;
                enemy.body.reset(x, -100);
                enemy.body.setSize(100, 80);
                enemy.body.setOffset(14, 20);
            }
            
            enemy.setTexture('spritesheet', 'enemy_big');
            enemy.setFlipY(true); // Flip big enemy to face down (asset is drawn nose up)
            
            // Initial velocity down
            enemy.setVelocityY(50);
            enemy.setVelocityX(0);
            
            // @ts-ignore
            enemy.hp = 50.0;
            // @ts-ignore
            enemy.maxHp = 50.0;
            // @ts-ignore
            enemy.isBig = true;
            // @ts-ignore
            enemy.shootTimer = 0;
            
            // Ensure no leftover HP text from normal enemy state
            // @ts-ignore
            if (enemy.hpText) {
                // @ts-ignore
                enemy.hpText.destroy();
                // @ts-ignore
                enemy.hpText = null;
            }

            // Create HP bar for big enemy
            // @ts-ignore
            if (enemy.hpBar) enemy.hpBar.destroy();
            // @ts-ignore
            enemy.hpBar = this.add.graphics();
            this.updateEnemyHpBar(enemy);
        }
    }

    hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;

        this.bullets.killAndHide(bullet);
        if (bullet.body) bullet.body.enable = false;

        // @ts-ignore
        enemy.hp -= 1.0; // Use float damage

        // Play hit sound
        this.audioManager.playSound('hit');

        // Visual feedback for hit - store original tint
        // @ts-ignore
        const originalTint = enemy.hasRingShot ? 0xff9900 : 0xffffff;
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                // @ts-ignore
                if (enemy.hasRingShot) {
                    enemy.setTint(0xff9900); // Restore orange tint for ring shot enemies
                } else {
                    enemy.clearTint(); // Restore normal color
                }
            }
        });

        // Update HP bar
        this.updateEnemyHpBar(enemy);

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

        // Play laser hit sound with lower volume
        this.audioManager.playSound('hit', {
            volume: 0.3,
            rate: 1.5 // Higher pitch for laser hit
        });

        enemy.setTint(0x00ffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) {
                // @ts-ignore
                if (enemy.hasRingShot) {
                    enemy.setTint(0xff9900); // Restore orange tint for ring shot enemies
                } else {
                    enemy.clearTint(); // Restore normal color
                }
            }
        });

        // Update HP bar
        this.updateEnemyHpBar(enemy);

        // @ts-ignore
        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    destroyEnemy(enemy: any) {
        // Play explosion sound
        if (enemy.isBig) {
            this.audioManager.playSound('explosion', { rate: 0.5 }); // Deeper explosion sound
        } else {
            this.audioManager.playSound('explosion');
        }

        // Play explosion
        const explosion = this.add.sprite(enemy.x, enemy.y, 'spritesheet', 'explosion_0');
        explosion.play('explode');
        if (enemy.isBig) {
            explosion.setScale(2); // Bigger explosion for big enemy
        }
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });

        this.enemies.killAndHide(enemy);
        if (enemy.body) enemy.body.enable = false;
        // @ts-ignore
        if (enemy.hpBar) {
            // @ts-ignore
            enemy.hpBar.destroy();
            // @ts-ignore
            enemy.hpBar = null;
        }
        // @ts-ignore
        if (enemy.hpText) {
            // @ts-ignore
            enemy.hpText.destroy();
            // @ts-ignore
            enemy.hpText = null;
        }

        const scorePoints = enemy.isBig ? 100 : 10;
        this.score += scorePoints;
        this.scoreText.setText('Score: ' + this.score);

        // Collect Energy (10%)
        this.playerEnergy = Math.min(this.playerEnergy + 10, this.maxEnergy);
        this.updateEnergyBar();

        if (Math.random() > (enemy.isBig ? 0.2 : 0.8)) { // High drop rate for big enemy
            this.spawnPowerup(enemy.x, enemy.y);
        }
    }

    hitPlayer(_player: any, enemy: any) {
        if (this.isGameOver || !enemy.active) return;

        this.enemies.killAndHide(enemy);
        if (enemy.body) enemy.body.enable = false;

        // @ts-ignore
        if (enemy.hpBar) {
            // @ts-ignore
            enemy.hpBar.destroy();
            // @ts-ignore
            enemy.hpBar = null;
        }

        this.takeDamage(20, 'collision'); // Collision with enemy
    }

    hitPlayerBullet(_player: any, bullet: any) {
        if (this.isGameOver || !bullet.active) return;

        this.enemyBullets.killAndHide(bullet);
        if (bullet.body) bullet.body.enable = false;

        this.takeDamage(10, 'bullet'); // Hit by enemy bullet
    }

    takeDamage(amount: number, damageType: 'collision' | 'bullet' | 'laser' = 'bullet') {
        this.playerHp -= amount;
        this.updateHpBar();

        // Play different hit sounds based on damage type
        if (damageType === 'collision') {
            // Enemy collision - deeper, more impactful sound
            this.audioManager.playWithPitchVariation('playerHit', 0.6, 0.9);
        } else if (damageType === 'bullet') {
            // Bullet hit - standard player hit sound
            this.audioManager.playWithPitchVariation('playerHit', 0.8, 1.1);
        } else if (damageType === 'laser') {
            // Laser damage - higher pitch, smaller sound
            this.audioManager.playSound('playerHit', {
                rate: Phaser.Math.FloatBetween(1.2, 1.5),
                volume: 0.7
            });
        }

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
        
        this.hpBar.fillStyle(0xff0000);
        
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

        this.energyBar.fillStyle(0x0088ff);
        this.energyBar.fillRect(10, 70, 200 * percent, 20);

        // Text update - 确保显示整数，避免小数显示问题
        this.energyText.setText(`MP: ${Math.round(this.playerEnergy)}/${this.maxEnergy}`);
        this.energyText.setPosition(15, 72);
        this.energyText.setDepth(101);
    }

    updateEnemyHpBar(enemy: any) {
        if (!enemy.hpBar) return;

        // Adjust bar size based on enemy type
        // @ts-ignore
        const isBig = enemy.isBig || false;
        const barWidth = isBig ? 80 : 40; // Double width for big enemy
        const barHeight = isBig ? 6 : 4;   // Slightly thicker for big enemy
        const yOffset = isBig ? -60 : -35;  // Position further above big enemy

        const x = enemy.x - barWidth / 2;
        const y = enemy.y + yOffset;

        enemy.hpBar.clear();

        // Background (dark red)
        enemy.hpBar.fillStyle(0x660000);
        enemy.hpBar.fillRect(x, y, barWidth, barHeight);

        // HP bar (red to green gradient based on health)
        // @ts-ignore
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        let color: number;

        if (hpPercent > 0.6) {
            color = 0x00ff00; // Green
        } else if (hpPercent > 0.3) {
            color = 0xffff00; // Yellow
        } else {
            color = 0xff0000; // Red
        }

        enemy.hpBar.fillStyle(color);
        enemy.hpBar.fillRect(x, y, barWidth * hpPercent, barHeight);

        // Border (thicker for big enemy)
        enemy.hpBar.lineStyle(isBig ? 2 : 1, 0xffffff, 0.6);
        enemy.hpBar.strokeRect(x, y, barWidth, barHeight);
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

        // Play powerup collection sound
        this.audioManager.playSound('powerup');

        // Always collect (remove from screen)
        this.powerups.killAndHide(powerup);
        if (powerup.body) powerup.body.enable = false;

        // Auto-use health powerup if player is not at full health
        if (type === 'powerup_strengthen') {
            // Check if player needs healing
            if (this.playerHp < this.maxHp) {
                // Auto-use the healing powerup immediately
                this.playerHp = Math.min(this.playerHp + 30, this.maxHp);
                this.updateHpBar();

                // Show auto-use visual feedback
                const autoUseText = this.add.text(this.player.x, this.player.y - 80, '自动回血 +30 HP', {
                    fontSize: '16px',
                    color: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 5, y: 3 }
                }).setOrigin(0.5).setDepth(200);

                this.tweens.add({
                    targets: autoUseText,
                    alpha: 0,
                    y: autoUseText.y - 40,
                    duration: 1500,
                    onComplete: () => autoUseText.destroy()
                });

                // Also add to inventory if space available and player still needs more healing
                if (this.playerHp < this.maxHp) {
                    // Init if undefined
                    if (this.inventory[type] === undefined) this.inventory[type] = 0;

                    // Only add to inventory if space available (Max 5 per type)
                    if (this.inventory[type] < 5) {
                        this.inventory[type]++;
                        this.updateInventoryUI();
                    }
                }
            } else {
                // Player is at full health, just add to inventory
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

                // Show full health notification
                const fullHealthText = this.add.text(this.player.x, this.player.y - 80, '血量已满', {
                    fontSize: '14px',
                    color: '#ffff00',
                    backgroundColor: '#000000',
                    padding: { x: 5, y: 3 }
                }).setOrigin(0.5).setDepth(200);

                this.tweens.add({
                    targets: fullHealthText,
                    alpha: 0,
                    y: fullHealthText.y - 30,
                    duration: 1000,
                    onComplete: () => fullHealthText.destroy()
                });
            }
            return; // Skip the rest of the logic for healing items
        }

        // Handle other powerup types
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

            // Show wave fire activation message with bullet count
            const waveBulletCount = this.fireLevel + 2; // 3-5 bullets based on fire level (1-3)
            const waveText = this.add.text(this.scale.width / 2, 120, `波次射击已激活！${waveBulletCount}发子弹`, {
                fontSize: '24px',
                color: '#00ffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            this.tweens.add({
                targets: waveText,
                alpha: { from: 1, to: 0 },
                duration: 2000,
                onComplete: () => waveText.destroy()
            });
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

        // Play lightning activation sound
        this.audioManager.playSound('lightning');

        // Flash screen
        this.cameras.main.flash(500, 255, 255, 200);

        // Duration: 3 seconds
        this.time.delayedCall(3000, () => {
            this.isLightningActive = false;
            this.lightningGroup.clear(true, true); // Clear all bolts
        });

        // Damage ticks: 0s, 1s, 2s (3 ticks)
        // Tick 1 (Immediate)
        this.damageAllEnemiesWithLightning();

        // Tick 2
        this.time.delayedCall(1000, () => {
            if (this.isLightningActive) {
                this.damageAllEnemiesWithLightning();
                this.cameras.main.shake(100, 0.01);
                // Play additional lightning sound for effect
                this.audioManager.playWithPitchVariation('lightning', 0.8, 1.0);
            }
        });

        // Tick 3
        this.time.delayedCall(2000, () => {
            if (this.isLightningActive) {
                this.damageAllEnemiesWithLightning();
                this.cameras.main.shake(100, 0.01);
                // Play final lightning sound with lower pitch
                this.audioManager.playWithPitchVariation('lightning', 0.6, 0.8);
            }
        });
    }
    
    damageAllEnemiesWithLightning() {
        // First, create random lightning bolts across the screen for visual effect
        const boltCount = 5 + Math.floor(Math.random() * 5); // 5-9 random bolts
        for (let i = 0; i < boltCount; i++) {
            const startX = Phaser.Math.Between(0, this.scale.width);
            const startY = 0;
            const endX = Phaser.Math.Between(0, this.scale.width);
            const endY = this.scale.height;

            this.gpuEffects.createLightningEffect(
                startX,
                startY,
                endX,
                endY,
                0xffff00
            );
        }

        // Then, damage enemies with targeted lightning from player
        this.enemies.children.each((e: any) => {
            if (e.active) {
                // Create GPU-accelerated lightning effect from player to enemy
                this.gpuEffects.createLightningEffect(
                    this.player.x,
                    this.player.y - 20,
                    e.x,
                    e.y,
                    0xffffff  // Use white for player-to-enemy lightning to distinguish
                );

                e.hp -= 1;
                // Update HP bar
                this.updateEnemyHpBar(e);

                if (e.hp <= 0) {
                    // Play explosion
                    const explosion = this.add.sprite(e.x, e.y, 'spritesheet', 'explosion_0');
                    explosion.play('explode');
                    explosion.once('animationcomplete', () => {
                        explosion.destroy();
                    });

                    this.enemies.killAndHide(e);
                    if (e.body) e.body.enable = false;
                    if (e.hpBar) {
                        e.hpBar.destroy();
                        e.hpBar = null;
                    }
                    this.score += 10;
                }
            }
            return true;
        });
        this.scoreText.setText('Score: ' + this.score);
    }

    damageAllEnemies(damage: number) {
        this.enemies.children.each((e: any) => {
            if (e.active) {
                e.hp -= damage;
                // Update HP bar
                this.updateEnemyHpBar(e);

                if (e.hp <= 0) {
                    // Play explosion
                    const explosion = this.add.sprite(e.x, e.y, 'spritesheet', 'explosion_0');
                    explosion.play('explode');
                    explosion.once('animationcomplete', () => {
                        explosion.destroy();
                    });

                    this.enemies.killAndHide(e);
                    if (e.body) e.body.enable = false;
                    if (e.hpBar) {
                        e.hpBar.destroy();
                        e.hpBar = null;
                    }
                    this.score += 10;
                }
            }
            return true;
        });
        this.scoreText.setText('Score: ' + this.score);
    }

    stopLaserSounds() {
        if (this.laserLoopSound && this.laserLoopSound.isPlaying) {
            this.laserLoopSound.stop();
        }
        if (this.laserSound && this.laserSound.isPlaying) {
            this.laserSound.stop();
        }
    }

    showMuteStatus(isMuted: boolean) {
        const status = isMuted ? '🔇 MUTED' : '🔊 SOUND ON';
        const color = isMuted ? '#ff6666' : '#66ff66';

        const text = this.add.text(this.scale.width / 2, 100, status, {
            fontSize: '24px',
            color: color,
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 30,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();

        // Stop background music
        this.audioManager.stopBGM();

        // Stop all laser sounds
        this.stopLaserSounds();

        // Play game over sound
        this.audioManager.playSound('gameOver');

        // Ensure laser is properly deactivated
        this.isLaserActive = false;
        this.isLightningActive = false;
        this.isWaveFireActive = false;

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
                // Reset all game state before restarting
                this.resetGameState();
                this.scene.restart();
            });
        }
    }

    resetGameState() {
        // Reset player stats
        this.playerHp = 100;
        this.playerEnergy = 0; // Reset energy to 0

        // Reset fire level and score
        this.score = 0;
        this.fireLevel = 1;

        // Reset inventory
        this.inventory = {
            'powerup_upgrade': 0,
            'powerup_strengthen': 0,
            'powerup_lightning': 0
        };

        // Reset enemy spawn counters
        this.enemySpawnCount = 0;
        this.nextBigEnemySpawn = Phaser.Math.Between(15, 23);

        // Reset UI displays
        this.scoreText.setText('Score: 0');
        this.fireLevelText.setText('火力 Lv.1');
        this.inventoryText.setText('加强(Q): 0    闪电(E): 0    治疗(R): 0');

        // Update bars
        this.updateHpBar();
        this.updateEnergyBar();

        // Clear any active enemies and bullets
        this.enemies.children.each((e: any) => {
            if (e.active) {
                this.enemies.killAndHide(e);
                if (e.body) e.body.enable = false;
                // @ts-ignore
                if (e.hpBar) {
                    e.hpBar.destroy();
                    e.hpBar = null;
                }
                // @ts-ignore
                if (e.hpText) {
                    e.hpText.destroy();
                    e.hpText = null;
                }
            }
            return true;
        });

        this.bullets.children.each((b: any) => {
            if (b.active) {
                this.bullets.killAndHide(b);
                if (b.body) b.body.enable = false;
            }
            return true;
        });

        this.enemyBullets.children.each((b: any) => {
            if (b.active) {
                this.enemyBullets.killAndHide(b);
                if (b.body) b.body.enable = false;
            }
            return true;
        });

        this.powerups.children.each((p: any) => {
            if (p.active) {
                this.powerups.killAndHide(p);
                if (p.body) p.body.enable = false;
            }
            return true;
        });

        // Clear lightning bolts
        this.lightningGroup.clear(true, true);

        // Clear laser graphics
        this.laserGraphics.clear();

        // Cleanup GPU effects
        if (this.laserEffect) {
            if (this.laserEffect.main) this.laserEffect.main.destroy();
            if (this.laserEffect.glow) {
                if (this.laserEffect.glow.core && this.laserEffect.glow.core.destroy) {
                    this.laserEffect.glow.core.destroy();
                }
                if (this.laserEffect.glow.inner && this.laserEffect.glow.inner.destroy) {
                    this.laserEffect.glow.inner.destroy();
                }
                if (this.laserEffect.glow.middle && this.laserEffect.glow.middle.destroy) {
                    this.laserEffect.glow.middle.destroy();
                }
                if (this.laserEffect.glow.outer && this.laserEffect.glow.outer.destroy()) {
                    this.laserEffect.glow.outer.destroy();
                }
            }
            this.laserEffect = null;
        }

        if (this.gpuEffects) {
            this.gpuEffects.destroy();
        }
    }

    // Initialize GPU shader pipelines
    initShaderPipelines() {
        try {
            // Initialize GPU effects system
            this.gpuEffects = new GPUEffects(this);
            console.log('GPU effects system initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize GPU effects, falling back to CPU rendering:', error);
        }
    }


    // Add cleanup method to handle scene shutdown
    shutdown() {
        // Stop all sounds when scene is destroyed
        this.stopLaserSounds();
        this.audioManager.stopAll();
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
        
        // Big Enemy: (100, 200) 128x128
        if (!sheet.has('enemy_big')) sheet.add('enemy_big', 0, 100, 200, 128, 128);

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
