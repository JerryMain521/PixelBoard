import { state } from './state.js';
import { render } from './render.js';
import { screenToCell } from './utils.js';
import { exporter } from './export.js'; // 引入导出模块

export const interaction = {
    bindEvents(canvas, ctx, domElements) {
        
        // 辅助函数：统一负责重绘并同步更新代码区
        const refreshApp = () => {
            render(ctx);
            exporter.updateExportPanel(); // 每次画面变动，代码区同步跟着变
        };

        // 1. 像素格子点击
        canvas.addEventListener('click', (e) => {
            const { activeTab, config, view } = state;
            if (activeTab === 'preview') return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const cell = screenToCell(mouseX, mouseY, view, config);
            if (!cell) return;

            const { row, col } = cell;
            if (activeTab === 'bw') {
                state.bwLayer[row][col] = state.bwLayer[row][col] === 1 ? 0 : 1;
            } else if (activeTab === 'red') {
                state.redLayer[row][col] = state.redLayer[row][col] === 1 ? 0 : 1;
            }

            refreshApp();
        });

        // 2. 滚轮以鼠标为中心缩放（缩放不影响数组数据，不需要刷新代码区，只调用 render）
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const { view } = state;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const canvasX = (mouseX - view.offsetX) / view.scale;
            const canvasY = (mouseY - view.offsetY) / view.scale;

            const zoomFactor = 1.1;
            let newScale = e.deltaY < 0 ? view.scale * zoomFactor : view.scale / zoomFactor;
            newScale = Math.max(0.5, Math.min(8.0, newScale));

            view.offsetX = mouseX - canvasX * newScale;
            view.offsetY = mouseY - canvasY * newScale;
            view.scale = newScale;

            render(ctx);
        }, { passive: false });

        // 3. F键复位（不影响数据，只需调用 render）
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F' || e.key === 'f') {
                const { config } = state;
                state.view.scale = 1;
                // 计算让格子居中所需的偏移量
                state.view.offsetX = (canvas.width - config.cols * config.baseCellSize) / 2;
                state.view.offsetY = (canvas.height - config.rows * config.baseCellSize) / 2;
                render(ctx);
            }
        });

        // 4. Tab 切换
        const tabs = [domElements.tabBw, domElements.tabRed, domElements.tabPreview];
        tabs.forEach(tab => {
            if (!tab) return;
            tab.addEventListener('click', () => {
                state.activeTab = tab.getAttribute('data-view');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                render(ctx); // 仅切换视图，不需要重新转换数组文本
            });
        });

        // 5. 网格线开关
        if (domElements.btnToggleGrid) {
            domElements.btnToggleGrid.addEventListener('click', () => {
                state.showGrid = !state.showGrid;
                domElements.btnToggleGrid.textContent = state.showGrid ? '网格线: 开' : '网格线: 关';
                render(ctx);
            });
        }

        // 6. 导入/导出模式切换
        if (domElements.btnToggleMode) {
            domElements.btnToggleMode.addEventListener('click', () => {
                state.importMode = !state.importMode;
                if (state.importMode) {
                    domElements.btnToggleMode.textContent = '模式: 导入';
                    domElements.outputBw?.removeAttribute('readonly');
                    domElements.outputRed?.removeAttribute('readonly');
                    domElements.btnCopyBw && (domElements.btnCopyBw.textContent = '应用');
                    domElements.btnCopyRed && (domElements.btnCopyRed.textContent = '应用');
                } else {
                    domElements.btnToggleMode.textContent = '模式: 导出';
                    domElements.outputBw?.setAttribute('readonly', '');
                    domElements.outputRed?.setAttribute('readonly', '');
                    domElements.btnCopyBw && (domElements.btnCopyBw.textContent = '复制');
                    domElements.btnCopyRed && (domElements.btnCopyRed.textContent = '复制');
                    exporter.updateExportPanel();
                }
            });
        }

        // 7. 绑定底部的两个按钮（导出模式下复制，导入模式下应用数组）
        if (domElements.btnCopyBw && domElements.outputBw) {
            domElements.btnCopyBw.addEventListener('click', () => {
                if (state.importMode) {
                    if (exporter.importLayer(domElements.outputBw.value, 'bw')) {
                        refreshApp();
                    }
                } else {
                    exporter.copyToClipboard(domElements.outputBw.value, domElements.btnCopyBw);
                }
            });
        }
        if (domElements.btnCopyRed && domElements.outputRed) {
            domElements.btnCopyRed.addEventListener('click', () => {
                if (state.importMode) {
                    if (exporter.importLayer(domElements.outputRed.value, 'red')) {
                        refreshApp();
                    }
                } else {
                    exporter.copyToClipboard(domElements.outputRed.value, domElements.btnCopyRed);
                }
            });
        }
    }
};