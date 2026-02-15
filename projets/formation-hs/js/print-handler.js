/**
 * Print Handler — Export PDF via impression navigateur
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Bouton d'impression
        document.querySelectorAll('.print-btn, [data-print]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                window.print();
            });
        });

        // Raccourci info
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                // Le navigateur gère nativement Ctrl+P
            }
        });
    });
})();
