import './minigame-polyfills';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

declare const tt: any;

// 简单的适配器逻辑 (如果需要更复杂的适配，建议引入 minigame-adapter)
// 这里假设环境已经有基本的 Canvas 支持，或者通过外部 Adapter 注入

// 在小游戏环境中，通常没有 window/document，或者是不完整的
// Phaser 需要一个 Canvas
// 抖音小游戏通常提供 tt.createCanvas()

// 初始化游戏
// @ts-ignore
const canvas = tt.createCanvas();
// 3. 修复 canvas 相关缺失方法
if (!canvas.addEventListener) {
    // @ts-ignore
    canvas.addEventListener = () => {};
    // @ts-ignore
    canvas.removeEventListener = () => {};
}
// 修复 getBoundingClientRect is not a function
if (!canvas.getBoundingClientRect) {
    // @ts-ignore
    canvas.getBoundingClientRect = () => {
        return {
            top: 0,
            left: 0,
            width: systemInfo.windowWidth,
            height: systemInfo.windowHeight,
            bottom: systemInfo.windowHeight,
            right: systemInfo.windowWidth,
            x: 0,
            y: 0
        };
    };
}
// 修复 style undefined
if (!canvas.style) {
    // @ts-ignore
    canvas.style = {};
}

const systemInfo = tt.getSystemInfoSync();

const config = {
    ...gameConfig,
    width: systemInfo.windowWidth,
    height: systemInfo.windowHeight,
    canvas: canvas,
    type: Phaser.CANVAS, // 小游戏通常建议使用 CANVAS 或 WEBGL (取决于适配情况)
    // 模拟一个 parent 节点，防止 Phaser 尝试将 canvas 添加到 document.body 导致报错
    parent: {
        nodeType: 1,
        style: {},
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => {
            return {
                x: 0,
                y: 0,
                width: systemInfo.windowWidth,
                height: systemInfo.windowHeight,
                top: 0,
                left: 0,
                right: systemInfo.windowWidth,
                bottom: systemInfo.windowHeight,
            };
        }
    } as any,
    scale: {
        mode: Phaser.Scale.NONE, // 手动控制尺寸
        width: systemInfo.windowWidth,
        height: systemInfo.windowHeight
    }
};

new Phaser.Game(config);
