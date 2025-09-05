function sketch(p) {
    // --- Глобальные переменные ---
    let originalImg;
    let myFont;
    let isDirty = true;
    let showOriginal = false;
    let textColor = '#f0f0f0';
    let bgColor = '#1a1a1a';
    let isInverted = false;
    let isTextColorCustom = false;
    let canvas;

    let imgDrawParams = { x: 0, y: 0, width: 0, height: 0 };
    let canvasContainer, uploadBox, fileInput;
    let cellSizeSlider, emptyThresholdSlider, fThresholdSlider, eThresholdSlider;
    let brightnessSlider, contrastSlider;
    let cellSizeValue, emptyThresholdValue, fThresholdValue, eThresholdValue;
    let brightnessValue, contrastValue;
    
    p.preload = function() {
        myFont = p.loadFont('data/ABCFavoritMonoVariable-Trial.ttf');
    }

    p.setup = function() {
        canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('app-container');
        canvas.style('position', 'absolute');
        canvas.style('top', '0');
        canvas.style('left', '0');
        canvas.style('z-index', '1');
        p.textFont(myFont);
        p.textAlign(p.CENTER, p.CENTER);
        setupDOMConnections();
        setupEventListeners();
        p.noLoop();
        p.redraw();
    };

    p.draw = function() {
        if (isDirty) {
            p.background(bgColor);
            if (originalImg) {
                generateAscii();
            }
            isDirty = false;
        }
    };
    
    function setupDOMConnections() {
        uploadBox = p.select('#upload-box');
        fileInput = p.select('#file-input');
        cellSizeSlider = p.select('#cell-size-slider');
        emptyThresholdSlider = p.select('#empty-threshold-slider');
        fThresholdSlider = p.select('#f-threshold-slider');
        eThresholdSlider = p.select('#e-threshold-slider');
        brightnessSlider = p.select('#brightness-slider');
        contrastSlider = p.select('#contrast-slider');
        cellSizeValue = p.select('#cell-size-value');
        emptyThresholdValue = p.select('#empty-threshold-value');
        fThresholdValue = p.select('#f-threshold-value');
        eThresholdValue = p.select('#e-threshold-value');
        brightnessValue = p.select('#brightness-value');
        contrastValue = p.select('#contrast-value');
    }

    function setupEventListeners() {
        uploadBox.dragOver(() => uploadBox.addClass('drag-over'));
        uploadBox.dragLeave(() => uploadBox.removeClass('drag-over'));
        uploadBox.drop(handleDrop, () => uploadBox.removeClass('drag-over'));
        uploadBox.mouseClicked(() => fileInput.elt.click());
        fileInput.changed(handleChange);

        const allSliders = [cellSizeSlider, emptyThresholdSlider, fThresholdSlider, eThresholdSlider, brightnessSlider, contrastSlider];
        allSliders.forEach(slider => slider.input(updateAndRedraw));
        
        p.select('#toggle-preview-btn').mousePressed(() => { showOriginal = !showOriginal; isDirty = true; p.redraw(); });
        p.select('#invert-btn').mousePressed(toggleInversion);
        p.select('#reset-btn').mousePressed(resetAdjustments);
        p.select('#color-btn').mousePressed(toggleTextColor);
        p.select('#theme-switcher').mousePressed(toggleTheme);
        p.select('#export-png-btn').mousePressed(exportPNG);
        p.select('#export-svg-btn').mousePressed(exportSVG);
        p.select('#export-txt-btn').mousePressed(exportTXT);
        
        p.windowResized = onWindowResize;

        const headers = p.selectAll('.control-section-header');
        headers.forEach(header => {
            header.mousePressed(() => {
                const parentSection = header.parent();
                if (parentSection.classList.contains('is-open')) {
                    parentSection.classList.remove('is-open');
                } else {
                    p.selectAll('.control-section').forEach(section => section.removeClass('is-open'));
                    parentSection.classList.add('is-open');
                }
            });
        });

        const mobileMenuBtn = p.select('.mobile-menu-toggle');
        const controlsPanel = p.select('.controls-panel');
        mobileMenuBtn.mousePressed(() => {
            controlsPanel.toggleClass('is-mobile-open');
            if (controlsPanel.hasClass('is-mobile-open')) {
                mobileMenuBtn.html('Close');
            } else {
                mobileMenuBtn.html('Menu');
            }
        });
    }
    
    function onWindowResize() { p.resizeCanvas(p.windowWidth, p.windowHeight); if (originalImg) { calculateAspectRatioFit(); } isDirty = true; p.redraw(); }
    function toggleInversion() { isInverted = !isInverted; isDirty = true; p.redraw(); }
    function resetAdjustments() { cellSizeSlider.value(12); emptyThresholdSlider.value(25); fThresholdSlider.value(50); eThresholdSlider.value(75); brightnessSlider.value(100); contrastSlider.value(100); isInverted = false; isTextColorCustom = false; updateTextColor(); updateAndRedraw(); }
    function updateAndRedraw() { cellSizeValue.html(cellSizeSlider.value()); emptyThresholdValue.html(emptyThresholdSlider.value()); fThresholdValue.html(fThresholdSlider.value()); eThresholdValue.html(eThresholdSlider.value()); brightnessValue.html(brightnessSlider.value()); contrastValue.html(contrastSlider.value()); isDirty = true; p.redraw(); }
    function handleDrop(file) { if (file.type === 'image') { processImage(file.data); } }
    function handleChange(event) { const file = event.target.files[0]; if (file && file.type.startsWith('image/')) { const url = URL.createObjectURL(file); processImage(url, () => URL.revokeObjectURL(url)); } }
    function processImage(imageData, onLoadedCallback) { originalImg = p.loadImage(imageData, () => { calculateAspectRatioFit(); isDirty = true; p.redraw(); if (onLoadedCallback) { onLoadedCallback(); } }); }
    function calculateAspectRatioFit() { const canvasW = p.width; const canvasH = p.height; const imgW = originalImg.width; const imgH = originalImg.height; const canvasRatio = canvasW / canvasH; const imgRatio = imgW / imgH; if (imgRatio > canvasRatio) { imgDrawParams.width = canvasW; imgDrawParams.height = canvasW / imgRatio; imgDrawParams.x = 0; imgDrawParams.y = (canvasH - imgDrawParams.height) / 2; } else { imgDrawParams.height = canvasH; imgDrawParams.width = canvasH * imgRatio; imgDrawParams.y = 0; imgDrawParams.x = (canvasW - imgDrawParams.width) / 2; } }
    function getFilteredImageGraphics() { if (!originalImg) return null; const pg = p.createGraphics(p.width, p.height); const brightnessVal = brightnessSlider.value() / 100; const contrastVal = contrastSlider.value() / 100; pg.drawingContext.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`; pg.image(originalImg, imgDrawParams.x, imgDrawParams.y, imgDrawParams.width, imgDrawParams.height); pg.drawingContext.filter = 'none'; return pg; }

    // ИЗМЕНЕНИЕ: Полностью новая логика для инверсии
    function getAsciiChar(brightness) {
        const t_empty = parseInt(emptyThresholdSlider.value());
        const t_f = parseInt(fThresholdSlider.value());
        const t_e = parseInt(eThresholdSlider.value());
        
        // 1. Сначала определяем символ, как в обычном режиме
        let char;
        if (brightness < t_empty) char = ' ';
        else if (brightness < t_f) char = 'F';
        else if (brightness < t_e) char = 'E';
        else char = 'X';
        
        // 2. Если инверсия включена, применяем правило "присутствия/отсутствия"
        if (isInverted) {
            // Если был пробел, ставим самый плотный символ. Если была любая буква, ставим пробел.
            return (char === ' ') ? 'X' : ' ';
        } else {
            // Иначе возвращаем обычный символ
            return char;
        }
    }
    
    function generateAscii() { if (!originalImg || !imgDrawParams) return; const filteredGraphics = getFilteredImageGraphics(); if (!filteredGraphics) return; if (showOriginal) { p.image(originalImg, imgDrawParams.x, imgDrawParams.y, imgDrawParams.width, imgDrawParams.height); } const cellHeight = parseInt(cellSizeSlider.value()); const cellWidth = cellHeight * 0.8; p.fill(textColor); p.textSize(cellHeight * 0.9); for (let y = imgDrawParams.y; y < imgDrawParams.y + imgDrawParams.height; y += cellHeight) { for (let x = imgDrawParams.x; x < imgDrawParams.x + imgDrawParams.width; x += cellWidth) { const pixelX = x + cellWidth / 2; const pixelY = y + cellHeight / 2; const c = filteredGraphics.get(pixelX, pixelY); const brightness = p.brightness(c); const charToDraw = getAsciiChar(brightness); p.text(charToDraw, pixelX, pixelY); } } }
    function toggleTextColor() { isTextColorCustom = !isTextColorCustom; updateTextColor(); isDirty = true; p.redraw(); }
    function updateTextColor() { const isLightTheme = document.body.classList.contains('light-theme'); const themeTextColor = isLightTheme ? '#1a1a1a' : '#f0f0f0'; const themeBgColor = isLightTheme ? '#f0f0f0' : '#1a1a1a'; textColor = isTextColorCustom ? themeBgColor : themeTextColor; }
    function toggleTheme() { const body = document.body; body.classList.toggle('light-theme'); bgColor = body.classList.contains('light-theme') ? '#f0f0f0' : '#1a1a1a'; isTextColorCustom = false; updateTextColor(); isDirty = true; p.redraw(); }
    function exportPNG() { if (!originalImg || !imgDrawParams) return; const exportPG = p.createGraphics(imgDrawParams.width, imgDrawParams.height); const filteredGraphics = getFilteredImageGraphics(); if (showOriginal) { exportPG.image(originalImg, 0, 0, exportPG.width, exportPG.height); } exportPG.textFont(myFont); exportPG.textAlign(p.CENTER, p.CENTER); exportPG.fill(textColor); const cellHeight = parseInt(cellSizeSlider.value()); const cellWidth = cellHeight * 0.8; exportPG.textSize(cellHeight * 0.9); for (let y = 0; y < exportPG.height; y += cellHeight) { for (let x = 0; x < exportPG.width; x += cellWidth) { const sourceX = imgDrawParams.x + x + cellWidth / 2; const sourceY = imgDrawParams.y + y + cellHeight / 2; const c = filteredGraphics.get(sourceX, sourceY); const brightness = p.brightness(c); const charToDraw = getAsciiChar(brightness); exportPG.text(charToDraw, x + cellWidth / 2, y + cellHeight / 2); } } p.save(exportPG, 'exf-studio-art.png'); }
    function exportSVG() { if (!originalImg || !imgDrawParams) return; const filteredGraphics = getFilteredImageGraphics(); const cellHeight = parseInt(cellSizeSlider.value()); const cellWidth = cellHeight * 0.8; let svgData = `<svg width="${imgDrawParams.width}" height="${imgDrawParams.height}" xmlns="http://www.w3.org/2000/svg" style="background-color:${bgColor};">`; svgData += `<style> .ascii { font-family: '${myFont.font.names.fontFamily.en}', monospace; font-size: ${cellHeight * 0.9}px; fill: ${textColor}; text-anchor: middle; alignment-baseline: middle; } </style>`; for (let y = 0; y < imgDrawParams.height; y += cellHeight) { for (let x = 0; x < imgDrawParams.width; x += cellWidth) { const sourceX = imgDrawParams.x + x + cellWidth / 2; const sourceY = imgDrawParams.y + y + cellHeight / 2; const c = filteredGraphics.get(sourceX, sourceY); const brightness = p.brightness(c); const charToDraw = getAsciiChar(brightness); svgData += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" class="ascii">${charToDraw}</text>`; } } svgData += '</svg>'; const blob = new Blob([svgData], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'exf-studio-art.svg'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
    function exportTXT() { if (!originalImg || !imgDrawParams) return; const filteredGraphics = getFilteredImageGraphics(); const cellHeight = parseInt(cellSizeSlider.value()); const cellWidth = cellHeight * 0.8; let textLines = []; for (let y = 0; y < imgDrawParams.height; y += cellHeight) { let currentRow = ''; for (let x = 0; x < imgDrawParams.width; x += cellWidth) { const sourceX = imgDrawParams.x + x + cellWidth / 2; const sourceY = imgDrawParams.y + y + cellHeight / 2; const c = filteredGraphics.get(sourceX, sourceY); const brightness = p.brightness(c); const charToDraw = getAsciiChar(brightness); currentRow += charToDraw; } textLines.push(currentRow); } p.saveStrings(textLines, 'exf-studio-art', 'txt'); }
}

new p5(sketch, 'app-container');