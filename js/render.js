import { state } from './state.js';

/**
 * 外部导出的唯一公开渲染函数，负责重绘整个画布
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 渲染上下文
 */
export function render(ctx) {
    const { canvas } = ctx;
    const { activeTab, showGrid, view } = state;

    // 1. 清空 canvas（使用画布的实际物理像素尺寸清空）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 保存当前的绘图状态（以便后续恢复变换前的坐标系）
    ctx.save();

    // 2. 应用视图变换（位移 + 缩放）
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);

    // 3. 根据 activeTab 决定绘制内容
    switch (activeTab) {
        case 'bw':
            drawBwLayer(ctx);
            break;
        case 'red':
            drawRedLayer(ctx);
            break;
        case 'preview':
            drawPreview(ctx);
            break;
    }

    // 4. 如果 showGrid 为 true，在最上层绘制网格线
    if (showGrid) {
        drawGrid(ctx);
    }

    // 5. 恢复视图变换，确保后续操作不受本次缩放平移影响
    ctx.restore();
}

/* ==========================================================================
   内部私有函数（不导出，仅供 render 内部调用）
   ========================================================================== */

/**
 * 绘制黑白层：0 为白色，1 为黑色
 */
function drawBwLayer(ctx) {
    const { bwLayer, config } = state;
    const size = config.baseCellSize;

    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            ctx.fillStyle = bwLayer[r][c] === 1 ? '#000000' : '#FFFFFF';
            ctx.fillRect(c * size, r * size, size, size);
        }
    }
}

/**
 * 绘制红色层：1 为亮红色，0 为浅灰色占位
 */
function drawRedLayer(ctx) {
    const { redLayer, config } = state;
    const size = config.baseCellSize;

    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            ctx.fillStyle = redLayer[r][c] === 1 ? '#FF3B30' : '#E5E5EA';
            ctx.fillRect(c * size, r * size, size, size);
        }
    }
}

/**
 * 合成预览：先绘制黑白图层作为底色，再将红色层中激活（值为 1）的像素叠绘在上面
 */
function drawPreview(ctx) {
    // 先完整绘制黑白层
    drawBwLayer(ctx);

    const { redLayer, config } = state;
    const size = config.baseCellSize;

    // 叠加红色层激活的点 (值为 0 的地方直接保留黑白层颜色，不覆盖)
    ctx.fillStyle = '#FF3B30';
    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            if (redLayer[r][c] === 1) {
                ctx.fillRect(c * size, r * size, size, size);
            }
        }
    }
}

/**
 * 绘制网格线：在整个 16×16 区域上绘制半透明灰色线条，不干扰底层图层观察
 */
function drawGrid(ctx) {
    const { config, view } = state;
    const size = config.baseCellSize;
    const width = config.cols * size;
    const height = config.rows * size;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(134, 134, 139, 0.4)'; // 半透明灰色
    ctx.lineWidth = 1 / view.scale; // 根据当前缩放级别调整线宽，保持视觉一致

    // 绘制竖线（包含最左和最右边界）
    for (let c = 0; c <= config.cols; c++) {
        const x = c * size;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // 绘制横线（包含最上和最下边界）
    for (let r = 0; r <= config.rows; r++) {
        const y = r * size;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.stroke();
}