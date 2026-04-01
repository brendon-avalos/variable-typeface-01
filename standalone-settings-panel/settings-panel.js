/**
 * Vanilla JS: collapse, sliders (thumb = value), FG/BG hex + native color inputs.
 * Global: StandaloneSettingsPanel.init(panelElement, { values, onChange })
 */
(function (global) {
  "use strict";

  var THUMB_WIDTH = 32;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function roundToStep(value, min, max, step) {
    var steps = Math.round((value - min) / step);
    var next = min + steps * step;
    return clamp(Number(next.toPrecision(12)), min, max);
  }

  function valueFromClientX(clientX, trackEl, min, max, step) {
    if (!trackEl) return min;
    var rect = trackEl.getBoundingClientRect();
    var usable = rect.width - THUMB_WIDTH;
    if (usable <= 0) return min;
    var x = clientX - rect.left;
    var thumbLeft = clamp(x - THUMB_WIDTH / 2, 0, usable);
    var pct = thumbLeft / usable;
    var raw = min + pct * (max - min);
    return roundToStep(raw, min, max, step);
  }

  function formatDisplay(value, step) {
    if (Number.isInteger(step) || (step >= 1 && step % 1 === 0)) {
      return Math.round(value);
    }
    var decimals = String(step).split(".")[1];
    decimals = decimals ? decimals.length : 1;
    return Number(value.toFixed(Math.min(decimals, 4)));
  }

  function normalizeHex6(input) {
    if (!input || typeof input !== "string") return null;
    var t = input.trim();
    if (t.startsWith("#")) t = t.slice(1);
    t = t.replace(/[^0-9A-Fa-f]/g, "");
    if (t.length === 3) {
      t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
    }
    if (t.length !== 6) return null;
    return "#" + t.toUpperCase();
  }

  function bindSlider(root, state, key, onChange) {
    var track = root.querySelector(".custom-slider-track");
    var thumb = root.querySelector(".custom-slider-thumb");
    if (!track || !thumb) return;

    var min = Number(root.dataset.min);
    var max = Number(root.dataset.max);
    var step = root.dataset.step != null && root.dataset.step !== "" ? Number(root.dataset.step) : 1;

    var dragPointerId = null;

    function getValue() {
      return state[key];
    }

    function setValue(v) {
      v = roundToStep(v, min, max, step);
      if (state[key] === v) return;
      state[key] = v;
      sync();
      onChange(key, v, Object.assign({}, state));
    }

    function sync() {
      var value = state[key];
      var pct = max === min ? 0 : (value - min) / (max - min);
      thumb.style.setProperty("--slider-pct", String(pct));
      thumb.textContent = String(formatDisplay(value, step));
      root.setAttribute("aria-valuenow", String(value));
      root.setAttribute("aria-valuetext", String(formatDisplay(value, step)));
    }

    function applyFromEvent(clientX) {
      setValue(valueFromClientX(clientX, track, min, max, step));
    }

    function endDrag() {
      dragPointerId = null;
    }

    function onMove(e) {
      if (dragPointerId == null || e.pointerId !== dragPointerId) return;
      applyFromEvent(e.clientX);
    }

    function onUp(e) {
      if (e.pointerId === dragPointerId) endDrag();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    root._settingsPanelCleanup = root._settingsPanelCleanup || [];
    root._settingsPanelCleanup.push(function () {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    });

    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".custom-slider-thumb")) return;
      root.focus({ preventScroll: true });
      applyFromEvent(e.clientX);
    });

    thumb.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      root.focus({ preventScroll: true });
      dragPointerId = e.pointerId;
      try {
        thumb.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    root.addEventListener("keydown", function (e) {
      var value = getValue();
      var next = value;
      var page = (max - min) / 10 || step;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = clamp(value + step, min, max);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = clamp(value - step, min, max);
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        case "PageUp":
          next = clamp(value + page, min, max);
          break;
        case "PageDown":
          next = clamp(value - page, min, max);
          break;
        default:
          return;
      }
      e.preventDefault();
      next = roundToStep(next, min, max, step);
      if (next !== value) setValue(next);
    });

    sync();
  }

  function bindColorPair(panel, state, prefix, colorKey, draftKey, onChange) {
    var hexInput = panel.querySelector('[data-color-hex="' + prefix + '"]');
    var nativeInput = panel.querySelector('[data-color-native="' + prefix + '"]');
    var swatch = panel.querySelector('[data-color-swatch="' + prefix + '"]');
    if (!hexInput || !nativeInput || !swatch) return;

    function applyColor(hex) {
      hex = hex.toUpperCase();
      state[colorKey] = hex;
      state[draftKey] = null;
      nativeInput.value = hex;
      swatch.style.backgroundColor = hex;
      if (document.activeElement !== hexInput) hexInput.value = hex;
      onChange(colorKey, hex, Object.assign({}, state));
    }

    hexInput.addEventListener("focus", function () {
      state[draftKey] = state[colorKey];
      hexInput.value = state[colorKey];
    });

    hexInput.addEventListener("input", function () {
      var v = hexInput.value.toUpperCase();
      if (!v.startsWith("#")) v = "#" + v.replace(/#/g, "");
      v = "#" + v.slice(1).replace(/[^0-9A-F]/g, "").slice(0, 6);
      state[draftKey] = v;
      var n = normalizeHex6(v);
      if (n) {
        state[colorKey] = n;
        nativeInput.value = n;
        swatch.style.backgroundColor = n;
        onChange(colorKey, n, Object.assign({}, state));
      }
    });

    hexInput.addEventListener("blur", function () {
      var draft = state[draftKey];
      var raw = draft != null ? draft : state[colorKey];
      var next = normalizeHex6(raw) || state[colorKey];
      applyColor(next);
    });

    nativeInput.addEventListener("input", function () {
      applyColor(nativeInput.value.toUpperCase());
    });

    swatch.style.backgroundColor = state[colorKey];
    hexInput.value = state[colorKey];
    nativeInput.value = state[colorKey];
  }

  function bindCollapse(panel) {
    var btn = panel.querySelector(".collapse-button");
    var body = panel.querySelector(".settings-body");
    if (!btn || !body) return;

    function syncDom(open) {
      panel.setAttribute("data-open", open ? "true" : "false");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      body.classList.toggle("open", open);
      body.classList.toggle("closed", !open);
    }

    var open = panel.getAttribute("data-open") === "true";
    syncDom(open);

    btn.addEventListener("click", function () {
      open = !open;
      syncDom(open);
    });
  }

  function init(panel, options) {
    options = options || {};
    var onChange = options.onChange || function () {};
    var state = Object.assign({}, options.values || {});

    if (!("hexEditFg" in state)) state.hexEditFg = null;
    if (!("hexEditBg" in state)) state.hexEditBg = null;

    var sliderRoots = panel.querySelectorAll(".custom-slider-root[data-setting]");
    sliderRoots.forEach(function (root) {
      var key = root.dataset.setting;
      if (state[key] == null) {
        state[key] = Number(
          root.dataset.defaultValue != null ? root.dataset.defaultValue : root.dataset.min
        );
      }
      bindSlider(root, state, key, onChange);
    });

    bindColorPair(panel, state, "fg", "foregroundColor", "hexEditFg", onChange);
    bindColorPair(panel, state, "bg", "backgroundColor", "hexEditBg", onChange);

    bindCollapse(panel);

    return {
      getValues: function () {
        return Object.assign({}, state);
      },
      setValue: function (key, value) {
        if (key === "foregroundColor" || key === "backgroundColor") {
          var n = normalizeHex6(String(value));
          if (n) {
            state[key] = n;
            var prefix = key === "foregroundColor" ? "fg" : "bg";
            var hexInput = panel.querySelector('[data-color-hex="' + prefix + '"]');
            var nativeInput = panel.querySelector('[data-color-native="' + prefix + '"]');
            var swatch = panel.querySelector('[data-color-swatch="' + prefix + '"]');
            if (hexInput) hexInput.value = n;
            if (nativeInput) nativeInput.value = n;
            if (swatch) swatch.style.backgroundColor = n;
            onChange(key, n, Object.assign({}, state));
          }
          return;
        }
        var root = panel.querySelector('.custom-slider-root[data-setting="' + key + '"]');
        if (!root) return;
        var min = Number(root.dataset.min);
        var max = Number(root.dataset.max);
        var step = root.dataset.step != null && root.dataset.step !== "" ? Number(root.dataset.step) : 1;
        var v = roundToStep(Number(value), min, max, step);
        state[key] = v;
        var thumb = root.querySelector(".custom-slider-thumb");
        var pct = max === min ? 0 : (v - min) / (max - min);
        if (thumb) {
          thumb.style.setProperty("--slider-pct", String(pct));
          thumb.textContent = String(formatDisplay(v, step));
        }
        root.setAttribute("aria-valuenow", String(v));
        root.setAttribute("aria-valuetext", String(formatDisplay(v, step)));
        onChange(key, v, Object.assign({}, state));
      },
      destroy: function () {
        panel.querySelectorAll(".custom-slider-root").forEach(function (root) {
          if (root._settingsPanelCleanup) {
            root._settingsPanelCleanup.forEach(function (fn) {
              fn();
            });
            root._settingsPanelCleanup = null;
          }
        });
      },
    };
  }

  global.StandaloneSettingsPanel = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
