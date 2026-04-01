import React from "react";
import "./styles.css";
import paper from "paper";
import { buildFontNamesFromSettings, generateTTF, downloadTTF } from "./fontGenerator";
import { buildDotPathD } from "./pathUtils";
import { SettingsSlider } from "./SettingsSlider";

const CANVAS_BG = "#FFEBD8";
const INK_COLOR = "#0022FF";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      circleWidth: 20,
      circleHeight: 20,
      shapeScale: 1,
      rotationAngle: 0,
      roundness: 50,
      letterSpacing: 5,
      inputText: "blip",
      canvasFocused: false,
      showCursor: true,
    };
  }

  // Define the font data, including special cases for M, W, m, w
  fontData = {
    // Uppercase Letters
    A: ["0110", "1001", "1111", "1001", "1001", "0000"],
    B: ["1110", "1001", "1110", "1001", "1110", "0000"],
    C: ["0111", "1000", "1000", "1000", "0111", "0000"],
    D: ["1110", "1001", "1001", "1001", "1110", "0000"],
    E: ["1111", "1000", "1110", "1000", "1111", "0000"],
    F: ["1111", "1000", "1110", "1000", "1000", "0000"],
    G: ["0111", "1000", "1011", "1001", "0111", "0000"],
    H: ["1001", "1001", "1111", "1001", "1001", "0000"],
    I: ["111", "010", "010", "010", "111", "000"],
    J: ["0011", "0001", "0001", "1001", "0110", "0000"],
    K: ["1001", "1010", "1100", "1010", "1001", "0000"],
    L: ["1000", "1000", "1000", "1000", "1111", "0000"],
    M: ["01010", "10101", "10101", "10101", "10101", "00000"],
    N: ["1001", "1101", "1011", "1001", "1001", "0000"],
    O: ["0110", "1001", "1001", "1001", "0110", "0000"],
    P: ["1110", "1001", "1110", "1000", "1000", "0000"],
    Q: ["0110", "1001", "1001", "1011", "0111", "0000"],
    R: ["1110", "1001", "1110", "1010", "1001", "0000"],
    S: ["0111", "1000", "0110", "0001", "1110", "0000"],
    T: ["11111", "00100", "00100", "00100", "00100", "00000"],
    U: ["1001", "1001", "1001", "1001", "1111", "0000"],
    V: ["1001", "1001", "1001", "0101", "0011", "0000"],
    W: ["10101", "10101", "10101", "10101", "01010", "00000"],
    X: ["1001", "1001", "0110", "1001", "1001", "0000"],
    Y: ["1001", "1001", "0110", "0010", "0010", "0000"],
    Z: ["1111", "0001", "0110", "1000", "1111", "0000"],

    // Lowercase Letters
    a: ["0000", "0110", "1001", "1001", "0111", "0000"],
    b: ["1000", "1110", "1001", "1001", "0110", "0000"],
    c: ["0000", "0111", "1000", "1000", "0111", "0000"],
    d: ["0001", "0111", "1001", "1001", "0111", "0000"],
    e: ["0000", "0110", "1111", "1000", "0111", "0000"],
    f: ["0011", "0100", "1111", "0100", "0100", "0000"],
    g: ["0000", "0111", "1001", "0111", "0001", "1110"],
    h: ["1000", "1110", "1001", "1001", "1001", "0000"],
    i: ["010", "000", "110", "010", "111", "000"],
    j: ["0001", "0000", "0001", "0001", "1001", "0110"],
    k: ["1000", "1001", "1110", "1010", "1001", "0000"],
    l: ["110", "010", "010", "010", "111", "000"],
    m: ["00000", "11111", "10101", "10101", "10101", "00000"],
    n: ["0000", "1110", "1001", "1001", "1001", "0000"],
    o: ["0000", "0110", "1001", "1001", "0110", "0000"],
    p: ["0000", "0110", "1001", "1110", "1000", "1000"],
    q: ["0000", "0111", "1001", "0111", "0001", "0001"],
    r: ["0000", "0111", "1000", "1000", "1000", "0000"],
    s: ["0000", "0111", "1100", "0011", "1110", "0000"],
    t: ["0010", "0010", "1111", "0010", "0010", "0000"],
    u: ["0000", "1001", "1001", "1001", "1111", "0000"],
    v: ["0000", "1001", "1001", "0101", "0011", "0000"],
    w: ["00000", "10101", "10101", "10101", "11111", "00000"],
    x: ["0000", "1001", "0110", "0110", "1001", "0000"],
    y: ["0000", "1001", "1001", "0111", "0001", "1110"],
    z: ["0000", "1111", "0010", "0100", "1111", "0000"],
    " ": ["0000", "0000", "0000", "0000", "0000", "0000"],
  };

  drawScene = () => {
    const scope = this.paperScope;
    if (!scope) return;

    const {
      circleWidth,
      circleHeight,
      shapeScale,
      rotationAngle,
      roundness,
      letterSpacing,
      inputText,
      canvasFocused,
      showCursor,
    } = this.state;

    // Clear everything
    scope.project.activeLayer.removeChildren();

    const viewWidth = scope.view.size.width;
    const viewHeight = scope.view.size.height;
    const margin = 50;
    const colSpacing = circleWidth + 5;
    const rowSpacing = circleHeight + 5;

    // Background
    const bg = new scope.Path.Rectangle(
      new scope.Rectangle(0, 0, viewWidth, viewHeight)
    );
    bg.fillColor = CANVAS_BG;

    let xOffset = margin;
    let yOffset = margin;

    const scaledWidth = circleWidth * shapeScale;
    const scaledHeight = circleHeight * shapeScale;

    for (let charIndex = 0; charIndex < inputText.length; charIndex++) {
      const char = inputText[charIndex];
      const charGrid = this.fontData[char];
      if (!charGrid) continue;

      const charWidth = charGrid[0].length;

      if (xOffset + colSpacing * charWidth > viewWidth - margin) {
        xOffset = margin;
        yOffset += rowSpacing * 8;
      }

      for (let row = 0; row < charGrid.length; row++) {
        for (let col = 0; col < charGrid[row].length; col++) {
          if (charGrid[row][col] === "1") {
            const centerX = xOffset + col * colSpacing;
            const centerY = yOffset + row * rowSpacing;

            const path = new scope.Path(
              buildDotPathD(centerX, centerY, scaledWidth, scaledHeight, roundness, 0, rotationAngle)
            );
            path.fillColor = INK_COLOR;
          }
        }
      }

      xOffset += colSpacing * charWidth + letterSpacing;
    }

    // Draw blinking cursor if canvas is focused
    if (canvasFocused && showCursor) {
      const glyphTop = yOffset - scaledHeight / 2;
      const glyphBottom = yOffset + rowSpacing * 5 + scaledHeight / 2;
      const cursorX = xOffset - Math.max(letterSpacing, 0) - Math.max((colSpacing - scaledWidth) / 2, 1);
      const cursorLine = new scope.Path.Line(
        new scope.Point(cursorX, glyphTop),
        new scope.Point(cursorX, glyphBottom)
      );
      cursorLine.strokeColor = "#000000";
      cursorLine.strokeWidth = 0.5;
    }
  };

  componentDidMount() {
    // Create canvas and set up Paper.js with its own scope
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.myRef.current.appendChild(canvas);
    this.canvas = canvas;

    this.paperScope = new paper.PaperScope();
    this.paperScope.setup(canvas);

    // Animation loop
    this.paperScope.view.onFrame = () => this.drawScene();

    // Handle window resize
    this.handleResize = () => {
      if (this.paperScope && this.paperScope.view) {
        this.paperScope.view.viewSize = new this.paperScope.Size(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.handleResize);

    // Handle canvas click to focus
    canvas.addEventListener('click', () => {
      this.setState({ canvasFocused: true });
    });

    // Add keyboard event listener for typing
    window.addEventListener('keydown', this.handleKeyDown);

    // Add click outside listener to blur canvas
    window.addEventListener('click', this.handleClickOutside);

    // Cursor blink interval
    this.cursorInterval = setInterval(() => {
      if (this.state.canvasFocused) {
        this.setState({ showCursor: !this.state.showCursor });
      }
    }, 530);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
    if (this.cursorInterval) {
      clearInterval(this.cursorInterval);
    }
    if (this.paperScope && this.paperScope.view) {
      this.paperScope.view.onFrame = null;
    }
  }

  handleClickOutside = (e) => {
    // Check if click is outside the canvas
    if (this.canvas && !this.canvas.contains(e.target)) {
      this.setState({ canvasFocused: false, showCursor: true });
    }
  };

  handleKeyDown = (e) => {
    // Only handle keyboard input when canvas is focused
    if (!this.state.canvasFocused) {
      return;
    }

    // Ignore if typing in any input element, textarea, or contenteditable
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'SELECT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable ||
      e.target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.setState({ inputText: this.state.inputText.slice(0, -1), showCursor: true });
    } else if (e.key === 'Escape') {
      // Allow escape to blur the canvas
      this.setState({ canvasFocused: false, showCursor: true });
    } else if (e.key.length === 1) {
      // Only add printable characters
      e.preventDefault();
      this.setState({ inputText: this.state.inputText + e.key, showCursor: true });
    }
  }

  handleSliderChange = (property, value) => {
    this.setState({ [property]: value });
  };

  handleExport = () => {
    if (!this.state.inputText.trim()) {
      return;
    }

    const {
      circleWidth,
      circleHeight,
      shapeScale,
      rotationAngle,
      roundness,
      letterSpacing,
    } = this.state;

    const naming = buildFontNamesFromSettings({
      circleWidth,
      circleHeight,
      shapeScale,
      rotationAngle,
      roundness,
      letterSpacing,
    });

    const colPitch = circleWidth + 5;
    const rowPitch = circleHeight + 5;

    const glyphData = {};

    Object.keys(this.fontData).forEach(char => {
      const charGrid = this.fontData[char];
      if (!charGrid) return;

      const layoutWidth = charGrid[0].length * colPitch;
      const layoutHeight = charGrid.length * rowPitch;
      const paths = [];
      const scaledWidth = circleWidth * shapeScale;
      const scaledHeight = circleHeight * shapeScale;

      for (let row = 0; row < charGrid.length; row++) {
        for (let col = 0; col < charGrid[row].length; col++) {
          if (charGrid[row][col] === "1") {
            const x = col * colPitch;
            const y = row * rowPitch;

            paths.push(buildDotPathD(x, y, scaledWidth, scaledHeight, roundness, 0, rotationAngle));
          }
        }
      }

      if (paths.length > 0 || char === " ") {
        glyphData[char] = { paths, layoutWidth, layoutHeight };
      }
    });

    try {
      // Generate TTF font
      const fontBuffer = generateTTF(glyphData, {
        fontFamily: naming.fontFamily,
        fontStyle: naming.styleName,
        fullName: naming.fullName,
        postScriptName: naming.postScriptName,
        unitsPerEm: 1000,
        ascender: 800,
        descender: 0,
        roundness,
        layoutRowPitch: rowPitch,
        layoutDotScaledHeight: circleHeight * shapeScale,
        baselineRowIndex0: 4,
      });

      downloadTTF(fontBuffer, naming.filename);

      console.log('Font generated successfully!');
    } catch (error) {
      console.error('Error generating font:', error);
      alert('Error generating font. Check console for details.');
    }
  };

  render() {
    const naming = buildFontNamesFromSettings({
      circleWidth: this.state.circleWidth,
      circleHeight: this.state.circleHeight,
      shapeScale: this.state.shapeScale,
      rotationAngle: this.state.rotationAngle,
      roundness: this.state.roundness,
      letterSpacing: this.state.letterSpacing,
    });

    return (
      <div className="App">
        <div ref={this.myRef} />

        <div className="bottom-chrome">
          <p className="font-title-preview">{naming.filename.toUpperCase()}</p>
          <div className="settings-panel">
            <div className="settings-list">
              {[
                { label: "Width", property: "circleWidth", min: 5, max: 50 },
                { label: "Rotation", property: "rotationAngle", min: 0, max: 360 },
                { label: "Scale", property: "shapeScale", min: 0.5, max: 3, step: 0.1 },
                { label: "Height", property: "circleHeight", min: 5, max: 50 },
                { label: "Roundness", property: "roundness", min: 0, max: 100 },
                { label: "Spacing", property: "letterSpacing", min: -50, max: 50 },
              ].map(({ label, property, min, max, step = 1 }) => {
                const value = this.state[property];

                return (
                  <div key={property} className="slider-container">
                    <label className="slider-label" htmlFor={`slider-${property}`}>
                      {label}
                    </label>
                    <SettingsSlider
                      id={`slider-${property}`}
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(v) => this.handleSliderChange(property, v)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="download-column">
              <button
                className="download-button"
                onClick={this.handleExport}
                disabled={!this.state.inputText.trim()}
              >
                Download Font
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }
}

export default App;
