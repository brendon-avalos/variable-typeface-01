# Standalone settings panel (vanilla)

Portable copy of the variable-typeface settings UI: collapsible panel, custom sliders (thumb shows value), and FG/BG hex fields with native color pickers.

## Files

| File | Role |
|------|------|
| `settings-panel.css` | Layout, motion, slider track/thumb, colors |
| `settings-panel.js` | `StandaloneSettingsPanel.init(panel, options)` |
| `index.html` | Demo page (open locally in a browser) |

## Use in another project

1. Copy this entire folder (or the two assets + your own HTML).
2. Link CSS and JS. Markup must follow the structure in `index.html` (class names and `data-*` hooks).
3. Call:

```js
var api = StandaloneSettingsPanel.init(document.getElementById("settings-panel"), {
  values: {
    circleWidth: 20,
    foregroundColor: "#FFFFFF",
    backgroundColor: "#000000",
    // …any keys matching data-setting on sliders
  },
  onChange: function (key, value, all) {
    // all includes hexEditFg / hexEditBg while typing; omit if you only care about committed colors
  },
});
```

- **Sliders:** each `.custom-slider-root` needs `data-setting`, `data-min`, `data-max`, optional `data-step`, and inner `.custom-slider-track` > `.custom-slider-thumb`.
- **Colors:** `data-color-hex="fg|bg"`, `data-color-native="fg|bg"`, `data-color-swatch="fg|bg"` on the swatch fill span.

API: `api.getValues()`, `api.setValue(key, value)`, `api.destroy()`.

## Optional font

CSS defaults to `"Avenue Mono"` with `ui-monospace` fallback. To match the main app, add `@font-face` in your page or in `settings-panel.css` and point `src` at your font files.

## Try the demo

From this directory:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` and use `index.html`.
