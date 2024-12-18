let cellSize = 6;
let clickCounter = 0;
let fonts = [];
let binaryMatrix = [];
let animStates = []; // Для анимации
let roundCorner = 30;
let buffer;
let bufferPosX;
let bufferPosY;
let score = 0;
let mouseColor;
let wTile, hTile;
let isAnimating = false;
let startX, startY, endX, endY;
let frameCount = 0;
let duration = 15;
let matchTimer = []; // Таймер для отслеживания задержки
let matchDelay = 100;


function setup() {
  createCanvas(800, 800);

  // Загрузка шрифтов (пример, требует корректных путей и имен файлов)
  fonts[0] = loadFont('fonts/Suisse-Works-Medium.otf');
  fonts[1] = loadFont('fonts/Druk-Wide-Medium-Desktop.otf');
  fonts[2] = loadFont('fonts/le-murmure.ttf');
  fonts[3] = loadFont('fonts/Pilowlava-Regular.otf');
  fonts[4] = loadFont('fonts/terminal-grotesque.ttf');
  // Повторите для других шрифтов...

  textSize(76);
  textAlign(CENTER);

  wTile = width / cellSize;
  hTile = height / cellSize;

  // Инициализация матрицы и состояний анимации
  for (let i = 0; i < cellSize; i++) {
    binaryMatrix[i] = [];
    animStates[i] = [];
    matchTimer[i] = [];
    for (let j = 0; j < cellSize; j++) {
      binaryMatrix[i][j] = int(random(fonts.length));
      animStates[i][j] = 1; // Анимация неактивна, масштаб = 1
      matchTimer[i][j] = -1; // Нет активных совпадений
    }
  }

  mouseColor = color(0);
}

function draw() {
  background(228,228,228);
  //push();
  //noFill();
  //stroke(255,0,0);
  //rect(0,0,width-10,height-10);
  //pop();
  wTile = width / cellSize;
  hTile = height / cellSize;

  // Проверка задержки и обновление анимации
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      if (matchTimer[i][j] != -1 && millis() - matchTimer[i][j] > matchDelay) {
        generateNewValue(i, j);
        matchTimer[i][j] = -1; // Сброс таймера
      }
    }
  }

  updateAnimation(); // Обновление состояния анимации

  if (isAnimating) {
    animateSwap();
  } else {
    checkMatchesAndUpdateScore();
    displayGrid();
  }

  displayScore();
 push();
 noFill();
     strokeWeight(6);
    if(clickCounter === 1){
        stroke(255,42,42);
          rect(bufferPosX* wTile+4, bufferPosY* hTile+4, wTile-8, hTile-8, roundCorner);
        rect(floor(mouseX / wTile) * wTile+4, floor(mouseY / hTile) * hTile+4, wTile-8, hTile-8, roundCorner);
      
    }else {
        stroke(0, 163, 255);
          rect(floor(mouseX / wTile) * wTile+4, floor(mouseY / hTile) * hTile+4, wTile-8, hTile-8, roundCorner);
    }
 
 pop();

}


function mousePressed() {
  let posX = int(mouseX / wTile);
  let posY = int(mouseY / hTile);
  clickCounter++;

  if (clickCounter === 1) {
    // Первый клик: запомнить ячейку
    buffer = binaryMatrix[posX][posY];
    bufferPosX = posX;
    bufferPosY = posY;
//      push();
//      stroke(255, 0, 0);
//      noFill();
//      rect(bufferPosX, bufferPosY, wTile-10, hTile-10, roundCorner);
//      pop()
    //mouseColor = color(78, 180, 255); // Заменено на использование функции color
      
  } else if (clickCounter === 2) {
    // Второй клик: проверить, можно ли сменить ячейки
    if (abs(posX - bufferPosX) + abs(posY - bufferPosY) === 1) {
      startX = bufferPosX * wTile;
      startY = bufferPosY * hTile;
      endX = posX * wTile;
      endY = posY * hTile;

      clickCounter = 0;
      mouseColor = color(0);
      isAnimating = true;
      frameCount = 0;
    } else {
      clickCounter = 0; // Сброс второго клика
    }
  }
}

function displayGrid() {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      if (matchTimer[i][j] != -1) {
        fill(255, 0, 0); // Красный цвет для совпадений
      } else {
        fill(247, 247, 247); // Обычный цвет
      }
      let scale = animStates[i][j];
      let rectSize = scale * (wTile - 5);
      let rectX = i * wTile + (wTile - rectSize) / 2;
      let rectY = j * hTile + (hTile - rectSize) / 2;
      noStroke();
      rect(rectX, rectY, rectSize, rectSize, roundCorner * scale);
      fill(0);
      textFont(fonts[binaryMatrix[i][j]]);
      text("A", i * wTile + wTile / 2, j * hTile + hTile / 2+26);
    }
  }
}

function animateSwap() {
  let t = float(frameCount) / duration;
  let currentX1 = lerp(startX, endX, t);
  let currentY1 = lerp(startY, endY, t);
  let currentX2 = lerp(endX, startX, t);
  let currentY2 = lerp(endY, startY, t);

  // Отображение сетки без анимируемых ячеек
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      let iPos = i * wTile;
      let jPos = j * hTile;
      if ((iPos != startX || jPos != startY) && (iPos != endX || jPos != endY)) {
        displayCell(i, j);
      }
    }
  }

  // Анимация перемещения ячеек
  displayMovingCell(startX / wTile, startY / hTile, currentX1, currentY1);
  displayMovingCell(endX / wTile, endY / hTile, currentX2, currentY2);

  frameCount++;

  if (frameCount > duration) {
    // Завершение анимации и обновление матрицы
    swapMatrixValues(startX / wTile, startY / hTile, endX / wTile, endY / hTile);
    isAnimating = false;
  }
}

function displayScore() {
  push();
  rectMode(CENTER, CENTER);
  textSize(30);
  textFont(fonts[0], 30);
  textAlign(CENTER);
  fill(0, 40);
  let xScore = width/2;
  let yScore = height-50;
  rect(xScore, yScore, 160, 60, 360, 360, 360, 360);
  fill(255);
  text("Score: " + score, xScore, yScore+10);
  pop();
}
function checkMatchesAndUpdateScore() {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      // Проверка горизонтальных совпадений
      if (i > 0 && i < cellSize - 1) {
        if (binaryMatrix[i][j] === binaryMatrix[i - 1][j] && binaryMatrix[i][j] === binaryMatrix[i + 1][j]) {
          handleMatch(i, j);
          handleMatch(i - 1, j);
          handleMatch(i + 1, j);
        }
      }

      // Проверка вертикальных совпадений
      if (j > 0 && j < cellSize - 1) {
        if (binaryMatrix[i][j] === binaryMatrix[i][j - 1] && binaryMatrix[i][j] === binaryMatrix[i][j + 1]) {
          handleMatch(i, j);
          handleMatch(i, j - 1);
          handleMatch(i, j + 1);
        }
      }
    }
  }
}

function handleMatch(i, j) {
  if (matchTimer[i][j] === -1) {
    matchTimer[i][j] = millis(); // Запуск таймера для анимации
    score++; // Увеличение счета
  }
}


function generateNewValue(x, y) {
  let newValue;
  do {
    newValue = int(random(fonts.length));
  } while (newValue === 3); // Условие, которое вы хотите использовать
  binaryMatrix[x][y] = newValue;
  animStates[x][y] = 0.5; // Начало анимации
}

function updateAnimation() {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      if (animStates[i][j] < 1) {
        animStates[i][j] += 0.08; // Изменение масштаба
        if (animStates[i][j] > 1) {
          animStates[i][j] = 1; // Завершение анимации
        }
      }
    }
  }
}
function displayCell(i, j) {
  fill(247, 247, 247);
  rect(i * wTile+2.5, j * hTile+2.5, wTile-5, hTile-5, roundCorner);
  fill(0);
  textFont(fonts[binaryMatrix[i][j]]);
  text("A", i * wTile + wTile / 2, j * hTile + hTile / 2+26);
}

function displayMovingCell(matrixX, matrixY, x, y) {
  fill(247, 247, 247);
  rect(x, y, wTile, hTile, roundCorner);
  fill(0);
  textFont(fonts[binaryMatrix[matrixX][matrixY]]);
  text("A", x + wTile / 2, y + hTile / 2+26);
}

function swapMatrixValues(x1, y1, x2, y2) {
  let temp = binaryMatrix[x1][y1];
  binaryMatrix[x1][y1] = binaryMatrix[x2][y2];
  binaryMatrix[x2][y2] = temp;
}

// Возможно, потребуется адаптировать некоторые детали кода,
// в зависимости от того, как используются шрифты и другие элементы.
