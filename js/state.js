/**
 * 应用全局状态对象（唯一真相来源）
 * 遵循直接读写原则，不包含任何 getter/setter 或副作用逻辑
 */
export const state = {
    // 黑白图层，16×16 二维数组
    // 0 = 白色，1 = 黑色
    bwLayer: Array.from({ length: 16 }, () => new Array(16).fill(0)),

    // 红色图层，16×16 二维数组
    // 0 = 关闭（透明），1 = 开启（红色）
    redLayer: Array.from({ length: 16 }, () => new Array(16).fill(0)),

    // 当前激活的 Tab
    // 可选值：'bw'（黑白层）| 'red'（红色层）| 'preview'（预览）
    activeTab: 'bw',

    // 网格线是否显示
    showGrid: true,

    // 模式开关：false = 像素→数组（导出），true = 数组→像素（导入）
    importMode: false,

    // 视图变换状态（用于滚轮缩放与画布平移）
    view: {
        scale: 1,       // 当前缩放倍数
        offsetX: 0,     // 画布在 X 方向的偏移（像素）
        offsetY: 0,     // 画布在 Y 方向的偏移（像素）
    },

    // 基础配置（不会在运行时改变）
    config: {
        rows: 16,           // 行数
        cols: 16,           // 列数
        baseCellSize: 24,   // 未缩放时每个格子的像素大小（px）
    }
};