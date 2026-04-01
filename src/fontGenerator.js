import opentype from 'opentype.js';
import { mergeShapePaths, pathToFontUnits, calculatePathBounds } from './pathUtils';

/** PostScript name length limit for broad installer compatibility */
const MAX_POSTSCRIPT_NAME_LEN = 63;

/**
 * Builds unique font names from UI settings so each export installs as its own family.
 * @param {object} settings - Export-relevant geometry (width, height, scale, rotation, roundness)
 * @returns {{ fontFamily: string, fullName: string, postScriptName: string, filename: string }}
 */
export function buildFontNamesFromSettings(settings) {
  const {
    circleWidth,
    circleHeight,
    shapeScale,
    rotationAngle,
    roundness,
  } = settings;

  const W = Math.round(circleWidth);
  const H = Math.round(circleHeight);
  const S = Math.round(Number(shapeScale) * 10);
  const scaleDisplay = Number(Number(shapeScale).toFixed(1));
  const R = Math.round(rotationAngle);
  const Rn = Math.round(roundness);

  const fontFamily = `Blip ${W} ${H} ${R} ${Rn} ${scaleDisplay}`;
  const styleName = 'Regular';
  const fullName = `${fontFamily} ${styleName}`;

  let postScriptName =
    `Blip-${W}-${H}-${R}-${Rn}-${S}`;

  if (postScriptName.length > MAX_POSTSCRIPT_NAME_LEN) {
    let h = 0;
    for (let i = 0; i < postScriptName.length; i++) {
      h = (h * 31 + postScriptName.charCodeAt(i)) >>> 0;
    }
    const short = (h >>> 0).toString(16).padStart(8, '0');
    postScriptName = `Blip-${short}`;
  }

  const filenameBase = postScriptName.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase();
  const filename = `${filenameBase}.ttf`;

  return { fontFamily, fullName, postScriptName, styleName, filename };
}

/**
 * Generates a TTF font file from glyph data
 * @param {object} glyphData - Map of char → path string[] **or** `{ paths, layoutWidth, layoutHeight }` (grid em-box, matches preview)
 * @param {object} options - Font options (name, family, style, etc.)
 * @param {number} [options.layoutRowPitch] - With `layoutDotScaledHeight`, fixes export baseline to bottom of row `baselineRowIndex0` (default 4 = 5th grid row); row below is descender
 * @param {number} [options.layoutDotScaledHeight] - Scaled dot height (`circleHeight * shapeScale`)
 * @param {number} [options.baselineRowIndex0=4] - 0-index row whose lower edge is the typographic baseline
 * @returns {ArrayBuffer} - TTF font file as ArrayBuffer
 */
export function generateTTF(glyphData, options = {}) {
  const {
    fontFamily = 'Blip',
    fontStyle = 'Regular',
    fullName,
    postScriptName,
    unitsPerEm = 1000,
    ascender = 800,
    descender: descenderOption = 0,
    roundness = 0,
    layoutRowPitch = null,
    layoutDotScaledHeight = null,
    baselineRowIndex0 = 4,
  } = options;

  const firstKey = Object.keys(glyphData)[0];
  const firstEntry = firstKey ? glyphData[firstKey] : null;
  const sampleLayoutHeight =
    firstEntry && !Array.isArray(firstEntry) && firstEntry.layoutHeight > 0
      ? firstEntry.layoutHeight
      : null;

  const baselineYDesign =
    layoutRowPitch != null &&
    layoutDotScaledHeight != null &&
    baselineRowIndex0 >= 0
      ? baselineRowIndex0 * layoutRowPitch + layoutDotScaledHeight / 2
      : null;

  const descender =
    baselineYDesign != null && layoutRowPitch != null && sampleLayoutHeight
      ? -Math.ceil((layoutRowPitch * ascender) / sampleLayoutHeight)
      : descenderOption;

  // Round dots are already smooth cubics; skip simplify so Paper does not distort them.
  // Rectilinear (roundness 0) still benefits from simplify.
  const mergeOpts =
    roundness > 0 ? { simplifyTolerance: null } : { simplifyTolerance: 0.5 };

  // Create notdef glyph (required for all fonts)
  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 650,
    path: new opentype.Path()
  });

  // Create space glyph
  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 250,
    path: new opentype.Path()
  });

  // Start with notdef and space
  const glyphs = [notdefGlyph, spaceGlyph];

  const sideBearing = 50;

  // Process each character
  Object.keys(glyphData).forEach(char => {
    const entry = glyphData[char];
    const pathStrings = Array.isArray(entry) ? entry : entry?.paths;
    const layoutWidth = Array.isArray(entry) ? null : entry?.layoutWidth;
    const layoutHeight = Array.isArray(entry) ? null : entry?.layoutHeight;

    if (!pathStrings || pathStrings.length === 0) {
      console.warn(`No paths found for character: ${char}`);
      return;
    }

    try {
      // Merge all paths for this character
      const mergedPath = mergeShapePaths(pathStrings, mergeOpts);

      // Calculate bounds for the merged path (tight ink; X snap only when using layout export)
      const bounds = calculatePathBounds([mergedPath]);

      const useLayout =
        layoutWidth != null &&
        layoutHeight != null &&
        layoutWidth > 0 &&
        layoutHeight > 0;

      const fontScale = useLayout ? ascender / layoutHeight : ascender / Math.max(bounds.width, bounds.height);

      const commands = pathToFontUnits(
        mergedPath,
        unitsPerEm,
        bounds,
        ascender,
        useLayout
          ? {
              layoutHeight,
              ...(baselineYDesign != null ? { baselineYDesign } : {}),
            }
          : null
      );

      // Create opentype.js path
      const glyphPath = new opentype.Path();

      commands.forEach(cmd => {
        switch (cmd.type) {
          case 'M':
            glyphPath.moveTo(cmd.x, cmd.y);
            break;
          case 'L':
            glyphPath.lineTo(cmd.x, cmd.y);
            break;
          case 'C':
            glyphPath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            break;
          case 'Q':
            glyphPath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            break;
          case 'Z':
            glyphPath.close();
            break;
        }
      });

      const advanceWidth = useLayout
        ? Math.round(layoutWidth * fontScale) + sideBearing
        : Math.round(bounds.width * fontScale) + sideBearing;

      const glyph = new opentype.Glyph({
        name: getGlyphName(char),
        unicode: char.charCodeAt(0),
        advanceWidth,
        path: glyphPath
      });

      glyphs.push(glyph);
    } catch (error) {
      console.error(`Error creating glyph for character ${char}:`, error);
    }
  });

  // Create font
  const fontOptions = {
    familyName: fontFamily,
    styleName: fontStyle,
    unitsPerEm: unitsPerEm,
    ascender: ascender,
    descender: descender,
    glyphs: glyphs
  };
  if (fullName) fontOptions.fullName = fullName;
  if (postScriptName) fontOptions.postScriptName = postScriptName;

  const font = new opentype.Font(fontOptions);

  // Generate TTF as ArrayBuffer
  return font.toArrayBuffer();
}

/**
 * Downloads a TTF font file
 * @param {ArrayBuffer} fontBuffer - TTF font data
 * @param {string} filename - Filename for download
 */
export function downloadTTF(fontBuffer, filename = 'blip.ttf') {
  const blob = new Blob([fontBuffer], { type: 'font/ttf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gets a PostScript-compatible glyph name for a character
 * @param {string} char - Character
 * @returns {string} - Glyph name
 */
function getGlyphName(char) {
  const code = char.charCodeAt(0);

  // Standard Adobe Glyph List names for common characters
  const glyphNames = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H',
    'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P',
    'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X',
    'Y': 'Y', 'Z': 'Z',
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h',
    'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p',
    'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
    'y': 'y', 'z': 'z',
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '!': 'exclam', '?': 'question', '.': 'period', ',': 'comma',
    ':': 'colon', ';': 'semicolon', '-': 'hyphen', '_': 'underscore'
  };

  return glyphNames[char] || `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;
}
