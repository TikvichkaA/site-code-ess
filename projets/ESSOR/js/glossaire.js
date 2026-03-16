/**
 * ESSOR — Glossaire
 * Accordéon glossaire + tooltips sur <dfn>
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Glossaire accordéon
        var terms = document.querySelectorAll('.glossaire-term');

        terms.forEach(function(term) {
            term.addEventListener('click', function() {
                var def = term.nextElementSibling;
                var isOpen = term.getAttribute('aria-expanded') === 'true';

                term.setAttribute('aria-expanded', !isOpen);
                if (def) def.classList.toggle('open', !isOpen);
            });

            term.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    term.click();
                }
            });
        });

        // Tooltips <dfn> — add tabindex for keyboard access
        document.querySelectorAll('dfn[data-definition]').forEach(function(dfn) {
            dfn.setAttribute('tabindex', '0');

            // Create tooltip if not already present
            if (!dfn.querySelector('.tooltip')) {
                var tooltip = document.createElement('span');
                tooltip.className = 'tooltip';
                tooltip.setAttribute('role', 'tooltip');
                tooltip.textContent = dfn.getAttribute('data-definition');
                dfn.appendChild(tooltip);
            }
        });
    });
})();
