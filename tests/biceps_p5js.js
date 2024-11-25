let rasterCanvas; // Растровый холст
let svgCanvas; // Скрытый SVG холст
let field;
let hexField = []; // Массив для хранения координат hex
let tileSize = 32;
let cols, rows;
let xPos, yPos;
let ran = 50;
let sliderVal = 0;

let tempHexX;
let tempHexY;

let btnGrid;
let opacity = 0;
let btnGridCount = 0;
let btnEraserCount = 0;

let btnClear;
let btnPencil;
let btnErase;
let btnSave;
let btnSaveSVG;

let colorF;
let colorBG;

function setup() {
  // Создание растрового холста
  rasterCanvas = createCanvas(windowWidth / 2, windowWidth / 2, P2D).parent(select('#cnv'));

  // Создание скрытого SVG-холста
  svgCanvas = createGraphics(width, height, SVG);
  svgCanvas.noLoop(); // SVG холст не требует перерисовки каждый кадр

  frameRate(60);
  cols = 1 + floor(width / tileSize);
  rows = 1 + floor(height / tileSize);
  field = Array.from({ length: cols }, () => Array(rows).fill(0));

  btnPencil = select('#pencil');
  btnPencil.mousePressed(btnPencilClick);

  btnErase = select('#eraser');
  btnErase.mousePressed(btnEraser);

  btnSave = select('#savePNG');
  btnSave.mousePressed(btnSaverPNG);

  btnSaveSVG = select('#saveSVG');
  btnSaveSVG.mousePressed(btnSaverSVG);

  chance = select('#chance');
  sliderVal = chance.value();
  chance.input(() => {
    sliderVal = int(chance.value());
  });

  btnGrid = select('#grid');
  btnGrid.mousePressed(btnClick);

  btnClear = select('#clear');
  btnClear.mousePressed(clearGrid);

  colorF = color('#000000');
  colorBG = color('#ffffff');
}

function draw() {
  background(colorBG); // Очистка растрового холста

  // Отрисовка hex-фигур из массива hexField
  for (let hex of hexField) {
    drawHex(hex.x, hex.y, tileSize);
  }

  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      let x = i * tileSize;
      let y = j * tileSize;
      noFill();
      if (btnGridCount === 1) {
        stroke(100);
      } else {
        noStroke();
      }
      rect(x, y, tileSize, tileSize);

      let a = createVector(x, y);
      let b = createVector(x + tileSize, y);
      let c = createVector(x + tileSize, y + tileSize);
      let d = createVector(x, y + tileSize);

      let state = getState(
        field[i][j],
        field[i + 1][j],
        field[i + 1][j + 1],
        field[i][j + 1]
      );

      noStroke();
      fill(0);

      if (mouseIsPressed) {
        xPos = floor(mouseX / tileSize);
        yPos = floor(mouseY / tileSize);

        if (xPos >= 0 && xPos < cols && yPos >= 0 && yPos < rows) {
          let hexX = xPos * tileSize;
          let hexY = yPos * tileSize;

          if (btnEraserCount === 1) {
            hexField = hexField.filter(hex => dist(hex.x, hex.y, hexX, hexY) > tileSize * 2);
            field[xPos][yPos] = 0;

            if (xPos + 1 < cols && yPos + 1 < rows) {
              field[xPos + 1][yPos] = 0;
              field[xPos + 1][yPos + 1] = 0;
              field[xPos][yPos + 1] = 0;
            }
          } else {
            let hexExists = hexField.some(hex => hex.x === hexX && hex.y === hexY);

            if (tempHexX != hexX || tempHexY != hexY) {
              ran = Math.floor(random(1, 100));
              if (!hexExists && ran < sliderVal) {
                hexField.push({ x: hexX, y: hexY });
              } else if (!hexExists) {
                field[xPos][yPos] = 1;

                if (xPos + 1 < cols && yPos + 1 < rows) {
                  field[xPos + 1][yPos] = 1;
                  field[xPos + 1][yPos + 1] = 1;
                  field[xPos][yPos + 1] = 1;
                }
              }
            }
            tempHexX = hexX;
            tempHexY = hexY;
          }
        }
      }

      switch (state) {
        case 7:
          drawShape(b, c, d, b);
          break;
        case 11:
          drawShape(a, c, d, a);
          break;
        case 13:
          drawShape(d, a, b, d);
          break;
        case 14:
          drawShape(a, b, c, a);
          break;
        case 15:
          drawShape(a, b, c, d);
          break;
      }
    }
  }
}

function btnClick() {
  btnGridCount = btnGridCount === 0 ? 1 : 0;
}

function btnPencilClick() {
  btnEraserCount = 0;
}

function btnEraser() {
  btnEraserCount = 1;
}
function clearGrid() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      field[x][y] = 0;
    }
  }
  hexField = [];
}

function btnSaverPNG() {
  saveCanvas('output', 'png');
}

function btnSaverSVG() {
  // Очистка SVG-холста
  svgCanvas.background(colorBG);

  // Рисуем сетку и фигуры на SVG-холсте
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      let x = i * tileSize;
      let y = j * tileSize;

      if (btnGridCount === 1) {
        svgCanvas.stroke(100);
        svgCanvas.noFill();
        svgCanvas.rect(x, y, tileSize, tileSize);
      }

      let a = createVector(x, y);
      let b = createVector(x + tileSize, y);
      let c = createVector(x + tileSize, y + tileSize);
      let d = createVector(x, y + tileSize);

      let state = getState(
        field[i][j],
        field[i + 1][j],
        field[i + 1][j + 1],
        field[i][j + 1]
      );

      svgCanvas.noStroke();
      svgCanvas.fill(0);

      // Рисуем фигуры на основе состояния
      switch (state) {
        case 7:
          drawShapeSVG(svgCanvas, b, c, d, b);
          break;
        case 11:
          drawShapeSVG(svgCanvas, a, c, d, a);
          break;
        case 13:
          drawShapeSVG(svgCanvas, d, a, b, d);
          break;
        case 14:
          drawShapeSVG(svgCanvas, a, b, c, a);
          break;
        case 15:
          drawShapeSVG(svgCanvas, a, b, c, d);
          break;
      }
    }
  }
  function drawShapeSVG(canvas, v1, v2, v3, v4) {
    canvas.beginShape();
    canvas.vertex(v1.x, v1.y);
    canvas.vertex(v2.x, v2.y);
    canvas.vertex(v3.x, v3.y);
    canvas.vertex(v4.x, v4.y);
    canvas.endShape(CLOSE);
  }
  
  // Рисуем hex-фигуры из массива hexField
  for (let hex of hexField) {
    svgCanvas.fill(0);
    svgCanvas.noStroke();
    drawHexSVG(svgCanvas, hex.x, hex.y, tileSize);
  }

  // Сохраняем SVG
  svgCanvas.save('output.svg');
}

function drawShape(v1, v2, v3, v4) {
  beginShape();
  vertex(v1.x, v1.y);
  vertex(v2.x, v2.y);
  vertex(v3.x, v3.y);
  vertex(v4.x, v4.y);
  endShape(CLOSE);
}

function drawHex(x, y, size) {
  fill(0);
  beginShape();
  vertex(x, y);
  vertex(x + size, y - size * 1);
  vertex(x + size * 3, y - size);
  vertex(x + size * 4, y);
  vertex(x + size * 4, y + size * 2);
  vertex(x + size * 3, y + size * 3);
  vertex(x + size * 1, y + size * 3);
  vertex(x, y + size * 2);
  endShape(CLOSE);
}

function drawHexSVG(canvas, x, y, size) {
  canvas.beginShape();
  canvas.vertex(x, y);
  canvas.vertex(x + size, y - size * 1);
  canvas.vertex(x + size * 3, y - size);
  canvas.vertex(x + size * 4, y);
  canvas.vertex(x + size * 4, y + size * 2);
  canvas.vertex(x + size * 3, y + size * 3);
  canvas.vertex(x + size * 1, y + size * 3);
  canvas.vertex(x, y + size * 2);
  canvas.endShape(CLOSE);
}

function getState(a, b, c, d) {
  return a * 8 + b * 4 + c * 2 + d * 1;
}
