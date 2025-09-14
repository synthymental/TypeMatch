// --- Массив для хранения всех вершин всех букв
let letterShapes = [];

// --- Объект для хранения ссылок на все UI элементы
const ui = {};

// --- Переменные для управления состоянием кнопок-переключателей
let isFillMode = false;
let isEchoOn = true;

// --- Параметры Мыши и Анимации
const mouseAttractionRadius = 150, mouseAttractionStrength = 0.1, mouseWiggleStrength = 0.1;
const mouseAttractionRadiusSq = mouseAttractionRadius * mouseAttractionRadius;
const warmupDurationInSeconds = 3.0;
const maxDist = 15, minDist = 5, MAX_VERTICES_PER_LETTER = 500;
const maxFrameSpeed = 1.5, boundaryPadding = 30, boundaryStrength = 1.8;
let growthVector, repulsionVector, finalMove, tempVec, boundaryRepulsionVector, mouseForceVector;
let font;

function preload() {
    font = loadFont('IBMPlexMono-SemiBold.ttf');
}

function setup() {
    const canvasContainer = select('#canvas-container');
    const canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent(canvasContainer);

    initVectors();
    connectUI();
    renderText();
}

function connectUI() {
    const ids = [
        'textInput', 'renderBtn', 'fontSizeSlider', 'fontSizeValue',
        'colorPicker', 'strokeWidthSlider', 'strokeWidthValue',
        'fillToggleBtn', 'echoToggleBtn',
        'growthSpeedSlider', 'growthSpeedValue', 'noiseAmountSlider', 'noiseAmountValue',
        'repulsionStrengthSlider', 'repulsionStrengthValue', 'repulsionRadiusSlider', 'repulsionRadiusValue',
        'curveTightnessSlider', 'curveTightnessValue',
        'resetBtn', 'saveBtn'
    ];
    ids.forEach(id => ui[id] = select(`#${id}`));

    ui.renderBtn.mousePressed(renderText);
    ui.fontSizeSlider.input(renderText);
    ui.resetBtn.mousePressed(renderText);
    ui.saveBtn.mousePressed(() => saveCanvas('coral-text', 'png'));

    ui.fillToggleBtn.mousePressed(() => {
        isFillMode = !isFillMode;
        ui.fillToggleBtn.toggleClass('active');
    });

    ui.echoToggleBtn.mousePressed(() => {
        isEchoOn = !isEchoOn;
        ui.echoToggleBtn.toggleClass('active');
    });

    if (isEchoOn) {
        ui.echoToggleBtn.addClass('active');
    }

    const sliders = selectAll('input[type="range"]');
    sliders.forEach(slider => {
        updateSliderVisuals(slider);
        slider.input(() => updateSliderVisuals(slider));
    });
}

function updateSliderVisuals(slider) {
    const id = slider.id();
    const valueDisplay = ui[`${id}Value`];
    if (valueDisplay) {
        let value = parseFloat(slider.value());
        valueDisplay.html(slider.elt.step.includes('.') ? value.toFixed(2) : value);
    }
    const min = slider.elt.min, max = slider.elt.max, val = slider.elt.value;
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style('background', `linear-gradient(to right, var(--slider-fill-color) ${percentage}%, var(--slider-track-color) ${percentage}%)`);
}

function initVectors() {
    growthVector = createVector(); repulsionVector = createVector(); finalMove = createVector();
    tempVec = createVector(); boundaryRepulsionVector = createVector(); mouseForceVector = createVector();
}

function draw() {
    if (isEchoOn) {
        background(0, 15);
    } else {
        background(0);
    }

    const currentGrowthSpeed = ui.growthSpeedSlider.value();
    const currentNoiseAmount = ui.noiseAmountSlider.value();
    const currentRepulsionStrength = ui.repulsionStrengthSlider.value();
    const currentRepulsionRadius = ui.repulsionRadiusSlider.value();
    const currentRepulsionRadiusSq = currentRepulsionRadius * currentRepulsionRadius;
    
    const warmupFrames = warmupDurationInSeconds * frameRate();
    let growthFactor = min(1.0, frameCount / warmupFrames);

    if (letterShapes.length === 0) return;

    let allVertices = [].concat(...letterShapes);
    let newLetterShapes = [];

    for (const vertices of letterShapes) {
        let newPositions = [];
        for (let i = 0; i < vertices.length; i++) {
            let current = vertices[i];
            let prev = vertices[(i - 1 + vertices.length) % vertices.length];
            let next = vertices[(i + 1) % vertices.length];

            let edge = p5.Vector.sub(next, prev);
            let normal = tempVec.set(edge.y, -edge.x).normalize();
            let noiseValue = noise(current.x * 0.01, current.y * 0.01, frameCount * 0.005);
            let angle = map(noiseValue, 0, 1, -PI, PI);
            let perturbation = p5.Vector.fromAngle(angle).mult(currentNoiseAmount * growthFactor);
            growthVector.set(normal).add(perturbation).normalize().mult(currentGrowthSpeed * growthFactor);

            repulsionVector.set(0, 0);
            for (let j = 0; j < allVertices.length; j++) {
                if (current === allVertices[j]) continue;
                let dSq = pow(current.x - allVertices[j].x, 2) + pow(current.y - allVertices[j].y, 2);
                if (dSq > 0 && dSq < currentRepulsionRadiusSq) {
                    tempVec.set(current).sub(allVertices[j]);
                    let strength = 1 - (dSq / currentRepulsionRadiusSq);
                    tempVec.setMag(currentRepulsionStrength * strength);
                    repulsionVector.add(tempVec);
                }
            }

            boundaryRepulsionVector.set(0, 0);
            if (current.x < boundaryPadding) boundaryRepulsionVector.x += boundaryStrength;
            if (current.x > width - boundaryPadding) boundaryRepulsionVector.x -= boundaryStrength;
            if (current.y < boundaryPadding) boundaryRepulsionVector.y += boundaryStrength;
            if (current.y > height - boundaryPadding) boundaryRepulsionVector.y -= boundaryStrength;
            
            mouseForceVector.set(0, 0);
            if (mouseIsPressed && mouseX > select('#sidebar').width) {
                let dSq = pow(current.x - mouseX, 2) + pow(current.y - mouseY, 2);
                if (dSq < mouseAttractionRadiusSq) {
                    let distance = sqrt(dSq);
                    let falloff = map(distance, 0, mouseAttractionRadius, 1, 0);
                    let attraction = createVector(mouseX, mouseY).sub(current).setMag(mouseAttractionStrength * falloff);
                    let wiggleDir = createVector(-attraction.y, attraction.x);
                    let wiggleAmount = sin(frameCount * 0.2 + i * 0.5) * mouseWiggleStrength * falloff;
                    mouseForceVector.add(attraction).add(wiggleDir.setMag(wiggleAmount));
                }
            }

            finalMove.set(growthVector).add(repulsionVector).add(boundaryRepulsionVector).add(mouseForceVector);
            finalMove.limit(maxFrameSpeed);

            newPositions.push(p5.Vector.add(current, finalMove));
        }
        
        for (let i = newPositions.length - 1; i >= 0; i--) {
            let current = newPositions[i];
            let next = newPositions[(i + 1) % newPositions.length];
            let dSq = pow(current.x - next.x, 2) + pow(current.y - next.y, 2);
            if (dSq > maxDist * maxDist && newPositions.length < MAX_VERTICES_PER_LETTER) {
                newPositions.splice(i + 1, 0, p5.Vector.lerp(current, next, 0.5));
            }
            if (dSq < minDist * minDist && newPositions.length > 50) {
                newPositions.splice(i, 1);
            }
        }
        newLetterShapes.push(newPositions);
    }
    letterShapes = newLetterShapes;
    drawShapes();
}

function drawShapes() {
    let currentCurveTightness = ui.curveTightnessSlider.value();
    let c = color(ui.colorPicker.value());

    if (isFillMode) {
        noStroke();
        c.setAlpha(15);
        fill(c);
    } else {
        noFill();
        
        // --- НОВАЯ ЛОГИКА ПРОЗРАЧНОСТИ ---
        // Если echo включено, делаем обводку полупрозрачной
        // Если выключено - полностью непрозрачной
        if (isEchoOn) {
            c.setAlpha(50);
        } else {
            c.setAlpha(255);
        }
        
        stroke(c);
        strokeWeight(ui.strokeWidthSlider.value());
    }
    
    for (const vertices of letterShapes) {
        if (vertices.length < 3) continue;
        beginShape();
        vertex(vertices[0].x, vertices[0].y); 
        for (let i = 0; i < vertices.length; i++) {
            let p0 = vertices[(i - 1 + vertices.length) % vertices.length];
            let p1 = vertices[i];
            let p2 = vertices[(i + 1) % vertices.length];
            let p3 = vertices[(i + 2) % vertices.length];
            let cp1 = p5.Vector.sub(p2, p0).mult(currentCurveTightness).add(p1);
            let cp2 = p5.Vector.sub(p1, p3).mult(currentCurveTightness).add(p2);
            bezierVertex(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
        }
        endShape(CLOSE);
    }
    strokeWeight(1);
}

// --- ИСПРАВЛЕНА ОШИБКА В ЭТОЙ ФУНКЦИИ ---
function renderText() {
    letterShapes = [];
    const userText = ui.textInput.value();
    if (!userText) return;

    const fontSize = ui.fontSizeSlider.value();
    
    // 1. Получаем ширину одного символа, используя ПРАВИЛЬНУЮ функцию font.textBounds()
    const charBounds = font.textBounds("M", 0, 0, fontSize);
    const charWidth = charBounds.w;

    // 2. Считаем количество видимых символов (без пробелов)
    const visibleChars = userText.replace(/ /g, '').length;
    
    // 3. Вычисляем общую ширину и начальную позицию для центрирования
    const totalWidth = visibleChars * charWidth;
    const startX = (width - totalWidth) / 2;
    
    // 4. Вычисляем Y-позицию, используя высоту из textBounds для точности
    const textBounds = font.textBounds(userText, 0, 0, fontSize);
    const startY = height / 2 + textBounds.h / 2;

    let visibleCharIndex = 0;

    for (let i = 0; i < userText.length; i++) {
        const char = userText[i];
        if (char === ' ') continue;

        // 5. Вычисляем точную X-позицию для каждого символа
        const charX = startX + (visibleCharIndex * charWidth);

        const points = font.textToPoints(char, charX, startY, fontSize, {
            sampleFactor: 0.2,
            simplifyThreshold: 0
        });

        const charVertices = points.map(p => createVector(p.x, p.y));
        if (charVertices.length > 0) {
            letterShapes.push(charVertices);
        }

        visibleCharIndex++;
    }
}


function windowResized() {
    const canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
    renderText();
}