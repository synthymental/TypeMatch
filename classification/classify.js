let video;
let detector;
let detections = {};
let idCount = 0;

let isModelReady = false;
let isVideoReady = false;

function modelIsReady() {
  console.log('Модель детектора объектов загружена!');
  isModelReady = true;
  startDetectionIfAllReady();
}

function videoFeedIsReady() {
  console.log('Видеопоток готов и загрузил данные!');
  isVideoReady = true;
  startDetectionIfAllReady();
}

function startDetectionIfAllReady() {
  if (isModelReady && isVideoReady) {
    console.log('Модель и видео готовы. Начинаем первое обнаружение.');
    detector.detect(video, gotDetections);
  } else {
    if (!isModelReady) console.log('Ожидание загрузки модели...');
    if (!isVideoReady) console.log('Ожидание готовности видеопотока...');
  }
}

function setup() {
  // Используем windowWidth и windowHeight для полноэкранного режима
  createCanvas(windowWidth, windowHeight);

  // Запрашиваем камеру.
  // Для задней камеры телефона (обычно):
  const constraints = {
    video: {
      facingMode: "environment" // "environment" для задней, "user" для передней
    },
    audio: false // Аудио нам не нужно
  };
  // Для передней (селфи) камеры:
  // const constraints = {
  //   video: {
  //     facingMode: "user"
  //   },
  //   audio: false
  // };

  video = createCapture(constraints, videoFeedIsReady);
  video.size(width, height); // Устанавливаем размер видео равным размеру холста
  video.hide(); // Скрываем HTML-элемент видео

  detector = ml5.objectDetector('cocossd', modelIsReady);
}

// Эта функция вызывается, когда размер окна браузера изменяется
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (video) {
    video.size(width, height); // Обновляем размер видео при изменении размера холста
  }
}

function gotDetections(error, results) {
  if (error) {
    console.error("Ошибка в gotDetections:", error);
    return;
  }
  // Ваша логика обработки detections
  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let object of objects) {
      object.taken = false;
    }
  }

  for (let i = 0; i < results.length; i++) {
    let object = results[i];
    let label = object.label;

    if (detections[label]) {
      let existing = detections[label];
      if (existing.length == 0) {
        object.id = idCount;
        idCount++;
        existing.push(object);
        object.timer = 100;
      } else {
        let recordDist = Infinity;
        let closest = null;
        for (let candidate of existing) {
          let d = dist(candidate.x, candidate.y, object.x, object.y);
          if (d < recordDist && !candidate.taken) {
            recordDist = d;
            closest = candidate;
          }
        }
        if (closest) {
          let amt = 0.75;
          closest.x = lerp(object.x, closest.x, amt);
          closest.y = lerp(object.y, closest.y, amt);
          closest.width = lerp(object.width, closest.width, amt);
          closest.height = lerp(object.height, closest.height, amt);
          closest.taken = true;
          closest.timer = 100;
          closest.confidence = object.confidence;
        } else {
          object.id = idCount;
          idCount++;
          existing.push(object);
          object.timer = 100;
        }
      }
    } else {
      object.id = idCount;
      idCount++;
      detections[label] = [object];
      object.timer = 100;
    }
  }

  if (detector && video) {
    detector.detect(video, gotDetections);
  }
}

function draw() {
  if (!video || !isVideoReady) {
    background(0); // Черный фон, пока видео не готово
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Загрузка камеры и модели...", width / 2, height / 2);
    return;
  }
  // Рисуем видео на весь холст
  image(video, 0, 0, width, height);

  // Ваша логика отрисовки bounding boxes
  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let i = objects.length - 1; i >= 0; i--) {
      let object = objects[i];

      if (object.label === 'person') { // Ищем людей
        stroke(0, 255, 0);
        strokeWeight(4);
        noFill();
        // Координаты от ml5.objectDetector могут быть нормализованы (0-1) или в пикселях.
        // Для cocossd они обычно в пикселях относительно оригинального размера видео.
        // Если видео растягивается на весь экран, эти координаты должны быть +/- правильными.
        rect(object.x, object.y, object.width, object.height);

        noStroke();
        fill(255);
        textSize(18); // Можно сделать размер текста адаптивным

        let confidencePercentage = object.confidence ? nf(object.confidence * 100, 0, 1) + "%" : "";
        let labelText = object.label + " " + confidencePercentage;

        let textBgHeight = 22;
        let textBgWidth = textWidth(labelText) + 10;
        let textY = object.y - 5;
        let textX = object.x + 5;
        let textBgY = textY - textBgHeight + 5;

        if (textBgY < 0) {
            textBgY = object.y + 5;
            textY = textBgY + textBgHeight - 5;
        }
        
        fill(0, 255, 0, 180);
        rect(textX - 5, textBgY, textBgWidth, textBgHeight, 3);

        fill(0); // Черный текст
        text(labelText, textX, textY);
      }

      object.timer -= 2; // Ваша логика таймера
      if (object.timer < 0) {
        objects.splice(i, 1);
      }
    }
  }
}