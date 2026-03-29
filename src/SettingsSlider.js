import React, { useRef, useCallback, useEffect } from "react";

const THUMB_WIDTH = 32;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundToStep(value, min, max, step) {
  const steps = Math.round((value - min) / step);
  const next = min + steps * step;
  return clamp(Number(next.toPrecision(12)), min, max);
}

function valueFromClientX(clientX, trackEl, min, max, step) {
  if (!trackEl) return min;
  const rect = trackEl.getBoundingClientRect();
  const usable = rect.width - THUMB_WIDTH;
  if (usable <= 0) return min;
  const x = clientX - rect.left;
  const thumbLeft = clamp(x - THUMB_WIDTH / 2, 0, usable);
  const pct = thumbLeft / usable;
  const raw = min + pct * (max - min);
  return roundToStep(raw, min, max, step);
}

function formatDisplay(value, step) {
  if (Number.isInteger(step) || (step >= 1 && step % 1 === 0)) {
    return Math.round(value);
  }
  const decimals = String(step).split(".")[1]?.length ?? 1;
  return Number(value.toFixed(Math.min(decimals, 4)));
}

/**
 * Custom slider: thumb and value label are the same element; position uses one model.
 */
export function SettingsSlider({ id, min, max, step = 1, value, onChange }) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const dragPointerId = useRef(null);

  const percentage = max === min ? 0 : (value - min) / (max - min);
  const display = formatDisplay(value, step);

  const applyFromEvent = useCallback(
    (clientX) => {
      const next = valueFromClientX(clientX, trackRef.current, min, max, step);
      onChange(next);
    },
    [min, max, step, onChange]
  );

  const endDrag = useCallback(() => {
    dragPointerId.current = null;
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (dragPointerId.current == null || e.pointerId !== dragPointerId.current) {
        return;
      }
      applyFromEvent(e.clientX);
    };
    const onUp = (e) => {
      if (e.pointerId === dragPointerId.current) endDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyFromEvent, endDrag]);

  const onTrackPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(".custom-slider-thumb")) return;
    rootRef.current?.focus({ preventScroll: true });
    applyFromEvent(e.clientX);
  };

  const onThumbPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    rootRef.current?.focus({ preventScroll: true });
    dragPointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  };

  const onKeyDown = (e) => {
    let next = value;
    const page = (max - min) / 10 || step;
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
    if (next !== value) onChange(next);
  };

  return (
    <div
      ref={rootRef}
      id={id}
      className="custom-slider-root"
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={String(display)}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      <div
        ref={trackRef}
        className="custom-slider-track"
        onPointerDown={onTrackPointerDown}
      >
        <div
          className="custom-slider-thumb"
          style={{ "--slider-pct": percentage }}
          onPointerDown={onThumbPointerDown}
        >
          {display}
        </div>
      </div>
    </div>
  );
}
