/**
 * Config Loader — Charge config.json et injecte les données ARS
 * Usage: ajouter data-config="ars.nom" ou data-config="organisme.email" etc.
 */
(function() {
    'use strict';

    const CONFIG_PATH = '../config.json';
    let config = null;

    async function loadConfig() {
        try {
            // Déterminer le chemin relatif selon la profondeur
            const depth = getDepth();
            const path = depth === 0 ? 'config.json' : '../config.json';
            const response = await fetch(path);
            if (!response.ok) throw new Error('Config introuvable');
            config = await response.json();
            injectConfig();
            return config;
        } catch (err) {
            console.warn('Config non chargée:', err.message);
            return null;
        }
    }

    function getDepth() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        // Si on est dans support/ ou modules/, profondeur 1
        if (parts.includes('support') || parts.includes('modules')) return 1;
        return 0;
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    function injectConfig() {
        if (!config) return;
        document.querySelectorAll('[data-config]').forEach(el => {
            const key = el.getAttribute('data-config');
            const value = getNestedValue(config, key);
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

    // Exposer globalement
    window.FormationConfig = {
        load: loadConfig,
        get: (path) => config ? getNestedValue(config, path) : null,
        getConfig: () => config
    };

    // Auto-load au DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadConfig);
    } else {
        loadConfig();
    }
})();
