/**
 * Presentation — Slide deck navigation & controls
 */
(function() {
  'use strict';

  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  if (!total) return;

  const counter = document.querySelector('.slide-counter');
  const progressFill = document.querySelector('.pres-progress-fill');
  const controls = document.querySelector('.pres-controls');

  function goTo(n) {
    if (n < 0 || n >= total) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = n;
    slides[currentSlide].classList.add('active');
    update();
  }

  function next() { goTo(currentSlide + 1); }
  function prev() { goTo(currentSlide - 1); }

  function update() {
    if (counter) counter.textContent = (currentSlide + 1) + ' / ' + total;
    if (progressFill) progressFill.style.width = ((currentSlide + 1) / total * 100) + '%';
    // Update hash without scrolling
    history.replaceState(null, '', '#' + (currentSlide + 1));
  }

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    switch(e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(total - 1); break;
      case 'f': case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
        }
        break;
      case 'Escape':
        if (document.fullscreenElement) document.exitFullscreen();
        break;
    }
  });

  // Touch swipe
  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  });

  // Click left/right halves
  document.querySelector('.slide-deck')?.addEventListener('click', function(e) {
    if (e.target.closest('.pres-controls, button, a, .img-placeholder')) return;
    const rect = this.getBoundingClientRect();
    (e.clientX - rect.left) > rect.width / 2 ? next() : prev();
  });

  // Button controls
  document.querySelector('.pres-prev')?.addEventListener('click', prev);
  document.querySelector('.pres-next')?.addEventListener('click', next);
  document.querySelector('.pres-fullscreen')?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });
  document.querySelector('.pres-print')?.addEventListener('click', () => window.print());

  // Show controls on mouse move
  let hideTimeout;
  document.addEventListener('mousemove', () => {
    if (controls) { controls.classList.add('visible'); clearTimeout(hideTimeout); hideTimeout = setTimeout(() => controls.classList.remove('visible'), 3000); }
  });

  // Hash navigation
  const hash = parseInt(location.hash.replace('#', ''));
  if (hash > 0 && hash <= total) currentSlide = hash - 1;
  slides[currentSlide].classList.add('active');
  update();
})();
