// Глобальные переменные для p5.js, Matter.js и ml5.js
let video;
let handPose;
let hands = [];

// Matter.js
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

//Получаем ссылки на существующие элементы из HTML
let sizeRange = document.getElementById('sizeRange');
let speedRange = document.getElementById('speedRange');
let amountRange = document.getElementById('amountRange');
let gravityRange = document.getElementById('gravityRange');
let textInput = document.getElementById('textInput');
let arrowButton = document.querySelector('.arrow-button');



function preload() {
  handPose = ml5.handPose({ flipped: true });
}
function gotHand(results) {
  hands = results;
}

function setup() {

  let cnv = createCanvas(700, 700);
  cnv.parent('canvasContainer');
  //background(200);

  Runner.run(runner, engine);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(30);
  frameRate(60);

  video = createCapture(VIDEO, { flipped: true });
  video.size(900, 700);
  video.hide();

  handPose.detectStart(video, gotHand);

  arrowButton.addEventListener('click', updateWord);
}

function updateWord() {
  let newText = textInput.value;
  if (newText.length > 0) {
    word = newText.split("");
    currentLetterIndex = 0;
  }
  console.log('Кнопка нажата!');
}

function draw() {
translate(-80,0);
  image(video, 0, 0);


  //Получаем значения из слайдеров
  let sizeValue = parseFloat(sizeRange.value);
  let speedValue = parseFloat(speedRange.value);
  let amountValue = parseFloat(amountRange.value);
  let gravityValue = parseFloat(gravityRange.value);

  // let sizeRange = 50;
  // let speedRange = 50;
  // let amountRange = 50;
  // let gravityRange = 1;


  engine.gravity.y = gravityValue;

  // Обновляем размеры боксов
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].mySize !== sizeValue) {
      let scaleFactor = sizeValue / boxes[i].mySize;
      Matter.Body.scale(boxes[i], scaleFactor, scaleFactor);
      boxes[i].mySize = sizeValue;
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

  // Обрабатываем обнаруженные руки и создаём боксы с буквами
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let index = hand.index_finger_tip;
    let middle = hand.index_finger_mcp;

    let d1 = dist(index.x, index.y, middle.x, middle.y);
    let thresholdFrame = 30 - amountValue;
    if (lastCreatedFrameHand[i] === undefined) {
      lastCreatedFrameHand[i] = 0;
    }
    if (d1 > 60 && frameCount - lastCreatedFrameHand[i] > thresholdFrame) {
      lastCreatedFrameHand[i] = frameCount;

      let dx = index.x - middle.x;
      let dy = index.y - middle.y;
      let vec = createVector(dx, dy).normalize();

      let currentSpeedFactor = speedValue;
      let boxSize = sizeValue;

      let newBox = Bodies.rectangle(index.x, index.y, boxSize, boxSize, { frictionAir: 0.01 });
      newBox.mySize = boxSize * 1.5;

      newBox.myLetter = word[currentLetterIndex];
      currentLetterIndex = (currentLetterIndex + 1) % word.length;

      Matter.Body.setVelocity(newBox, { x: vec.x * currentSpeedFactor, y: vec.y * currentSpeedFactor });

      boxes.push(newBox);
      Composite.add(world, newBox);
    }
  }

  // Рисуем боксы с буквами
  for (let i = 0; i < boxes.length; i++) {
    push();
    translate(boxes[i].position.x, boxes[i].position.y);
    rotate(boxes[i].angle);
    textSize(boxes[i].mySize);
    fill(255);
    text(boxes[i].myLetter, 0, 0);
    pop();
  }
}