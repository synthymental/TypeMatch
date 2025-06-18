let video;
let detector;
let detections = []; // Упростим detections до простого массива результатов для этого примера
// let detections = {}; // Если вы хотите вернуть свою сложную систему, ее нужно будет адаптировать
// let idCount = 0;

let isModelReady = false;
let isVideoReady = false;

// Переменные для корректной отрисовки видео
let drawVideoX = 0;
let drawVideoY = 0;
let drawVideoWidth = 0;
let drawVideoHeight = 0;

function modelIsReady() {
  console.log('Модель детектора объектов загружена!');
  isModelReady = true;
  startDetectionIfAllReady();
}

function videoFeedIsReady() {
  console.log('Видеопоток готов и загрузил данные!');
  console.log('Оригинальные размеры видео:', video.elt.videoWidth, video.elt.videoHeight);
  isVideoReady = true;
  calculateVideoDrawParameters(); // Рассчитаем параметры отрисовки после готовности видео
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

// Рассчитывает параметры для отрисовки видео с сохранением пропорций
function calculateVideoDrawParameters() {
  if (!video || !video.elt || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) {
    console.warn("Размеры видео еще недоступны для расчета параметров отрисовки.");
    return;
  }

  let videoW = video.elt.videoWidth;   // Фактическая ширина видеопотока
  let videoH = video.elt.videoHeight;  // Фактическая высота видеопотока

  let canvasW = width;   // Ширина холста (windowWidth)
  let canvasH = height;  // Высота холста (windowHeight)

  let canvasRatio = canvasW / canvasH;
  let videoRatio = videoW / videoH;

  if (videoRatio > canvasRatio) {
    // Видео шире, чем холст. Масштабируем по ширине холста.
    drawVideoWidth = canvasW;
    drawVideoHeight = canvasW / videoRatio;
  } else {
    // Видео выше (или такое же соотношение), чем холст. Масштабируем по высоте холста.
    drawVideoHeight = canvasH;
    drawVideoWidth = canvasH * videoRatio;
  }

  // Центрируем видео на холсте
  drawVideoX = (canvasW - drawVideoWidth) / 2;
  drawVideoY = (canvasH - drawVideoHeight) / 2;

  // console.log(`Canvas: ${canvasW}x${canvasH}, Video Original: ${videoW}x${videoH}`);
  // console.log(`Draw Params: X=${drawVideoX}, Y=${drawVideoY}, W=${drawVideoWidth}, H=${drawVideoHeight}`);
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  // pixelDensity(1); // Можно раскомментировать для отладки на устройствах с высокой плотностью

  const constraints = {
    video: {
      facingMode: "environment" // Задняя камера
      // Для отладки на ПК можно убрать facingMode или использовать video: true
      // width: { ideal: 1280 }, // Можно попробовать запросить определенное разрешение
      // height: { ideal: 720 }
    },
    audio: false
  };

  video = createCapture(constraints, () => {
    // Коллбэк createCapture вызывается, когда поток получен.
    // video.elt.onloadedmetadata гарантирует, что videoWidth/videoHeight доступны.
    video.elt.onloadedmetadata = () => {
      videoFeedIsReady();
    };
    // На некоторых системах videoFeedIsReady может быть вызван и без onloadedmetadata,
    // если данные уже доступны. Для надежности используем onloadedmetadata.
    // Если onloadedmetadata не срабатывает, можно попробовать вызвать videoFeedIsReady здесь
    // с проверкой video.elt.videoWidth > 0
    if (video.elt.videoWidth > 0) {
        videoFeedIsReady(); // Попытка на случай, если onloadedmetadata не вызовется, а данные есть
    }
  });
  video.hide();

  detector = ml5.objectDetector('cocossd', modelIsReady);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (isVideoReady) { // Пересчитываем параметры только если видео уже было инициализировано
    calculateVideoDrawParameters();
  }
}

function gotDetections(error, results) {
  if (error) {
    console.error("Ошибка в gotDetections:", error);
    // detector.detect(video, gotDetections); // Можно попробовать перезапустить, но осторожно
    return;
  }
  detections = results; // Сохраняем результаты (упрощенная версия)

  // Если вы вернете свою систему detections:
  // Ваша логика обновления сложного объекта detections ...

  if (detector && video && isVideoReady) { // Добавил isVideoReady
    detector.detect(video, gotDetections);
  }
}

function draw() {
  background(0); // Заливаем фон черным (или любым другим цветом) для полей

  if (!isVideoReady || !video.elt || video.elt.readyState < video.elt.HAVE_ENOUGH_DATA) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Загрузка камеры и модели...", width / 2, height / 2);
    return;
  }
  
  // Рисуем видео с рассчитанными параметрами
  image(video, drawVideoX, drawVideoY, drawVideoWidth, drawVideoHeight);

  // Отрисовка bounding boxes
  if (detections && detections.length > 0) {
    for (let i = 0; i < detections.length; i++) {
      let object = detections[i];

      if (object.label === 'person') {
        stroke(0, 255, 0);
        strokeWeight(4);
        noFill();

        // Координаты от ml5 (object.x, object.y, object.width, object.height)
        // относятся к оригинальному размеру видеопотока (video.elt.videoWidth, video.elt.videoHeight).
        
        let originalVideoW = video.elt.videoWidth;
        let originalVideoH = video.elt.videoHeight;

        if (originalVideoW === 0 || originalVideoH === 0) continue; // Пропускаем, если размеры еще неизвестны

        // Масштабируем и смещаем координаты из оригинального видео в систему координат холста,
        // учитывая, как видео было отрисовано.
        let displayX = (object.x / originalVideoW) * drawVideoWidth + drawVideoX;
        let displayY = (object.y / originalVideoH) * drawVideoHeight + drawVideoY;
        let displayWidth = (object.width / originalVideoW) * drawVideoWidth;
        let displayHeight = (object.height / originalVideoH) * drawVideoHeight;

        rect(displayX, displayY, displayWidth, displayHeight);

        // Отрисовка текста метки
        noStroke();
        fill(255);
        textSize(18); // Можно сделать размер текста адаптивным

        let confidencePercentage = object.confidence ? nf(object.confidence * 100, 0, 1) + "%" : "";
        let labelText = object.label + " " + confidencePercentage;

        let textBgHeight = 22;
        let textBgWidth = textWidth(labelText) + 10;
        let textY = displayY - 5; // Позиционируем относительно displayY
        let textX = displayX + 5; // Позиционируем относительно displayX
        let textBgY = textY - textBgHeight + 5;

        // Убедимся, что текст не выходит за пределы отрисованного видео сверху
        if (textBgY < drawVideoY) {
            textBgY = displayY + 5; // Внутри рамки сверху
            if (textBgY + textBgHeight > displayY + displayHeight) { // Если не помещается, то чуть ниже рамки
                 textBgY = displayY + displayHeight + 5;
            }
            textY = textBgY + textBgHeight - 8; // Скорректировать Y для текста
        }
        
        fill(0, 255, 0, 180);
        rect(textX - 5, textBgY, textBgWidth, textBgHeight, 3);

        fill(0); // Черный текст
        text(labelText, textX, textY);
      }
    }
  }

  // Если вы вернете свою систему detections с таймерами:
  /*
  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let i = objects.length - 1; i >= 0; i--) {
      let currentObject = objects[i]; // Используйте другое имя переменной
      currentObject.timer -= 2;
      if (currentObject.timer < 0) {
        objects.splice(i, 1);
      }
    }
  }
  */
}