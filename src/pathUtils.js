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
 * SVG path `d` for one dot: rounded shape from circle-like to square-like.
 * Uses four cubic Béziers (one per quadrant): κ interpolates between a tight corner and the
 * standard quarter-ellipse constant (0.55228…). Same winding as the sharp rectangle branch.
 *
 * @param {number} cx - center x
 * @param {number} cy - center y
 * @param {number} scaledWidth
 * @param {number} scaledHeight
 * @param {number} roundness - 0–100 (settings slider)
 * @param {number} [_steps=288] - ignored (legacy); kept for call-site compatibility
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

/** Cubic handle ratio for a quarter-ellipse arc (matches a true circle to ~0.03% error). */
const KAPPA = 0.5522847498;

export function buildDotPathD(cx, cy, scaledWidth, scaledHeight, roundness, _steps = 288, rotationDeg = 0) {
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

  // Corner radius scales with roundness: at r=1 fills the full half-dimension → circle/ellipse.
  // At r=0 we'd have no arcs → rectangle, but roundness=0 uses the L-branch above.
  const crx = hw * easedRoundness;
  const cry = hh * easedRoundness;
  const K = KAPPA;

  // Shorthand: apply rotation to a centered offset and format as "x y"
  const pt = (ox, oy) => {
    const [x, y] = offsetRotated(cx, cy, ox, oy, rotationDeg);
    return `${x} ${y}`;
  };

  // Path (clockwise from rightmost point, +y down):
  //   M  right-axis
  //   L  top of bottom-right arc   (right side, lower half)
  //   C  bottom-right corner arc
  //   L  top of bottom-left arc    (bottom side)
  //   C  bottom-left corner arc
  //   L  bottom of top-left arc    (left side)
  //   C  top-left corner arc
  //   L  end of top-right arc      (top side)
  //   C  top-right corner arc
  //   L  right-axis                (right side, upper half)
  //   Z
  // #region agent log
  if (typeof window !== 'undefined' && cx === 0 && cy === 0) {
    fetch('http://127.0.0.1:7599/ingest/580290b2-e8c0-442c-8837-6b325b1f82a0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5284e'},body:JSON.stringify({sessionId:'e5284e',location:'pathUtils.js:buildDotPathD',message:'path built',data:{roundness,crx,cry,hw,hh,hasC:true},timestamp:Date.now(),hypothesisId:'H-A,H-D'})}).catch(()=>{});
  }
  // #endregion
  return [
    `M ${pt(hw, 0)}`,
    `L ${pt(hw, hh - cry)}`,
    `C ${pt(hw, hh - cry * (1 - K))} ${pt(hw - crx * (1 - K), hh)} ${pt(hw - crx, hh)}`,
    `L ${pt(-hw + crx, hh)}`,
    `C ${pt(-hw + crx * (1 - K), hh)} ${pt(-hw, hh - cry * (1 - K))} ${pt(-hw, hh - cry)}`,
    `L ${pt(-hw, -(hh - cry))}`,
    `C ${pt(-hw, -(hh - cry * (1 - K)))} ${pt(-hw + crx * (1 - K), -hh)} ${pt(-hw + crx, -hh)}`,
    `L ${pt(hw - crx, -hh)}`,
    `C ${pt(hw - crx * (1 - K), -hh)} ${pt(hw, -(hh - cry * (1 - K)))} ${pt(hw, -(hh - cry))}`,
    `L ${pt(hw, 0)}`,
    'Z',
  ].join(' ');
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

    // #region agent log
    const inputHasC = pathStrings[0].includes(' C ') || pathStrings[0].startsWith('C ');
    const outputHasC = pathData.includes('C') || pathData.includes('c');
    const inputCCount = (pathStrings[0].match(/ C /g) || []).length;
    const outputCCount = (pathData.match(/[Cc]/g) || []).length;
    fetch('http://127.0.0.1:7599/ingest/580290b2-e8c0-442c-8837-6b325b1f82a0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5284e'},body:JSON.stringify({sessionId:'e5284e',location:'pathUtils.js:mergeShapePaths',message:'merge result',data:{inputHasC,outputHasC,inputCCount,outputCCount,inputSnippet:pathStrings[0].slice(0,120),outputSnippet:pathData.slice(0,120)},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
    // #endregion

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
 * @param {number} [layoutOpts.baselineYDesign] - When set, Y-down coordinate of typographic baseline (bottom of baseline row dot centers + half dot height). Row 0-index 4 = 5th grid row; row 5 = descender.
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
    // Layout mode: fixed grid baseline (bottom of 5th row / 0-index row 4) maps to font y=0 so descenders
    // sit below baseline; otherwise fall back to aligning lowest ink to y=0.
    const flipSpan =
      layoutOpts?.baselineYDesign != null
        ? layoutOpts.baselineYDesign * scale
        : layoutHeight != null
          ? (bounds.height > 0 ? bounds.y + bounds.height : layoutHeight) * scale
          : bounds.height * scale;
    item.scale(1, -1, new paper.Point(0, 0));
    item.translate(new paper.Point(0, flipSpan));

    // Convert to segments for opentype.js — iterate each sub-path separately
    const commands = [];
    const subPaths = item.children && item.children.length > 0 ? item.children : [item];

    // #region agent log
    let _straightCount = 0, _curveCount = 0;
    // #endregion

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
          // #region agent log
          _straightCount++;
          // #endregion
          // Line to
          commands.push({
            type: 'L',
            x: roundLineCoord(curve.point2.x),
            y: roundLineCoord(curve.point2.y)
          });
        } else {
          // #region agent log
          _curveCount++;
          // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7599/ingest/580290b2-e8c0-442c-8837-6b325b1f82a0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5284e'},body:JSON.stringify({sessionId:'e5284e',location:'pathUtils.js:pathToFontUnits',message:'curve type counts',data:{straightCount:_straightCount,curveCount:_curveCount,inputSnippet:pathData.slice(0,120)},timestamp:Date.now(),hypothesisId:'H-C'})}).catch(()=>{});
    // #endregion

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
