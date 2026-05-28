import { state } from './state.js';
import { layerToHex, parseHexArray, hexToLayer } from './utils.js';

// 内部留存底部两个文本框的 DOM 引用，方便随时刷新
let cachedOutputBw = null;
let cachedOutputRed = null;

export const exporter = {
    /**
     * 将二维数组转换为完整的 C++ uint8_t 数组声明字符串
     * @param {number[][]} layer - 图层二维数组
     * @param {string} arrayName - C++ 数组变量名
     * @returns {string} 完整的 C++ 代码块字符串
     */
    buildCppString(layer, arrayName) {
        const rows = layer.length;
        const cols = layer[0]?.length ?? 0;
        const numWords = Math.ceil(cols / 8);
        const allWords = layerToHex(layer);

        let result = `uint8_t ${arrayName}[${rows * numWords}] = {\n`;

        for (let r = 0; r < rows; r++) {
            const chunk = allWords.slice(r * numWords, (r + 1) * numWords).join(', ');
            const comma = r < rows - 1 ? ',' : '';
            result += `    ${chunk}${comma}  // row ${r}\n`;
        }

        result += `};`;
        return result;
    },

    /**
     * 读取最新状态并刷新底部两个输出文本框。
     * 导入模式下不会覆盖用户正在编辑的内容。
     * @param {HTMLTextAreaElement} [outputBw] - 黑白层文本框
     * @param {HTMLTextAreaElement} [outputRed] - 红色层文本框
     */
    updateExportPanel(outputBw, outputRed) {
        if (outputBw) cachedOutputBw = outputBw;
        if (outputRed) cachedOutputRed = outputRed;

        if (!cachedOutputBw || !cachedOutputRed) return;
        if (state.importMode) return; // 导入模式下不自动更新

        const bwCppText = this.buildCppString(state.bwLayer, 'bwLayer');
        const redCppText = this.buildCppString(state.redLayer, 'redLayer');

        cachedOutputBw.value = bwCppText;
        cachedOutputRed.value = redCppText;
    },

    /**
     * 导入模式：解析文本框中的数组并更新对应图层
     * @param {string} text - 文本框中的 C++ 数组文本
     * @param {'bw'|'red'} layerName - 目标图层名称
     * @returns {boolean} 是否成功
     */
    importLayer(text, layerName) {
        const hexValues = parseHexArray(text);
        const { rows, cols } = state.config;
        const numWords = Math.ceil(cols / 8);
        const expected = rows * numWords;

        if (hexValues.length === 0) {
            alert('未在文本中找到有效的十六进制数值 (0xNN 格式)');
            return false;
        }

        if (hexValues.length !== expected) {
            const confirmed = confirm(
                `数组长度不匹配：找到 ${hexValues.length} 个值，但当前 ${rows}×${cols} 的网格需要 ${expected} 个值。\n\n是否仍要继续导入？（多余值将被忽略，不足部分将补零）`
            );
            if (!confirmed) return false;
        }

        if (layerName === 'bw') {
            state.bwLayer = hexToLayer(hexValues, rows, cols);
        } else {
            state.redLayer = hexToLayer(hexValues, rows, cols);
        }

        return true;
    },

    /**
     * 将指定文本复制到剪贴板，并提供 1.5 秒的按钮文字状态反馈
     * @param {string} text - 需要复制的字符串
     * @param {HTMLButtonElement} button - 点击的复制按钮 DOM
     */
    copyToClipboard(text, button) {
        if (!navigator.clipboard) {
            console.error('浏览器不支持 Clipboard API');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = button.textContent;
                button.textContent = '已复制！';
                button.disabled = true;

                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 1500);
            })
            .catch(err => {
                console.error('复制失败: ', err);
            });
    }
};