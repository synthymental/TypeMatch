let cols = 50; // Количество столбцов
let rows = 50; // Количество строк
let cellSize = 50; // Размер клетки (1000 / 10)
let grid = Array.from({ length: cols }, () => Array.from({ length: rows }, () => 0)); // Массив для хранения состояния клеток
let bicepsChance = 3;

function setup() {
  createCanvas(1000, 1000); // Установка размера окна 1000x1000
  frameRate(30);
}

function draw() {
  background(255); // Очистка фона
  stroke(100);
  strokeWeight(5);
  rect(0,0,width,height);
  fill(0);
  noStroke();
  textSize(14);
  text(`bicepsChance = ${bicepsChance} +/-`, 10, 30);

  // Рисуем сетку
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let cellX = x * cellSize;
      let cellY = y * cellSize;
      fill(0);
      // Проверяем состояние клетки и устанавливаем цвет
      if (grid[x][y] === 1) {
        // Если значение клетки 1, просто продолжаем
      } else if (grid[x][y] === 2) {
        drawTriangle(cellX, cellY, cellSize); // Рисуем треугольник в клетке
        continue;
      } else if (grid[x][y] === 3) {
        drawTriangle3(cellX, cellY, cellSize); // Рисуем треугольник в клетке
        continue;
      } else if (grid[x][y] === 4) {
        drawTriangle4(cellX, cellY, cellSize); // Рисуем треугольник в клетке
        continue;
      } else if (grid[x][y] === 5) {
        drawTriangle5(cellX, cellY, cellSize); // Рисуем треугольник в клетке
        continue;
      } else if (grid[x][y] === 6) {
        drawHex(cellX, cellY, cellSize); // Рисуем шестиугольник в клетке
        continue;
      } else {
        fill(255, 10); // Белый цвет для клеток со значением 0
      }

      // Рисуем клетку
      noStroke(); // Цвет рамки клетки
      rect(cellX, cellY, cellSize, cellSize);
    }
  }
}

function mouseDragged() {
  shapes();
}

function mouseClicked() {
  shapes();
}

function shapes() {
  // Определяем в какую клетку попала мышь
  let x = Math.floor(mouseX / cellSize);
  let y = Math.floor(mouseY / cellSize);

  // Проверяем, что курсор в пределах сетки
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    // Меняем значение клетки на противоположное (0 становится 1, а 1 становится 0)
    grid[x][y] = 1;

    // Проверяем соседние клетки
    let roll1 = Math.round(random(bicepsChance));
    if (roll1 === 1 && x > 0 && y > 0 && grid[x - 1][y - 1] === 1) {
      grid[x - 1][y] = 2;
    } else if (roll1 === 2 && x > 0 && y > 0 && grid[x - 1][y - 1] === 1) {
      grid[x][y - 1] = 3;
    } else if (roll1 >= 3 && x > 0 && y > 0 && grid[x - 1][y - 1] === 1) {
      grid[x][y] = 6;
    }

    if (roll1 === 1 && x < cols - 1 && y < rows - 1 && grid[x + 1][y + 1] === 1) {
      grid[x + 1][y] = 3;
    } else if (roll1 === 2 && x < cols - 1 && y < rows - 1 && grid[x + 1][y + 1] === 1) {
      grid[x][y + 1] = 2;
    } else if (roll1 >= 3 && x < cols - 1 && y < rows - 1 && grid[x + 1][y + 1] === 1) {
      grid[x][y] = 6;
    }

    if (roll1 === 1 && x > 0 && y < rows - 1 && grid[x - 1][y + 1] === 1) {
      grid[x - 1][y] = 4;
    } else if (roll1 === 2 && x > 0 && y < rows - 1 && grid[x - 1][y + 1] === 1) {
      grid[x][y + 1] = 5;
    } else if (roll1 >= 3 && x > 0 && y < rows - 1 && grid[x - 1][y + 1] === 1) {
      grid[x][y] = 6;
    }

    if (roll1 === 1 && x < cols - 1 && y > 0 && grid[x + 1][y - 1] === 1) {
      grid[x + 1][y] = 5;
    } else if (roll1 === 2 && x < cols - 1 && y > 0 && grid[x + 1][y - 1] === 1) {
      grid[x][y - 1] = 4;
    } else if (roll1 >= 3 && x < cols - 1 && y > 0 && grid[x + 1][y - 1] === 1) {
      grid[x][y - 1] = 6;
    }
  }
}

// Функция для рисования треугольников
function drawTriangle(x, y, size) {
  triangle(
    x + size, y, // Верхняя точка треугольника
    x, y, // Левая нижняя точка треугольника
    x + size, y + size // Правая нижняя точка треугольника
  );
}

function drawTriangle3(x, y, size) {
  triangle(
    x, y + size, // Верхняя точка треугольника
    x, y, // Левая нижняя точка треугольника
    x + size, y + size // Правая нижняя точка треугольника
  );
}

function drawTriangle4(x, y, size) {
  triangle(
    x + size, y, // Верхняя точка треугольника
    x, y + size, // Левая нижняя точка треугольника
    x + size, y + size // Правая нижняя точка треугольника
  );
}

function drawTriangle5(x, y, size) {
  triangle(
    x, y, // Верхняя точка треугольника
    x, y + size, // Левая нижняя точка треугольника
    x + size, y // Правая нижняя точка треугольника
  );
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
