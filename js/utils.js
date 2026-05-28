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
 * 将二维数组转换为 C++ 风格的 uint8_t 十六进制字符串数组
 * 规定：每一行左侧第一个元素 [row][0] 代表 8-bit 整数的最高位 (MSB)
 * @param {number[][]} layer - 二维数组（元素为 0 或 1）
 * @returns {string[]} 长度 = rows * ceil(cols/8) 的字符串数组，每个元素形如 "0x3F"
 */
export function layerToHex(layer) {
    const cols = layer[0]?.length ?? 0;
    const numWords = Math.ceil(cols / 8);
    const allWords = [];

    for (const row of layer) {
        for (let w = 0; w < numWords; w++) {
            let val = 0;
            for (let b = 0; b < 8; b++) {
                const c = w * 8 + b;
                if (c < cols && row[c] === 1) {
                    val |= (1 << (7 - b));
                }
            }
            allWords.push('0x' + (val >>> 0).toString(16).toUpperCase().padStart(2, '0'));
        }
    }

    return allWords;
}

/**
 * 从 C++ 数组文本中提取所有十六进制数值
 * @param {string} text - 包含 0xNN 格式的文本
 * @returns {number[]} 解析出的整数值数组
 */
export function parseHexArray(text) {
    const hexPattern = /0x[0-9A-Fa-f]{1,2}/g;
    const matches = text.match(hexPattern) || [];
    return matches.map(h => parseInt(h, 16));
}

/**
 * 将 uint8_t 十六进制数组还原为二维图层数组
 * @param {number[]} hexValues - 解析后的整数值数组
 * @param {number} rows - 目标行数
 * @param {number} cols - 目标列数
 * @returns {number[][]} 还原的二维数组
 */
export function hexToLayer(hexValues, rows, cols) {
    const numWords = Math.ceil(cols / 8);
    const layer = initLayer(rows, cols, 0);

    for (let r = 0; r < rows; r++) {
        for (let w = 0; w < numWords; w++) {
            const idx = r * numWords + w;
            if (idx >= hexValues.length) break;
            const val = hexValues[idx];
            for (let b = 0; b < 8; b++) {
                const c = w * 8 + b;
                if (c < cols && (val & (1 << (7 - b)))) {
                    layer[r][c] = 1;
                }
            }
        }
    }

    return layer;
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