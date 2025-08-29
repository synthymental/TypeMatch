let letterShape; // Объект для хранения кастомного шейпа
let x, y, d = 0;
let ex, ey;
let isDragging = false;
let angle;

let targetX, targetY;

// Массивы смещений x и y для вершин. Теперь они будут хранить постоянную деформацию.
let dx;
let dy;
let threshold = 50;
let lerpFactor = 0.12;

function setup() {
  createCanvas(1000, 1000);
  frameRate(60);
  x = mouseX;
  y = mouseY;
  background(0);

  letterShape = createSubdividedShape(createCustomShape(), 70);

  dx = new Array(letterShape.length).fill(0);
  dy = new Array(letterShape.length).fill(0);
}

function draw() {
  background(0);

  // Логика движения шарика остается без изменений
  if (isDragging) {
    let relX = mouseX;
    let relY = mouseY;
    d = dist(x, y, relX, relY);
    stroke("#00ff00");
    line(x, y, mouseX, mouseY);
    noStroke();
    fill("#ff0000");
    ellipse(mouseX, mouseY, d / 5, d / 5);

    targetX = mouseX;
    targetY = mouseY;
  } else {
    if (d > 0) {
      let speed = d / 10;
      ex -= cos(angle) * speed;
      ey -= sin(angle) * speed;

      let radius = d / 10;
      if (ex - radius < 0 || ex + radius > width) {
        angle = PI - angle;
      }
      if (ey - radius < 0 || ey + radius > height) {
        angle = -angle;
      }
      
      fill("#ff0000");
      ellipse(ex, ey, d / 5, d / 5);

      targetX = int(ex);
      targetY = int(ey);
    }
  }
  threshold = d / 5;

  stroke(0);
  fill(255);

  beginShape();
  for (let i = 0; i < letterShape.length; i++) {
    // Важно: мы всегда начинаем с оригинальной позиции и прибавляем к ней накопленное смещение
    let originalX = letterShape[i].x;
    let originalY = letterShape[i].y;
    
    // Текущая позиция вершины (с учетом деформации)
    let currentX = originalX + dx[i];
    let currentY = originalY + dy[i];

    // Расстояние считаем от текущей (деформированной) позиции вершины до шарика
    let distance = dist(targetX, targetY, currentX, currentY);

    // Если шарик достаточно близко, мы продолжаем изменять смещение
    if (distance <= threshold) {
      dx[i] = lerp(dx[i], random(-width * 0.5, width * 0.5), lerpFactor);
      dy[i] = lerp(dy[i], random(-height * 0.5, height * 0.5), lerpFactor);
    }
    
    // ========== КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ==========
    // Мы удалили блок 'else', который возвращал dx[i] и dy[i] к нулю.
    // Теперь, даже когда шарик улетает, значения в dx и dy сохраняются.
    // ======================================

    // Рисуем вершину в ее новом, деформированном положении
    vertex(originalX + dx[i], originalY + dy[i]);
  }
  endShape(CLOSE);
}

function mousePressed() {
  x = mouseX;
  y = mouseY;
  isDragging = true;
  d = 0;
}

function mouseReleased() {
  isDragging = false;
  ex = mouseX;
  ey = mouseY;
  angle = atan2(ey - y, ex - x);
}

// Вспомогательные функции остаются без изменений
function createCustomShape() {
  let centerX = width / 2;
  let centerY = height / 2;

  return [
    createVector(centerX - 235, centerY + 318),
    createVector(centerX - 235, centerY - 320),
    createVector(centerX + 236, centerY - 320),
    createVector(centerX + 236, centerY + 318),
    createVector(centerX + 79, centerY + 318),
    createVector(centerX + 79, centerY - 163),
    createVector(centerX - 78, centerY - 163),
    createVector(centerX - 78, centerY + 318),
    createVector(centerX - 235, centerY + 318)
  ];
}

function createSubdividedShape(originalShape, subdivisionFactor) {
  let subdivided = [];
  for (let i = 0; i < originalShape.length - 1; i++) {
    let p1 = originalShape[i];
    let p2 = originalShape[i + 1];

    subdivided.push(p1);

    for (let j = 1; j < subdivisionFactor; j++) {
      let t = j / subdivisionFactor;
      let newX = lerp(p1.x, p2.x, t);
      let newY = lerp(p1.y, p2.y, t);
      subdivided.push(createVector(newX, newY));
    }
  }
  subdivided.push(originalShape[originalShape.length - 1]);
  return subdivided;
}