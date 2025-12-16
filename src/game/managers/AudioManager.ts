export default class AudioManager {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private masterVolume: number = 0.8;
    private sfxVolume: number = 0.7;
    private bgmVolume: number = 0.5;
    private bgmMusic: Phaser.Sound.BaseSound | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // 预加载音效文件
    preload() {
        // 检查音效文件是否存在，如果不存在则跳过加载
        const soundFiles = [
            'shoot', 'explosion', 'hit', 'playerHit', 'powerup',
            'laser', 'lightning', 'enemyShoot', 'gameOver'
        ];

        soundFiles.forEach(key => {
            const path = `assets/sounds/${key}.wav`;
            this.scene.load.audio(key, path);
        });

        this.scene.load.audio('bgm', 'assets/sounds/background_music.mp3');

        // 设置加载失败时的处理
        this.scene.load.on('filecomplete', (key: string) => {
            if (key.startsWith('audio_')) {
                console.log(`Audio file loaded: ${key}`);
            }
        });
    }

    // 初始化音效
    create() {
        // 创建所有音效（如果文件存在的话）
        const soundKeys = [
            'shoot', 'explosion', 'hit', 'playerHit', 'powerup',
            'laser', 'lightning', 'enemyShoot', 'gameOver'
        ];

        soundKeys.forEach(key => {
            try {
                const sound = this.scene.sound.add(key, {
                    volume: this.sfxVolume * this.masterVolume
                });
                this.sounds.set(key, sound);
            } catch (error) {
                console.warn(`Sound "${key}" could not be loaded, skipping...`);
            }
        });

        // 创建背景音乐（如果文件存在的话）
        try {
            this.bgmMusic = this.scene.sound.add('bgm', {
                volume: this.bgmVolume * this.masterVolume,
                loop: true
            });
        } catch (error) {
            console.warn('Background music could not be loaded, skipping...');
            this.bgmMusic = null;
        }
    }

    // 播放音效
    playSound(key: string, config?: Phaser.Types.Sound.SoundConfig) {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.play(config);
        } else {
            // Try to create the sound on the fly if it wasn't preloaded
            try {
                const newSound = this.scene.sound.add(key, {
                    volume: this.sfxVolume * this.masterVolume,
                    ...config
                });
                newSound.play(config);
                this.sounds.set(key, newSound);
            } catch (error) {
                console.warn(`Sound "${key}" not found and could not be created`);
            }
        }
    }

    // 播放背景音乐
    playBGM() {
        if (this.bgmMusic && !this.bgmMusic.isPlaying) {
            this.bgmMusic.play();
        }
    }

    // 停止背景音乐
    stopBGM() {
        if (this.bgmMusic && this.bgmMusic.isPlaying) {
            this.bgmMusic.stop();
        }
    }

    // 设置音量
    setMasterVolume(volume: number) {
        this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.updateAllVolumes();
    }

    setSFXVolume(volume: number) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.updateSFXVolumes();
    }

    setBGMVolume(volume: number) {
        this.bgmVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.bgmMusic) {
            (this.bgmMusic as any).setVolume(this.bgmVolume * this.masterVolume);
        }
    }

    // 更新所有音效音量
    private updateAllVolumes() {
        this.updateSFXVolumes();
        if (this.bgmMusic) {
            (this.bgmMusic as any).setVolume(this.bgmVolume * this.masterVolume);
        }
    }

    // 更新音效音量
    private updateSFXVolumes() {
        this.sounds.forEach(sound => {
            (sound as any).setVolume(this.sfxVolume * this.masterVolume);
        });
    }

    // 静音/取消静音
    toggleMute() {
        const currentMute = this.scene.sound.mute;
        this.scene.sound.mute = !currentMute;
        return !currentMute;
    }

    // 暂停所有音效
    pauseAll() {
        this.scene.sound.pauseAll();
    }

    // 恢复所有音效
    resumeAll() {
        this.scene.sound.resumeAll();
    }

    // 停止所有音效
    stopAll() {
        this.scene.sound.stopAll();
    }

    // 获取当前音量设置
    getVolumeSettings() {
        return {
            master: this.masterVolume,
            sfx: this.sfxVolume,
            bgm: this.bgmVolume,
            muted: this.scene.sound.mute
        };
    }

    // 播放随机音效变体（用于多样性）
    playRandomVariant(key: string, variants: number = 3) {
        const variantKey = `${key}_${Phaser.Math.Between(1, variants)}`;
        this.playSound(variantKey);
    }

    // 播放带有随机音调变化的音效
    playWithPitchVariation(key: string, minRate: number = 0.8, maxRate: number = 1.2) {
        const sound = this.sounds.get(key);
        if (sound) {
            const rate = Phaser.Math.FloatBetween(minRate, maxRate);
            sound.play({ rate });
        }
    }
}