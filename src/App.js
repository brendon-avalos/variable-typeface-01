import React from "react";
import "./styles.css";
import paper from "paper";
import { Agentation } from "agentation";
import caretIcon from "./icons/caret.svg";
import { generateTTF, downloadTTF } from "./fontGenerator";

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
      inputText: "abc",
      canvasFocused: false,
      showCursor: true,
      settingsPanelOpen: true,
      foregroundColor: "#FFFFFF",
      backgroundColor: "#000000",
    };
  }

  // Define the font data, including special cases for M, W, m, w
  fontData = {
    // Uppercase Letters
    A: ["0110", "1001", "1111", "1001", "1001", "0000"],
    B: ["1110", "1001", "1110", "1001", "1110", "0000"],
    C: ["0111", "1000", "1000", "1000", "0111", "0000"],
    D: ["1110", "1001", "1001", "1001", "1110", "0000"],
    E: ["1111", "1000", "1111", "1000", "1111", "0000"],
    F: ["1111", "1000", "1111", "1000", "1000", "0000"],
    G: ["0111", "1000", "1011", "1001", "0111", "0000"],
    H: ["1001", "1001", "1111", "1001", "1001", "0000"],
    I: ["1111", "0010", "0010", "0010", "1111", "0000"],
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
    T: ["1111", "0010", "0010", "0010", "0010", "0000"],
    U: ["1001", "1001", "1001", "1001", "1111", "0000"],
    V: ["1001", "1001", "1001", "0101", "0011", "0000"],
    W: ["10101", "01101", "10101", "10101", "01001", "00000"],
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
    i: ["0010", "0000", "0110", "0010", "1111", "0000"],
    j: ["0001", "0000", "0001", "0001", "1001", "0110"],
    k: ["1000", "1001", "1110", "1010", "1001", "0000"],
    l: ["0110", "0010", "0010", "0010", "1111", "0000"],
    m: ["00000", "11111", "10101", "10101", "10101", "00000"],
    n: ["0000", "1110", "1001", "1001", "1001", "0000"],
    o: ["0000", "0110", "1001", "1001", "0110", "0000"],
    p: ["0000", "0110", "1001", "1110", "1000", "1000"],
    q: ["0000", "0111", "1001", "0111", "0001", "0001"],
    r: ["0000", "0111", "1000", "1000", "1000", "0000"],
    s: ["0000", "0111", "1000", "0110", "1110", "0000"],
    t: ["0000", "0010", "1111", "0010", "0010", "0000"],
    u: ["0000", "1001", "1001", "1001", "1111", "0000"],
    v: ["0000", "1001", "1001", "0101", "0011", "0000"],
    w: ["00000", "10101", "10101", "10101", "11111", "00000"],
    x: ["0000", "1001", "0110", "0110", "1001", "0000"],
    y: ["0000", "1001", "1001", "0111", "0001", "1110"],
    z: ["0000", "1111", "0010", "0100", "1111", "0000"],
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
      foregroundColor,
      backgroundColor,
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
    bg.fillColor = backgroundColor;

    // Draw focus indicator if canvas is focused
    if (canvasFocused) {
      const focusRect = new scope.Path.Rectangle(
        new scope.Rectangle(1, 1, viewWidth - 2, viewHeight - 2)
      );
      focusRect.strokeColor = new scope.Color(100 / 255, 150 / 255, 255 / 255);
      focusRect.strokeWidth = 2;
    }

    let xOffset = margin;
    let yOffset = margin;

    // Precompute superellipse parameters
    const normalizedRoundness = roundness / 100;
    const easedRoundness = 1 - Math.pow(1 - normalizedRoundness, 3);
    const exponent = 2 + (1 - easedRoundness) * 48;
    const scaledWidth = circleWidth * shapeScale;
    const scaledHeight = circleHeight * shapeScale;
    const steps = 100;

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

            // Draw superellipse (Lamé curve) that morphs from rectangle to ellipse
            // Use ease-out curve for smoother perceived changes
            const path = new scope.Path();
            for (let i = 0; i <= steps; i++) {
              const angle = (i / steps) * Math.PI * 2;
              const cosT = Math.cos(angle);
              const sinT = Math.sin(angle);

              // Superellipse formula
              const x = Math.pow(Math.abs(cosT), 2 / exponent) * (scaledWidth / 2) * Math.sign(cosT);
              const y = Math.pow(Math.abs(sinT), 2 / exponent) * (scaledHeight / 2) * Math.sign(sinT);

              path.add(new scope.Point(centerX + x, centerY + y));
            }
            path.closed = true;
            path.fillColor = foregroundColor;

            if (rotationAngle !== 0) {
              path.rotate(rotationAngle);
            }
          }
        }
      }

      xOffset += colSpacing * charWidth + letterSpacing;
    }

    // Draw blinking cursor if canvas is focused
    if (canvasFocused && showCursor) {
      const cursorLine = new scope.Path.Line(
        new scope.Point(xOffset, yOffset),
        new scope.Point(xOffset, yOffset + rowSpacing * 6)
      );
      cursorLine.strokeColor = foregroundColor;
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

    // Don't interfere with agentation elements
    if (e.target.closest('[data-agentation]') || e.target.closest('.agentation')) {
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
    } = this.state;

    // Collect paths for each character
    const glyphData = {};

    // Process each unique character in the font
    Object.keys(this.fontData).forEach(char => {
      const charGrid = this.fontData[char];
      if (!charGrid) return;

      const paths = [];

      for (let row = 0; row < charGrid.length; row++) {
        for (let col = 0; col < charGrid[row].length; col++) {
          if (charGrid[row][col] === "1") {
            // Position relative to character origin
            const x = col * (circleWidth + 5);
            const y = row * (circleHeight + 5);
            const scaledWidth = circleWidth * shapeScale;
            const scaledHeight = circleHeight * shapeScale;

            // Generate superellipse path with ease-out curve
            const normalizedRoundness = roundness / 100;
            const easedRoundness = 1 - Math.pow(1 - normalizedRoundness, 3);
            const exponent = 2 + (1 - easedRoundness) * 48;
            const steps = 100;
            let pathData = "";

            for (let i = 0; i <= steps; i++) {
              const angle = (i / steps) * Math.PI * 2;
              const cosT = Math.cos(angle);
              const sinT = Math.sin(angle);

              const px = Math.pow(Math.abs(cosT), 2 / exponent) * (scaledWidth / 2) * Math.sign(cosT);
              const py = Math.pow(Math.abs(sinT), 2 / exponent) * (scaledHeight / 2) * Math.sign(sinT);

              pathData += i === 0 ? `M ${x + px} ${y + py}` : ` L ${x + px} ${y + py}`;
            }
            pathData += " Z";

            paths.push(pathData);
          }
        }
      }

      if (paths.length > 0) {
        glyphData[char] = paths;
      }
    });

    try {
      // Generate TTF font
      const fontBuffer = generateTTF(glyphData, {
        fontFamily: 'Variable Typeface',
        fontStyle: 'Regular',
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200
      });

      // Download TTF file
      downloadTTF(fontBuffer, 'variable-typeface.ttf');

      console.log('Font generated successfully!');
    } catch (error) {
      console.error('Error generating font:', error);
      alert('Error generating font. Check console for details.');
    }
  };

  toggleSettingsPanel = () => {
    this.setState({ settingsPanelOpen: !this.state.settingsPanelOpen });
  };

  handleColorChange = (colorType, value) => {
    this.setState({ [colorType]: value });
  };

  render() {
    const { settingsPanelOpen, foregroundColor, backgroundColor } = this.state;

    return (
      <div className="App">
        <div ref={this.myRef} />

        {/* Settings Panel */}
        <div className="settings-panel" data-open={settingsPanelOpen}>
          <div className="settings-content">
            {/* Header */}
            <div className="settings-header">
              <span className="settings-title">Settings</span>
              <button
                className="collapse-button"
                onClick={this.toggleSettingsPanel}
                aria-label="Toggle settings"
                style={{ transform: settingsPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <img src={caretIcon} alt="" width="12" height="12" />
              </button>
            </div>

            {/* Settings List */}
            <div className={`settings-body ${settingsPanelOpen ? 'open' : 'closed'}`}>
              <div className="settings-list">
                  {[
                    { label: "Width", property: "circleWidth", min: 5, max: 50 },
                    { label: "Height", property: "circleHeight", min: 5, max: 50 },
                    { label: "Scale", property: "shapeScale", min: 0.5, max: 3, step: 0.1 },
                    { label: "Rotation", property: "rotationAngle", min: 0, max: 360 },
                    { label: "Roundness", property: "roundness", min: 0, max: 100 },
                    { label: "Spacing", property: "letterSpacing", min: -50, max: 50 },
                  ].map(({ label, property, min, max, step = 1 }) => {
                    const value = this.state[property];
                    const percentage = ((value - min) / (max - min));

                    return (
                      <div key={property} className="slider-container">
                        <label className="slider-label">{label}</label>
                        <div className="slider-wrapper">
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value}
                            onChange={(e) =>
                              this.handleSliderChange(property, parseFloat(e.target.value))
                            }
                            className="custom-slider"
                          />
                          <div
                            className="slider-value"
                            style={{ left: `calc(${percentage * 100}% - ${percentage * 32 + 2}px)` }}
                          >
                            {Math.round(value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Color Pickers */}
                  <div className="color-section">
                    <span className="color-label">Colors</span>
                    <div className="color-inputs">
                      <div className="color-input">
                        <label>
                          <span className="color-prefix">FG</span>
                          <input
                            type="color"
                            value={foregroundColor}
                            onChange={(e) => this.handleColorChange('foregroundColor', e.target.value)}
                          />
                          <span className="color-value">{foregroundColor}</span>
                        </label>
                        <div className="color-preview" style={{ backgroundColor: foregroundColor }} />
                      </div>
                      <div className="color-input">
                        <label>
                          <span className="color-prefix">BG</span>
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => this.handleColorChange('backgroundColor', e.target.value)}
                          />
                          <span className="color-value">{backgroundColor}</span>
                        </label>
                        <div className="color-preview" style={{ backgroundColor: backgroundColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
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

        {process.env.NODE_ENV === "development" && <Agentation />}
      </div>
    );
  }
}

export default App;
