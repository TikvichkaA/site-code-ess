/* ============================================
   Du vent dans les pages — Scripts
============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // Mobile nav toggle
    // ============================================
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            navToggle.classList.toggle('active');
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                navToggle.classList.remove('active');
            });
        });
    }

    // ============================================
    // Header scroll
    // ============================================
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    });

    // ============================================
    // Scroll Reveal
    // ============================================
    const revealElements = document.querySelectorAll('[data-reveal]');

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
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // ============================================
    // Book catalogue filter
    // ============================================
    const catFilters = document.querySelectorAll('.cat-filter');
    const bookCards = document.querySelectorAll('.book-card');

    catFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            catFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            bookCards.forEach(card => {
                const genre = card.dataset.genre;
                if (filter === 'all' || genre === filter) {
                    card.style.display = '';
                    card.style.animation = 'fadeInUp 0.4s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ============================================
    // Shopping Cart
    // ============================================
    let cart = [];
    const cartToggle = document.querySelector('.cart-toggle');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartClose = document.querySelector('.cart-close');
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalEl = document.querySelector('.cart-total strong');
    const cartFooter = document.querySelector('.cart-footer');

    function openCart() {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    function updateCartUI() {
        // Update count
        const count = cart.length;
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.classList.toggle('empty', count === 0);
        }

        // Update items display
        if (cartItemsContainer) {
            if (count === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="cart-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                        <p>Votre panier est vide</p>
                    </div>`;
                if (cartFooter) cartFooter.style.display = 'none';
            } else {
                let html = '';
                cart.forEach((item, index) => {
                    html += `
                        <div class="cart-item">
                            <div class="cart-item-cover ${item.coverClass}" style="font-size:0.55rem;">
                                ${item.title}
                            </div>
                            <div class="cart-item-info">
                                <div class="cart-item-title">${item.title}</div>
                                <div class="cart-item-author">${item.author}</div>
                                <div class="cart-item-price">${item.price.toFixed(2).replace('.', ',')} &euro;</div>
                            </div>
                            <button class="cart-item-remove" data-index="${index}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>`;
                });
                cartItemsContainer.innerHTML = html;
                if (cartFooter) cartFooter.style.display = '';

                // Remove buttons
                cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.index);
                        cart.splice(idx, 1);
                        updateCartUI();
                        showToast('Article retiré du panier');
                    });
                });
            }
        }

        // Update total
        if (cartTotalEl) {
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            cartTotalEl.textContent = total.toFixed(2).replace('.', ',') + ' \u20AC';
        }
    }

    // Add to cart buttons
    document.querySelectorAll('.btn-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.book-card');
            const item = {
                title: card.querySelector('.book-title').textContent,
                author: card.querySelector('.book-author').textContent,
                price: parseFloat(card.dataset.price),
                coverClass: card.querySelector('.book-cover-art').className.split(' ').pop()
            };

            cart.push(item);
            updateCartUI();

            // Button feedback
            const originalHTML = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Ajouté';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = originalHTML;
            }, 1500);

            showToast('Ajouté au panier : ' + item.title);
        });
    });

    // Initialize cart UI
    updateCartUI();

    // ============================================
    // Toast notifications
    // ============================================
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            ${message}`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // ============================================
    // Contact form
    // ============================================
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message envoyé avec succès !');
            contactForm.reset();
        });
    }

    // ============================================
    // Checkout button
    // ============================================
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                showToast('Redirection vers le paiement sécurisé...');
            }
        });
    }

    // ============================================
    // Fade-in keyframe injection
    // ============================================
    if (!document.getElementById('dvdlp-animations')) {
        const style = document.createElement('style');
        style.id = 'dvdlp-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

});
