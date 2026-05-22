# PixelBoard

A browser-based 16×16 pixel editor with dual-layer support, designed for creating icons and exporting them as C++ arrays for embedded display systems.

---

## Features

- **Dual-layer editing** — Independent black/white layer and red layer, each 16×16
- **Layer preview** — Composite view showing both layers merged in real time
- **Grid overlay** — Toggleable grid lines sitting on top of all layers
- **Zoom** — Scroll wheel to zoom in/out, `F` key to reset to default view
- **C++ export** — Both layers are exported as `uint16_t` arrays in hex format, ready to copy

---

## Getting Started

Because the project uses ES Modules (`import`/`export`), it must be served over HTTP rather than opened directly as a `file://` URL.

**Option 1 — VS Code Live Server (recommended)**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, then right-click `index.html` and select **Open with Live Server**.

**Option 2 — Python**

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

**Option 3 — Node.js**

```bash
npx serve .
```

---

## Usage

### Switching Layers

Use the tab buttons in the top toolbar to switch between editing modes:

| Tab | Description |
|-----|-------------|
| 黑白层 (B&W) | Edit the black and white layer. Click a cell to toggle between black and white. |
| 红色层 (Red) | Edit the red layer. Click a cell to toggle red on or off. |
| 预览 (Preview) | Read-only composite view. Red cells take priority over the B&W layer beneath. |

### Grid Lines

Click the **网格线 (Grid)** button in the toolbar to show or hide the grid overlay.

### Zoom & Navigation

| Action | Effect |
|--------|--------|
| Scroll wheel up | Zoom in |
| Scroll wheel down | Zoom out |
| `F` key | Reset zoom and re-center the canvas |

### C++ Export

The bottom panel displays the current state of both layers as C++ array declarations. Click the **复制 (Copy)** button next to each array to copy it to your clipboard.

---

## Layer Compositing Rules

In preview mode, the two layers are merged using the following logic:

```
for each cell (row, col):
    if redLayer[row][col] == 1  →  display red
    if redLayer[row][col] == 0  →  display bwLayer[row][col] (black or white)
```

The grid overlay is always rendered on top and does not affect the exported data.

---

## C++ Export Format

Each layer is exported as a `uint16_t` array of 16 elements, one per row.

**Bit order:** The leftmost cell (column 0) maps to the most significant bit (bit 15). The rightmost cell (column 15) maps to the least significant bit (bit 0).

**Example:** A row of `0011001100110011` is stored as `0x3333`.

**Output format:**

```cpp
uint16_t bwLayer[16] = {
    0x3333, 0x0000, 0xFF00, 0x0F0F,
    0x3333, 0x0000, 0xFF00, 0x0F0F,
    0x3333, 0x0000, 0xFF00, 0x0F0F,
    0x3333, 0x0000, 0xFF00, 0x0F0F
};

uint16_t redLayer[16] = {
    0x0000, 0x0000, 0x0000, 0x0000,
    0x0000, 0x0000, 0x0000, 0x0000,
    0x0000, 0x0000, 0x0000, 0x0000,
    0x0000, 0x0000, 0x0000, 0x0000
};
```

---

## Project Structure

```
pixelboard/
├── index.html          # Page structure
├── style.css           # Styles
└── js/
    ├── app.js          # Entry point, initialization
    ├── state.js        # Global state (single source of truth)
    ├── render.js       # Canvas drawing logic
    ├── interaction.js  # Mouse and keyboard event handling
    ├── export.js       # C++ array generation and clipboard copy
    └── utils.js        # Pure utility functions
```

---

## Browser Compatibility

Requires a modern browser with support for ES Modules and the Canvas 2D API. Tested on Chrome and Edge.