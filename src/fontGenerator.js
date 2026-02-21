import opentype from 'opentype.js';
import { mergeShapePaths, pathToFontUnits, calculatePathBounds } from './pathUtils';

/**
 * Generates a TTF font file from glyph data
 * @param {object} glyphData - Object mapping characters to their path arrays
 * @param {object} options - Font options (name, family, style, etc.)
 * @returns {ArrayBuffer} - TTF font file as ArrayBuffer
 */
export function generateTTF(glyphData, options = {}) {
  const {
    fontFamily = 'Variable Typeface',
    fontStyle = 'Regular',
    unitsPerEm = 1000,
    ascender = 800,
    descender = -200
  } = options;

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

  // Process each character
  Object.keys(glyphData).forEach(char => {
    const pathStrings = glyphData[char];

    if (!pathStrings || pathStrings.length === 0) {
      console.warn(`No paths found for character: ${char}`);
      return;
    }

    try {
      // Merge all paths for this character
      const mergedPath = mergeShapePaths(pathStrings);

      // Calculate bounds for the merged path
      const bounds = calculatePathBounds([mergedPath]);

      // Compute scale factor (same formula used in pathToFontUnits)
      const maxDimension = Math.max(bounds.width, bounds.height);
      const fontScale = ascender / maxDimension;

      // Convert to font units
      const commands = pathToFontUnits(mergedPath, unitsPerEm, bounds, ascender);

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

      // Create glyph
      const glyph = new opentype.Glyph({
        name: getGlyphName(char),
        unicode: char.charCodeAt(0),
        advanceWidth: Math.round(bounds.width * fontScale) + 50, // Add some spacing
        path: glyphPath
      });

      glyphs.push(glyph);
    } catch (error) {
      console.error(`Error creating glyph for character ${char}:`, error);
    }
  });

  // Create font
  const font = new opentype.Font({
    familyName: fontFamily,
    styleName: fontStyle,
    unitsPerEm: unitsPerEm,
    ascender: ascender,
    descender: descender,
    glyphs: glyphs
  });

  // Generate TTF as ArrayBuffer
  return font.toArrayBuffer();
}

/**
 * Downloads a TTF font file
 * @param {ArrayBuffer} fontBuffer - TTF font data
 * @param {string} filename - Filename for download
 */
export function downloadTTF(fontBuffer, filename = 'variable-typeface.ttf') {
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
