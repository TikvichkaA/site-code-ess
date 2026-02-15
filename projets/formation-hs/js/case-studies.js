/**
 * Case Studies — Études de cas interactives
 */
(function() {
    'use strict';

    class CaseStudy {
        constructor(container, data) {
            this.container = typeof container === 'string' ? document.getElementById(container) : container;
            this.data = data;
            this.currentStep = 0;
            this.choices = [];
        }

        render() {
            if (!this.container || !this.data) return;
            this.showStep(0);
        }

        showStep(index) {
            const step = this.data.steps[index];
            if (!step) return;

            this.currentStep = index;

            let html = `
                <div class="case-study-card">
                    <div class="case-study-header">
                        <span class="badge badge-info">Étude de cas</span>
                        <h4>${this.data.title}</h4>
                    </div>
                    <div class="case-study-scenario">
                        <p>${step.scenario}</p>
                    </div>
            `;

            if (step.choices) {
                html += `<div class="case-study-choices">`;
                html += `<p class="case-study-question"><strong>${step.question}</strong></p>`;
                step.choices.forEach((choice, i) => {
                    html += `
                        <button class="case-study-choice" data-choice="${i}" data-correct="${choice.correct || false}">
                            <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
                            <span class="choice-text">${choice.text}</span>
                        </button>
                    `;
                });
                html += `</div>`;
                html += `<div class="case-study-feedback hidden"></div>`;
            }

            if (step.conclusion) {
                html += `
                    <div class="case-study-conclusion">
                        <div class="encadre encadre-pratique">
                            <div class="encadre-titre">Conclusion</div>
                            <p>${step.conclusion}</p>
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
            this.container.innerHTML = html;

            // Bind choice events
            this.container.querySelectorAll('.case-study-choice').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleChoice(e, step));
            });
        }

        handleChoice(e, step) {
            const btn = e.currentTarget;
            const choiceIndex = parseInt(btn.dataset.choice);
            const isCorrect = btn.dataset.correct === 'true';
            const choice = step.choices[choiceIndex];

            // Disable all buttons
            this.container.querySelectorAll('.case-study-choice').forEach(b => {
                b.disabled = true;
                if (b.dataset.correct === 'true') b.classList.add('correct');
            });

            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            this.choices.push({ step: this.currentStep, choice: choiceIndex, correct: isCorrect });

            // Show feedback
            const feedbackEl = this.container.querySelector('.case-study-feedback');
            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                feedbackEl.className = `case-study-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
                feedbackEl.innerHTML = `
                    <span class="feedback-icon">${isCorrect ? '✓' : '✗'}</span>
                    <span class="feedback-text">${choice.feedback || (isCorrect ? 'Bonne réponse !' : 'Ce n\'est pas la meilleure réponse.')}</span>
                `;

                // Show next button if more steps
                if (this.currentStep < this.data.steps.length - 1) {
                    feedbackEl.innerHTML += `
                        <button class="btn btn-sm btn-primary case-study-next mt-2">Étape suivante &rarr;</button>
                    `;
                    feedbackEl.querySelector('.case-study-next').addEventListener('click', () => {
                        this.showStep(this.currentStep + 1);
                    });
                }
            }
        }
    }

    window.CaseStudy = CaseStudy;
})();
