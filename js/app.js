import { state } from './state.js';
import { render } from './render.js';
import { interaction } from './interaction.js';
import { exporter } from './export.js';

/**
 * 应用程序入口函数
 */
function init() {
    // 1. 获取核心 DOM 元素
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) {
        console.error('无法找到 canvas 元素');
        return;
    }
    const ctx = canvas.getContext('2d');

    const domElements = {
        tabBw: document.getElementById('tab-bw'),
        tabRed: document.getElementById('tab-red'),
        tabPreview: document.getElementById('tab-preview'),
        btnToggleGrid: document.getElementById('btn-toggle-grid'),
        btnToggleMode: document.getElementById('btn-toggle-mode'),
        outputBw: document.getElementById('output-bw'),
        outputRed: document.getElementById('output-red'),
        btnCopyBw: document.getElementById('btn-copy-bw'),
        btnCopyRed: document.getElementById('btn-copy-red'),
        inputRows: document.getElementById('input-rows'),
        inputCols: document.getElementById('input-cols'),
        btnResize: document.getElementById('btn-resize'),
    };

    // 2. canvas 铺满整个视口，格子等分屏幕
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.config.baseCellSize = Math.floor(Math.min(window.innerWidth / state.config.cols, window.innerHeight / state.config.rows));
    
    // 3. 调用 export 模块初始化输出区内容
    exporter.updateExportPanel(domElements.outputBw, domElements.outputRed);

    // 4. 调用 interaction 模块绑定所有交互事件
    interaction.bindEvents(canvas, ctx, domElements);

    // canvas 尺寸设置完之后，初始化居中偏移
    state.view.scale = 0.7; // 初始缩放为 70%，让格子更大一些
    state.view.offsetX = (canvas.width - state.config.cols * state.config.baseCellSize * state.view.scale) / 2;
    state.view.offsetY = (canvas.height - state.config.rows * state.config.baseCellSize * state.view.scale - 100) / 2;

    // 5. 调用 render 模块进行首次画面渲染
    render(ctx);

    // 6. 窗口大小变化时重新适配
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        state.config.baseCellSize = Math.floor(Math.min(window.innerWidth / state.config.cols, window.innerHeight / state.config.rows));
        state.view.offsetX = (canvas.width - state.config.cols * state.config.baseCellSize * state.view.scale) / 2;
        state.view.offsetY = (canvas.height - state.config.rows * state.config.baseCellSize * state.view.scale - 100) / 2;
        render(ctx);
    });

    document.getElementById('btn-resize').addEventListener('click', () => {
        const newRows = Math.max(1, parseInt(domElements.inputRows.value) || 16);
        const newCols = Math.max(1, parseInt(domElements.inputCols.value) || 16);

        // 更新配置
        state.config.rows = newRows;
        state.config.cols = newCols;

        // 重建两个图层数组（新尺寸，清空为 0）
        state.bwLayer  = Array.from({ length: newRows }, () => new Array(newCols).fill(0));
        state.redLayer = Array.from({ length: newRows }, () => new Array(newCols).fill(0));

        // 重新计算 baseCellSize 并居中
        state.config.baseCellSize = Math.floor(Math.min(canvas.width / newCols, canvas.height / newRows));
        state.view.scale = 0.7;
        state.view.offsetX = (canvas.width  - newCols * state.config.baseCellSize * state.view.scale) / 2;
        state.view.offsetY = (canvas.height - newRows * state.config.baseCellSize * state.view.scale - 100) / 2;

        exporter.updateExportPanel(domElements.outputBw, domElements.outputRed);
        render(ctx);
    });
}

// 当 DOM 解析完成后启动应用
document.addEventListener('DOMContentLoaded', init);