let bicepsChance = 5; // Вероятность рисования hex (в процентах)

let field;
let hexField = []; // Массив для хранения координат hex
let tileSize = 32;
let cols, rows;
let xPos, yPos;

let btnGrid;
let opacity = 0;
let btnGridCount = 0;
let btnEraserCount = 0;

let btnClear;
let btnRandom;
let btnPencil;
let btnErase;
let btnSave;

let colorF;
let colorBG;

function setup() {
  createCanvas(windowWidth / 2, windowHeight - 80).parent(select('#cnv'));
  frameRate(60);
  cols = 1 + floor(width / tileSize);
  rows = 1 + floor(height / tileSize);
  field = Array.from({ length: cols }, () => Array(rows).fill(0));

  btnRandom = select('#rnd');
  btnRandom.mousePressed(btnClick);

  btnPencil = select('#pencil');
  btnPencil.mousePressed(btnPencilClick);

  btnErase = select('#eraser');
  btnErase.mousePressed(btnEraser);
  
  btnSave = select('#save');
  btnSave.mousePressed(btnSaver);

  btnGrid = select('#grid');
  btnGrid.mousePressed(btnClick);
  
  btnClear = select('#clear');
  btnClear.mousePressed(clearGrid);

  colorF = color('#000000');
  colorBG = color('#ffffff');
}

function drawShape(v1, v2, v3, v4) {
  beginShape();
  vertex(v1.x, v1.y);
  vertex(v2.x, v2.y);
  vertex(v3.x, v3.y);
  vertex(v4.x, v4.y);
  endShape(CLOSE);
}

function draw() {

  background(colorBG); // Очистка фона для обновления сетки
  // fill(255,0,0);
  // ellipse(mouseX,mouseY,tileSize,tileSize);
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

      // Проверка на нажатие мыши
      if (mouseIsPressed) {
        xPos = floor(mouseX / tileSize);
        yPos = floor(mouseY / tileSize);

        if (xPos >= 0 && xPos < cols && yPos >= 0 && yPos < rows) {
          if (btnEraserCount === 1) {
            // Режим стирания: удаляем hex-фигуры и обычные фигуры
            hexField = hexField.filter(hex => dist(hex.x, hex.y, xPos * tileSize, yPos * tileSize) > tileSize / 2);

            // Очистка обычных фигур из массива field
            field[xPos][yPos] = 0;
            field[xPos + 1][yPos] = 0;
            field[xPos + 1][yPos + 1] = 0;
            field[xPos][yPos + 1] = 0;

          } else {
            if (random(10) < bicepsChance) {
              if (frameCount % 50 === 0) {
                // Добавляем hex в массив
                let hexX = xPos * tileSize;
                let hexY = yPos * tileSize;
                hexField.push({ x: hexX, y: hexY });
              }
            } else { // Если шанс не выполняется, заполняем обычный квадрат
              field[xPos][yPos] = 1;
              field[xPos + 1][yPos] = 1;
              field[xPos + 1][yPos + 1] = 1;
              field[xPos][yPos + 1] = 1;
            }
          }
        }
        document.getElementById('cpF').addEventListener('input', (event) => {
          colorF = color(event.target.value);
        });
        document.getElementById('cpBG').addEventListener('input', (event) => {
          colorBG = color(event.target.value);
        });
      }

      // Отображение обычных форм, если hex не нарисован
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

function getState(a, b, c, d) {
  return a * 8 + b * 4 + c * 2 + d * 1;
}

function btnClick() {
  btnGridCount = btnGridCount === 0 ? 1 : 0;
}

function btnPencilClick() {
  btnEraserCount = 0; // Отключаем режим стирания при нажатии на кнопку pencil
}

function btnEraser() {
  btnEraserCount = 1; // Включаем режим стирания при нажатии на кнопку eraser
}

function btnSaver() {
  textSize(0);
  saveCanvas('Arnold', 'png');
}

function clearGrid() {
  // Обнуление массива field и hexField
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      field[x][y] = 0;
    }
  }
  hexField = []; // Очистка массива hex
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
