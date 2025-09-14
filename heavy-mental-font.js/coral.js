// --- Глобальные переменные ---
let vertices = [];
let font;

// Переменные для DOM-элементов
let letterInput, fontSizeSlider, sampleFactorSlider, noiseSlider, speedSlider, maxDistSlider, 
    minDistSlider, repulsionRadiusSlider, repulsionStrengthSlider, maxSpeedSlider, 
    boundaryPaddingSlider, boundaryStrengthSlider, curveTightnessSlider, resetButton,
    pauseButton, exportButton, toggleStyleButton; // Новые кнопки

// Переменные состояния
let isPaused = false;
let isFilled = true;

// ПАРАМЕТРЫ СИМУЛЯЦИИ (управляются слайдерами)
// ... (остальные переменные без изменений)
let warmupDurationInSeconds = 3.0;
let noiseAmount, growthSpeed, maxDist, minDist, repulsionRadius, repulsionStrength,
    maxFrameSpeed, boundaryPadding, boundaryStrength, curveTightness;
let repulsionRadiusSq;
const MAX_VERTICES = 1800;
let growthVector, repulsionVector, finalMove, tempVec, boundaryRepulsionVector;

function preload() {
  font = loadFont('IBMPlexMono-SemiBold.ttf');
}

function setup() {
  createCanvas(700, 700);

  // Инициализация рабочих векторов
  growthVector = createVector();
  repulsionVector = createVector();
  finalMove = createVector();
  tempVec = createVector();
  boundaryRepulsionVector = createVector();
  
  createControls();
  resetSketch();
}

function createControls() {
  let controlsContainer = createDiv('').style('padding', '10px').style('background-color', '#333').style('color', 'white');
  
  const createLabeledSlider = (label, min, max, value, step) => {
    createP(label).parent(controlsContainer).style('margin', '10px 0 2px 0');
    let slider = createSlider(min, max, value, step).parent(controlsContainer);
    slider.style('width', '350px');
    return slider;
  };
  
  // --- Настройки формы ---
  createP('<strong>Shape Controls (Настройки формы)</strong>').parent(controlsContainer);
  createP('Text (Текст для генерации)').parent(controlsContainer).style('margin', '10px 0 2px 0');
  letterInput = createInput('П').parent(controlsContainer);
  fontSizeSlider = createLabeledSlider('Font Size (Размер шрифта)', 100, 800, 550, 10);
  sampleFactorSlider = createLabeledSlider('Sample Factor (Детализация контура)', 0.05, 0.5, 0.1, 0.01);
  resetButton = createButton('Reset Simulation with New Shape').parent(controlsContainer);
  resetButton.style('margin-top', '15px');
  resetButton.mousePressed(resetSketch);
  
  // --- Настройки симуляции ---
  createP('<strong>Simulation Controls (Настройки симуляции)</strong>').parent(controlsContainer).style('margin-top', '20px');
  // ... (все слайдеры остаются здесь без изменений)
  noiseSlider = createLabeledSlider('Noise Amount (Органичность)', 0, 2, 0.8, 0.01);
  speedSlider = createLabeledSlider('Growth Speed (Скорость роста)', 0, 2, 0.3, 0.01);
  maxDistSlider = createLabeledSlider('Max Distance (Детализация +)', 5, 50, 15, 1);
  minDistSlider = createLabeledSlider('Min Distance (Детализация -)', 1, 20, 4, 1);
  repulsionRadiusSlider = createLabeledSlider('Repulsion Radius (Личное пространство)', 10, 100, 30, 1);
  repulsionStrengthSlider = createLabeledSlider('Repulsion Strength (Сила отталкивания)', 0, 2, 0.4, 0.01);
  maxSpeedSlider = createLabeledSlider('Max Frame Speed (Стабильность)', 0.1, 5, 1.0, 0.1);
  boundaryPaddingSlider = createLabeledSlider('Boundary Padding (Размер контейнера)', 0, 200, 80, 1);
  boundaryStrengthSlider = createLabeledSlider('Boundary Strength (Жесткость стен)', 0, 2, 0.8, 0.01);
  curveTightnessSlider = createLabeledSlider('Curve Tightness (Плавность краев)', 0, 0.5, 0.2, 0.01);

  // --- НОВЫЙ БЛОК: Управление и Экспорт ---
  createP('<strong>Actions (Управление)</strong>').parent(controlsContainer).style('margin-top', '20px');
  pauseButton = createButton('Pause').parent(controlsContainer).style('margin-right', '10px');
  toggleStyleButton = createButton('Toggle Stroke/Fill').parent(controlsContainer).style('margin-right', '10px');
  exportButton = createButton('Export PNG').parent(controlsContainer);

  pauseButton.mousePressed(togglePause);
  toggleStyleButton.mousePressed(toggleRenderStyle);
  exportButton.mousePressed(() => saveCanvas('coral_growth', 'png'));
}

// --- Новые функции управления ---
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    noLoop();
    pauseButton.html('Play');
  } else {
    loop();
    pauseButton.html('Pause');
  }
}

function toggleRenderStyle() {
  isFilled = !isFilled;
  // Если симуляция на паузе, нужно перерисовать холст один раз, чтобы увидеть изменения
  if (isPaused) {
    redraw();
  }
}

function resetSketch() {
  // ... (функция resetSketch без изменений)
  vertices = [];
  let currentLetter = letterInput.value() || 'A';
  let currentFontSize = fontSizeSlider.value();
  let currentSampleFactor = sampleFactorSlider.value();
  let bounds = font.textBounds(currentLetter, 0, 0, currentFontSize);
  let postX = width / 2 - bounds.w / 2;
  let postY = height / 2 + bounds.h / 2;
  let points = font.textToPoints(currentLetter, postX, postY, currentFontSize, { sampleFactor: currentSampleFactor });
  for (let pt of points) {
    vertices.push(createVector(pt.x, pt.y));
  }
  background(0);
  frameCount = 0;
  // Если сброс происходит во время паузы, возобновляем
  if (isPaused) {
    togglePause();
  }
}

function updateParameters() {
  // ... (функция updateParameters без изменений)
  noiseAmount = noiseSlider.value();
  growthSpeed = speedSlider.value();
  maxDist = maxDistSlider.value();
  minDist = minDistSlider.value();
  repulsionRadius = repulsionRadiusSlider.value();
  repulsionStrength = repulsionStrengthSlider.value();
  maxFrameSpeed = maxSpeedSlider.value();
  boundaryPadding = boundaryPaddingSlider.value();
  boundaryStrength = boundaryStrengthSlider.value();
  curveTightness = curveTightnessSlider.value();
  repulsionRadiusSq = repulsionRadius * repulsionRadius;
}

function draw() {
  background(0);
  updateParameters();

  const warmupFrames = warmupDurationInSeconds * 60;
  let growthFactor = constrain(map(frameCount, 0, warmupFrames, 0, 1), 0, 1);

  // --- Расчёты физики (без изменений) ---
  // ... (весь блок физики остается прежним)
  let newPositions = [];
  for (let i = 0; i < vertices.length; i++) {
    let current = vertices[i];
    let prev = vertices[(i - 1 + vertices.length) % vertices.length];
    let next = vertices[(i + 1) % vertices.length];
    let edge = p5.Vector.sub(next, prev);
    let normal = tempVec.set(edge.y, -edge.x).normalize();
    let noiseValue = noise(current.x * 0.01, current.y * 0.01, frameCount * 0.005);
    let angle = map(noiseValue, 0, 1, -PI, PI);
    let perturbation = p5.Vector.fromAngle(angle).mult(noiseAmount * growthFactor);
    growthVector.set(normal).add(perturbation).normalize().mult(growthSpeed * growthFactor);
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
    boundaryRepulsionVector.set(0, 0);
    if (current.x < boundaryPadding) boundaryRepulsionVector.x += map(current.x, 0, boundaryPadding, 1, 0) * boundaryStrength;
    if (current.x > width - boundaryPadding) boundaryRepulsionVector.x -= map(current.x, width - boundaryPadding, width, 0, 1) * boundaryStrength;
    if (current.y < boundaryPadding) boundaryRepulsionVector.y += map(current.y, 0, boundaryPadding, 1, 0) * boundaryStrength;
    if (current.y > height - boundaryPadding) boundaryRepulsionVector.y -= map(current.y, height - boundaryPadding, height, 0, 1) * boundaryStrength;
    finalMove.set(growthVector).add(repulsionVector).add(boundaryRepulsionVector);
    finalMove.limit(maxFrameSpeed);
    newPositions.push(p5.Vector.add(current, finalMove));
  }
  vertices = newPositions;
  
  // --- Подразбивка и слияние (без изменений) ---
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
  
  drawShape();
}

// ИЗМЕНЕННАЯ ФУНКЦИЯ ОТРИСОВКИ
function drawShape() {
  if (vertices.length < 3) return;

  // Переключаем стиль в зависимости от переменной isFilled
  if (isFilled) {
    noStroke();
    fill(255);
  } else {
    stroke(255);
    strokeWeight(1);
    noFill();
  }

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