let vertices = [];

// --- НОВЫЕ ПАРАМЕТРЫ ВЗАИМОДЕЙСТВИЯ С МЫШЬЮ ---
const MOUSE_INTERACTION_RADIUS = 150; // Радиус вокруг мыши, в котором точки реагируют
const MOUSE_ATTRACTION_STRENGTH = 0.9; // Максимальная сила притяжения точек к мыши

// --- Параметры Роста ---
const noiseAmount = 1.0;
const growthSpeed = 0.1;

// --- Параметры Детализации ---
const maxDist = 15;
const minDist = 5;
const MAX_VERTICES = 1500;

// --- Параметры Отталкивания ---
const repulsionRadius = 30;
const repulsionStrength = 0.4;
const repulsionRadiusSq = repulsionRadius * repulsionRadius;
const maxFrameSpeed = 1.5; // Немного увеличим, чтобы эффект от мыши был заметнее

// --- Параметры Границ ---
const boundaryPadding = 100;
const boundaryStrength = 5.8;

// --- Параметры Кривой ---
const curveTightness = 0.2;

let growthVector, repulsionVector, finalMove, tempVec, boundaryRepulsionVector, attractionVector;

function setup() {
  createCanvas(1000, 1000);
background(0);

  // Инициализация векторов
  growthVector = createVector();
  repulsionVector = createVector();
  finalMove = createVector();
  tempVec = createVector();
  boundaryRepulsionVector = createVector();
  attractionVector = createVector(); // Новый вектор для притяжения к мыши
  
  // Создание начальной формы
  let corners = createPShapeVertices();
  for (let i = 0; i < corners.length; i++) {
    let current = corners[i];
    let next = corners[(i + 1) % corners.length];
    let segmentLength = p5.Vector.dist(current, next);
    let numPointsInSegment = floor(segmentLength / 10);
    for (let j = 0; j < numPointsInSegment; j++) {
      vertices.push(p5.Vector.lerp(current, next, j / numPointsInSegment));
    }
  }
}

function createPShapeVertices() {
  // (Без изменений)
  let p_width = 300, p_height = 400, thickness = 80;
  let centerX = width / 2, centerY = height / 2;
 return [
    createVector(centerX - 235, centerY + 318),  // (265.01,818.57)
    createVector(centerX - 235, centerY - 320),  // (265.01,180.98)
    createVector(centerX + 236, centerY - 320),  // (736,180.98)
    createVector(centerX + 236, centerY + 318),  // (736,818.57)
    createVector(centerX + 79,  centerY + 318),  // (579,818.57)
    createVector(centerX + 79,  centerY - 163),  // (579,337.97)
    createVector(centerX - 78,  centerY - 163),  // (422,337.97)
    createVector(centerX - 78,  centerY + 318),  // (422,818.57)
    createVector(centerX - 235, centerY + 318)   // замыкаем
  ];
}

function draw() {
  //background(0);

  // --- ГЛАВНОЕ ИЗМЕНЕНИЕ: вся физика работает только при зажатой мыши ---
  if (mouseIsPressed) {
    let newPositions = [];
    const mousePos = createVector(mouseX, mouseY); // Позиция мыши как вектор

    // --- Расчёты физики ---
    for (let i = 0; i < vertices.length; i++) {
      let current = vertices[i];
      let prev = vertices[(i - 1 + vertices.length) % vertices.length];
      let next = vertices[(i + 1) % vertices.length];

      // Проверяем расстояние до курсора
      let distToMouse = p5.Vector.dist(current, mousePos);

      // Если точка вне радиуса действия, она не двигается
      if (distToMouse > MOUSE_INTERACTION_RADIUS) {
        newPositions.push(current.copy()); // Важно использовать .copy()
        continue; // Переходим к следующей точке
      }

      // Если точка ВНУТРИ радиуса, рассчитываем все силы
      
      // 1. Вектор роста (шум)
      let edge = p5.Vector.sub(next, prev);
      let normal = tempVec.set(edge.y, -edge.x).normalize();
      let noiseValue = noise(current.x * 0.01, current.y * 0.01, frameCount * 0.005);
      let angle = map(noiseValue, 0, 1, -PI, PI);
      let perturbation = p5.Vector.fromAngle(angle).mult(noiseAmount);
      growthVector.set(normal).add(perturbation).normalize().mult(growthSpeed);

      // 2. Вектор отталкивания (между точками)
      repulsionVector.set(0, 0);
      for (let j = 0; j < vertices.length; j++) {
        if (i === j) continue;
        let other = vertices[j];
        let dSq = pow(current.x - other.x, 2) + pow(current.y - other.y, 2);
        if (dSq > 0 && dSq < repulsionRadiusSq) {
          tempVec.set(current).sub(other);
          let strength = 1 - (dSq / repulsionRadiusSq);
          tempVec.setMag(repulsionStrength * strength);
          repulsionVector.add(tempVec);
        }
      }
      
      // 3. Вектор отталкивания от границ
      boundaryRepulsionVector.set(0, 0);
      if (current.x < boundaryPadding) {
        let strength = map(current.x, 0, boundaryPadding, 1, 0);
        boundaryRepulsionVector.x += strength * boundaryStrength;
      }
      if (current.x > width - boundaryPadding) {
        let strength = map(current.x, width - boundaryPadding, width, 0, 1);
        boundaryRepulsionVector.x -= strength * boundaryStrength;
      }
      if (current.y < boundaryPadding) {
        let strength = map(current.y, 0, boundaryPadding, 1, 0);
        boundaryRepulsionVector.y += strength * boundaryStrength;
      }
      if (current.y > height - boundaryPadding) {
        let strength = map(current.y, height - boundaryPadding, height, 0, 1);
        boundaryRepulsionVector.y -= strength * boundaryStrength;
      }

      // 4. НОВЫЙ ВЕКТОР: Притяжение к мыши
      attractionVector.set(mousePos).sub(current);
      // Чем ближе точка, тем сильнее притяжение
      let attractionForce = map(distToMouse, 0, MOUSE_INTERACTION_RADIUS, MOUSE_ATTRACTION_STRENGTH, 0);
      attractionVector.setMag(attractionForce);

      // 5. Суммируем ВСЕ силы
      finalMove.set(growthVector)
               .add(repulsionVector)
               .add(boundaryRepulsionVector)
               .add(attractionVector); // Добавляем новую силу
      finalMove.limit(maxFrameSpeed);
      
      newPositions.push(p5.Vector.add(current, finalMove));
    }
    
    vertices = newPositions;

    // --- Подразбивка и слияние (тоже только при зажатой мыши) ---
    for (let i = vertices.length - 1; i >= 0; i--) {
      let current = vertices[i];
      let next = vertices[(i + 1) % vertices.length];
      let dSq = pow(current.x - next.x, 2) + pow(current.y - next.y, 2);
      if (dSq > maxDist * maxDist && vertices.length < MAX_VERTICES) {
        vertices.splice(i + 1, 0, p5.Vector.lerp(current, next, 0.5));
      }
      if (dSq < minDist * minDist && vertices.length > 50) {
        vertices.splice(i, 1);
      }
    }
  } // Конец блока if (mouseIsPressed)

  // --- Отрисовка (происходит всегда, чтобы форма была видна) ---
  drawShape();
}

function drawShape() {
  // (Без изменений)
  if (vertices.length < 3) return;
  noStroke();
  //fill(0);
  noFill();
  stroke(255);
  beginShape();
  vertex(vertices[0].x, vertices[0].y);
  for (let i = 0; i < vertices.length; i++) {
    let p0 = vertices[(i - 1 + vertices.length) % vertices.length];
    let p1 = vertices[i];
    let p2 = vertices[(i + 1) % vertices.length];
    let p3 = vertices[(i + 2) % vertices.length];
    let cp1 = p5.Vector.sub(p2, p0).mult(curveTightness).add(p1);
    let cp2 = p5.Vector.sub(p1, p3).mult(curveTightness).add(p2);
    bezierVertex(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
  }
  endShape(CLOSE);
}