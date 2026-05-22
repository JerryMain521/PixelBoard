/**
 * 将鼠标在 HTML Canvas 上的相对坐标换算为画布内像素格子的行列号
 * @param {number} mouseX - 鼠标相对于 canvas 元素的 X 坐标
 * @param {number} mouseY - 鼠标相对于 canvas 元素的 Y 坐标
 * @param {Object} view - 当前视图变换状态 { scale, offsetX, offsetY }
 * @param {Object} config - 画布基础配置 { rows, cols, baseCellSize }
 * @returns {Object|null} 成功时返回 { row, col }，若超出格子边界则返回 null
 */
export function screenToCell(mouseX, mouseY, view, config) {
    const { scale, offsetX, offsetY } = view;
    const { rows, cols, baseCellSize } = config;

    // 1. 逆转缩放与平移变换，计算出相对于未变换画布(0,0)点的绝对像素位置
    const canvasX = (mouseX - offsetX) / scale;
    const canvasY = (mouseY - offsetY) / scale;

    // 2. 根据每个格子的基础大小，计算出落在哪一行、哪一列
    const col = Math.floor(canvasX / baseCellSize);
    const row = Math.floor(canvasY / baseCellSize);

    // 3. 边界检查：如果计算出的坐标超出了定义的行列范围，说明点击在画布外部
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return null;
    }

    return { row, col };
}

/**
 * 将 16×16 的二维数组转换为 C++ 风格的十六进制字符串数组
 * 规定：每一行左侧第一个元素 [row][0] 代表 16-bit 整数的最高位 (MSB)
 * @param {number[][]} layer - 16×16 的二维数组（元素为 0 或 1）
 * @returns {string[]} 长度为 16 的字符串数组，每个元素形如 "0x3333"
 */
export function layerToHex(layer) {
    const hexArray = [];

    for (let r = 0; r < 16; r++) {
        let rowValue = 0;
        for (let c = 0; c < 16; c++) {
            // 如果该点被标记（值为 1），则将对应权重的比特位置 1
            // c = 0 时移位 15（最高位 MSB），c = 15 时移位 0（最低位 LSB）
            if (layer[r][c] === 1) {
                rowValue |= (1 << (15 - c));
            }
        }
        // 将数字转为 16 进制，并通过 padStart 补齐 4 位大写，输出形如 "0x3333"
        const hexStr = '0x' + (rowValue >>> 0).toString(16).toUpperCase().padStart(4, '0');
        hexArray.push(hexStr);
    }

    return hexArray;
}

/**
 * 创建一个指定尺寸、所有格子填充为同一初始值的二维数组
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {number} value - 初始值（通常为 0 或 1）
 * @returns {number[][]} 构建完成的二维数组
 */
export function initLayer(rows, cols, value) {
    return Array.from({ length: rows }, () => new Array(cols).fill(value));
}