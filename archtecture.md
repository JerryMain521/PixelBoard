# PixelBoard 架构手册

## 项目概述

PixelBoard 是一个基于浏览器的 16×16 像素画板工具，支持双图层编辑（黑白层 + 红色层），可实时预览合成效果，并将图层数据导出为 C++ 数组。

---

## 目录结构

```
pixelboard/
├── index.html          # HTML 骨架，负责页面结构
├── style.css           # 全局样式
└── js/
    ├── app.js          # 入口文件，初始化整个应用
    ├── state.js        # 数据层，存储所有状态
    ├── render.js       # 渲染层，负责 canvas 绘制
    ├── interaction.js  # 交互层，负责所有事件处理
    ├── export.js       # 导出层，生成 C++ 数组字符串
    └── utils.js        # 工具函数，纯函数集合
```

---

## 模块依赖关系

```
app.js
├── state.js        （无任何依赖）
├── utils.js        （无任何依赖）
├── render.js       → 依赖 state.js、utils.js
├── interaction.js  → 依赖 state.js、utils.js、render.js
└── export.js       → 依赖 state.js
```

依赖关系单向流动，不存在循环依赖。`state.js` 和 `utils.js` 是最底层的模块，不依赖任何其他文件。

---

## 文件详细说明

### index.html

**职责**：定义页面的 HTML 骨架结构，不包含任何逻辑。

页面分为三个区域：

**顶部工具栏**包含三个 Tab 按钮用于切换视图（黑白层 / 红色层 / 预览），以及一个网格线开关按钮。

**主画布区域**放置一个 `<canvas>` 元素，所有像素格子的绘制都在这里完成。canvas 的实际像素尺寸由 JS 动态设置，不在 HTML 中硬编码。

**底部输出区**包含两个只读文本框，分别显示黑白层和红色层的 C++ 数组，每个文本框旁边有一个复制按钮。

所有 JS 文件以 `type="module"` 方式引入，只引入 `app.js` 作为入口，其余模块由 app.js 内部通过 `import` 加载。

---

### style.css

**职责**：负责页面整体视觉样式，不包含任何逻辑。

主要包含以下部分：

- 页面整体布局（flex 纵向排列，居中）
- 工具栏样式（Tab 按钮的激活态、hover 态）
- canvas 容器样式（边框、居中、cursor 样式）
- 底部输出区样式（文本框、复制按钮）
- 响应式调整（保证在不同屏幕宽度下正常显示）

canvas 本身的视觉内容完全由 JS 控制，CSS 只控制 canvas 元素的外层容器。

---

### js/state.js

**职责**：集中存储应用的所有状态数据，是整个应用的"唯一真相来源"。

**不包含任何函数或逻辑**，只导出一个 `state` 对象。

```js
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

  // 视图变换状态（用于滚轮缩放）
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

}
```

其他模块需要修改状态时，**直接修改 state 对象的属性**，然后调用 `render()` 刷新画面。不使用任何 getter/setter 或响应式框架。

---

### js/utils.js

**职责**：提供纯工具函数，不依赖任何其他模块，不读写任何状态。

所有函数输入输出明确，相同输入永远得到相同输出。

**`screenToCell(mouseX, mouseY, view, config)`**

将鼠标在屏幕上的坐标换算为对应的格子行列号。由于画布存在缩放和偏移，必须经过反向变换才能得到正确的格子坐标。

- 输入：鼠标坐标 `(mouseX, mouseY)`，当前视图变换 `view`，画布配置 `config`
- 输出：`{ row, col }` 格子坐标，若点击在画布外则返回 `null`

**`layerToHex(layer)`**

将一个 16×16 的二维数组转换为十六进制字符串数组，每行 16 个 bit 转换为一个 `0xXXXX` 格式的字符串。

- 例如一行数据为 `[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1]`，输出为 `"0x3333"`
- 输入：16×16 的二维数组（值为 0 或 1）
- 输出：长度为 16 的字符串数组，每个元素形如 `"0x3333"`

**`initLayer(rows, cols, value)`**

创建一个指定尺寸、所有格子填充为同一初始值的二维数组。

- 输入：行数、列数、初始值（0 或 1）
- 输出：二维数组

---

### js/render.js

**职责**：根据当前 `state` 的内容，将画面绘制到 canvas 上。只读取 state，不修改 state。

导出唯一的公开函数 `render(ctx)`，每次调用时完整重绘整个 canvas。

**内部绘制流程（固定顺序）**：

```
1. 清空 canvas
2. 应用视图变换（scale + offset）
3. 根据 activeTab 决定绘制内容：
   - 'bw'      → 绘制黑白层
   - 'red'     → 绘制红色层（未开启的格子显示灰色占位）
   - 'preview' → 先绘制黑白层，再叠加红色层
4. 如果 showGrid == true，在最上层绘制网格线
5. 恢复视图变换
```

**内部私有函数**（不导出，仅供 render 内部调用）：

`drawBwLayer(ctx)` — 遍历 `state.bwLayer`，每个格子根据值绘制白色或黑色矩形。

`drawRedLayer(ctx)` — 遍历 `state.redLayer`，值为 1 时绘制红色矩形，值为 0 时绘制浅灰色矩形（表示该格子未激活）。

`drawPreview(ctx)` — 合成渲染，先调用 `drawBwLayer`，再遍历 `state.redLayer`，只在值为 1 的位置叠绘红色（值为 0 的位置直接显示下方黑白层颜色，不覆盖）。

`drawGrid(ctx)` — 在整个 16×16 区域上绘制横竖网格线，颜色为半透明灰色，使其不干扰下方图层的颜色观察。

**格子坐标换算**：

每个格子的绘制坐标为：
```
x = col * cellSize    （cellSize = config.baseCellSize * view.scale）
y = row * cellSize
width = cellSize
height = cellSize
```

---

### js/interaction.js

**职责**：绑定所有用户交互事件，在事件触发时修改 `state`，然后调用 `render()` 刷新画面。是连接用户操作和数据状态的桥梁。

导出唯一的公开函数 `bindEvents(canvas, ctx)`，在 `app.js` 初始化时调用一次。

**处理的事件列表**：

**`canvas click`（格子点击）**

调用 `utils.screenToCell()` 将鼠标坐标换算为格子坐标。根据当前 `activeTab` 判断操作哪一层：若当前是 `'bw'` 则翻转 `bwLayer[row][col]`，若是 `'red'` 则翻转 `redLayer[row][col]`，若是 `'preview'` 则不响应点击。翻转完成后调用 `render(ctx)`。

**`canvas wheel`（滚轮缩放）**

读取 `event.deltaY` 判断缩放方向。向上滚动放大，向下滚动缩小。缩放以鼠标当前位置为中心（而非画布左上角），需要同步更新 `view.scale` 和 `view.offsetX/Y`。缩放范围限制在 `0.5x ~ 8x` 之间，防止过大或过小。更新后调用 `render(ctx)`。

**`window keydown`（键盘 F 键复位）**

监听 `key === 'F'`（大写）或 `key === 'f'`（小写），触发时将 `view.scale` 重置为 `1`，`view.offsetX/Y` 重置为 `0`，然后调用 `render(ctx)`，使画布回到初始大小和位置。

**Tab 切换按钮 click**

监听顶部工具栏三个 Tab 按钮的点击事件，更新 `state.activeTab` 为对应值，同步更新按钮的激活样式，然后调用 `render(ctx)`。

**网格线开关按钮 click**

点击时翻转 `state.showGrid` 的布尔值，同步更新按钮的激活样式，然后调用 `render(ctx)`。

---

### js/export.js

**职责**：将 `state` 中的图层数据转换为 C++ 数组字符串，并处理复制到剪贴板的操作。

**`buildCppString(layer, arrayName)`**

将一个 16×16 二维数组转换为完整的 C++ 数组声明字符串。

输入：图层二维数组、C++ 数组变量名（如 `"bwLayer"` 或 `"redLayer"`）

输出示例：
```cpp
uint16_t bwLayer[16] = {
    0x0000, 0x0000, 0xFF00, 0x3333,
    0x0000, 0x0000, 0xFF00, 0x3333,
    0x0000, 0x0000, 0xFF00, 0x3333,
    0x0000, 0x0000, 0xFF00, 0x3333
};
```

内部调用 `utils.layerToHex()` 完成逐行的位运算转换。

**`updateExportPanel()`**

读取 `state.bwLayer` 和 `state.redLayer`，分别调用 `buildCppString()` 生成两个 C++ 字符串，然后更新页面底部两个文本框的内容。应在每次 `render()` 调用后同步调用，保证输出内容与画面一致。

**`copyToClipboard(text)`**

调用浏览器的 `navigator.clipboard.writeText()` API 将指定字符串复制到系统剪贴板。复制成功后短暂修改按钮文字为"已复制！"进行反馈，1.5 秒后恢复原文字。

---

### js/app.js

**职责**：应用入口，负责初始化所有模块并将它们串联起来。自身不包含业务逻辑。

**初始化流程**：

```
1. 获取 DOM 元素（canvas、ctx、各按钮、文本框）
2. 设置 canvas 尺寸（根据 config.baseCellSize × rows/cols 计算）
3. 调用 interaction.bindEvents(canvas, ctx) 绑定所有事件
4. 调用 export.updateExportPanel() 初始化输出区内容
5. 调用 render(ctx) 进行首次渲染
```

**不做任何状态修改或事件处理**，这些职责完全交由 `interaction.js` 和 `export.js` 负责。

---

## 数据流说明

整个应用的数据流是单向的：

```
用户操作
   ↓
interaction.js 修改 state
   ↓
render(ctx) 重绘 canvas
   ↓
export.updateExportPanel() 刷新 C++ 输出
```

没有任何模块会直接修改 DOM 上的视觉元素来代替 render()，所有视觉变化都必须经过"修改 state → 调用 render"这条路径。

---

## 图层合成规则

预览模式下，两层的合成逻辑如下：

```
对于每个格子 (row, col)：
  如果 redLayer[row][col] == 1  →  显示红色
  如果 redLayer[row][col] == 0  →  显示 bwLayer[row][col] 的颜色（白或黑）
```

网格线始终绘制在最上方，不参与图层合成逻辑，只影响视觉辅助显示。

---

## C++ 导出格式说明

每个图层导出为一个 `uint16_t` 数组，共 16 个元素，每个元素对应一行的 16 个格子。

**位序约定**：每行从左到右，第 0 列对应最高位（bit 15），第 15 列对应最低位（bit 0）。

**示例**：

若黑白层第 0 行为 `0011001100110011`，则：

```
二进制：0011 0011 0011 0011
十六进制：0x3333
```

最终输出：

```cpp
uint16_t bwLayer[16] = {
    0x3333, 0x0000, ...
};

uint16_t redLayer[16] = {
    0x0000, 0xFF00, ...
};
```