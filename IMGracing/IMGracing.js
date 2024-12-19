let p, force, rot;
let dir = -33;
let s = 0;
let imgW, imgH;

let btnSave;
let importIMG;

function preload() {
  img = loadImage('img/car2.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  //background(0);

  btnSave = select('#savePNG');
  btnSave.mousePressed(btnSaverPNG);

  importIMG = select('#importIMG');
  importIMG.mousePressed(importImg);


  p = createVector(width / 2, height / 2);
  force = createVector(0, 0);
  rectMode(CENTER);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(80);
  frameRate(60);
  //angleMode(DEGREES);
}

function draw() {

  //if (s<=round(img.width*0.2)) {
  //  s=(-img.width);
  //}

  p.add(force);
  push();
  translate(p.x, p.y);
  rotate(33);
  rotate(dir);
  imgW = img.width+s;
  imgH =img.height+s;
  if (imgW <= 1) {
    imgW=1;
  }
  if (imgH <= 1) {
    imgH=1;
  }
  image(img, 0, 0, imgW, imgH);
  pop();


  if (keyIsDown(87)) {
    let acceleration = p5.Vector.fromAngle(dir, 0.5);
    force.add(acceleration);
  }
  if (keyIsDown(83)) {
    let deceleration = p5.Vector.fromAngle(dir, -0.5);
    force.add(deceleration);
  }
  if (keyIsDown(68)) {
    dir += 0.04;
  }
  if (keyIsDown(65)) {
    dir -= 0.04;
  }

  if (keyIsDown(66)) {
    s -= 2;
  }
  if (keyIsDown(78)) {
    s += 2;
  }

  force.mult(0.96);
}

function btnSaverPNG() {
  saveCanvas('drift', 'png');
}

function importImg() {
  let input = createFileInput(handleFile);
  input.hide();
  input.elt.click();

  function handleFile(file) {
    if (file.type === 'image') {
      let newImg = createImg(file.data, '', '', () => {
        img = loadImage(newImg.elt.src, () => {
          // Вычисляем aspect ratio (соотношение ширины к высоте)
          let aspectRatio = img.height / img.width;
          let newWidth = 100;
          let newHeight = newWidth * aspectRatio;

          // Масштабируем изображение
          img.resize(newWidth, newHeight);
        }
        );
        newImg.remove();
      }
      );
      newImg.hide();
    } else {
    }
  }
}
