/**
 * Tracking — Envoi progression vers Google Sheets + identification apprenant
 */
(function() {
    'use strict';

    const LEARNER_KEY = 'formation-hs-learner';
    const ATTEMPTS_KEY = 'formation-hs-attempts';

    let config = null;
    let configLoaded = false;

    // Charger la config tracking
    async function loadTrackingConfig() {
        if (configLoaded) return config;
        try {
            const depth = window.location.pathname.split('/').filter(Boolean);
            const inSubdir = depth.some(p => p === 'modules' || p === 'support');
            const path = inSubdir ? '../config.json' : 'config.json';
            const response = await fetch(path);
            if (!response.ok) throw new Error('Config introuvable');
            const data = await response.json();
            config = data.tracking || null;
        } catch (e) {
            config = null;
        }
        configLoaded = true;
        return config;
    }

    function isEnabled() {
        return config && config.enabled && config.endpoint && config.endpoint !== 'https://script.google.com/macros/s/XXXXXXXXX/exec';
    }

    // --- Identité apprenant ---

    function getLearner() {
        try {
            const data = localStorage.getItem(LEARNER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function saveLearner(nom, email) {
        try {
            localStorage.setItem(LEARNER_KEY, JSON.stringify({ nom: nom, email: email }));
        } catch (e) {
            // silencieux
        }
    }

    // --- Compteur de tentatives ---

    function getAttempts() {
        try {
            const data = localStorage.getItem(ATTEMPTS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function getAttempt(moduleId) {
        return getAttempts()[moduleId] || 0;
    }

    function incrementAttempt(moduleId) {
        var attempts = getAttempts();
        attempts[moduleId] = (attempts[moduleId] || 0) + 1;
        try {
            localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
        } catch (e) {
            // silencieux
        }
        return attempts[moduleId];
    }

    // --- Envoi vers Google Sheets ---

    async function send(data) {
        await loadTrackingConfig();
        if (!isEnabled()) return;

        var learner = getLearner();
        if (!learner) return;

        var payload = Object.assign({}, data, {
            nom: learner.nom,
            email: learner.email
        });

        try {
            fetch(config.endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            // Mode dégradé : échec silencieux
        }
    }

    // --- Modale d'identification ---

    function showIdentifyModal() {
        return new Promise(function(resolve) {
            // Ne pas afficher si déjà identifié
            var existing = getLearner();
            if (existing) { resolve(existing); return; }

            var overlay = document.createElement('div');
            overlay.id = 'trackingModalOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;';

            var modal = document.createElement('div');
            modal.style.cssText = 'background:#fff;border-radius:12px;padding:2rem;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;';

            modal.innerHTML = '<div style="text-align:center;margin-bottom:1.5rem;">' +
                '<div style="width:48px;height:48px;background:#1a5276;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:0.75rem;">' +
                '<span style="color:#fff;font-weight:700;font-size:1.1rem;">H&S</span></div>' +
                '<h2 style="margin:0 0 0.25rem;color:#1a5276;font-size:1.25rem;">Bienvenue dans la formation</h2>' +
                '<p style="margin:0;color:#6b7280;font-size:0.9rem;">Identifiez-vous pour suivre votre progression</p></div>' +
                '<form id="trackingIdentifyForm" style="display:flex;flex-direction:column;gap:1rem;">' +
                '<div><label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.25rem;" for="trackingNom">Nom complet</label>' +
                '<input type="text" id="trackingNom" required placeholder="Prénom Nom" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;"></div>' +
                '<div><label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.25rem;" for="trackingEmail">Email</label>' +
                '<input type="email" id="trackingEmail" required placeholder="votre@email.fr" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;"></div>' +
                '<button type="submit" style="background:#27ae60;color:#fff;border:none;padding:0.75rem;border-radius:6px;font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit;margin-top:0.5rem;">Commencer la formation</button>' +
                '</form>';

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            var form = document.getElementById('trackingIdentifyForm');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var nom = document.getElementById('trackingNom').value.trim();
                var email = document.getElementById('trackingEmail').value.trim();
                if (nom && email) {
                    saveLearner(nom, email);
                    overlay.remove();
                    resolve({ nom: nom, email: email });
                    updateLearnerInfo();
                }
            });
        });
    }

    function identify() {
        var learner = getLearner();
        if (learner) return Promise.resolve(learner);
        return showIdentifyModal();
    }

    // --- Affichage identité dans le dashboard ---

    function updateLearnerInfo() {
        var el = document.getElementById('learnerInfo');
        if (!el) return;
        var learner = getLearner();
        if (!learner) {
            el.innerHTML = '';
            return;
        }
        el.style.cssText = 'background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;font-family:Inter,system-ui,sans-serif;';
        el.innerHTML = '<span style="color:#1a5276;font-size:0.9rem;">Connect\u00e9 en tant que <strong>' +
            escapeHtml(learner.nom) + '</strong> (' + escapeHtml(learner.email) + ')</span>' +
            '<button id="trackingChangeBtn" style="background:none;border:1px solid #1a5276;color:#1a5276;padding:0.3rem 0.75rem;border-radius:4px;font-size:0.8rem;cursor:pointer;font-family:inherit;">Changer</button>';

        var btn = document.getElementById('trackingChangeBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                localStorage.removeItem(LEARNER_KEY);
                updateLearnerInfo();
                showIdentifyModal();
            });
        }
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Reset ---

    function reset() {
        localStorage.removeItem(LEARNER_KEY);
        localStorage.removeItem(ATTEMPTS_KEY);
    }

    // --- Expose API ---

    window.Tracking = {
        send: send,
        identify: identify,
        getLearner: getLearner,
        getAttempt: getAttempt,
        incrementAttempt: incrementAttempt,
        reset: reset,
        updateLearnerInfo: updateLearnerInfo
    };

    // --- Auto-init ---

    document.addEventListener('DOMContentLoaded', function() {
        loadTrackingConfig().then(function() {
            // Afficher l'identité dans le dashboard si présente
            updateLearnerInfo();

            // Sur les pages module ou dashboard, demander l'identification
            var isModule = window.location.pathname.match(/module-\d+/);
            var isDashboard = document.querySelector('.dashboard');
            if (isModule || isDashboard) {
                identify();
            }
        });
    });
})();
