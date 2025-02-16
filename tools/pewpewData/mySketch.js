let video;
let handPose;
let hands = [];

const Engine = Matter.Engine,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

const engine = Engine.create();
const world = engine.world;
const runner = Runner.create();

const boxes = [];
let word = ["P", "E", "W"];
let currentLetterIndex = 0; // Глобальный индекс для выбора буквы
let lastCreatedFrameHand = [];

let sizeSlider, speedSlider, amountSlider;
let sizeLabel, speedLabel, amountLabel;
let inputField, submitButton;

function preload() {
  handPose = ml5.handPose("MoveNet", { flipped: true });
}

function gotHand(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  Runner.run(runner, engine);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(30);
  
  frameRate(60);
  video = createCapture(VIDEO, { flipped: true });
  video.size(1300 / 1.5, 1000 / 1.5);
  video.hide();
  
  // Создание слайдеров и подписи
  sizeLabel = createP("Size:");
  sizeLabel.position(20, 0);
  sizeSlider = createSlider(10, 100, 20, 1);
  sizeSlider.position(20, 40);
  
  speedLabel = createP("Speed:");
  speedLabel.position(20, 55);
  speedSlider = createSlider(5, 30, 10, 1);
  speedSlider.position(20, 90);
	
	amountLabel = createP("Amount:");
  amountLabel.position(20,100);
  amountSlider = createSlider(0, 30, 30, 1);
  amountSlider.position(20, 140);
  
  // Поле ввода и кнопка для смены текста
  inputField = createInput('PEW');
  inputField.position(20,170);
  submitButton = createButton("input");
  submitButton.position(inputField.x + inputField.width + 10, 170);
  submitButton.mousePressed(updateWord);
  
  handPose.detectStart(video, gotHand);
  engine.gravity.y = 1;
}

function updateWord() {
  let newText = inputField.value();
  if (newText.length > 0) {
    word = newText.split("");
    currentLetterIndex = 0;
  }
}

function draw() {
  image(video, 0, 0);
  let newSize = sizeSlider.value();
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].mySize !== newSize) {
      let scaleFactor = newSize / boxes[i].mySize;
      Matter.Body.scale(boxes[i], scaleFactor, scaleFactor);
      boxes[i].mySize = newSize;
    }
  }
  
  // Удаляем боксы, вышедшие за пределы экрана
  for (let i = boxes.length - 1; i >= 0; i--) {
    let pos = boxes[i].position;
    if (pos.x < -50 || pos.x > width + 50 || pos.y < -50 || pos.y > height + 50) {
      Composite.remove(world, boxes[i]);
      boxes.splice(i, 1);
    }
  }
  
  // Обрабатываем каждую обнаруженную руку
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let index = hand.index_finger_tip;
    let middle = hand.index_finger_mcp;
    
    // fill(0, 255, 0);
    // circle(index.x, index.y, 8);
    // circle(middle.x, middle.y, 8);
    
    let d1 = dist(index.x, index.y, middle.x, middle.y);
    let thresholdFrame = 30-amountSlider.value();
    if (lastCreatedFrameHand[i] === undefined) {
      lastCreatedFrameHand[i] = 0;
    }
    if (d1 > 60 && frameCount - lastCreatedFrameHand[i] > thresholdFrame) {
      lastCreatedFrameHand[i] = frameCount;
      
      let dx = index.x - middle.x;
      let dy = index.y - middle.y;
      let vec = createVector(dx, dy).normalize();
      
      let currentSpeedFactor = speedSlider.value();
      let boxSize = sizeSlider.value();
      
      let newBox = Bodies.rectangle(index.x, index.y, boxSize, boxSize, { frictionAir: 0.01 });
      newBox.mySize = boxSize*1.5;
      
      newBox.myLetter = word[currentLetterIndex];
      currentLetterIndex = (currentLetterIndex + 1) % word.length;
    
      Matter.Body.setVelocity(newBox, { x: vec.x * currentSpeedFactor, y: vec.y * currentSpeedFactor });
      
      boxes.push(newBox);
      Composite.add(world, newBox);
    }
  }

  for (let i = 0; i < boxes.length; i++) {
    push();
    translate(boxes[i].position.x, boxes[i].position.y);
    rotate(boxes[i].angle);
    // Устанавливаем размер текста равным размеру бокса
    textSize(boxes[i].mySize);
    fill(255);
    text(boxes[i].myLetter, 0, 0);
    pop();
  }
}
