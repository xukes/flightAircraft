
declare const tt: any;

// @ts-ignore
if (typeof window === 'undefined') { 
    // @ts-ignore
    window = {}; 
}
// @ts-ignore
if (typeof document === 'undefined') { 
    // @ts-ignore
    document = {}; 
}

// 1. 修复 target.addEventListener is not a function (KeyboardManager)
if (!window.addEventListener) {
    window.addEventListener = () => {};
}
if (!window.removeEventListener) {
    window.removeEventListener = () => {};
}
// 修复 window.focus Illegal invocation
// @ts-ignore
window.focus = () => {};

// 2. 修复 Illegal invocation (VisibilityHandler)
// 强制覆盖 document 方法，避免调用原生不兼容的方法
try {
    // 使用 Object.defineProperty 强制覆盖，防止直接赋值失败
    Object.defineProperty(document, 'addEventListener', {
        value: () => {},
        writable: true,
        configurable: true
    });
    Object.defineProperty(document, 'removeEventListener', {
        value: () => {},
        writable: true,
        configurable: true
    });
    // 屏蔽 hidden 属性，让 Phaser 认为不支持 Visibility API，从而跳过相关逻辑
    Object.defineProperty(document, 'hidden', { value: undefined, writable: true, configurable: true });
    Object.defineProperty(document, 'webkitHidden', { value: undefined, writable: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
} catch (e) {
    console.warn('Mock document failed:', e);
}

// 3. 确保 globalThis 存在 (修复 new Function 问题)
// @ts-ignore
if (typeof globalThis === 'undefined') {
    // @ts-ignore
    globalThis = window;
}
