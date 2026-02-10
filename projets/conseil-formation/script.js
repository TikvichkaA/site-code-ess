// ============================================
// Navigation Mobile
// ============================================
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Fermer le menu au clic sur un lien
navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ============================================
// Header scroll effect
// ============================================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ============================================
// Scroll Reveal
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay;
            if (delay !== undefined) {
                entry.target.style.transitionDelay = `${parseInt(delay) * 0.12}s`;
            }
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
});

document.querySelectorAll('[data-reveal]').forEach(el => {
    revealObserver.observe(el);
});

// ============================================
// Form Tabs (Contact / Devis)
// ============================================
const formTabs = document.querySelectorAll('.form-tab');
const contactForm = document.getElementById('contact-form');
const devisForm = document.getElementById('devis-form');

formTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        formTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (target === 'contact') {
            contactForm.dataset.active = 'true';
            devisForm.dataset.active = 'false';
        } else {
            contactForm.dataset.active = 'false';
            devisForm.dataset.active = 'true';
        }
    });
});

// Lien "Demander un devis" depuis les offres -> switch sur l'onglet devis
document.querySelectorAll('a[data-form-type]').forEach(link => {
    link.addEventListener('click', (e) => {
        const type = link.dataset.formType;

        // Switch to devis tab
        formTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="devis"]')?.classList.add('active');
        if (contactForm) contactForm.dataset.active = 'false';
        if (devisForm) devisForm.dataset.active = 'true';

        // Pre-fill le select prestation
        const prestationSelect = document.getElementById('d-prestation');
        if (prestationSelect) {
            const mapping = {
                'management': 'management',
                'commercial': 'commercial',
                'formation': 'formation'
            };
            prestationSelect.value = mapping[type] || '';
        }
    });
});

// ============================================
// Form Submissions
// ============================================
function handleFormSubmit(form, type) {
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Envoi en cours...</span>';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Simulation d'envoi (remplacer par votre backend)
            await new Promise(resolve => setTimeout(resolve, 1200));

            console.log(`[${type}] Données du formulaire :`, data);

            if (type === 'contact') {
                showNotification('Message envoyé avec succès ! Nous vous répondrons sous 24h.', 'success');
            } else if (type === 'devis') {
                showNotification('Demande de devis envoyée ! Nous vous recontacterons rapidement.', 'success');
            } else if (type === 'download') {
                showNotification('Vous allez recevoir le document par email dans quelques instants.', 'success');
                closeDownloadModal();
            }

            form.reset();
        } catch (error) {
            showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    });
}

handleFormSubmit(document.getElementById('contact-form'), 'contact');
handleFormSubmit(document.getElementById('devis-form'), 'devis');
handleFormSubmit(document.getElementById('download-form'), 'download');

// ============================================
// Download Modal (Livres Blancs)
// ============================================
const downloadModal = document.getElementById('download-modal');
const modalClose = document.getElementById('modal-close');
const downloadResource = document.getElementById('download-resource');

document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', () => {
        const resourceName = btn.dataset.resource;
        if (downloadResource) downloadResource.value = resourceName;
        openDownloadModal();
    });
});

function openDownloadModal() {
    downloadModal?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDownloadModal() {
    downloadModal?.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose?.addEventListener('click', closeDownloadModal);

downloadModal?.addEventListener('click', (e) => {
    if (e.target === downloadModal) closeDownloadModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDownloadModal();
});

// ============================================
// Notifications
// ============================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease forwards';
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

// ============================================
// Smooth scroll
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '#mentions') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = header.offsetHeight + 20;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});
