// Global game variables
let cellSize = 6;
let clickCounter = 0; // Tracks clicks for click-based interaction
let fonts = [];
let fontNames = [
  'Suisse Works Medium', 'Druk Wide Medium', 'Le Murmure',
  'Pilowlava Regular', 'Terminal Grotesque'
];
let binaryMatrix = [], characterMatrix = [], animStates = [], matchTimer = [];
let roundCorner = 30;
let bufferPosX, bufferPosY; // Buffer for first click in click-mode

let score = 0;
let wTile, hTile; // Width and height of each tile

// Animation state for swapping cells
let isAnimating = false;
let startX, startY, endX, endY; // Pixel coordinates for animation start/end points
let animationFrameCount = 0;
let duration = 15; // Duration of swap animation in frames
let matchDelay = 200; // Delay in ms before matched cells are regenerated

// Game timer
const GAME_DURATION_MS = 3 * 60 * 1000; // 3 minutes
let gameStartTime, timeRemaining = GAME_DURATION_MS;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let difficulty = 'hard'; // Default, can be 'easy'
let gameInitialized = false; // True after difficulty is chosen and game setup is complete
const AVAILABLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// --- Variables for Combined Click & Drag ---
let isPotentialClick = false; // True from mousePressed until drag threshold is met or mouseReleased
let hasDraggedFarEnough = false; // True if mouse has moved beyond dragThreshold
let dragThreshold = 8; // Pixels mouse must move to be considered a drag
let mouseDownX, mouseDownY; // Initial mouse position on press
let mouseDownTileX, mouseDownTileY; // Initial TILE position on press

let isDragging = false; // True when actively dragging a cell visual
let draggedCellInfo = null; // Info about the cell being dragged { x, y, originalX, originalY, char, fontIdx }
let dragOffsetX, dragOffsetY; // Offset of mouse cursor from top-left of dragged cell

// Theme variables
let currentTheme = 'dark'; // Initial theme
let themesP5 = {
  light: { background: [228,228,228], cellBackground: [247,247,247], cellHighlight: [0,163,255], cellSelected: [255,42,42], textColor: [0,0,0], matchedCellColor: [255,100,100] },
  dark:  { background: [30,30,30],   cellBackground: [50,50,50],   cellHighlight: [0,200,255], cellSelected: [255,90,90], textColor: [220,220,220], matchedCellColor: [180,50,50] }
};
let activeP5Theme = themesP5.dark;

// DOM Element references
let canvasContainerElement;
let timerDisplayElement, scoreDisplayElement, themeToggleButtonElement, fontInfoContainerElement;
let startScreenElement, gameContainerElement, easyButton, hardButton;

function preload() {
  fonts[0] = loadFont('tmAssets/fonts/Suisse-Works-Medium.otf');
  fonts[1] = loadFont('tmAssets/fonts/Druk-Wide-Medium-Desktop.otf');
  fonts[2] = loadFont('tmAssets/fonts/le-murmure.ttf');
  fonts[3] = loadFont('tmAssets/fonts/Pilowlava-Regular.otf');
  fonts[4] = loadFont('tmAssets/fonts/terminal-grotesque.ttf');
}

function setup() {
  startScreenElement = document.getElementById('startScreen');
  gameContainerElement = document.getElementById('gameContainer');
  easyButton = document.getElementById('easyButton');
  hardButton = document.getElementById('hardButton');
  canvasContainerElement = document.getElementById('canvas-container');

  let cnv = createCanvas(1, 1); // Minimal canvas, hidden initially
  if (canvasContainerElement) cnv.parent(canvasContainerElement);
  noLoop(); // Don't start draw loop until game starts

  if (easyButton) easyButton.addEventListener('click', () => startGameSetup('easy'));
  if (hardButton) hardButton.addEventListener('click', () => startGameSetup('hard'));

  timerDisplayElement = document.getElementById('timerDisplay');
  scoreDisplayElement = document.getElementById('scoreDisplay');
  themeToggleButtonElement = document.getElementById('themeToggleButton');
  fontInfoContainerElement = document.getElementById('fontInfoContainer');

  if (themeToggleButtonElement) {
    themeToggleButtonElement.addEventListener('click', () => {
      // Allow theme change even on start screen, but p5 canvas theme applies after game starts
      currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
      applyTheme();
    });
  }
  applyTheme(); // Apply initial body class and button icon based on default currentTheme
}

function startGameSetup(chosenDifficulty) {
  difficulty = chosenDifficulty;
  gameInitialized = true;
  gameState = 'playing';

  if (startScreenElement) startScreenElement.style.display = 'none';
  if (gameContainerElement) gameContainerElement.style.display = 'flex';

  textAlign(CENTER, CENTER);

  // Initialize game board
  for (let i = 0; i < cellSize; i++) {
    binaryMatrix[i] = []; characterMatrix[i] = []; animStates[i] = []; matchTimer[i] = [];
    for (let j = 0; j < cellSize; j++) {
      binaryMatrix[i][j] = int(random(fonts.length));
      characterMatrix[i][j] = (difficulty === 'easy') ? 'A' : random(AVAILABLE_CHARS.split(''));
      animStates[i][j] = 1; matchTimer[i][j] = -1;
    }
  }

  // Reset game state variables
  gameStartTime = millis();
  timeRemaining = GAME_DURATION_MS;
  score = 0;
  clickCounter = 0; // Reset click counter for the new game
  bufferPosX = undefined; bufferPosY = undefined; // Clear click buffer

  updateScoreDisplay();
  updateGameTimer(); // Display initial 03:00 or current timeRemaining
  applyTheme(); // Ensure p5 theme matches currentTheme
  populateFontInfo();

  setTimeout(windowResized, 60); // Allow DOM to settle, then size canvas properly
  loop(); // Start p5 draw loop
}

function applyTheme() {
  activeP5Theme = themesP5[currentTheme];
  document.body.classList.toggle('dark-theme', currentTheme === 'dark');
  if (themeToggleButtonElement) {
    themeToggleButtonElement.innerText = (currentTheme === 'light') ? "🌙" : "☀️";
  }
}

function populateFontInfo() {
  if (!fontInfoContainerElement || !fonts.length) return;
  let htmlContent = '<p class="font-info-title">Fonts in Game:</p>';
  fontNames.forEach(name => {
    htmlContent += `<p style="font-family: '${name}', sans-serif;">${name}</p>`;
  });
  fontInfoContainerElement.innerHTML = htmlContent;
}

function updateScoreDisplay() {
  if (scoreDisplayElement) scoreDisplayElement.innerText = "Score: " + score;
}

function draw() {
  if (!gameInitialized || gameState === 'start') return; // Don't draw if game hasn't fully started
  background(activeP5Theme.background);

  if (gameState === 'playing') {
    updateGameTimer();
    // Process matched cells for regeneration
    for (let i = 0; i < cellSize; i++) {
      for (let j = 0; j < cellSize; j++) {
        if (matchTimer[i][j] !== -1 && millis() - matchTimer[i][j] > matchDelay) {
          generateNewValueAndChar(i, j);
          matchTimer[i][j] = -1;
        }
      }
    }
    updateAnimationStates(); // Handle cell appearance/disappearance animations

    if (isAnimating) {
      animateSwap();
    } else {
      checkMatchesAndUpdateScore();
      // Draw grid, excluding the cell being dragged from its original spot if dragging
      displayGrid(isDragging && draggedCellInfo ? draggedCellInfo.x : -1, isDragging && draggedCellInfo ? draggedCellInfo.y : -1);
       // Add visual highlight for the first clicked cell if clickCounter is 1 and not dragging
      if (clickCounter === 1 && bufferPosX !== undefined && !isDragging) {
          highlightFirstClick();
      }
    }
  } else if (gameState === 'gameOver') {
    displayGrid(); // Show final state of the grid
    displayGameOverScreenOnCanvas();
  }

  // Draw the dragged cell on top if currently dragging
  if (isDragging && draggedCellInfo) {
    push();
    let currentDragX = mouseX - dragOffsetX;
    let currentDragY = mouseY - dragOffsetY;
    fill(activeP5Theme.cellBackground[0], activeP5Theme.cellBackground[1], activeP5Theme.cellBackground[2], 200);
    noStroke();
    rect(currentDragX, currentDragY, wTile, hTile, roundCorner * 0.8);
    drawLetterInCell(draggedCellInfo.char, draggedCellInfo.fontIdx, currentDragX, currentDragY, wTile, hTile);
    pop();
  }
}

function highlightFirstClick() {
    if (bufferPosX === undefined || bufferPosY === undefined) return;
    push();
    noFill();
    strokeWeight(max(2, width * 0.005));
    stroke(activeP5Theme.cellSelected);
    let tilePadding = max(2, width * 0.005);
    let corner = roundCorner * (wTile / (800 / cellSize)) * 0.8;
    rect(bufferPosX * wTile + tilePadding, bufferPosY * hTile + tilePadding,
         wTile - 2 * tilePadding, hTile - 2 * tilePadding, corner);
    pop();
}

function updateGameTimer() {
  if (gameState !== 'playing') {
    if (timeRemaining <= 0 && timerDisplayElement) timerDisplayElement.innerText = "00:00";
    return;
  }
  timeRemaining = GAME_DURATION_MS - (millis() - gameStartTime);
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    gameState = 'gameOver';
    if (timerDisplayElement) timerDisplayElement.innerText = "00:00";
  } else if (timerDisplayElement) {
    let minutes = floor(timeRemaining / 60000);
    let seconds = floor((timeRemaining % 60000) / 1000);
    timerDisplayElement.innerText = nf(minutes, 2) + ":" + nf(seconds, 2);
  }
}

function displayGameOverScreenOnCanvas() {
  push();
  rectMode(CENTER); textAlign(CENTER, CENTER);
  fill(activeP5Theme.cellBackground[0], activeP5Theme.cellBackground[1], activeP5Theme.cellBackground[2], 230);
  noStroke();
  rect(width / 2, height / 2, width * 0.8, height * 0.5, roundCorner * 0.7);
  textFont(fonts[0] || 'Arial'); textSize(min(width, height) * 0.08); fill(activeP5Theme.textColor);
  text("Game Over!", width / 2, height / 2 - min(width, height) * 0.07);
  textFont(fonts[1] || 'Arial'); textSize(min(width, height) * 0.06);
  text("Your Score: " + score, width / 2, height / 2 + min(width, height) * 0.03);
  textFont('Arial'); textSize(min(width, height) * 0.03);
  text("Refresh the page to play again", width / 2, height / 2 + min(width, height) * 0.12);
  pop();
}

function drawLetterInCell(char, fontIndex, cellPixelX, cellPixelY, cellW, cellH, scaleFactor = 1) {
  push();
  fill(activeP5Theme.textColor);
  textFont(fonts[fontIndex]);
  let baseTextSize = min(cellW, cellH) * 0.65;
  let charTextSize = baseTextSize * scaleFactor;
  textSize(charTextSize);
  let yOffset = charTextSize * 0.05;
  text(char, cellPixelX + cellW / 2, cellPixelY + cellH / 2 - yOffset);
  pop();
}

function displayGrid(excludeX = -1, excludeY = -1) {
  for (let i = 0; i < cellSize; i++) {
    for (let j = 0; j < cellSize; j++) {
      if (i === excludeX && j === excludeY && isDragging) continue;

      let cTW = wTile, cTH = hTile, sc = animStates[i][j];
      let rP = max(1, cTW * 0.02);
      let rSW = sc * (cTW - 2 * rP), rSH = sc * (cTH - 2 * rP);
      let rX = i * cTW + (cTW - rSW) / 2, rY = j * cTH + (cTH - rSH) / 2;
      let corn = roundCorner * sc * (cTW / (800 / cellSize)) * 0.8;
      noStroke();
      if (matchTimer[i][j] !== -1 && gameState === 'playing') { fill(activeP5Theme.matchedCellColor); }
      else { fill(activeP5Theme.cellBackground); }
      rect(rX, rY, rSW, rSH, corn);
      if (sc > 0.5) {
        drawLetterInCell(characterMatrix[i][j], binaryMatrix[i][j], i * cTW, j * cTH, cTW, cTH, sc);
      }
    }
  }
}

function displayCell(i, j) {
  let cTW = wTile, cTH = hTile, sc = animStates[i][j];
  let rP = max(1, cTW * 0.02);
  let rSW = sc * (cTW - 2 * rP), rSH = sc * (cTH - 2 * rP);
  let rX = i * cTW + (cTW - rSW) / 2, rY = j * cTH + (cTH - rSH) / 2;
  let corn = roundCorner * sc * (cTW / (800 / cellSize)) * 0.8;
  noStroke(); fill(activeP5Theme.cellBackground);
  rect(rX, rY, rSW, rSH, corn);
  if (sc > 0.5) {
    drawLetterInCell(characterMatrix[i][j], binaryMatrix[i][j], i * cTW, j * cTH, cTW, cTH, sc);
  }
}

function displayMovingCell(matrixIndexX, matrixIndexY, currentPixelX, currentPixelY) {
  let cTW = wTile, cTH = hTile, sc = 1;
  let rP = max(1, cTW * 0.02);
  let rSW = sc * (cTW - 2 * rP), rSH = sc * (cTH - 2 * rP);
  let rX = currentPixelX + (cTW - rSW) / 2, rY = currentPixelY + (cTH - rSH) / 2;
  let corn = roundCorner * sc * (cTW / (800 / cellSize)) * 0.8;
  noStroke(); fill(activeP5Theme.cellBackground);
  rect(rX, rY, rSW, rSH, corn);
  drawLetterInCell(characterMatrix[matrixIndexX][matrixIndexY], binaryMatrix[matrixIndexX][matrixIndexY], currentPixelX, currentPixelY, cTW, cTH, sc);
}

// --- Combined Click & Drag Mouse Logic ---
function mousePressed() {
  if (!gameInitialized || gameState !== 'playing' || isAnimating) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  mouseDownTileX = floor(mouseX / wTile);
  mouseDownTileY = floor(mouseY / hTile);

  if (mouseDownTileX < 0 || mouseDownTileX >= cellSize || mouseDownTileY < 0 || mouseDownTileY >= cellSize) return;

  isPotentialClick = true;
  hasDraggedFarEnough = false;
  mouseDownX = mouseX;
  mouseDownY = mouseY;

  draggedCellInfo = {
    x: mouseDownTileX, y: mouseDownTileY,
    originalX: mouseDownTileX * wTile, originalY: mouseDownTileY * hTile,
    char: characterMatrix[mouseDownTileX][mouseDownTileY],
    fontIdx: binaryMatrix[mouseDownTileX][mouseDownTileY]
  };
  dragOffsetX = mouseX - draggedCellInfo.originalX;
  dragOffsetY = mouseY - draggedCellInfo.originalY;
}

function mouseDragged() {
  if (!gameInitialized || !isPotentialClick || isAnimating) return; // also check isAnimating

  let dx = mouseX - mouseDownX;
  let dy = mouseY - mouseDownY;
  if (!hasDraggedFarEnough && sqrt(dx * dx + dy * dy) > dragThreshold) {
    hasDraggedFarEnough = true;
    isDragging = true;
    isPotentialClick = false;
    clickCounter = 0; // Reset click state if it becomes a drag
    bufferPosX = undefined; bufferPosY = undefined; // Clear click buffer
  }
  return false;
}

function mouseReleased() {
  if (!gameInitialized || gameState !== 'playing' || isAnimating) {
    resetInteractionState();
    return;
  }

  let releaseTileX = floor(mouseX / wTile);
  let releaseTileY = floor(mouseY / hTile);

  if (isDragging && hasDraggedFarEnough) { // Process as Drag End
    if (draggedCellInfo &&
        releaseTileX >= 0 && releaseTileX < cellSize &&
        releaseTileY >= 0 && releaseTileY < cellSize &&
        (draggedCellInfo.x !== releaseTileX || draggedCellInfo.y !== releaseTileY) &&
        (abs(draggedCellInfo.x - releaseTileX) + abs(draggedCellInfo.y - releaseTileY) === 1)) {
      startX = draggedCellInfo.originalX; startY = draggedCellInfo.originalY;
      endX = releaseTileX * wTile; endY = releaseTileY * hTile;
      isAnimating = true; animationFrameCount = 0;
    }
  } else if (isPotentialClick) { // Process as Click (used mouseDownTileX/Y as the click location)
    clickCounter++;
    if (clickCounter === 1) {
      bufferPosX = mouseDownTileX;
      bufferPosY = mouseDownTileY;
    } else if (clickCounter === 2) {
      if (bufferPosX !== undefined &&
          (abs(bufferPosX - mouseDownTileX) + abs(bufferPosY - mouseDownTileY) === 1)) {
        // Second click is on an adjacent cell to the buffered one
        startX = bufferPosX * wTile;       startY = bufferPosY * hTile;
        endX = mouseDownTileX * wTile;     endY = mouseDownTileY * hTile;
        isAnimating = true; animationFrameCount = 0;
        // clickCounter and buffer will be reset in animateSwap
      } else if (bufferPosX !== undefined && mouseDownTileX === bufferPosX && mouseDownTileY === bufferPosY) {
        // Clicked the same cell again - deselect
        clickCounter = 0;
        bufferPosX = undefined; bufferPosY = undefined;
      } else {
        // Second click is not adjacent or first was invalid. Treat as new first click.
        clickCounter = 1;
        bufferPosX = mouseDownTileX;
        bufferPosY = mouseDownTileY;
      }
    }
  }
  resetInteractionState();
}

function resetInteractionState() {
  isPotentialClick = false;
  hasDraggedFarEnough = false;
  isDragging = false;
  draggedCellInfo = null;
  // clickCounter and bufferPosX/Y are managed by click logic and animateSwap
}

function animateSwap() {
  let t = easing(float(animationFrameCount) / duration);
  let cX1 = lerp(startX, endX, t), cY1 = lerp(startY, endY, t);
  let cX2 = lerp(endX, startX, t), cY2 = lerp(endY, startY, t);

  displayGrid(); // Draw full grid, moving cells will draw over

  displayMovingCell(floor(startX / wTile), floor(startY / hTile), cX1, cY1);
  displayMovingCell(floor(endX / wTile), floor(endY / hTile), cX2, cY2);

  animationFrameCount++;
  if (animationFrameCount > duration) {
    swapMatrixValues(floor(startX / wTile), floor(startY / hTile), floor(endX / wTile), floor(endY / hTile));
    isAnimating = false;
    clickCounter = 0;
    bufferPosX = undefined; bufferPosY = undefined;
    checkMatchesAndUpdateScore();
  }
}

function easing(t) { return t * (2 - t); }

function checkMatchesAndUpdateScore() {
  let matchOccurred = false; let cellsToMark = [];
  for(let j=0;j<cellSize;j++){for(let i=0;i<=cellSize-3;){
    if(!binaryMatrix[i+1]||!binaryMatrix[i+2]){i++;continue;}
    let val=binaryMatrix[i][j];
    if(val===binaryMatrix[i+1][j]&&val===binaryMatrix[i+2][j]){
      let cM=[{x:i,y:j},{x:i+1,y:j},{x:i+2,y:j}];
      if(i<=cellSize-4&&binaryMatrix[i+3]&&val===binaryMatrix[i+3][j]){
        cM.push({x:i+3,y:j});
        if(i<=cellSize-5&&binaryMatrix[i+4]&&val===binaryMatrix[i+4][j]){cM.push({x:i+4,y:j});}
      } cM.forEach(c=>cellsToMark.push(c));i+=cM.length;
    }else{i++;}
  }}
  for(let i=0;i<cellSize;i++){for(let j=0;j<=cellSize-3;){
    if(binaryMatrix[i][j+1]===undefined||binaryMatrix[i][j+2]===undefined){j++;continue;}
    let val=binaryMatrix[i][j];
    if(val===binaryMatrix[i][j+1]&&val===binaryMatrix[i][j+2]){
      let cM=[{x:i,y:j},{x:i,y:j+1},{x:i,y:j+2}];
      if(j<=cellSize-4&&binaryMatrix[i][j+3]!==undefined&&val===binaryMatrix[i][j+3]){
        cM.push({x:i,y:j+3});
        if(j<=cellSize-5&&binaryMatrix[i][j+4]!==undefined&&val===binaryMatrix[i][j+4]){cM.push({x:i,y:j+4});}
      } cM.forEach(c=>cellsToMark.push(c));j+=cM.length;
    }else{j++;}
  }}
  let uniqueCells=[];cellsToMark.forEach(cell=>{if(!uniqueCells.find(uc=>uc.x===cell.x&&uc.y===cell.y))uniqueCells.push(cell);});
  if(uniqueCells.length>0){matchOccurred=true;uniqueCells.forEach(cell=>handleMatch(cell.x,cell.y));}
  return matchOccurred;
}

function handleMatch(i, j) {
  if(matchTimer[i][j]===-1){matchTimer[i][j]=millis();score++;updateScoreDisplay();animStates[i][j]=0.1;}
}

function generateNewValueAndChar(x, y) {
  let nFI; if(fonts.length>1){do{nFI=int(random(fonts.length));}while(nFI===binaryMatrix[x][y]&&fonts.length>1);}else{nFI=0;}
  binaryMatrix[x][y]=nFI; characterMatrix[x][y]=(difficulty==='easy')?'A':random(AVAILABLE_CHARS.split('')); animStates[x][y]=0.5;
}

function updateAnimationStates() {
  for(let i=0;i<cellSize;i++){for(let j=0;j<cellSize;j++){if(animStates[i][j]<1){animStates[i][j]+=0.08;if(animStates[i][j]>1)animStates[i][j]=1;}}}
}

function swapMatrixValues(x1, y1, x2, y2) {
  [binaryMatrix[x1][y1],binaryMatrix[x2][y2]]=[binaryMatrix[x2][y2],binaryMatrix[x1][y1]];
  [characterMatrix[x1][y1],characterMatrix[x2][y2]]=[characterMatrix[x2][y2],characterMatrix[x1][y1]];
  [animStates[x1][y1],animStates[x2][y2]]=[animStates[x2][y2],animStates[x1][y1]];
  [matchTimer[x1][y1],matchTimer[x2][y2]]=[matchTimer[x2][y2],matchTimer[x1][y1]];
}

function windowResized() {
    if(!canvasContainerElement){canvasContainerElement=document.getElementById('canvas-container');if(!canvasContainerElement){let dS=Math.min(window.innerWidth,window.innerHeight)*0.5;resizeCanvas(dS,dS);console.error("CRITICAL: Canvas container NOT FOUND. Using small fallback.");wTile=width/cellSize;hTile=height/cellSize;return;}}
    let vW=window.innerWidth,vH=window.innerHeight;let hE=document.querySelector('.game-header'),bUE=document.querySelector('.game-ui-bottom'),gWE=document.querySelector('.game-wrapper');
    let hH=hE?hE.offsetHeight:0;let bUH=bUE?bUE.offsetHeight:0;
    let bS=getComputedStyle(document.body),wS=gWE?getComputedStyle(gWE):{paddingLeft:'0px',paddingRight:'0px',paddingTop:'0px',paddingBottom:'0px',marginBottom:'0px'},hS=hE?getComputedStyle(hE):{marginBottom:'0px'};
    let bPT=parseFloat(bS.paddingTop)||0,bPB=parseFloat(bS.paddingBottom)||0,bPL=parseFloat(bS.paddingLeft)||0,bPR=parseFloat(bS.paddingRight)||0;
    let wMB=parseFloat(wS.marginBottom)||0,hMB=parseFloat(hS.marginBottom)||0;
    let aHGW=vH-hH-bUH-bPT-bPB-wMB-hMB-20;let aWGW=vW-bPL-bPR;
    aWGW-=(parseFloat(wS.paddingLeft)||0)+(parseFloat(wS.paddingRight)||0);aHGW-=(parseFloat(wS.paddingTop)||0)+(parseFloat(wS.paddingBottom)||0);
    let cTS=Math.min(aWGW,aHGW);cTS*=0.96;
    let minCS=350,maxCS=1200;let fCS=Math.max(minCS,cTS);fCS=Math.min(fCS,maxCS);fCS=Math.min(fCS,vW*0.92,vH*0.82);
    if(fCS<=0||isNaN(fCS)){console.warn("Calculated canvasSize invalid:",fCS,"Using fallback 400px.");fCS=400;}
    resizeCanvas(fCS,fCS);wTile=width/cellSize;hTile=height/cellSize;
    if(hE)hE.style.maxWidth=fCS+'px';if(bUE)bUE.style.maxWidth=fCS+'px';
}