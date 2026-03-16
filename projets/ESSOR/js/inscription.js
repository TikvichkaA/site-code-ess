/**
 * ESSOR — Inscription
 * Toggle type usager, validation, POST Google Sheets
 * Gère aussi le formulaire de contact
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // --- User type selector ---
        var typeCards = document.querySelectorAll('.user-type-card');
        var formBeneficiaire = document.getElementById('form-beneficiaire');
        var formBenevole = document.getElementById('form-benevole');

        typeCards.forEach(function(card) {
            card.addEventListener('click', function() {
                typeCards.forEach(function(c) { c.classList.remove('selected'); });
                card.classList.add('selected');

                var type = card.getAttribute('data-type');
                if (formBeneficiaire && formBenevole) {
                    if (type === 'beneficiaire') {
                        formBeneficiaire.classList.remove('hidden');
                        formBenevole.classList.add('hidden');
                    } else {
                        formBeneficiaire.classList.add('hidden');
                        formBenevole.classList.remove('hidden');
                    }
                }
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        // --- Charger les créneaux depuis config ---
        function loadCreneaux() {
            var select = document.getElementById('ins-creneau');
            if (!select) return;

            // Wait for config to be loaded
            var interval = setInterval(function() {
                if (window.ESSORConfig && window.ESSORConfig.getConfig()) {
                    clearInterval(interval);
                    var config = window.ESSORConfig.getConfig();
                    if (config.creneaux && config.creneaux.length) {
                        config.creneaux.forEach(function(c) {
                            var opt = document.createElement('option');
                            opt.value = c.value;
                            opt.textContent = c.label;
                            select.appendChild(opt);
                        });
                    }
                }
            }, 100);

            // Timeout after 3s
            setTimeout(function() { clearInterval(interval); }, 3000);
        }

        loadCreneaux();

        // --- Validation ---
        function validateField(input) {
            var isValid = input.checkValidity();
            input.classList.toggle('error', !isValid);
            return isValid;
        }

        function validateForm(form) {
            var inputs = form.querySelectorAll('[required]');
            var valid = true;
            inputs.forEach(function(input) {
                if (!validateField(input)) valid = false;
            });
            return valid;
        }

        // Live validation on blur
        document.querySelectorAll('.form-input').forEach(function(input) {
            input.addEventListener('blur', function() {
                if (input.hasAttribute('required')) {
                    validateField(input);
                }
            });
            input.addEventListener('input', function() {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });

        // --- Submit forms ---
        function getEndpoint() {
            if (window.ESSORConfig && window.ESSORConfig.getConfig()) {
                return window.ESSORConfig.get('inscription.endpoint');
            }
            return null;
        }

        function getContactEndpoint() {
            if (window.ESSORConfig && window.ESSORConfig.getConfig()) {
                return window.ESSORConfig.get('contact.endpoint');
            }
            return null;
        }

        function collectFormData(form) {
            var data = {};
            var inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(function(input) {
                if (input.type === 'checkbox') {
                    if (!data[input.name]) data[input.name] = [];
                    if (input.checked) data[input.name].push(input.value);
                } else {
                    data[input.name] = input.value;
                }
            });
            // Convert checkbox arrays to strings
            for (var key in data) {
                if (Array.isArray(data[key])) {
                    data[key] = data[key].join(', ');
                }
            }
            return data;
        }

        function submitForm(form, type, confirmationId) {
            if (!validateForm(form)) return;

            var btn = form.querySelector('button[type="submit"]');
            if (btn) btn.classList.add('loading');

            var data = collectFormData(form);
            data.type = type;
            data.timestamp = new Date().toISOString();

            var endpoint = type === 'contact' ? getContactEndpoint() : getEndpoint();

            if (!endpoint || endpoint.includes('VOTRE_ID_ICI')) {
                // Demo mode
                setTimeout(function() {
                    if (btn) btn.classList.remove('loading');
                    showConfirmation(form, confirmationId);
                }, 1000);
                return;
            }

            fetch(endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(function() {
                if (btn) btn.classList.remove('loading');
                showConfirmation(form, confirmationId);
            }).catch(function() {
                if (btn) btn.classList.remove('loading');
                showConfirmation(form, confirmationId);
            });
        }

        function showConfirmation(form, confirmationId) {
            form.style.display = 'none';
            var confirmation = document.getElementById(confirmationId);
            if (confirmation) confirmation.classList.remove('hidden');
        }

        // Beneficiaire form
        var formBenef = document.getElementById('inscription-beneficiaire');
        if (formBenef) {
            formBenef.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm(formBenef, 'beneficiaire', 'confirmation-beneficiaire');
            });
        }

        // Benevole form
        var formBenev = document.getElementById('inscription-benevole');
        if (formBenev) {
            formBenev.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm(formBenev, 'benevole', 'confirmation-benevole');
            });
        }

        // Contact form
        var formContact = document.getElementById('contact-form');
        if (formContact) {
            formContact.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm(formContact, 'contact', 'contact-confirmation');
            });
        }

        // --- Pre-select bénévole from URL parameter ---
        var params = new URLSearchParams(window.location.search);
        if (params.get('type') === 'benevole') {
            var benevoleCard = document.querySelector('.user-type-card[data-type="benevole"]');
            if (benevoleCard) benevoleCard.click();
        }
    });
})();
