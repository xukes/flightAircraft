// Phaser FX utilities and types
export namespace FX {
    export interface Pipeline {
        addGlow(color: number, outerStrength: number, innerStrength: number, knockout?: boolean, quality?: number, distance?: number): void;
        addShadow(x: number, y: number, color: number, decay: number, power: number, samples?: number, resolution?: number): void;
        addBarrel(amount: number): void;
        addGradient(angle: number, alpha: number): void;
    }
}