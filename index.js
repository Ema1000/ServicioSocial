/* ==========================================================
   RUTAS PERMITIDAS DE LOGIN
   Define las rutas válidas según el tipo de usuario.
   Se usa en la función navigateToRole().
========================================================== */
const ALLOWED_ROUTES = {
    'administrador': 'login.html?role=administrador',
    'personal':      'login.html?role=personal',
    'estudiante':    'login.html?role=estudiante'
};


/* ==========================================================
   PRELOADER INICIAL
   Oculta y elimina el preloader cuando la página termina
   de cargar completamente.
========================================================== */
window.addEventListener('load', function () {
    var preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(function () { 
            preloader.remove(); 
        }, 400);
    }
});


/* ==========================================================
   FOOTER - AÑO DINÁMICO
   Inserta automáticamente el año actual en el footer.
========================================================== */
var yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ==========================================================
   SCROLL SUAVE PARA ANCLAS
   Permite navegación suave entre secciones del sitio
   usando enlaces internos (#id).
========================================================== */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target;
        try {
            target = document.querySelector(href);
        } catch (err) {
            return;
        }

        if (target) {
            e.preventDefault();
            var offsetPosition =
                target.getBoundingClientRect().top +
                window.scrollY - 100;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
    });
});


/* ==========================================================
   ANIMACIONES AL HACER SCROLL
   Detecta elementos visibles en pantalla y agrega
   la clase 'visible' para activar animaciones.
========================================================== */
var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -80px 0px'
});

document.querySelectorAll('.fade-in, .footer-section').forEach(function (el) {
    observer.observe(el);
});


/* ==========================================================
   ELEMENTOS PRINCIPALES UI
   Referencias a componentes visuales importantes
   del header y botón flotante.
========================================================== */
var headerEl = document.getElementById('header-index');
var backToTopBtn = document.getElementById('back-to-top');


/* ==========================================================
   EFECTOS DURANTE EL SCROLL
   Cambia estilos del header y muestra/oculta
   el botón "volver arriba".
========================================================== */
window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;

    if (headerEl) {
        headerEl.style.background =
            scrollY > 100
                ? 'rgba(255,255,255,0.98)'
                : 'rgba(255,255,255,0.95)';

        headerEl.style.boxShadow =
            scrollY > 100
                ? '0 2px 10px rgba(0,0,0,0.1)'
                : 'none';
    }

    if (backToTopBtn) {
        backToTopBtn.classList.toggle(
            'visible',
            scrollY > 300
        );
    }
}, { passive: true });


/* ==========================================================
   BOTÓN VOLVER ARRIBA
   Lleva al usuario al inicio de la página
   con animación suave.
========================================================== */
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


/* ==========================================================
   ANIMACIONES EN FEATURE CARDS
   Activa animación flotante en íconos cuando
   el mouse entra o sale del card.
========================================================== */
document.querySelectorAll('.feature-card').forEach(function (card) {
    var icon = card.querySelector('.feature-icon');
    if (!icon) return;

    card.addEventListener('mouseenter', function () {
        icon.style.animation =
            'float-avatar 1.8s ease-in-out infinite';
    });

    card.addEventListener('mouseleave', function () {
        icon.style.animation = '';
    });
});


/* ==========================================================
   ANIMACIONES EN LOGIN CARDS
   Mismo efecto flotante aplicado a las tarjetas
   de acceso/login.
========================================================== */
document.querySelectorAll('.login-card').forEach(function (card) {
    var icon = card.querySelector('.feature-icon');
    if (!icon) return;

    card.addEventListener('mouseenter', function () {
        icon.style.animation =
            'float-avatar 1.8s ease-in-out infinite';
    });

    card.addEventListener('mouseleave', function () {
        icon.style.animation = '';
    });
});


/* ==========================================================
   EFECTO EN TARJETAS DE REQUISITOS
   Reinicia y reproduce animación pulse
   al pasar el mouse sobre cada card.
========================================================== */
document.querySelectorAll('.req-card').forEach(function (card) {
    var num = card.querySelector('.req-number');
    if (!num) return;

    card.addEventListener('mouseenter', function () {
        num.style.animation = 'none';

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                num.style.animation =
                    'pulse 0.6s ease';
            });
        });
    });
});


/* ==========================================================
   NAVEGACIÓN SEGÚN ROL
   Redirecciona al usuario a la ruta correcta
   según su tipo de acceso.
========================================================== */
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


/* ==========================================================
   EVENTOS DE LOGIN CARD
   Permite navegación con click o teclado
   (Enter / Espacio) para accesibilidad.
========================================================== */
document.querySelectorAll('.login-card').forEach(function (card) {
    card.addEventListener('click', function () {
        navigateToRole(
            this.getAttribute('data-role'),
            this
        );
    });

    card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateToRole(
                this.getAttribute('data-role'),
                this
            );
        }
    });
});
