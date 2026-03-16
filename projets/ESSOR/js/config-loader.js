/**
 * ESSOR — Config Loader
 * Charge config.json et injecte les données dans [data-config]
 */
(function() {
    'use strict';

    var config = null;

    function getNestedValue(obj, path) {
        return path.split('.').reduce(function(acc, key) {
            return acc && acc[key];
        }, obj);
    }

    function injectConfig() {
        if (!config) return;
        document.querySelectorAll('[data-config]').forEach(function(el) {
            var key = el.getAttribute('data-config');
            var value = getNestedValue(config, key);
            if (value !== undefined && value !== null) {
                if (el.tagName === 'A' && key.includes('email')) {
                    el.href = 'mailto:' + value;
                    el.textContent = value;
                } else if (el.tagName === 'A' && key.includes('site')) {
                    el.href = value;
                    el.textContent = value;
                } else if (el.tagName === 'A' && key.includes('telephone')) {
                    el.href = 'tel:' + value.replace(/\s/g, '');
                    el.textContent = value;
                } else {
                    el.textContent = value;
                }
            }
        });
    }

    async function loadConfig() {
        try {
            var response = await fetch('config.json');
            if (!response.ok) throw new Error('Config introuvable');
            config = await response.json();
            injectConfig();
            return config;
        } catch (err) {
            console.warn('Config non chargée:', err.message);
            return null;
        }
    }

    // Expose globally
    window.ESSORConfig = {
        load: loadConfig,
        get: function(path) { return config ? getNestedValue(config, path) : null; },
        getConfig: function() { return config; }
    };

    // Auto-load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadConfig);
    } else {
        loadConfig();
    }
})();
