let cellSize = 6;
let clickCounter = 0;
let fonts = [];
let fontNames = [
  'Suisse Works Medium',
  'Druk Wide Medium',
  'Le Murmure',
  'Pilowlava Regular',
  'Terminal Grotesque'
];
let binaryMatrix = [];
let characterMatrix = [];
let animStates = [];
let roundCorner = 30;
let bufferFontIndex, bufferChar, bufferPosX, bufferPosY;
let score = 0;

let wTile, hTile;
let isAnimating = false;
let startX, startY, endX, endY;
let animationFrameCount = 0;
let duration = 15; // Animation duration for swapping
let matchTimer = []; // Timer for matched cells before they disappear/regenerate
let matchDelay = 200; // Delay for matched cells

const GAME_DURATION_MS = 3 * 60 * 1000; // 3 minutes
let gameStartTime;
let timeRemaining = GAME_DURATION_MS;
let gameState = 'playing'; // 'playing', 'gameOver'

const AVAILABLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let currentTheme = 'dark'; // <<< INITIAL THEME IS NOW DARK
// p5.js specific theme colors (for canvas elements)
let themesP5 = {
  light: {
    background: [228, 228, 228],
    cellBackground: [247, 247, 247],
    cellHighlight: [0, 163, 255],
    cellSelected: [255, 42, 42],
    textColor: [0, 0, 0],
    matchedCellColor: [255, 100, 100],
  },
  dark: {
    background: [30, 30, 30],
    cellBackground: [50, 50, 50],
    cellHighlight: [0, 200, 255],
    cellSelected: [255, 90, 90],
    textColor: [220, 220, 220],
    matchedCellColor: [180, 50, 50],
  }
};
let activeP5Theme = themesP5.dark; // <<< AND CORRESPONDING P5 THEME

// DOM element references
let timerDisplayElement, scoreDisplayElement, themeToggleButtonElement, fontInfoContainerElement;
let canvasContainerElement;

function preload() {
  fonts[0] = loadFont('/tmAssets/fonts/Suisse-Works-Medium.otf');
  fonts[1] = loadFont('/tmAssets/fonts/Druk-Wide-Medium-Desktop.otf');
  fonts[2] = loadFont('/tmAssets/fonts/le-murmure.ttf');
  fonts[3] = loadFont('/tmAssets/fonts/Pilowlava-Regular.otf');
  fonts[4] = loadFont('/tmAssets/fonts/terminal-grotesque.ttf');
}

function setup() {
  canvasContainerElement = document.getElementById('canvas-container');
  let cnv = createCanvas(100, 100); // Temporary size, windowResized will update it
  if (canvasContainerElement) {
    cnv.parent(canvasContainerElement);
  } else {
    console.error("Canvas container not found!");
  }

  textAlign(CENTER, CENTER); // Global text alignment for p5.js

  // Get DOM element references
  timerDisplayElement = document.getElementById('timerDisplay');
  scoreDisplayElement = document.getElementById('scoreDisplay');
  themeToggleButtonElement = document.getElementById('themeToggleButton');
  fontInfoContainerElement = document.getElementById('fontInfoContainer');

  // Add event listener for the theme toggle button
  if (themeToggleButtonElement) {
    themeToggleButtonElement.addEventListener('click', () => {
      currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
      applyTheme();
    });
  }

  // Initialize game matrices
  for (let i = 0; i < cellSize; i++) {
    binaryMatrix[i] = [];
    characterMatrix[i] = [];
    animStates[i] = [];
    matchTimer[i] = [];
    for (let j = 0; j < cellSize; j++) {
      binaryMatrix[i][j] = int(random(fonts.length));
      characterMatrix[i][j] = random(AVAILABLE_CHARS.split(''));
      animStates[i][j] = 1; // Animation not active, scale = 1
      matchTimer[i][j] = -1; // No active matches
    }
  }

  gameStartTime = millis(); // Record game start time
  applyTheme(); // Apply initial theme to both p5.js and DOM
  populateFontInfo(); // Populate the font information in the DOM
  updateScoreDisplay(); // Display initial score

  setTimeout(windowResized, 60); // Delayed call to windowResized
}

function applyTheme() {
  activeP5Theme = themesP5[currentTheme]; // Set p5.js theme colors
  // Toggle dark-theme class on the body for CSS to handle DOM element styling
  // If dark is default, we remove it for light. If light is default, we add it for dark.
  // Since dark is default, for light theme, we REMOVE 'dark-theme' (or ensure it's not there)
  // and for dark theme, we ADD 'dark-theme' (or ensure it's there).
  // The CSS is set up to style body by default as dark, and body:not(.dark-theme) as light.
  // So, if currentTheme is 'light', we want body to NOT have 'dark-theme'.
  // If currentTheme is 'dark', we want body to HAVE 'dark-theme'.
  // This means the class should track the 'dark' state.
  document.body.classList.toggle('dark-theme', currentTheme === 'dark');

  if (themeToggleButtonElement) {
    // Update theme button icon to reflect the theme it will switch TO
    themeToggleButtonElement.innerText = (currentTheme === 'light') ? "🌙" : "☀️";
  }
}

function populateFontInfo() {
  if (!fontInfoContainerElement || !fonts.length) return;
  let htmlContent = '<p class="font-info-title">Fonts in Game:</p>';
  for (let i = 0; i < fontNames.length; i++) {
    if (fontNames[i]) {
      // Assumes CSS has @font-face rules for these font-family names
      htmlContent += `<p style="font-family: '${fontNames[i]}', sans-serif;">${fontNames[i]}</p>`;
    }
  }
  fontInfoContainerElement.innerHTML = htmlContent;
}

function updateScoreDisplay() {
  if (scoreDisplayElement) {
    scoreDisplayElement.innerText = "Score: " + score;
  }
}

function draw() {
  background(activeP5Theme.background); // Set p5.js canvas background

  if (gameState === 'playing') {
    updateGameTimer();

    // Process matched cells that are due for regeneration
    for (let i = 0; i < cellSize; i++) {
      for (let j = 0; j < cellSize; j++) {
        if (matchTimer[i][j] !== -1 && millis() - matchTimer[i][j] > matchDelay) {
          generateNewValueAndChar(i, j);
          matchTimer[i][j] = -1; // Reset timer
        }
      }
    }
    updateAnimationStates(); // Update appearance/disappearance animations

    if (isAnimating) {
      animateSwap(); // Handle tile swapping animation
    } else {
      checkMatchesAndUpdateScore(); // Check for new matches if no swap animation
      displayGrid(); // Draw the game grid
    }
    displayMouseHighlight(); // Highlight cell under mouse

  } else if (gameState === 'gameOver') {
    displayGrid(); // Show final grid state
    displayGameOverScreenOnCanvas(); // Show "Game Over" message on canvas
  }
}

function updateGameTimer() {
  if (gameState !== 'playing') {
    if (timeRemaining <= 0 && timerDisplayElement) timerDisplayElement.innerText = "00:00"; // Ensure 00:00 at end
    return;
  }
  timeRemaining = GAME_DURATION_MS - (millis() - gameStartTime);
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    gameState = 'gameOver';
  }

  if (timerDisplayElement) {
    let minutes = floor(timeRemaining / 60000);
    let seconds = floor((timeRemaining % 60000) / 1000);
    timerDisplayElement.innerText = nf(minutes, 2) + ":" + nf(seconds, 2);
  }
}

function displayGameOverScreenOnCanvas() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // Semi-transparent background for the message
  fill(activeP5Theme.cellBackground[0], activeP5Theme.cellBackground[1], activeP5Theme.cellBackground[2], 230);
  noStroke();
  rect(width / 2, height / 2, width * 0.8, height * 0.5, roundCorner * 0.7);

  // "Game Over!" text
  textFont(fonts[0] || 'Arial'); // Use first loaded font or Arial fallback
  textSize(min(width, height) * 0.08);
  fill(activeP5Theme.textColor);
  text("Game Over!", width / 2, height / 2 - min(width, height) * 0.07);

  // Final score text
  textFont(fonts[1] || 'Arial'); // Use another font or fallback
  textSize(min(width, height) * 0.06);
  text("Your Score: " + score, width / 2, height / 2 + min(width, height) * 0.03);

  // Restart instruction
  textFont('Arial');
  textSize(min(width, height) * 0.03);
  text("Refresh the page to play again", width / 2, height / 2 + min(width, height) * 0.12);
  pop();
}

// Helper function to draw letters, attempting better centering
function drawLetterInCell(char, fontIndex, cellX, cellY, cellW, cellH, scaleFactor = 1) {
  push();
  fill(activeP5Theme.textColor);
  textFont(fonts[fontIndex]);
  let baseTextSize = min(cellW, cellH) * 0.65; // Increased base size for letters
  let charTextSize = baseTextSize * scaleFactor;
  textSize(charTextSize);

  let yOffset = charTextSize * 0.05;
  text(char, cellX + cellW / 2, cellY + cellH / 2 - yOffset);
  pop();
}

function displayGrid() {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      let currentTileW = wTile;
      let currentTileH = hTile;
      let scale = animStates[i][j];

      let rectPadding = max(1, currentTileW * 0.02);
      let rectSizeW = scale * (currentTileW - 2 * rectPadding);
      let rectSizeH = scale * (currentTileH - 2 * rectPadding);
      let rectX = i * currentTileW + (currentTileW - rectSizeW) / 2;
      let rectY = j * currentTileH + (currentTileH - rectSizeH) / 2;
      let corner = roundCorner * scale * (currentTileW / (800 / cellSize)) * 0.8;

      noStroke();
      if (matchTimer[i][j] !== -1 && gameState === 'playing') {
        fill(activeP5Theme.matchedCellColor);
      } else {
        fill(activeP5Theme.cellBackground);
      }
      rect(rectX, rectY, rectSizeW, rectSizeH, corner);

      if (scale > 0.5) {
        drawLetterInCell(characterMatrix[i][j], binaryMatrix[i][j],
                         i * currentTileW, j * currentTileH,
                         currentTileW, currentTileH, scale);
      }
    }
  }
}

function displayCell(i, j) {
  let currentTileW = wTile;
  let currentTileH = hTile;
  let scale = animStates[i][j];

  let rectPadding = max(1, currentTileW * 0.02);
  let rectSizeW = scale * (currentTileW - 2 * rectPadding);
  let rectSizeH = scale * (currentTileH - 2 * rectPadding);
  let rectX = i * currentTileW + (currentTileW - rectSizeW) / 2;
  let rectY = j * currentTileH + (currentTileH - rectSizeH) / 2;
  let corner = roundCorner * scale * (currentTileW / (800 / cellSize)) * 0.8;

  noStroke();
  fill(activeP5Theme.cellBackground);
  rect(rectX, rectY, rectSizeW, rectSizeH, corner);

  if (scale > 0.5) {
    drawLetterInCell(characterMatrix[i][j], binaryMatrix[i][j],
                     i * currentTileW, j * currentTileH,
                     currentTileW, currentTileH, scale);
  }
}

function displayMovingCell(matrixIndexX, matrixIndexY, currentPixelX, currentPixelY) {
  let currentTileW = wTile;
  let currentTileH = hTile;
  let scale = 1;

  let rectPadding = max(1, currentTileW * 0.02);
  let rectSizeW = scale * (currentTileW - 2 * rectPadding);
  let rectSizeH = scale * (currentTileH - 2 * rectPadding);
  let rectX = currentPixelX + (currentTileW - rectSizeW) / 2;
  let rectY = currentPixelY + (currentTileH - rectSizeH) / 2;
  let corner = roundCorner * scale * (currentTileW / (800 / cellSize)) * 0.8;

  noStroke();
  fill(activeP5Theme.cellBackground);
  rect(rectX, rectY, rectSizeW, rectSizeH, corner);

  drawLetterInCell(characterMatrix[matrixIndexX][matrixIndexY], binaryMatrix[matrixIndexX][matrixIndexY],
                   currentPixelX, currentPixelY,
                   currentTileW, currentTileH, scale);
}


function displayMouseHighlight() {
  if (gameState !== 'playing' || isAnimating) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  let currentMouseXTile = floor(mouseX / wTile);
  let currentMouseYTile = floor(mouseY / hTile);
  if (currentMouseXTile < 0 || currentMouseXTile >= cellSize || currentMouseYTile < 0 || currentMouseYTile >= cellSize) return;

  push();
  noFill();
  strokeWeight(max(2, width * 0.005));
  let tilePadding = max(2, width * 0.005);
  let corner = roundCorner * (wTile / (800 / cellSize)) * 0.8;

  if (clickCounter === 1 && bufferPosX !== undefined && bufferPosY !== undefined) {
    stroke(activeP5Theme.cellSelected);
    rect(bufferPosX * wTile + tilePadding, bufferPosY * hTile + tilePadding,
         wTile - 2 * tilePadding, hTile - 2 * tilePadding, corner);
    if (currentMouseXTile !== bufferPosX || currentMouseYTile !== bufferPosY) {
      stroke(activeP5Theme.cellHighlight);
      rect(currentMouseXTile * wTile + tilePadding, currentMouseYTile * hTile + tilePadding,
           wTile - 2 * tilePadding, hTile - 2 * tilePadding, corner);
    }
  } else {
    stroke(activeP5Theme.cellHighlight);
    rect(currentMouseXTile * wTile + tilePadding, currentMouseYTile * hTile + tilePadding,
         wTile - 2 * tilePadding, hTile - 2 * tilePadding, corner);
  }
  pop();
}

function mousePressed() {
  if (gameState !== 'playing' || isAnimating) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    clickCounter = 0; bufferPosX = undefined; bufferPosY = undefined; return;
  }
  let posX = floor(mouseX / wTile);
  let posY = floor(mouseY / hTile);
  if (posX < 0 || posX >= cellSize || posY < 0 || posY >= cellSize) {
    clickCounter = 0; bufferPosX = undefined; bufferPosY = undefined; return;
  }

  clickCounter++;

  if (clickCounter === 1) {
    bufferFontIndex = binaryMatrix[posX][posY];
    bufferChar = characterMatrix[posX][posY];
    bufferPosX = posX;
    bufferPosY = posY;
  } else if (clickCounter === 2) {
    if (abs(posX - bufferPosX) + abs(posY - bufferPosY) === 1) {
      startX = bufferPosX * wTile;
      startY = bufferPosY * hTile;
      endX = posX * wTile;
      endY = posY * hTile;
      isAnimating = true;
      animationFrameCount = 0;
    } else if (posX === bufferPosX && posY === bufferPosY) {
      clickCounter = 0;
      bufferPosX = undefined;
      bufferPosY = undefined;
    } else {
      bufferFontIndex = binaryMatrix[posX][posY];
      bufferChar = characterMatrix[posX][posY];
      bufferPosX = posX;
      bufferPosY = posY;
      clickCounter = 1;
    }
  }
}

function animateSwap() {
  let t = easing(float(animationFrameCount) / duration);
  let currentX1 = lerp(startX, endX, t);
  let currentY1 = lerp(startY, endY, t);
  let currentX2 = lerp(endX, startX, t);
  let currentY2 = lerp(endY, startY, t);

  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      let iCellGridX = i * wTile;
      let jCellGridY = j * hTile;
      if (!((iCellGridX === startX && jCellGridY === startY) || (iCellGridX === endX && jCellGridY === endY))) {
        displayCell(i, j);
      }
    }
  }

  displayMovingCell(floor(startX / wTile), floor(startY / hTile), currentX1, currentY1);
  displayMovingCell(floor(endX / wTile), floor(endY / hTile), currentX2, currentY2);

  animationFrameCount++;

  if (animationFrameCount > duration) {
    swapMatrixValues(floor(startX / wTile), floor(startY / hTile), floor(endX / wTile), floor(endY / hTile));
    isAnimating = false;
    clickCounter = 0;
    bufferPosX = undefined;
    bufferPosY = undefined;
    checkMatchesAndUpdateScore();
  }
}

function easing(t) {
  return t * (2 - t);
}

function checkMatchesAndUpdateScore() {
  let matchOccurred = false;
  let cellsToMark = [];

  for (let j = 0; j < cellSize; j++) {
    for (let i = 0; i <= cellSize - 3; i++) {
      if (!binaryMatrix[i+1] || !binaryMatrix[i+2]) continue;
      let val = binaryMatrix[i][j];
      if (val === binaryMatrix[i + 1][j] && val === binaryMatrix[i + 2][j]) {
        let currentMatch = [{x: i, y: j}, {x: i+1, y: j}, {x: i+2, y: j}];
        if (i <= cellSize - 4 && binaryMatrix[i+3] && val === binaryMatrix[i+3][j]) {
            currentMatch.push({x: i+3, y:j});
            if (i <= cellSize - 5 && binaryMatrix[i+4] && val === binaryMatrix[i+4][j]) {
                currentMatch.push({x: i+4, y:j});
            }
        }
        currentMatch.forEach(c => cellsToMark.push(c));
        i += currentMatch.length -1;
      }
    }
  }

  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j <= cellSize - 3; j++) {
      if (binaryMatrix[i][j+1] === undefined || binaryMatrix[i][j+2] === undefined) continue;
      let val = binaryMatrix[i][j];
      if (val === binaryMatrix[i][j + 1] && val === binaryMatrix[i][j + 2]) {
        let currentMatch = [{x: i, y: j}, {x: i, y: j+1}, {x: i, y: j+2}];
         if (j <= cellSize - 4 && binaryMatrix[i][j+3] !== undefined && val === binaryMatrix[i][j+3]) {
            currentMatch.push({x: i, y:j+3});
            if (j <= cellSize - 5 && binaryMatrix[i][j+4] !== undefined && val === binaryMatrix[i][j+4]) {
                currentMatch.push({x: i, y:j+4});
            }
        }
        currentMatch.forEach(c => cellsToMark.push(c));
        j += currentMatch.length -1;
      }
    }
  }

  let uniqueCells = [];
  cellsToMark.forEach(cell => {
    if (!uniqueCells.find(uc => uc.x === cell.x && uc.y === cell.y)) {
      uniqueCells.push(cell);
    }
  });

  if (uniqueCells.length > 0) {
    matchOccurred = true;
    uniqueCells.forEach(cell => {
      handleMatch(cell.x, cell.y);
    });
  }
  return matchOccurred;
}

function handleMatch(i, j) {
  if (matchTimer[i][j] === -1) {
    matchTimer[i][j] = millis();
    score++;
    updateScoreDisplay();
    animStates[i][j] = 0.1;
  }
}

function generateNewValueAndChar(x, y) {
  let newFontIndex;
  if (fonts.length > 1) {
    do {
      newFontIndex = int(random(fonts.length));
    } while (newFontIndex === binaryMatrix[x][y]);
  } else {
    newFontIndex = 0;
  }
  binaryMatrix[x][y] = newFontIndex;
  characterMatrix[x][y] = random(AVAILABLE_CHARS.split(''));
  animStates[x][y] = 0.5;
}

function updateAnimationStates() {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      if (animStates[i][j] < 1) {
        animStates[i][j] += 0.08;
        if (animStates[i][j] > 1) {
          animStates[i][j] = 1;
        }
      }
    }
  }
}

function swapMatrixValues(x1, y1, x2, y2) {
  let tempFont = binaryMatrix[x1][y1];
  binaryMatrix[x1][y1] = binaryMatrix[x2][y2];
  binaryMatrix[x2][y2] = tempFont;

  let tempChar = characterMatrix[x1][y1];
  characterMatrix[x1][y1] = characterMatrix[x2][y2];
  characterMatrix[x2][y2] = tempChar;

  let tempAnim = animStates[x1][y1];
  animStates[x1][y1] = animStates[x2][y2];
  animStates[x2][y2] = tempAnim;

  let tempTimer = matchTimer[x1][y1];
  matchTimer[x1][y1] = matchTimer[x2][y2];
  matchTimer[x2][y2] = tempTimer;
}

function windowResized() {
    if (!canvasContainerElement) {
        console.warn("windowResized: canvasContainerElement is not defined. Retrying...");
        canvasContainerElement = document.getElementById('canvas-container');
        if (!canvasContainerElement) {
             let defaultSize = Math.min(window.innerWidth, window.innerHeight) * 0.5;
             resizeCanvas(defaultSize, defaultSize);
             console.error("CRITICAL: Canvas container NOT FOUND. Using small fallback canvas size.");
             wTile = width / cellSize;
             hTile = height / cellSize;
             return;
        }
    }

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let headerElement = document.querySelector('.game-header');
    let bottomUiElement = document.querySelector('.game-ui-bottom');
    let gameWrapperElement = document.querySelector('.game-wrapper'); // Get the wrapper

    let headerHeight = headerElement ? headerElement.offsetHeight : 0;
    let bottomUiHeight = bottomUiElement ? bottomUiElement.offsetHeight : 0;
    
    // Get computed styles for margins and paddings
    let bodyStyle = getComputedStyle(document.body);
    let wrapperStyle = getComputedStyle(gameWrapperElement);
    let headerStyle = getComputedStyle(headerElement);

    let bodyPaddingTop = parseFloat(bodyStyle.paddingTop) || 0;
    let bodyPaddingBottom = parseFloat(bodyStyle.paddingBottom) || 0;
    let bodyPaddingLeft = parseFloat(bodyStyle.paddingLeft) || 0;
    let bodyPaddingRight = parseFloat(bodyStyle.paddingRight) || 0;

    let wrapperMarginBottom = parseFloat(wrapperStyle.marginBottom) || 0;
    let headerMarginBottom = parseFloat(headerStyle.marginBottom) || 0;

    // Available height for the .game-wrapper (which contains the canvas container)
    let availableHeightForGameWrapper = viewportHeight - headerHeight - bottomUiHeight - bodyPaddingTop - bodyPaddingBottom - wrapperMarginBottom - headerMarginBottom - 20; // -20 for extra safety margin

    // Available width for the .game-wrapper
    let availableWidthForGameWrapper = viewportWidth - bodyPaddingLeft - bodyPaddingRight;

    // The canvas will be square, so we base its size on the minimum of the available space for its direct parent (.game-wrapper content area)
    let canvasTargetSize = Math.min(availableWidthForGameWrapper, availableHeightForGameWrapper);
    
    canvasTargetSize *= 0.95; // Aim to use 95% of this available space

    let minCanvasSize = 350;
    let maxCanvasSize = 1200; // Allow it to get quite large on big screens

    let finalCanvasSize = Math.max(minCanvasSize, canvasTargetSize);
    finalCanvasSize = Math.min(finalCanvasSize, maxCanvasSize);
    // Ensure it doesn't exceed viewport dimensions with some margin
    finalCanvasSize = Math.min(finalCanvasSize, viewportWidth * 0.92, viewportHeight * 0.85);


    if (finalCanvasSize <= 0 || isNaN(finalCanvasSize)) {
        console.warn("Calculated canvasSize is invalid:", finalCanvasSize, "Using fallback.");
        finalCanvasSize = 400; // Safe fallback
    }

    resizeCanvas(finalCanvasSize, finalCanvasSize);

    wTile = width / cellSize;
    hTile = height / cellSize;

    // Optional: Adjust max-width of header and bottom UI to match canvas width for visual consistency
    if (headerElement) headerElement.style.maxWidth = finalCanvasSize + 'px';
    if (bottomUiElement) bottomUiElement.style.maxWidth = finalCanvasSize + 'px';
}