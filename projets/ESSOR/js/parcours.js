/**
 * ESSOR — Parcours d'asile
 * Stepper accordéon avec navigation clavier et hash URL
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var headers = document.querySelectorAll('.etape-header');

        function toggleEtape(header) {
            var content = header.nextElementSibling;
            var isOpen = header.getAttribute('aria-expanded') === 'true';

            // Close all
            headers.forEach(function(h) {
                h.setAttribute('aria-expanded', 'false');
                var c = h.nextElementSibling;
                if (c) c.classList.remove('open');
            });

            // Toggle current
            if (!isOpen) {
                header.setAttribute('aria-expanded', 'true');
                if (content) content.classList.add('open');

                // Update hash
                var etape = header.closest('.parcours-etape');
                if (etape && etape.id) {
                    history.replaceState(null, '', '#' + etape.id);
                }
            }
        }

        headers.forEach(function(header) {
            // Click
            header.addEventListener('click', function() {
                toggleEtape(header);
            });

            // Keyboard
            header.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleEtape(header);
                }
            });
        });

        // Open step from URL hash
        function openFromHash() {
            var hash = window.location.hash.substring(1);
            if (hash) {
                var etape = document.getElementById(hash);
                if (etape) {
                    var header = etape.querySelector('.etape-header');
                    if (header) {
                        toggleEtape(header);
                        setTimeout(function() {
                            etape.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                    }
                }
            }
        }

        openFromHash();
        window.addEventListener('hashchange', openFromHash);
    });
})();
