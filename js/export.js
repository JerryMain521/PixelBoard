import { state } from './state.js';
import { layerToHex } from './utils.js';

// 内部留存底部两个文本框的 DOM 引用，方便随时刷新
let cachedOutputBw = null;
let cachedOutputRed = null;

export const exporter = {
    /**
     * 将 16×16 二维数组转换为完整的 C++ uint16_t 数组声明字符串
     * @param {number[][]} layer - 图层二维数组
     * @param {string} arrayName - C++ 数组变量名
     * @returns {string} 完整的 C++ 代码块字符串
     */
    buildCppString(layer, arrayName) {
        // 调用 utils 模块逐行完成 16 位位运算转换，得到 16 个十六进制字符串组成的数组
        const hexLines = layerToHex(layer);
        
        // 按照每行 4 个元素的排版格式进行格式化拼接
        let result = `uint16_t ${arrayName}[16] = {\n`;
        
        for (let i = 0; i < 16; i += 4) {
            const chunk = hexLines.slice(i, i + 4).join(', ');
            // 如果是最后四个元素，末尾不需要加逗号
            const trailingComma = (i + 4 < 16) ? ',' : '';
            result += `    ${chunk}${trailingComma}\n`;
        }
        
        result += `};`;
        return result;
    },

    /**
     * 读取最新状态并刷新底部两个输出文本框。
     * 首次调用时需要传入 DOM 元素完成绑定；后续更新若不传参数，将自动使用缓存的 DOM。
     * @param {HTMLTextAreaElement} [outputBw] - 黑白层文本框
     * @param {HTMLTextAreaElement} [outputRed] - 红色层文本框
     */
    updateExportPanel(outputBw, outputRed) {
        // 首次初始化时缓存 DOM 元素
        if (outputBw) cachedOutputBw = outputBw;
        if (outputRed) cachedOutputRed = outputRed;

        if (!cachedOutputBw || !cachedOutputRed) return;

        // 根据最新状态生成 C++ 字符串
        const bwCppText = this.buildCppString(state.bwLayer, 'bwLayer');
        const redCppText = this.buildCppString(state.redLayer, 'redLayer');

        // 更新文本框内容
        cachedOutputBw.value = bwCppText;
        cachedOutputRed.value = redCppText;
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
                button.disabled = true; // 期间防止重复点击

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