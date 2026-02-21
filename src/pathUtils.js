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
 * Merges multiple SVG path strings into a single compound path using boolean union
 * @param {string[]} pathStrings - Array of SVG path data strings
 * @returns {string} - Merged SVG path data
 */
export function mergeShapePaths(pathStrings) {
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

    // Simplify the path to reduce points
    result.simplify(0.5);

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
 * @param {object} bounds - Bounding box {x, y, width, height}
 * @param {number} targetSize - Target size in font units
 * @returns {object} - Path commands suitable for opentype.js
 */
export function pathToFontUnits(pathData, unitsPerEm = 1000, bounds, targetSize = 1000) {
  ensurePaperInitialized();

  try {
    // Use CompoundPath to correctly handle both simple paths and compound paths
    // (letters like O, B, D produce compound paths with outer + inner contours)
    const item = new paper.CompoundPath(pathData);

    // Calculate scale factor
    const maxDimension = Math.max(bounds.width, bounds.height);
    const scale = targetSize / maxDimension;

    // Translate to origin, then scale around (0,0)
    item.translate(new paper.Point(-bounds.x, -bounds.y));
    item.scale(scale, new paper.Point(0, 0));

    // Flip Y-axis (SVG has Y down, fonts have Y up): flip around y=0, then shift up
    item.scale(1, -1, new paper.Point(0, 0));
    item.translate(new paper.Point(0, bounds.height * scale));

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
            x: Math.round(curve.point1.x),
            y: Math.round(curve.point1.y)
          });
        }

        if (curve.isStraight()) {
          // Line to
          commands.push({
            type: 'L',
            x: Math.round(curve.point2.x),
            y: Math.round(curve.point2.y)
          });
        } else {
          // Cubic bezier curve
          commands.push({
            type: 'C',
            x1: Math.round(curve.handle1.x + curve.point1.x),
            y1: Math.round(curve.handle1.y + curve.point1.y),
            x2: Math.round(curve.handle2.x + curve.point2.x),
            y2: Math.round(curve.handle2.y + curve.point2.y),
            x: Math.round(curve.point2.x),
            y: Math.round(curve.point2.y)
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
