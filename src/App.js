import React from "react";
import "./styles.css";
import p5 from "p5";
import { Agentation } from "agentation";

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

  Sketch = (p) => {
    let colSpacing, rowSpacing;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);

      // Handle canvas click to focus
      p.canvas.addEventListener('click', () => {
        this.setState({ canvasFocused: true });
      });
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    p.draw = () => {
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

      const margin = 50;

      colSpacing = circleWidth + 5;
      rowSpacing = circleHeight + 5;

      // Background with focus indicator
      if (canvasFocused) {
        p.background(255);
        // Draw a subtle border to indicate focus
        p.noFill();
        p.stroke(100, 150, 255);
        p.strokeWeight(2);
        p.rect(1, 1, p.width - 2, p.height - 2);
      } else {
        p.background(250);
      }

      let xOffset = margin;
      let yOffset = margin;

      for (let charIndex = 0; charIndex < inputText.length; charIndex++) {
        const char = inputText[charIndex];
        const charGrid = this.fontData[char];
        if (!charGrid) continue;

        const charWidth = charGrid[0].length;

        if (xOffset + colSpacing * charWidth > p.width - margin) {
          xOffset = margin;
          yOffset += rowSpacing * 8;
        }

        for (let row = 0; row < charGrid.length; row++) {
          for (let col = 0; col < charGrid[row].length; col++) {
            if (charGrid[row][col] === "1") {
              p.push();
              p.translate(
                xOffset + col * colSpacing,
                yOffset + row * rowSpacing
              );
              p.rotate(p.radians(rotationAngle));
              p.noStroke();
              p.fill(0);

              const scaledWidth = circleWidth * shapeScale;
              const scaledHeight = circleHeight * shapeScale;

              // Draw superellipse (Lamé curve) that morphs from rectangle to ellipse
              // Use ease-out curve for smoother perceived changes
              const normalizedRoundness = roundness / 100;
              const easedRoundness = 1 - Math.pow(1 - normalizedRoundness, 3);
              const exponent = 2 + (1 - easedRoundness) * 48;

              p.beginShape();
              const steps = 100;
              for (let i = 0; i <= steps; i++) {
                const angle = (i / steps) * p.TWO_PI;
                const cosT = Math.cos(angle);
                const sinT = Math.sin(angle);

                // Superellipse formula
                const x = Math.pow(Math.abs(cosT), 2 / exponent) * (scaledWidth / 2) * Math.sign(cosT);
                const y = Math.pow(Math.abs(sinT), 2 / exponent) * (scaledHeight / 2) * Math.sign(sinT);

                p.vertex(x, y);
              }
              p.endShape(p.CLOSE);

              p.pop();
            }
          }
        }

        xOffset += colSpacing * charWidth + letterSpacing;
      }

      // Draw blinking cursor if canvas is focused
      if (canvasFocused && showCursor) {
        const cursorX = xOffset;
        const cursorY = yOffset;
        p.stroke(0);
        p.strokeWeight(2);
        p.line(cursorX, cursorY, cursorX, cursorY + rowSpacing * 6);
      }
    };

  };

  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current);

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
    if (this.cursorInterval) {
      clearInterval(this.cursorInterval);
    }
  }

  handleClickOutside = (e) => {
    // Check if click is outside the canvas
    if (this.myP5 && this.myP5.canvas && !this.myP5.canvas.contains(e.target)) {
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
      letterSpacing,
      inputText,
    } = this.state;

    const margin = 50;
    const colSpacing = circleWidth + 5;
    const rowSpacing = circleHeight + 5;

    let svgElements = [];
    let xOffset = margin;
    let yOffset = margin;
    let maxX = 0;
    let maxY = 0;

    // Generate SVG elements for each character
    for (let charIndex = 0; charIndex < inputText.length; charIndex++) {
      const char = inputText[charIndex];
      const charGrid = this.fontData[char];
      if (!charGrid) continue;

      const charWidth = charGrid[0].length;
      const canvasWidth = window.innerWidth;

      if (xOffset + colSpacing * charWidth > canvasWidth - margin) {
        xOffset = margin;
        yOffset += rowSpacing * 8;
      }

      for (let row = 0; row < charGrid.length; row++) {
        for (let col = 0; col < charGrid[row].length; col++) {
          if (charGrid[row][col] === "1") {
            const x = xOffset + col * colSpacing;
            const y = yOffset + row * rowSpacing;
            const scaledWidth = circleWidth * shapeScale;
            const scaledHeight = circleHeight * shapeScale;

            maxX = Math.max(maxX, x + scaledWidth);
            maxY = Math.max(maxY, y + scaledHeight);

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

            const transform = rotationAngle !== 0 ? `transform="rotate(${rotationAngle} ${x} ${y})"` : "";
            let shapeElement = `<path d="${pathData}" fill="black" ${transform}/>`;

            svgElements.push(shapeElement);
          }
        }
      }

      xOffset += colSpacing * charWidth + letterSpacing;
    }

    // Create SVG string
    const svgWidth = maxX + margin;
    const svgHeight = maxY + margin;
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  ${svgElements.join("\n  ")}
</svg>`;

    // Download SVG file
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shapes.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  render() {
    return (
      <div className="App">
        {[
          { label: "Width", property: "circleWidth", min: 5, max: 50 },
          { label: "Height", property: "circleHeight", min: 5, max: 50 },
          {
            label: "Shape Size",
            property: "shapeScale",
            min: 0.5,
            max: 3,
            step: 0.1,
          },
          {
            label: "Letter Spacing",
            property: "letterSpacing",
            min: 0,
            max: 50,
          },
          { label: "Rotation", property: "rotationAngle", min: 0, max: 360 },
          {
            label: "Roundness",
            property: "roundness",
            min: 0,
            max: 100,
          },
        ].map(({ label, property, min, max, step = 1 }) => (
          <div key={property} style={{ marginBottom: "10px" }}>
            <label>{label}: </label>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={this.state[property]}
              onChange={(e) =>
                this.handleSliderChange(property, parseFloat(e.target.value))
              }
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={this.state[property]}
              onChange={(e) =>
                this.handleSliderChange(property, parseFloat(e.target.value))
              }
              style={{ width: "60px", marginLeft: "10px" }}
            />
          </div>
        ))}

        <button
          onClick={this.handleExport}
          disabled={!this.state.inputText.trim()}
          style={{ marginBottom: "10px" }}
        >
          Export as SVG
        </button>

        <div ref={this.myRef} />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </div>
    );
  }
}

export default App;
