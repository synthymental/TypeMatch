let video = null;
let imageSource = null;
let currentObjectURL = null;

let sourceType = null; 
let isModelReady = false;
let isMediaReady = false;
let isProcessing = false;
let isDetecting = false;

let detector;
let detections = [];

let ui = {};
let objectSettings = {};
let showConfidence = true;
let boxStrokeWeight = 1;
let cutoutMode = false;
let showBordersInCutout = true;
let backgroundColor = '#1a1a1a';

const availableObjects = ['person', 'car', 'cat', 'dog', 'bird', 'bicycle', 'motorcycle', 'bus', 'truck', 'traffic light', 'stop sign'];
const defaultColors = ["#FF3860", "#3273DC", "#48C774", "#FFDD57", "#8B46FF", "#FF9933", "#209CEE", "#694028", "#F14668", "#363636", "#00D1B2"];

let mediaRecorder;
let recordedChunks = [];
let canvasElement;

let drawSourceX = 0, drawSourceY = 0, drawSourceWidth = 0, drawSourceHeight = 0;

function modelIsReady() {
    console.log('Model is loaded!');
    isModelReady = true;
    updateStatusText('Model loaded. Select a source.');
}

function mediaIsReady() {
    if ((sourceType === 'webcam' || sourceType === 'file') && (!video.elt || video.elt.readyState < 3)) {
        video.elt.oncanplaythrough = () => mediaIsReady();
        return;
    }
    
    console.log(`${sourceType} is ready!`);
    isMediaReady = true;
    setUIEnabled(true);
    calculateSourceDrawParameters();
    
    if (sourceType === 'image') {
        isDetecting = true;
        detector.detect(imageSource, (err, results) => {
            if (err) console.error(err);
            detections = results || [];
            isDetecting = false;
        });
    }
}

function calculateSourceDrawParameters() {
    if (!isMediaReady) return;
    let sourceW = (sourceType === 'image') ? imageSource.width : video.elt.videoWidth;
    let sourceH = (sourceType === 'image') ? imageSource.height : video.elt.videoHeight;
    let canvasW = width; let canvasH = height;
    let canvasRatio = canvasW / canvasH; let sourceRatio = sourceW / sourceH;
    if (sourceRatio > canvasRatio) {
        drawSourceWidth = canvasW; drawSourceHeight = canvasW / sourceRatio;
    } else {
        drawSourceHeight = canvasH; drawSourceWidth = canvasH * sourceRatio;
    }
    drawSourceX = (canvasW - drawSourceWidth) / 2;
    drawSourceY = (canvasH - drawSourceHeight) / 2;
}

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent(canvasContainer);
    pixelDensity(1);
    canvasElement = canvas.elt;
    detector = ml5.objectDetector('cocossd', modelIsReady);
    setupUI();
    updateStatusText('Loading model...');
}

function setupUI() {
    ui.btnWebcam = select('#btn-webcam');
    ui.btnWebcam.mousePressed(startWebcam);
    ui.videoUpload = select('#video-upload');
    ui.videoUpload.changed(startVideoFile);
    ui.imageUpload = select('#image-upload');
    ui.imageUpload.changed(startImageFile);

    let checkboxesDiv = select('#object-checkboxes');
    const defaultOn = ['person', 'car'];
    availableObjects.forEach((objName, index) => {
        const isChecked = defaultOn.includes(objName);
        objectSettings[objName] = { show: isChecked, color: defaultColors[index % defaultColors.length] };
        const row = createDiv().parent(checkboxesDiv).addClass('object-control-row');
        const checkboxContainer = createCheckbox(` ${objName}`, isChecked).parent(row).addClass('checkbox-label');
        const colorPicker = createColorPicker(objectSettings[objName].color).parent(row);
        if (!isChecked) colorPicker.addClass('hidden');
        checkboxContainer.changed(() => {
            const checked = checkboxContainer.checked();
            objectSettings[objName].show = checked;
            colorPicker.toggleClass('hidden', !checked);
        });
        colorPicker.input(() => { objectSettings[objName].color = colorPicker.value(); });
    });
    
    ui.bgColorPicker = select('#bg-color-picker');
    ui.bgColorPicker.input(() => { backgroundColor = ui.bgColorPicker.value(); });

    ui.strokeSlider = select('#stroke-weight-slider');
    ui.strokeValueLabel = select('#stroke-weight-value');
    ui.strokeSlider.input(() => {
        boxStrokeWeight = ui.strokeSlider.value();
        ui.strokeValueLabel.html(boxStrokeWeight);
    });
    ui.showConfidenceToggle = select('#show-confidence-toggle');
    ui.showConfidenceToggle.changed(() => { showConfidence = ui.showConfidenceToggle.elt.checked; });
    ui.cutoutToggle = select('#cutout-toggle');
    ui.cutoutBorderToggle = select('#cutout-border-toggle');
    ui.cutoutBorderLabel = select('#cutout-border-label');
    ui.cutoutBorderToggle.elt.disabled = true;
    ui.cutoutToggle.changed(() => {
        cutoutMode = ui.cutoutToggle.elt.checked;
        ui.cutoutBorderToggle.elt.disabled = !cutoutMode;
        ui.cutoutBorderLabel.toggleClass('disabled', !cutoutMode);
    });
    ui.cutoutBorderToggle.changed(() => { showBordersInCutout = ui.cutoutBorderToggle.elt.checked; });
    
    ui.btnExportVideo = select('#btn-export-video');
    ui.btnExportVideo.mousePressed(processAndExportVideo);
    ui.btnExportImage = select('#btn-export-image');
    ui.btnExportImage.mousePressed(exportImage);
}

function startWebcam() {
    resetSource();
    sourceType = 'webcam';
    video = createCapture({ video: { facingMode: "environment" }, audio: false }, mediaIsReady);
    video.hide();
    updateStatusText('Starting webcam...');
}

function startVideoFile(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        resetSource();
        sourceType = 'file';
        currentObjectURL = URL.createObjectURL(file);
        video = createVideo(currentObjectURL, mediaIsReady);
        video.hide(); video.loop();
        updateStatusText('Loading video file...');
    }
}

function startImageFile(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        resetSource();
        sourceType = 'image';
        currentObjectURL = URL.createObjectURL(file);
        imageSource = loadImage(currentObjectURL, mediaIsReady);
        updateStatusText('Loading image...');
    }
}

function resetSource() {
    if (video) { video.stop(); video.remove(); video = null; }
    if (imageSource) { imageSource = null; }
    if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
    detections = [];
    isMediaReady = false;
    isDetecting = false;
    sourceType = null;
    setUIEnabled(true);
}

function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
    if (isMediaReady) { calculateSourceDrawParameters(); }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ DRAW
function draw() {
    background(backgroundColor);
    if (!isMediaReady) return;

    // Стабильная циклическая детекция для видео
    if ((sourceType === 'webcam' || sourceType === 'file') && !isDetecting) {
        // Усиленная проверка готовности видео. readyState >= 3 означает, что есть данные для текущего и будущего кадра.
        if (video && video.elt && video.elt.readyState >= 3) {
            isDetecting = true;
            detector.detect(video, (error, results) => {
                if (error) console.error(error);
                // Защита от некорректных результатов
                detections = results || [];
                isDetecting = false;
            });
        }
    }

    const sourceMedia = sourceType === 'image' ? imageSource : video;
    const drawDetections = () => {
        if (!Array.isArray(detections)) return; // Защита от ошибки "not iterable"
        
        for (let object of detections) {
            if (objectSettings[object.label] && objectSettings[object.label].show) {
                drawBoundingBox(object);
            }
        }
    };

    if (cutoutMode) {
        background(backgroundColor); // Используем выбранный цвет фона
        for (let object of detections) {
             if (Array.isArray(detections) && objectSettings[object.label] && objectSettings[object.label].show) {
                let [x, y, w, h] = scaleCoords(object);
                let o = object;
                copy(sourceMedia, o.x, o.y, o.width, o.height, x, y, w, h);
            }
        }
        if (showBordersInCutout) { drawDetections(); }
        let previewH = sourceMedia.height * (160 / sourceMedia.width);
        image(sourceMedia, 10, 10, 160, previewH);
        stroke(255); strokeWeight(1); noFill(); rect(10, 10, 160, previewH);
    } else {
        image(sourceMedia, drawSourceX, drawSourceY, drawSourceWidth, drawSourceHeight);
        drawDetections();
    }
}

function drawBoundingBox(object) {
    push();
    const settings = objectSettings[object.label];
    if (!settings) { pop(); return; }
    const [x, y, w, h] = scaleCoords(object);
    const color = settings.color;
    const currentStrokeWeight = parseFloat(boxStrokeWeight);

    stroke(color);
    strokeWeight(currentStrokeWeight);
    noFill();
    rect(x, y, w, h);

    const fontSize = 10 + (currentStrokeWeight * 1.5);
    textSize(fontSize);
    let labelText = object.label;
    if (showConfidence) labelText += ` ${nf(object.confidence * 100, 0, 1)}%`;
    const textW = textWidth(labelText);
    
    noStroke();
    fill(color);
    const textBgHeight = fontSize + 8;
    const textBgX = x + currentStrokeWeight / 2;
    const textBgY = y + currentStrokeWeight / 2;
    rect(textBgX-1, textBgY-1, textW + 10, textBgHeight);
    
    fill(0);
    textAlign(LEFT, TOP);
    text(labelText, textBgX + 4, textBgY + 3);
    
    pop();
}

function scaleCoords(object) {
    let sourceW = (sourceType === 'image') ? imageSource.width : video.elt.videoWidth;
    let sourceH = (sourceType === 'image') ? imageSource.height : video.elt.videoHeight;
    let x = (object.x / sourceW) * drawSourceWidth + drawSourceX;
    let y = (object.y / sourceH) * drawSourceHeight + drawSourceY;
    let w = (object.width / sourceW) * drawSourceWidth;
    let h = (object.height / sourceH) * drawSourceHeight;
    return [x, y, w, h];
}

function updateStatusText(msg) {
    push();
    background(backgroundColor);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(msg, width / 2, height / 2);
    pop();
}

function exportImage() {
    if (isMediaReady) {
        saveCanvas(canvasElement, 'detection-output', 'png');
    } else {
        alert("Please upload an image or video first.");
    }
}

function processAndExportVideo() {
    if (sourceType !== 'file') {
        alert("Please upload a video file first to use the export function.");
        return;
    }
    if (isProcessing) return;

    isProcessing = true; setUIEnabled(false);
    ui.btnExportVideo.html('Processing...').addClass('processing');
    video.elt.currentTime = 0; video.elt.loop = false;
    
    const stream = canvasElement.captureStream(30);
    let options; let fileExtension;
    if (MediaRecorder.isTypeSupported('video/mp4; codecs=avc1')) {
        options = { mimeType: 'video/mp4; codecs=avc1.42E01E' }; fileExtension = 'mp4';
    } else {
        options = { mimeType: 'video/webm; codecs=vp9' }; fileExtension = 'webm';
    }
    
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style = 'display: none';
        a.href = url; a.download = `detection_export.${fileExtension}`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        recordedChunks = []; isProcessing = false;
        video.loop(); setUIEnabled(true);
        ui.btnExportVideo.html('Process & Export Video').removeClass('processing');
    };
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    video.elt.onended = () => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); };
    
    mediaRecorder.start();
    video.play();
}

function setUIEnabled(enabled) {
    selectAll('.control-group input, .control-group button, .btn-label').forEach(el => {
        const id = el.elt.id;
        if (id !== 'btn-export-video' && id !== 'btn-export-image') {
            el.elt.disabled = !enabled;
             if (el.hasClass('btn-label')) {
                 el.toggleClass('disabled', !enabled);
             }
        }
    });
    ui.btnExportVideo.elt.disabled = (sourceType !== 'file') || !enabled;
    ui.btnExportImage.elt.disabled = !isMediaReady || !enabled;
}