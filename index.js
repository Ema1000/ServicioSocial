        const ALLOWED_ROUTES = {
            'administrador': 'login.php?role=administrador',
            'personal':      'login.php?role=personal',
            'estudiante':    'login.php?role=estudiante'
        };

        window.addEventListener('load', function () {
            var preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
                setTimeout(function () { preloader.remove(); }, 400);
            }
        });

        var yearEl = document.getElementById('footer-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#') return;
                var target;
                try { target = document.querySelector(href); } catch (err) { return; }
                if (target) {
                    e.preventDefault();
                    var offsetPosition = target.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: true });
                }
            });
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

        document.querySelectorAll('.fade-in, .footer-section').forEach(function (el) {
            observer.observe(el);
        });

        var headerEl     = document.getElementById('header-index');
        var backToTopBtn = document.getElementById('back-to-top');

        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY;

            if (headerEl) {
                headerEl.style.background = scrollY > 100 ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)';
                headerEl.style.boxShadow  = scrollY > 100 ? '0 2px 10px rgba(0,0,0,0.1)' : 'none';
            }

            if (backToTopBtn) {
                backToTopBtn.classList.toggle('visible', scrollY > 300);
            }
        }, { passive: true });

        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        document.querySelectorAll('.feature-card').forEach(function (card) {
            var icon = card.querySelector('.feature-icon');
            if (!icon) return;
            card.addEventListener('mouseenter', function () {
                icon.style.animation = 'float-avatar 1.8s ease-in-out infinite';
            });
            card.addEventListener('mouseleave', function () {
                icon.style.animation = '';
            });
        });

        document.querySelectorAll('.login-card').forEach(function (card) {
            var icon = card.querySelector('.feature-icon');
            if (!icon) return;
            card.addEventListener('mouseenter', function () {
                icon.style.animation = 'bounce-in 0.5s ease both';
            });
            card.addEventListener('mouseleave', function () {
                icon.style.animation = '';
            });
        });

        document.querySelectorAll('.req-card').forEach(function (card) {
            var num = card.querySelector('.req-number');
            if (!num) return;
            card.addEventListener('mouseenter', function () {
                num.style.animation = 'none';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        num.style.animation = 'pulse 0.6s ease';
                    });
                });
            });
        });

        function navigateToRole(role, cardEl) {
            if (!Object.prototype.hasOwnProperty.call(ALLOWED_ROUTES, role)) return;
            var url = ALLOWED_ROUTES[role];
            if (!url) return;

            if (cardEl) {
                cardEl.classList.add('loading');
                cardEl.style.pointerEvents = 'none';
            }

            setTimeout(function () {
                window.location.href = url;
            }, 500);
        }

        document.querySelectorAll('.login-card').forEach(function (card) {
            card.addEventListener('click', function () {
                navigateToRole(this.getAttribute('data-role'), this);
            });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToRole(this.getAttribute('data-role'), this);
                }
            });
        });
