import React from "react";
import "./styles.css";
import p5 from "p5";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      circleWidth: 20,
      circleHeight: 20,
      shapeScale: 1,
      rotationAngle: 0,
      shapeType: "circle",
      cornerRadius: 10,
      letterSpacing: 5,
      inputText: "abc",
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
        shapeType,
        cornerRadius,
        letterSpacing,
        inputText,
      } = this.state;

      const margin = 50;

      colSpacing = circleWidth + 5;
      rowSpacing = circleHeight + 5;

      p.background(255);

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

              if (shapeType === "circle") {
                p.ellipse(0, 0, scaledWidth, scaledHeight);
              } else if (shapeType === "rect") {
                p.rectMode(p.CENTER);
                p.rect(0, 0, scaledWidth, scaledHeight);
              } else if (shapeType === "rounded-rect") {
                p.rectMode(p.CENTER);
                p.rect(0, 0, scaledWidth, scaledHeight, cornerRadius);
              }

              p.pop();
            }
          }
        }

        xOffset += colSpacing * charWidth + letterSpacing;
      }
    };

    p.exportSVG = () => {
      const svgCanvas = p.createCanvas(p.width, p.height, p.SVG);

      const {
        circleWidth,
        circleHeight,
        shapeScale,
        rotationAngle,
        shapeType,
        cornerRadius,
        letterSpacing,
        inputText,
      } = this.state;

      const margin = 50;
      const colSpacing = circleWidth + 5;
      const rowSpacing = circleHeight + 5;

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

              if (shapeType === "circle") {
                p.ellipse(0, 0, scaledWidth, scaledHeight);
              } else if (shapeType === "rect") {
                p.rectMode(p.CENTER);
                p.rect(0, 0, scaledWidth, scaledHeight);
              } else if (shapeType === "rounded-rect") {
                p.rectMode(p.CENTER);
                p.rect(0, 0, scaledWidth, scaledHeight, cornerRadius);
              }

              p.pop();
            }
          }
        }

        xOffset += colSpacing * charWidth + letterSpacing;
      }

      p.save("shapes.svg");

      // Delay the removal to ensure save is completed
      setTimeout(() => {
        p.remove();
      }, 100);
    };
  };

  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current);
  }

  handleSliderChange = (property, value) => {
    this.setState({ [property]: value });
  };

  handleExport = () => {
    this.myP5.exportSVG();
  };

  handleShapeTypeChange = (e) => {
    this.setState({ shapeType: e.target.value });
  };

  render() {
    return (
      <div>
        <div style={{ marginBottom: "10px" }}>
          <label>Type Text: </label>
          <input
            type="text"
            value={this.state.inputText}
            onChange={(e) => this.setState({ inputText: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Shape Type: </label>
          <select
            value={this.state.shapeType}
            onChange={this.handleShapeTypeChange}
          >
            <option value="circle">Oval</option>
            <option value="rect">Rectangle</option>
            <option value="rounded-rect">Rounded Rectangle</option>
          </select>
        </div>

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
            label: "Corner Radius",
            property: "cornerRadius",
            min: 0,
            max: 50,
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

        <button onClick={this.handleExport} style={{ marginBottom: "10px" }}>
          Export as SVG
        </button>

        <div ref={this.myRef} />
      </div>
    );
  }
}

export default App;
