/**
 * Navigation — Menu mobile, sidebar, scroll effects
 */
(function() {
    'use strict';

    // Mobile nav toggle
    document.addEventListener('DOMContentLoaded', function() {
        const toggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (toggle && navLinks) {
            toggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                const expanded = navLinks.classList.contains('active');
                toggle.setAttribute('aria-expanded', expanded);
            });

            // Fermer le menu en cliquant sur un lien
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Header scroll effect
        const header = document.querySelector('.site-header');
        if (header) {
            window.addEventListener('scroll', function() {
                header.classList.toggle('scrolled', window.scrollY > 30);
            }, { passive: true });
        }

        // Active nav link
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.endsWith(href.replace(/^\.\.\//, '').replace(/^\.\//, ''))) {
                link.classList.add('active');
            }
        });

        // Sidebar toggle (modules)
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('open');
            });
        }

        // Scroll reveal
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
})();
