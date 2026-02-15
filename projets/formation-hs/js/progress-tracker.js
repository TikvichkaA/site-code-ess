/**
 * Progress Tracker — Suivi progression localStorage
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'formation-hs-progress';

    function getProgress() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function saveProgress(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('ProgressTracker: impossible de sauvegarder');
        }
    }

    const ProgressTracker = {
        // Marquer un module comme commencé
        startModule(moduleId) {
            const progress = getProgress();
            if (!progress[moduleId]) {
                progress[moduleId] = { started: true, completed: false, quizScore: null, quizTotal: null, startedAt: Date.now() };
            } else {
                progress[moduleId].started = true;
            }
            saveProgress(progress);
        },

        // Marquer un module comme terminé
        completeModule(moduleId) {
            const progress = getProgress();
            if (!progress[moduleId]) {
                progress[moduleId] = { started: true, completed: true, quizScore: null, quizTotal: null };
            }
            progress[moduleId].completed = true;
            progress[moduleId].completedAt = Date.now();
            saveProgress(progress);
        },

        // Sauvegarder le score quiz
        saveQuizScore(moduleId, score, total) {
            const progress = getProgress();
            if (!progress[moduleId]) {
                progress[moduleId] = { started: true, completed: false };
            }
            progress[moduleId].quizScore = score;
            progress[moduleId].quizTotal = total;

            // Auto-complete si score >= 70%
            if (score / total >= 0.7) {
                progress[moduleId].completed = true;
                progress[moduleId].completedAt = Date.now();
            }
            saveProgress(progress);
        },

        // Obtenir le statut d'un module
        getModuleStatus(moduleId) {
            const progress = getProgress();
            return progress[moduleId] || { started: false, completed: false, quizScore: null, quizTotal: null };
        },

        // Obtenir la progression globale
        getOverallProgress() {
            const progress = getProgress();
            const totalModules = 9;
            let completed = 0;
            let started = 0;

            for (let i = 1; i <= totalModules; i++) {
                const mod = progress[`module-${i}`];
                if (mod) {
                    if (mod.completed) completed++;
                    else if (mod.started) started++;
                }
            }

            return {
                total: totalModules,
                completed,
                started,
                percentage: Math.round((completed / totalModules) * 100)
            };
        },

        // Réinitialiser
        reset() {
            localStorage.removeItem(STORAGE_KEY);
        },

        // Obtenir toutes les données
        getAll() {
            return getProgress();
        },

        // Mettre à jour l'UI du dashboard
        updateDashboard() {
            const overall = this.getOverallProgress();

            // Barre de progression globale
            const progressFill = document.querySelector('.global-progress-fill');
            const progressText = document.querySelector('.global-progress-text');
            if (progressFill) progressFill.style.width = overall.percentage + '%';
            if (progressText) progressText.textContent = `${overall.completed}/${overall.total} modules complétés (${overall.percentage}%)`;

            // Statut par module
            for (let i = 1; i <= 9; i++) {
                const status = this.getModuleStatus(`module-${i}`);
                const card = document.querySelector(`[data-module="module-${i}"]`);
                if (!card) continue;

                const badge = card.querySelector('.module-status');
                const scoreEl = card.querySelector('.module-score');

                if (status.completed) {
                    card.classList.add('completed');
                    card.classList.remove('in-progress');
                    if (badge) { badge.textContent = 'Terminé'; badge.className = 'module-status badge badge-accent'; }
                } else if (status.started) {
                    card.classList.add('in-progress');
                    if (badge) { badge.textContent = 'En cours'; badge.className = 'module-status badge badge-warning'; }
                }

                if (status.quizScore !== null && scoreEl) {
                    scoreEl.textContent = `Quiz: ${status.quizScore}/${status.quizTotal}`;
                    scoreEl.classList.remove('hidden');
                }
            }
        }
    };

    window.ProgressTracker = ProgressTracker;

    // Auto-update dashboard on load
    document.addEventListener('DOMContentLoaded', function() {
        if (document.querySelector('.dashboard')) {
            ProgressTracker.updateDashboard();
        }

        // Auto-start tracking for current module
        const moduleMatch = window.location.pathname.match(/module-(\d+)/);
        if (moduleMatch) {
            ProgressTracker.startModule(`module-${moduleMatch[1]}`);
        }
    });
})();
