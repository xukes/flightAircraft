import { FX } from './FX';

export class LightningFXPipeline {
    private scene: Phaser.Scene;
    private fxPipeline: any;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initFXPipeline();
    }

    private initFXPipeline() {
        try {
            // Initialize Phaser FX pipeline if available
            if ((this.scene.renderer as any).fx) {
                this.fxPipeline = (this.scene.renderer as any).fx;
                console.log('Lightning FX Pipeline initialized');
            } else {
                console.log('FX Pipeline not available, using CPU rendering');
            }
        } catch (error) {
            console.warn('Failed to initialize FX pipeline:', error);
        }
    }

    // Create GPU-accelerated lightning using FX
    createLightningBolt(x: number, y: number, targetX: number, targetY: number, color: number, thickness: number, alpha: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);

        try {
            // Create the main lightning as a series of small segments for better GPU performance
            const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
            const segments = Math.floor(distance / 20) + 3; // More segments for smoother effect

            const mainBolts: Phaser.GameObjects.Rectangle[] = [];
            const glowBolts: Phaser.GameObjects.Rectangle[] = [];

            // Generate zigzag path
            let prevX = x;
            let prevY = y;

            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                let nextX = x + (targetX - x) * t;
                let nextY = y + (targetY - y) * t;

                // Add perpendicular offset for zigzag effect (except for start and end)
                if (i > 0 && i < segments) {
                    const perpendicularAngle = Math.atan2(targetY - y, targetX - x) + Math.PI / 2;
                    const offset = (Math.random() - 0.5) * 30; // Reduced offset for GPU efficiency
                    nextX += Math.cos(perpendicularAngle) * offset;
                    nextY += Math.sin(perpendicularAngle) * offset;
                }

                // Create segment
                const segmentDistance = Math.sqrt(Math.pow(nextX - prevX, 2) + Math.pow(nextY - prevY, 2));
                const segmentAngle = Math.atan2(nextY - prevY, nextX - prevX);

                // Main bolt segment
                const mainSegment = this.scene.add.rectangle(
                    (prevX + nextX) / 2,
                    (prevY + nextY) / 2,
                    segmentDistance,
                    thickness,
                    color,
                    alpha
                );
                mainSegment.rotation = segmentAngle + Math.PI / 2;
                mainBolts.push(mainSegment);

                // Glow segment
                const glowSegment = this.scene.add.rectangle(
                    (prevX + nextX) / 2,
                    (prevY + nextY) / 2,
                    segmentDistance,
                    thickness * 2,
                    color,
                    alpha * 0.3
                );
                glowSegment.rotation = segmentAngle + Math.PI / 2;
                glowBolts.push(glowSegment);

                prevX = nextX;
                prevY = nextY;
            }

            // Add all segments to container
            glowBolts.forEach(bolt => container.add(bolt));
            mainBolts.forEach(bolt => container.add(bolt));

            // Add GPU effects if available
            if (this.fxPipeline) {
                // Add glow effect using FX
                mainBolts.forEach(bolt => {
                    if (bolt.postFX) {
                        bolt.postFX.addGlow(color, 0.5, 0, false, 0.1, 10);
                    }
                });
            }

            return container;

        } catch (error) {
            console.warn('GPU lightning creation failed, using fallback:', error);
            return this.createFallbackLightningBolt(x, y, targetX, targetY, color, thickness, alpha);
        }
    }

    private createFallbackLightningBolt(x: number, y: number, targetX: number, targetY: number, color: number, thickness: number, alpha: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);

        // Simple fallback using Graphics
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(thickness, color, alpha);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(targetX, targetY);
        graphics.strokePath();

        container.add(graphics);
        return container;
    }

    // Update pipeline uniforms for animated effects
    update(time: number) {
        if (this.fxPipeline) {
            // Update any time-based effects here
        }
    }

    destroy() {
        // Cleanup if needed
    }
}