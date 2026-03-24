/**
 * ESSOR — Inscription
 * Toggle type usager, validation, POST Netlify Forms
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

        // --- Submit forms via Netlify ---
        function submitForm(form, confirmationId) {
            if (!validateForm(form)) return;

            var btn = form.querySelector('button[type="submit"]');
            if (btn) btn.classList.add('loading');

            var formData = new FormData(form);

            fetch(form.action || '/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
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
                submitForm(formBenef, 'confirmation-beneficiaire');
            });
        }

        // Benevole form
        var formBenev = document.getElementById('inscription-benevole');
        if (formBenev) {
            formBenev.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm(formBenev, 'confirmation-benevole');
            });
        }

        // Contact form
        var formContact = document.getElementById('contact-form');
        if (formContact) {
            formContact.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm(formContact, 'contact-confirmation');
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
