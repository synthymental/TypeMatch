function sketch(p) {
    // --- Глобальные переменные ---
    let originalImg;
    let myFont;
    let isDirty = true;
    let showOriginal = false;
    let textColor = '#ffffff';
    let bgColor = '#1E1E1E';
    let isInverted = false;
    let isTextColorCustom = false;
    let canvas;

    let imgDrawParams = { x: 0, y: 0, width: 0, height: 0 };

    // Переменные для DOM-элементов
    let cellSizeSlider, dotThresholdSlider, emptyThresholdSlider, fThresholdSlider, eThresholdSlider;
    let brightnessSlider, contrastSlider, offsetXSlider, offsetYSlider;
    let cellSizeValue, dotThresholdValue, emptyThresholdValue, fThresholdValue, eThresholdValue;
    let brightnessValue, contrastValue, offsetXValue, offsetYValue;
    
    // --- Основные функции p5.js ---
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
    
    // --- Настройка DOM и событий ---
    function setupDOMConnections() {
        uploadBox = p.select('#upload-box');
        fileInput = p.select('#file-input');
        cellSizeSlider = p.select('#cell-size-slider');
        dotThresholdSlider = p.select('#dot-threshold-slider');
        emptyThresholdSlider = p.select('#empty-threshold-slider');
        fThresholdSlider = p.select('#f-threshold-slider');
        eThresholdSlider = p.select('#e-threshold-slider');
        brightnessSlider = p.select('#brightness-slider');
        contrastSlider = p.select('#contrast-slider');
        offsetXSlider = p.select('#offset-x-slider');
        offsetYSlider = p.select('#offset-y-slider');
        
        cellSizeValue = p.select('#cell-size-value');
        dotThresholdValue = p.select('#dot-threshold-value');
        emptyThresholdValue = p.select('#empty-threshold-value');
        fThresholdValue = p.select('#f-threshold-value');
        eThresholdValue = p.select('#e-threshold-value');
        brightnessValue = p.select('#brightness-value');
        contrastValue = p.select('#contrast-value');
        offsetXValue = p.select('#offset-x-value');
        offsetYValue = p.select('#offset-y-value');
    }

    function setupEventListeners() {
        const allSliders = [
            cellSizeSlider, dotThresholdSlider, emptyThresholdSlider, fThresholdSlider, eThresholdSlider, 
            brightnessSlider, contrastSlider, offsetXSlider, offsetYSlider
        ];
        allSliders.forEach(slider => {
            slider.input(updateAndRedraw);
            slider.doubleClicked(() => {
                slider.value(slider.elt.defaultValue);
                updateAndRedraw();
            });
        });
        
        uploadBox.dragOver(() => uploadBox.addClass('drag-over'));
        uploadBox.dragLeave(() => uploadBox.removeClass('drag-over'));
        uploadBox.drop(handleDrop, () => uploadBox.removeClass('drag-over'));
        uploadBox.mouseClicked(() => fileInput.elt.click());
        fileInput.changed(handleChange);
        
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
    
    // --- Функции-обработчики событий ---
    function onWindowResize() {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        if (originalImg) {
            calculateAspectRatioFit();
        }
        isDirty = true;
        p.redraw();
    }
    
    function toggleInversion() { isInverted = !isInverted; isDirty = true; p.redraw(); }
    
    function resetAdjustments() {
        const allSliders = [cellSizeSlider, dotThresholdSlider, emptyThresholdSlider, fThresholdSlider, eThresholdSlider, brightnessSlider, contrastSlider, offsetXSlider, offsetYSlider];
        allSliders.forEach(slider => {
            slider.value(slider.elt.defaultValue);
        });
        isInverted = false;
        isTextColorCustom = false;
        updateTextColor();
        updateAndRedraw();
    }

    function updateAndRedraw() {
        cellSizeValue.html(cellSizeSlider.value());
        dotThresholdValue.html(dotThresholdSlider.value());
        emptyThresholdValue.html(emptyThresholdSlider.value());
        fThresholdValue.html(fThresholdSlider.value());
        eThresholdValue.html(eThresholdSlider.value());
        brightnessValue.html(brightnessSlider.value());
        contrastValue.html(contrastSlider.value());
        offsetXValue.html(offsetXSlider.value());
        offsetYValue.html(offsetYSlider.value());
        isDirty = true;
        p.redraw();
    }

    function handleDrop(file) { if (file.type === 'image') { processImage(file.data); } }
    function handleChange(event) { const file = event.target.files[0]; if (file && file.type.startsWith('image/')) { const url = URL.createObjectURL(file); processImage(url, () => URL.revokeObjectURL(url)); } }

    // --- Логика обработки изображения ---
    function processImage(imageData, onLoadedCallback) { originalImg = p.loadImage(imageData, () => { calculateAspectRatioFit(); isDirty = true; p.redraw(); if (onLoadedCallback) { onLoadedCallback(); } }); }
    
    function calculateAspectRatioFit() {
        const canvasW = p.width; const canvasH = p.height; const imgW = originalImg.width; const imgH = originalImg.height; const canvasRatio = canvasW / canvasH; const imgRatio = imgW / imgH;
        if (imgRatio > canvasRatio) {
            imgDrawParams.width = canvasW; imgDrawParams.height = canvasW / imgRatio; imgDrawParams.x = 0; imgDrawParams.y = (canvasH - imgDrawParams.height) / 2;
        } else {
            imgDrawParams.height = canvasH; imgDrawParams.width = canvasH * imgRatio; imgDrawParams.y = 0; imgDrawParams.x = (canvasW - imgDrawParams.width) / 2;
        }
    }
    
    function getFilteredImageGraphics() {
        if (!originalImg) return null;
        const pg = p.createGraphics(p.width, p.height);
        const brightnessVal = brightnessSlider.value() / 100;
        const contrastVal = contrastSlider.value() / 100;
        pg.drawingContext.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`;
        pg.image(originalImg, imgDrawParams.x, imgDrawParams.y, imgDrawParams.width, imgDrawParams.height);
        pg.drawingContext.filter = 'none';
        return pg;
    }

    // ИЗМЕНЕНИЕ: Исправленная и правильная логика инверсии
    function getAsciiChar(brightness) {
        const t_dot = parseInt(dotThresholdSlider.value());
        const t_empty = parseInt(emptyThresholdSlider.value());
        const t_f = parseInt(fThresholdSlider.value());
        const t_e = parseInt(eThresholdSlider.value());
        
        // Определяем, был бы в этой точке символ в обычном режиме
        const isNormallyEmpty = (t_dot > 0 && brightness < t_dot) || (brightness < t_empty);

        if (!isInverted) {
            // Обычный режим
            if (t_dot > 0 && brightness < t_dot) return '.';
            if (brightness < t_empty) return ' ';
            if (brightness < t_f) return 'F';
            if (brightness < t_e) return 'E';
            return 'X';
        } else {
            // Инвертированный режим
            if (isNormallyEmpty) {
                // Если было пусто, заполняем символами в обратном порядке
                // Самые темные (были '.') становятся 'X', остальные (были ' ') становятся 'E'
                if (t_dot > 0 && brightness < t_dot) return 'X';
                return 'E'; // Или F, если хотите другой вид
            } else {
                // Если был символ, становится пусто
                return ' ';
            }
        }
    }
    
    // ИЗМЕНЕНИЕ: Возвращен стабильный метод .get()
    function generateAscii() {
        if (!originalImg || !imgDrawParams) return;
        const filteredGraphics = getFilteredImageGraphics();
        if (!filteredGraphics) return;
        if (showOriginal) {
            p.image(originalImg, imgDrawParams.x, imgDrawParams.y, imgDrawParams.width, imgDrawParams.height);
        }
        
        const offsetX = parseInt(offsetXSlider.value());
        const offsetY = parseInt(offsetYSlider.value());
        const cellHeight = parseInt(cellSizeSlider.value());
        const cellWidth = cellHeight * 0.8;
        p.fill(textColor);
        p.textSize(cellHeight * 0.9);
        
        for (let y = imgDrawParams.y; y < imgDrawParams.y + imgDrawParams.height; y += cellHeight) {
            for (let x = imgDrawParams.x; x < imgDrawParams.x + imgDrawParams.width; x += cellWidth) {
                const pixelX = x + cellWidth / 2;
                const pixelY = y + cellHeight / 2;
                const c = filteredGraphics.get(pixelX, pixelY);
                const brightness = p.brightness(c);
                const charToDraw = getAsciiChar(brightness);
                p.text(charToDraw, pixelX + offsetX, pixelY + offsetY);
            }
        }
    }
    
    // --- Вспомогательные функции и экспорт (исправлена тема) ---
    function toggleTextColor() { isTextColorCustom = !isTextColorCustom; updateTextColor(); isDirty = true; p.redraw(); }
    
    function updateTextColor() {
        const isLightTheme = document.body.classList.contains('light-theme');
        // Используем прямые значения из CSS, чтобы избежать рассинхрона
        const themeTextColor = isLightTheme ? '#1E1E1E' : '#ffffff'; 
        const themeBgColor = isLightTheme ? '#ffffff' : '#1E1E1E';
        textColor = isTextColorCustom ? themeBgColor : themeTextColor;
    }

    // ИЗМЕНЕНИЕ: Исправлена логика обновления цветов
    function toggleTheme() {
        const body = document.body;
        body.classList.toggle('light-theme');
        
        bgColor = body.classList.contains('light-theme') ? '#f0f0f0' : '#1E1E1E';
        isTextColorCustom = false; 
        updateTextColor(); // Эта функция теперь правильно определит цвет текста для новой темы
        isDirty = true;
        p.redraw();
    }
    
    function exportPNG() {
        if (!originalImg || !imgDrawParams) return;
        const scaleFactor = showOriginal ? 1 : 2;
        const filename = showOriginal ? 'exf-studio-art.png' : 'exf-studio-art_x2.png';
        const exportWidth = imgDrawParams.width * scaleFactor;
        const exportHeight = imgDrawParams.height * scaleFactor;
        const exportPG = p.createGraphics(exportWidth, exportHeight);
        const filteredGraphics = getFilteredImageGraphics();
        if (showOriginal) { exportPG.image(originalImg, 0, 0, exportPG.width, exportPG.height); }
        
        exportPG.textFont(myFont);
        exportPG.textAlign(p.CENTER, p.CENTER);
        exportPG.fill(textColor);
        
        const offsetX = parseInt(offsetXSlider.value()) * scaleFactor;
        const offsetY = parseInt(offsetYSlider.value()) * scaleFactor;
        const cellHeight = parseInt(cellSizeSlider.value());
        const cellWidth = cellHeight * 0.8;
        const scaledCellHeight = cellHeight * scaleFactor;
        const scaledCellWidth = cellWidth * scaleFactor;
        exportPG.textSize(scaledCellHeight * 0.9);

        for (let y = 0; y < exportHeight; y += scaledCellHeight) {
            for (let x = 0; x < exportWidth; x += scaledCellWidth) {
                const unscaledX = x / scaleFactor; const unscaledY = y / scaleFactor;
                const sourceX = imgDrawParams.x + unscaledX + (cellWidth / 2);
                const sourceY = imgDrawParams.y + unscaledY + (cellHeight / 2);
                const c = filteredGraphics.get(sourceX, sourceY);
                const brightness = p.brightness(c);
                const charToDraw = getAsciiChar(brightness);
                exportPG.text(charToDraw, x + scaledCellWidth / 2 + offsetX, y + scaledCellHeight / 2 + offsetY);
            }
        }
        p.save(exportPG, filename);
    }
    
    function exportSVG() {
        if (!originalImg || !imgDrawParams) return;
        const filteredGraphics = getFilteredImageGraphics();
        const offsetX = parseInt(offsetXSlider.value());
        const offsetY = parseInt(offsetYSlider.value());
        const cellHeight = parseInt(cellSizeSlider.value());
        const cellWidth = cellHeight * 0.8;
        let svgData = `<svg width="${imgDrawParams.width}" height="${imgDrawParams.height}" xmlns="http://www.w3.org/2000/svg" style="background-color:${bgColor};">`;
        svgData += `<style> .ascii { font-family: '${myFont.font.names.fontFamily.en}', monospace; font-size: ${cellHeight * 0.9}px; fill: ${textColor}; text-anchor: middle; alignment-baseline: middle; } </style>`;
        svgData += `<g transform="translate(${offsetX}, ${offsetY})">`;
        for (let y = 0; y < imgDrawParams.height; y += cellHeight) {
            for (let x = 0; x < imgDrawParams.width; x += cellWidth) {
                const sourceX = imgDrawParams.x + x + cellWidth / 2;
                const sourceY = imgDrawParams.y + y + cellHeight / 2;
                const c = filteredGraphics.get(sourceX, sourceY);
                const brightness = p.brightness(c);
                const charToDraw = getAsciiChar(brightness);
                svgData += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" class="ascii">${charToDraw}</text>`;
            }
        }
        svgData += `</g></svg>`;
        const blob = new Blob([svgData], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'exf-studio-art.svg'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    function exportTXT() {
        if (!originalImg || !imgDrawParams) return;
        const filteredGraphics = getFilteredImageGraphics();
        const cellHeight = parseInt(cellSizeSlider.value());
        const cellWidth = cellHeight * 0.8;
        let textLines = [];
        for (let y = 0; y < imgDrawParams.height; y += cellHeight) {
            let currentRow = '';
            for (let x = 0; x < imgDrawParams.width; x += cellWidth) {
                const sourceX = imgDrawParams.x + x + cellWidth / 2;
                const sourceY = imgDrawParams.y + y + cellHeight / 2;
                const c = filteredGraphics.get(sourceX, sourceY);
                const brightness = p.brightness(c);
                const charToDraw = getAsciiChar(brightness);
                currentRow += charToDraw;
            }
            textLines.push(currentRow);
        }
        p.saveStrings(textLines, 'exf-studio-art', 'txt');
    }
}

new p5(sketch, 'app-container');