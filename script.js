// ============================================
// Navigation Mobile
// ============================================
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Fermer le menu quand on clique sur un lien
navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ============================================
// Header au scroll (class-based)
// ============================================
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}, { passive: true });

// ============================================
// Dark Mode Toggle
// ============================================
const darkToggle = document.getElementById('dark-toggle');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Init from saved preference or system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
}

darkToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ============================================
// Cursor Glow Effect (desktop only)
// ============================================
const cursorGlow = document.querySelector('.cursor-glow');

if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.classList.add('active');
    });

    document.addEventListener('mouseleave', () => {
        cursorGlow.classList.remove('active');
    });

    // Smooth follow with requestAnimationFrame
    function animateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        cursorGlow.style.left = glowX + 'px';
        cursorGlow.style.top = glowY + 'px';
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

// ============================================
// Scroll Reveal System (data-reveal + data-delay)
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay;
            if (delay !== undefined) {
                entry.target.style.transitionDelay = `${parseInt(delay) * 0.15}s`;
            }
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
});

document.querySelectorAll('[data-reveal]').forEach(el => {
    revealObserver.observe(el);
});

// ============================================
// Parallax Effects (multi-layer)
// ============================================
const heroBg = document.querySelector('.hero-bg');
const shapes = document.querySelectorAll('.shape');
let ticking = false;

function updateParallax() {
    const scroll = window.pageYOffset;
    const heroHeight = window.innerHeight;

    if (scroll < heroHeight * 1.5) {
        // Hero background parallax
        if (heroBg) {
            heroBg.style.transform = `translate3d(0, ${scroll * 0.3}px, 0)`;
        }

        // Floating shapes parallax (different speeds)
        shapes.forEach((shape, index) => {
            const speed = 0.1 + (index * 0.08);
            const yOffset = scroll * speed;
            const currentTransform = getComputedStyle(shape).transform;
            shape.style.transform = `translate3d(0, ${yOffset}px, 0)`;
        });
    }

    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
}, { passive: true });

// ============================================
// Tilt Effect on Service Cards (desktop only)
// ============================================
if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -4;
            const rotateY = (x - centerX) / centerX * 4;

            card.style.transform = `translateY(-12px) scale(1.02) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// Magnetic Buttons (subtle pull toward cursor)
// ============================================
if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-nav').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.02)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// ============================================
// Gestion du formulaire
// ============================================
const contactForm = document.getElementById('contact-form');

contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        if (response.ok) {
            showNotification('Message envoyé avec succès ! Je vous répondrai rapidement.', 'success');
            contactForm.reset();
        } else {
            throw new Error('Erreur réseau');
        }
    } catch (error) {
        showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// Notifications
// ============================================
function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 10px 40px rgb(0 0 0 / 0.2)',
        zIndex: '10000',
        animation: 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        background: type === 'success' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        fontWeight: '500',
        backdropFilter: 'blur(10px)'
    });

    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translate3d(100%, 0, 0); opacity: 0; }
                to { transform: translate3d(0, 0, 0); opacity: 1; }
            }
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                opacity: 0.8;
                transition: opacity 0.2s ease;
            }
            .notification button:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// ============================================
// Smooth scroll pour les ancres
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// Counter Animation (triggered on scroll)
// ============================================
function animateCounter(element, target, suffix = '', duration = 1500) {
    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Observe hero stats for counter animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.counter);
            const suffix = el.dataset.suffix || '';
            if (!isNaN(target)) {
                animateCounter(el, target, suffix);
            }
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => {
    statsObserver.observe(el);
});
