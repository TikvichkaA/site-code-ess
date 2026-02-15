/**
 * PWA — Service Worker registration + install prompt
 */
(function() {
  'use strict';

  // Determine SW path based on page depth
  const depth = document.querySelector('script[src*="pwa-register"]')?.src.includes('../js/') ? '../' : '';
  const swPath = depth + 'sw.js';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath, { scope: depth || './' })
        .then(reg => {
          reg.onupdatefound = () => {
            const worker = reg.installing;
            worker.onstatechange = () => {
              if (worker.state === 'activated' && navigator.serviceWorker.controller) {
                showUpdateBanner();
              }
            };
          };
        })
        .catch(() => {});
    });
  }

  // Install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.querySelector('.pwa-install-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <span>Installer l'application pour un accès hors-ligne</span>
      <button class="pwa-install-btn">Installer</button>
      <button class="pwa-dismiss-btn" aria-label="Fermer">&times;</button>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    banner.querySelector('.pwa-install-btn').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
      }
      banner.remove();
    });
    banner.querySelector('.pwa-dismiss-btn').addEventListener('click', () => banner.remove());
  }

  function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner pwa-update-banner visible';
    banner.innerHTML = `
      <span>Nouvelle version disponible</span>
      <button class="pwa-install-btn" onclick="location.reload()">Mettre à jour</button>
      <button class="pwa-dismiss-btn" onclick="this.parentElement.remove()" aria-label="Fermer">&times;</button>
    `;
    document.body.appendChild(banner);
  }
})();
