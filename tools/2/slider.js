// Функция для обновления заливки слайдера
function updateSliderFill(slider) {
  const min = slider.getAttribute('min') || 0;
  const max = slider.getAttribute('max') || 100;
  const value = parseFloat(slider.value);
  const numMin = parseFloat(min);
  const numMax = parseFloat(max);
  // Заполненная часть масштабируется от 5% до 95%
  const percentage = ((value - numMin) / (numMax - numMin)) * 90 + 5;
  // При hover используем более светлые цвета
  const fillColor = slider.matches(':hover') ? "#8B8B8B" : "#6B6B6B";
  const trackColor = slider.matches(':hover') ? "#3a3a3a" : "#292929";
  slider.style.setProperty('--slider-fill-color', fillColor);
  slider.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`;
  if (slider.id === 'speedRange') {
    document.getElementById('speedValue').textContent = slider.value;
  } else if (slider.id === 'amountRange') {
    document.getElementById('amountValue').textContent = slider.value;
  }
}

// Функция для подключения слушателей событий к слайдерам
function attachSliderListeners() {
  // Предполагается, что p5-созданные слайдеры (sizeSlider, speedSlider, amountSlider) глобальны
  [sizeSlider, speedSlider, amountSlider].forEach(slider => {
    if (slider && slider.elt) {
      updateSliderFill(slider.elt);
      slider.elt.addEventListener('input', () => updateSliderFill(slider.elt));
      slider.elt.addEventListener('mouseenter', () => updateSliderFill(slider.elt));
      slider.elt.addEventListener('mouseleave', () => updateSliderFill(slider.elt));
    }
  });
}
