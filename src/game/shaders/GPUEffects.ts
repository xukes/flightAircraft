import * as Phaser from 'phaser';
import { LightningFXPipeline } from './LightningFXPipeline';

export class GPUEffects {
    private scene: Phaser.Scene;
    private activeEffects: Phaser.GameObjects.GameObject[] = [];
    private lightningFXPipeline: LightningFXPipeline;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.lightningFXPipeline = new LightningFXPipeline(scene);
    }

    // Create GPU-accelerated laser effect with white core and blue glow
    createLaserEffect(x: number, y: number, width: number, height: number, color: number = 0x00ffff) {
        try {
            // For vertical laser, create rectangles at position (x, y) with specified height
            // Thin white core in the center
            const coreWidth = Math.max(1, width * 0.3); // Core is 30% of total width
            const coreSprite = this.scene.add.rectangle(x, y, coreWidth, height, 0xffffff, 1.0);
            coreSprite.setDepth(50);

            // Blue glow layers (outer layers)
            const glowInner = this.scene.add.rectangle(x, y, width * 0.6, height, 0x00ccff, 0.4);
            glowInner.setDepth(49);

            const glowMiddle = this.scene.add.rectangle(x, y, width * 0.8, height, 0x0099ff, 0.25);
            glowMiddle.setDepth(48);

            const glowOuter = this.scene.add.rectangle(x, y, width, height, 0x0066ff, 0.15);
            glowOuter.setDepth(47);

            // Add subtle pulsing animation to the core only
            this.scene.tweens.add({
                targets: coreSprite,
                alpha: {
                    from: 1.0,
                    to: 0.8,
                    duration: 80,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                }
            });

            // Add very subtle glow pulsing
            this.scene.tweens.add({
                targets: [glowInner, glowMiddle],
                alpha: {
                    from: 1.0,
                    to: 0.9,
                    duration: 120,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                }
            });

            // Create container to manage all laser parts - position at 0,0 since rectangles are already positioned
            const container = this.scene.add.container(0, 0, [glowOuter, glowMiddle, glowInner, coreSprite]);

            this.activeEffects.push(container);

            return {
                main: container,
                glow: {
                    core: coreSprite,
                    inner: glowInner,
                    middle: glowMiddle,
                    outer: glowOuter
                }
            };
        } catch (error) {
            console.warn('GPU laser effect failed, using fallback:', error);
            return this.createFallbackLaser(x, y, width, height, color);
        }
    }

    // Create GPU-accelerated lightning effect with thinner, straighter lines
    createLightningEffect(x: number, y: number, targetX: number, targetY: number, color: number = 0xffff00) {
        try {
            // Create main lightning bolt with thin lines
            const mainBolt = this.createOptimizedLightningBolt(x, y, targetX, targetY, color, 3, 1.0);
            mainBolt.setDepth(50);

            // Create subtle glow layer (much thinner than before)
            const glowBolt = this.createOptimizedLightningBolt(x, y, targetX, targetY, color, 6, 0.3);
            glowBolt.setDepth(49);

            // Create fewer, shorter branches with thin lines
            const branches: Phaser.GameObjects.GameObject[] = [];
            const branchCount = Math.floor(1 + Math.random() * 3); // 1-3 branches (reduced)

            for (let i = 0; i < branchCount; i++) {
                const branchPos = Math.random();
                const branchX = x + (targetX - x) * branchPos;
                const branchY = y + (targetY - y) * branchPos;
                const branchLength = 10 + Math.random() * 20; // Shorter branches (10-30px)
                const branchAngle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * Math.PI / 3; // Narrower angle range

                const branchEndX = branchX + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchY + Math.sin(branchAngle) * branchLength;

                const branch = this.createOptimizedLightningBolt(
                    branchX, branchY, branchEndX, branchEndY,
                    color, 1.5, 0.6 // Very thin branches
                );
                branch.setDepth(48);
                branches.push(branch);
            }

            // Add fewer, smaller sparks
            const sparks: Phaser.GameObjects.GameObject[] = [];
            for (let i = 0; i < 4; i++) { // Reduced from 8 to 4
                const sparkPos = Math.random();
                const sparkX = x + (targetX - x) * sparkPos;
                const sparkY = y + (targetY - y) * sparkPos;
                const sparkSize = Math.random() * 4 + 1; // Smaller sparks (1-5px)

                const spark = this.scene.add.circle(
                    sparkX + (Math.random() - 0.5) * 20, // Reduced spread
                    sparkY + (Math.random() - 0.5) * 20,
                    sparkSize,
                    color,
                    Math.random() * 0.6 + 0.2 // Lower opacity
                );
                spark.setDepth(47);
                sparks.push(spark);
            }

            // Add flicker animation
            const allLightning = [mainBolt, glowBolt, ...branches, ...sparks];

            this.scene.tweens.add({
                targets: allLightning,
                alpha: { from: 1, to: 0 },
                duration: 80 + Math.random() * 100, // Slightly faster
                ease: 'Sine.easeOut',
                onComplete: () => {
                    allLightning.forEach(obj => obj.destroy());
                }
            });

            this.activeEffects.push(...allLightning);

            return mainBolt;
        } catch (error) {
            console.warn('Optimized lightning effect failed, using fallback:', error);
            return this.createFallbackLightning(x, y, targetX, targetY, color);
        }
    }

    // Create optimized lightning bolt with thinner, straighter lines
    private createOptimizedLightningBolt(x: number, y: number, targetX: number, targetY: number, color: number, thickness: number, alpha: number): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(thickness, color, alpha);

        // Calculate the main direction
        const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
        const segments = Math.floor(distance / 60) + 2; // Fewer segments for straighter lines

        // Generate less zigzag path
        const points: {x: number, y: number}[] = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            let pointX = x + (targetX - x) * t;
            let pointY = y + (targetY - y) * t;

            // Add much smaller perpendicular offset for subtle zigzag (except start and end)
            if (i > 0 && i < segments) {
                const perpendicularAngle = Math.atan2(targetY - y, targetX - x) + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 12; // Much smaller offset (6px max)
                pointX += Math.cos(perpendicularAngle) * offset;
                pointY += Math.sin(perpendicularAngle) * offset;
            }

            points.push({x: pointX, y: pointY});
        }

        // Draw the main bolt
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }

        graphics.strokePath();

        // Add fewer detail lines for cleaner look
        if (thickness > 2) {
            graphics.lineStyle(thickness * 0.5, color, alpha * 0.5); // Thinner detail lines

            for (let i = 1; i < points.length - 1; i++) {
                if (Math.random() > 0.7) { // Only 30% chance to add detail (reduced from 40%)
                    const midX = (points[i].x + points[i + 1].x) / 2;
                    const midY = (points[i].y + points[i + 1].y) / 2;
                    const detailOffset = (Math.random() - 0.5) * 8; // Smaller detail offset
                    const perpendicularAngle = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x) + Math.PI / 2;

                    graphics.beginPath();
                    graphics.moveTo(midX, midY);
                    graphics.lineTo(
                        midX + Math.cos(perpendicularAngle) * detailOffset,
                        midY + Math.sin(perpendicularAngle) * detailOffset
                    );
                    graphics.strokePath();
                }
            }
        }

        return graphics;
    }

    // Create GPU-accelerated lightning bolt using custom pipeline
    private createGPULightningBolt(x: number, y: number, targetX: number, targetY: number, color: number, thickness: number, alpha: number): Phaser.GameObjects.Rectangle {
        // Create a full-screen quad that will be rendered with the lightning shader
        const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
        const centerX = (x + targetX) / 2;
        const centerY = (y + targetY) / 2;

        const lightningBolt = this.scene.add.rectangle(centerX, centerY, distance + 100, distance + 100, color, alpha);
        lightningBolt.setOrigin(0.5, 0.5);

        // Set custom pipeline if available, otherwise use basic rendering
        if ((this.scene.renderer as any).pipelines && (this.scene.renderer as any).pipelines.has('LightningPipeline')) {
            lightningBolt.setPipeline('LightningPipeline');

            // Set shader uniforms
            const pipeline = (this.scene.renderer as any).pipelines.get('LightningPipeline');
            if (pipeline && pipeline.set1f) {
                pipeline.set1f('uTime', performance.now() / 1000);
                pipeline.set2f('uStartPoint', x, y);
                pipeline.set2f('uEndPoint', targetX, targetY);
                pipeline.set1f('uThickness', thickness);
                pipeline.set1f('uIntensity', alpha);
            }
        }

        return lightningBolt;
    }

    // Fallback CPU-based lightning effect
    private createCPULightning(x: number, y: number, targetX: number, targetY: number, color: number = 0xffff00): Phaser.GameObjects.Graphics {
        try {
            // Create main lightning bolt path with zigzag pattern
            const mainBoltGraphics = this.createLightningBolt(x, y, targetX, targetY, color, 6, 0.9);
            mainBoltGraphics.setDepth(50);

            // Create glow layer (thicker, more transparent bolt)
            const glowGraphics = this.createLightningBolt(x, y, targetX, targetY, color, 12, 0.4);
            glowGraphics.setDepth(49);

            // Create random branches
            const branches: Phaser.GameObjects.Graphics[] = [];
            const branchCount = Math.floor(3 + Math.random() * 5);

            for (let i = 0; i < branchCount; i++) {
                const branchPos = Math.random();
                const branchX = x + (targetX - x) * branchPos;
                const branchY = y + (targetY - y) * branchPos;
                const branchLength = 15 + Math.random() * 50;
                const branchAngle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * Math.PI / 2;

                const branchEndX = branchX + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchY + Math.sin(branchAngle) * branchLength;

                const branchGraphics = this.createLightningBolt(
                    branchX, branchY, branchEndX, branchEndY,
                    color, Math.random() * 3 + 1, Math.random() * 0.5 + 0.3
                );
                branchGraphics.setDepth(48);
                branches.push(branchGraphics);
            }

            // Add sparks
            const sparks: Phaser.GameObjects.Graphics[] = [];
            for (let i = 0; i < 8; i++) {
                const sparkPos = Math.random();
                const sparkX = x + (targetX - x) * sparkPos;
                const sparkY = y + (targetY - y) * sparkPos;
                const sparkSize = Math.random() * 8 + 2;

                const sparkGraphics = this.scene.add.graphics();
                sparkGraphics.fillStyle(color, Math.random() * 0.8 + 0.2);
                sparkGraphics.fillCircle(sparkX + (Math.random() - 0.5) * 50,
                                        sparkY + (Math.random() - 0.5) * 50,
                                        sparkSize);
                sparkGraphics.setDepth(47);
                sparks.push(sparkGraphics);
            }

            // Animation
            const allLightning = [mainBoltGraphics, glowGraphics, ...branches, ...sparks];

            this.scene.tweens.add({
                targets: allLightning,
                alpha: { from: 1, to: 0 },
                duration: 100 + Math.random() * 150,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    allLightning.forEach(obj => obj.destroy());
                }
            });

            this.activeEffects.push(...allLightning);

            return mainBoltGraphics;
        } catch (error) {
            console.warn('CPU lightning effect failed, using basic fallback:', error);
            return this.createFallbackLightning(x, y, targetX, targetY, color);
        }
    }

    // Create a single lightning bolt with zigzag pattern
    private createLightningBolt(x: number, y: number, targetX: number, targetY: number, color: number, thickness: number, alpha: number): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(thickness, color, alpha);

        // Calculate the main direction
        const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
        const segments = Math.floor(distance / 30) + 2; // Divide into segments

        // Generate zigzag path
        const points: {x: number, y: number}[] = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            let pointX = x + (targetX - x) * t;
            let pointY = y + (targetY - y) * t;

            // Add perpendicular offset for zigzag effect (except for start and end)
            if (i > 0 && i < segments) {
                const perpendicularAngle = Math.atan2(targetY - y, targetX - x) + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 40; // Random offset up to 20px
                pointX += Math.cos(perpendicularAngle) * offset;
                pointY += Math.sin(perpendicularAngle) * offset;
            }

            points.push({x: pointX, y: pointY});
        }

        // Draw the main bolt
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }

        graphics.strokePath();

        // Add some smaller detail lines for more realistic look
        if (thickness > 3) {
            graphics.lineStyle(thickness * 0.3, color, alpha * 0.7);

            for (let i = 1; i < points.length - 1; i++) {
                if (Math.random() > 0.6) { // 40% chance to add detail
                    const midX = (points[i].x + points[i + 1].x) / 2;
                    const midY = (points[i].y + points[i + 1].y) / 2;
                    const detailOffset = (Math.random() - 0.5) * 15;
                    const perpendicularAngle = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x) + Math.PI / 2;

                    graphics.beginPath();
                    graphics.moveTo(midX, midY);
                    graphics.lineTo(
                        midX + Math.cos(perpendicularAngle) * detailOffset,
                        midY + Math.sin(perpendicularAngle) * detailOffset
                    );
                    graphics.strokePath();
                }
            }
        }

        return graphics;
    }

    // Fallback CPU-based laser effect
    private createFallbackLaser(x: number, y: number, width: number, height: number, color: number) {
        const laser = this.scene.add.rectangle(x, y, width, height, color, 0.7);

        // Add glow effect using multiple rectangles
        const glow1 = this.scene.add.rectangle(x, y, width * 1.2, height * 1.2, color, 0.3);
        const glow2 = this.scene.add.rectangle(x, y, width * 1.4, height * 1.4, color, 0.15);

        // Create container for all laser parts
        const container = this.scene.add.container(x, y, [glow2, glow1, laser]);
        container.setDepth(50);

        this.activeEffects.push(container);

        return { main: container, glow: { glow1, glow2 } };
    }

    // Fallback CPU-based lightning effect
    private createFallbackLightning(x: number, y: number, targetX: number, targetY: number, color: number) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, color, 0.9);

        // Main lightning bolt
        graphics.moveTo(x, y);
        graphics.lineTo(targetX, targetY);

        // Add branches
        const midX = (x + targetX) / 2;
        const midY = (y + targetY) / 2;

        graphics.lineStyle(1, color, 0.6);

        // Left branch
        graphics.moveTo(midX, midY);
        graphics.lineTo(midX - 30, midY + 40);

        // Right branch
        graphics.moveTo(midX, midY);
        graphics.lineTo(midX + 25, midY + 35);

        graphics.setDepth(50);

        // Add flicker and destroy
        this.scene.tweens.add({
            targets: graphics,
            alpha: { from: 1, to: 0 },
            duration: 200,
            onComplete: () => {
                graphics.destroy();
            }
        });

        this.activeEffects.push(graphics);

        return graphics;
    }

    // Clear all active effects
    clearAllEffects() {
        this.activeEffects.forEach(effect => {
            if (effect && effect.destroy) {
                effect.destroy();
            }
        });
        this.activeEffects = [];
    }

    // Cleanup method
    destroy() {
        this.clearAllEffects();
    }
}