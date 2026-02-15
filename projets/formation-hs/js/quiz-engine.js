/**
 * Quiz Engine — Moteur QCM réutilisable
 * Charge les questions depuis data/quizzes.json
 * Rendu, validation, feedback, scoring
 */
(function() {
    'use strict';

    class QuizEngine {
        constructor(containerId, moduleId) {
            this.container = document.getElementById(containerId);
            this.moduleId = moduleId;
            this.questions = [];
            this.answers = {};
            this.submitted = false;
            this.score = 0;
        }

        async init() {
            try {
                const response = await fetch('../data/quizzes.json');
                const data = await response.json();
                this.questions = data[this.moduleId] || [];
                if (this.questions.length > 0) {
                    this.render();
                }
            } catch (err) {
                console.warn('Quiz: impossible de charger les questions', err);
            }
        }

        render() {
            if (!this.container) return;

            let html = `
                <div class="quiz-wrapper">
                    <div class="quiz-header">
                        <h3>Quiz — Testez vos connaissances</h3>
                        <p class="text-muted">${this.questions.length} questions</p>
                    </div>
                    <div class="quiz-questions">
            `;

            this.questions.forEach((q, i) => {
                html += `
                    <div class="quiz-question" data-index="${i}">
                        <div class="quiz-q-header">
                            <span class="quiz-q-num">${i + 1}</span>
                            <p class="quiz-q-text">${q.question}</p>
                        </div>
                        <div class="quiz-options">
                `;

                q.options.forEach((opt, j) => {
                    const id = `q${i}_opt${j}`;
                    html += `
                        <label class="quiz-option" for="${id}">
                            <input type="radio" name="q${i}" id="${id}" value="${j}">
                            <span class="quiz-option-text">${opt}</span>
                            <span class="quiz-option-icon"></span>
                        </label>
                    `;
                });

                html += `
                        </div>
                        <div class="quiz-feedback hidden" data-feedback="${i}"></div>
                    </div>
                `;
            });

            html += `
                    </div>
                    <div class="quiz-actions">
                        <button class="btn btn-primary quiz-submit-btn" id="quizSubmit">
                            Valider mes réponses
                        </button>
                    </div>
                    <div class="quiz-result hidden" id="quizResult"></div>
                </div>
            `;

            this.container.innerHTML = html;
            this.bindEvents();
        }

        bindEvents() {
            // Track answers
            this.container.querySelectorAll('input[type="radio"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    const name = e.target.name;
                    this.answers[name] = parseInt(e.target.value);

                    // Update visual selection
                    const question = e.target.closest('.quiz-question');
                    question.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.quiz-option').classList.add('selected');
                });
            });

            // Submit
            const submitBtn = document.getElementById('quizSubmit');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submit());
            }
        }

        submit() {
            if (this.submitted) return;

            const total = this.questions.length;
            const answered = Object.keys(this.answers).length;

            if (answered < total) {
                const unanswered = total - answered;
                if (!confirm(`Il reste ${unanswered} question(s) sans réponse. Valider quand même ?`)) {
                    return;
                }
            }

            this.submitted = true;
            this.score = 0;

            this.questions.forEach((q, i) => {
                const answer = this.answers[`q${i}`];
                const correct = answer === q.correct;
                if (correct) this.score++;

                const questionEl = this.container.querySelector(`.quiz-question[data-index="${i}"]`);
                const feedbackEl = questionEl.querySelector(`[data-feedback="${i}"]`);

                // Mark correct/incorrect options
                questionEl.querySelectorAll('.quiz-option').forEach((opt, j) => {
                    const input = opt.querySelector('input');
                    input.disabled = true;

                    if (j === q.correct) {
                        opt.classList.add('correct');
                    } else if (j === answer && !correct) {
                        opt.classList.add('incorrect');
                    }
                });

                // Show feedback
                feedbackEl.classList.remove('hidden');
                feedbackEl.className = `quiz-feedback ${correct ? 'feedback-correct' : 'feedback-incorrect'}`;
                feedbackEl.innerHTML = `
                    <span class="feedback-icon">${correct ? '✓' : '✗'}</span>
                    <span class="feedback-text">${q.feedback || (correct ? 'Bonne réponse !' : 'Mauvaise réponse.')}</span>
                `;
            });

            // Show result
            const resultEl = document.getElementById('quizResult');
            const pct = Math.round((this.score / total) * 100);
            const passed = pct >= 70;

            resultEl.classList.remove('hidden');
            resultEl.className = `quiz-result ${passed ? 'result-pass' : 'result-fail'}`;
            resultEl.innerHTML = `
                <div class="result-score">
                    <div class="result-circle ${passed ? 'pass' : 'fail'}">
                        <span class="result-pct">${pct}%</span>
                    </div>
                    <div class="result-details">
                        <h4>${passed ? 'Félicitations !' : 'À revoir'}</h4>
                        <p>${this.score}/${total} réponses correctes</p>
                        <p class="text-muted">${passed ? 'Vous maîtrisez ce module.' : 'Relisez le contenu et retentez le quiz.'}</p>
                    </div>
                </div>
                <button class="btn btn-outline quiz-retry-btn" onclick="location.reload()">
                    Retenter le quiz
                </button>
            `;

            // Update submit button
            const submitBtn = document.getElementById('quizSubmit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Quiz terminé';

            // Save progress
            if (window.ProgressTracker) {
                window.ProgressTracker.saveQuizScore(this.moduleId, this.score, total);
            }

            // Scroll to result
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Expose globally
    window.QuizEngine = QuizEngine;
})();
