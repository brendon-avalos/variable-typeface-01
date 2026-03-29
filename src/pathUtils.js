import paper from 'paper';

// Initialize Paper.js with a temporary canvas
let paperInitialized = false;

function ensurePaperInitialized() {
  if (!paperInitialized) {
    // Create a temporary canvas for Paper.js
    const canvas = document.createElement('canvas');
    paper.setup(canvas);
    paperInitialized = true;
  }
}

/**
 * SVG path `d` for one dot: superellipse (Lamé curve) with eased roundness.
 * Shared by live preview and font export so geometry stays identical.
 *
 * @param {number} cx - center x
 * @param {number} cy - center y
 * @param {number} scaledWidth
 * @param {number} scaledHeight
 * @param {number} roundness - 0–100 (settings slider)
 * @param {number} [steps=100] - samples around the curve
 * @param {number} [rotationDeg=0] - rotation in degrees around (cx, cy), same as Paper path.rotate(angle) at shape center
 * @returns {string}
 */
function offsetRotated(cx, cy, ox, oy, rotationDeg) {
  if (!rotationDeg) return [cx + ox, cy + oy];
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const rx = ox * c - oy * s;
  const ry = ox * s + oy * c;
  return [cx + rx, cy + ry];
}

export function buildDotPathD(cx, cy, scaledWidth, scaledHeight, roundness, steps = 100, rotationDeg = 0) {
  const hw = scaledWidth / 2;
  const hh = scaledHeight / 2;

  if (roundness <= 0) {
    // True rectangle: same winding as the polar superellipse (right → bottom → left → top)
    const corners = [
      [hw, 0],
      [hw, hh],
      [-hw, hh],
      [-hw, -hh],
      [hw, -hh],
    ];
    const [x0, y0] = offsetRotated(cx, cy, corners[0][0], corners[0][1], rotationDeg);
    let d = `M ${x0} ${y0}`;
    for (let i = 1; i < corners.length; i++) {
      const [xi, yi] = offsetRotated(cx, cy, corners[i][0], corners[i][1], rotationDeg);
      d += ` L ${xi} ${yi}`;
    }
    return `${d} Z`;
  }

  const normalizedRoundness = roundness / 100;
  const easedRoundness = 1 - Math.pow(1 - normalizedRoundness, 3);
  const exponent = 2 + (1 - easedRoundness) * 48;

  let d = '';

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const cosT = Math.cos(angle);
    const sinT = Math.sin(angle);
    const px = Math.pow(Math.abs(cosT), 2 / exponent) * hw * Math.sign(cosT);
    const py = Math.pow(Math.abs(sinT), 2 / exponent) * hh * Math.sign(sinT);
    const [xa, ya] = offsetRotated(cx, cy, px, py, rotationDeg);
    d += i === 0 ? `M ${xa} ${ya}` : ` L ${xa} ${ya}`;
  }

  return `${d} Z`;
}

/**
 * Merges multiple SVG path strings into a single compound path using boolean union
 * @param {string[]} pathStrings - Array of SVG path data strings
 * @param {object} [opts]
 * @param {number|null} [opts.simplifyTolerance=0.5] - Paper.js simplify tolerance; omit simplify when null or <= 0
 * @returns {string} - Merged SVG path data
 */
export function mergeShapePaths(pathStrings, opts = {}) {
  const { simplifyTolerance = 0.5 } = opts;
  ensurePaperInitialized();

  if (pathStrings.length === 0) return '';
  if (pathStrings.length === 1) return pathStrings[0];

  try {
    // Import all paths into Paper.js
    const paths = pathStrings.map(pathData => {
      const path = new paper.Path(pathData);
      return path;
    });

    // Merge all paths using boolean union
    let result = paths[0];
    for (let i = 1; i < paths.length; i++) {
      const united = result.unite(paths[i]);
      if (result !== paths[0]) result.remove();
      paths[i].remove();
      result = united;
    }
    paths[0].remove();

    if (simplifyTolerance != null && simplifyTolerance > 0) {
      result.simplify(simplifyTolerance);
    }

    // Export as SVG path data
    const pathData = result.pathData;
    result.remove();

    return pathData;
  } catch (error) {
    console.error('Error merging paths:', error);
    // Fallback: return the first path if merging fails
    return pathStrings[0];
  }
}

/**
 * Converts a Paper.js path to font units
 * @param {string} pathData - SVG path data string
 * @param {number} unitsPerEm - Font units per em (typically 1000)
 * @param {object} bounds - Bounding box {x, y, width, height} (tight ink bounds)
 * @param {number} targetSize - Target vertical span in font units (e.g. ascender) after layout scale
 * @param {object} [layoutOpts] - When `layoutHeight` is set, scale by grid em-box and preserve vertical grid origin (matches canvas preview)
 * @param {number} [layoutOpts.layoutHeight] - Design-space grid height (e.g. rows × rowPitch)
 * @returns {object} - Path commands suitable for opentype.js
 */
function roundLineCoord(v) {
  return Math.round(v);
}

/** Quantize cubic coords via 0.1 grid then int so handles stay slightly smoother than raw integer round. */
function roundCurveCoord(v) {
  return Math.round(Math.round(v * 10) / 10);
}

export function pathToFontUnits(pathData, unitsPerEm = 1000, bounds, targetSize = 1000, layoutOpts = null) {
  ensurePaperInitialized();

  try {
    // Use CompoundPath to correctly handle both simple paths and compound paths
    // (letters like O, B, D produce compound paths with outer + inner contours)
    const item = new paper.CompoundPath(pathData);

    const layoutHeight = layoutOpts && layoutOpts.layoutHeight > 0 ? layoutOpts.layoutHeight : null;
    const scale = layoutHeight != null
      ? targetSize / layoutHeight
      : targetSize / Math.max(bounds.width, bounds.height);

    // Layout export: keep design Y relative to grid top (y=0); only snap X to tight left
    if (layoutHeight != null) {
      item.translate(new paper.Point(-bounds.x, 0));
    } else {
      item.translate(new paper.Point(-bounds.x, -bounds.y));
    }
    item.scale(scale, new paper.Point(0, 0));

    // Flip Y-axis (SVG has Y down, fonts have Y up): flip around y=0, then shift up.
    // Layout mode: align baseline to bottom of ink (not full grid height), so lowest outline maps to y=0.
    const flipSpan = layoutHeight != null
      ? (bounds.height > 0 ? bounds.y + bounds.height : layoutHeight) * scale
      : bounds.height * scale;
    item.scale(1, -1, new paper.Point(0, 0));
    item.translate(new paper.Point(0, flipSpan));

    // Convert to segments for opentype.js — iterate each sub-path separately
    const commands = [];
    const subPaths = item.children && item.children.length > 0 ? item.children : [item];

    for (const path of subPaths) {
      for (let i = 0; i < path.curves.length; i++) {
        const curve = path.curves[i];

        if (i === 0) {
          // Move to start point of this contour
          commands.push({
            type: 'M',
            x: roundLineCoord(curve.point1.x),
            y: roundLineCoord(curve.point1.y)
          });
        }

        if (curve.isStraight()) {
          // Line to
          commands.push({
            type: 'L',
            x: roundLineCoord(curve.point2.x),
            y: roundLineCoord(curve.point2.y)
          });
        } else {
          // Cubic bezier curve
          commands.push({
            type: 'C',
            x1: roundCurveCoord(curve.handle1.x + curve.point1.x),
            y1: roundCurveCoord(curve.handle1.y + curve.point1.y),
            x2: roundCurveCoord(curve.handle2.x + curve.point2.x),
            y2: roundCurveCoord(curve.handle2.y + curve.point2.y),
            x: roundCurveCoord(curve.point2.x),
            y: roundCurveCoord(curve.point2.y)
          });
        }
      }
      // Close each contour
      commands.push({ type: 'Z' });
    }

    item.remove();
    return commands;
  } catch (error) {
    console.error('Error converting path to font units:', error);
    return [];
  }
}

/**
 * Calculates bounding box for an array of path strings
 * @param {string[]} pathStrings - Array of SVG path data strings
 * @returns {object} - {x, y, width, height}
 */
export function calculatePathBounds(pathStrings) {
  ensurePaperInitialized();

  if (pathStrings.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  try {
    // Use CompoundPath to correctly handle both simple and compound path data
    const items = pathStrings.map(pathData => new paper.CompoundPath(pathData));

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    items.forEach(item => {
      const bounds = item.bounds;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
      item.remove();
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } catch (error) {
    console.error('Error calculating bounds:', error);
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}
