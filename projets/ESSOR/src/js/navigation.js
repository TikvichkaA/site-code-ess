/**
 * ESSOR — Navigation
 * Menu mobile, header sticky, scroll effects, smooth scroll
 * Active link is now handled server-side in header.njk
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Mobile nav toggle
        var toggle = document.querySelector('.nav-toggle');
        var navLinks = document.querySelector('.nav-links');

        if (toggle && navLinks) {
            toggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                var expanded = navLinks.classList.contains('active');
                toggle.setAttribute('aria-expanded', expanded);
            });

            // Close on link click
            navLinks.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    navLinks.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Header scroll effect
        var header = document.querySelector('.site-header');
        if (header) {
            window.addEventListener('scroll', function() {
                header.classList.toggle('scrolled', window.scrollY > 30);
            }, { passive: true });
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
})();
