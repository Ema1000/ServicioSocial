/* <--- PRELOADER ---> */
function initPreloader() {
    window.addEventListener('load', function () {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
        }
    });
}

/* <--- MODAL UNIVERSAL ---> */
function initModal() {
    const overlay = document.getElementById('modalOverlay');

    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
}

function cerrarModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function modalSuccess(titulo, texto, callback) {
    _abrirModal('modal-success', 'fas fa-check-circle', titulo, texto, [
        {
            label   : '<i class="fas fa-check"></i> Aceptar',
            clase   : 'modal-btn btn-success',
            accion  : callback || null,
        },
    ]);
}

function modalConfirm(titulo, texto, callback) {
    _abrirModal('modal-confirm', 'fas fa-circle-question', titulo, texto, [
        {
            label   : '<i class="fas fa-times"></i> Cancelar',
            clase   : 'modal-btn btn-cancel',
            accion  : null,
        },
        {
            label   : '<i class="fas fa-check"></i> Confirmar',
            clase   : 'modal-btn btn-confirm',
            accion  : callback || null,
        },
    ]);
}

function modalError(titulo, texto, callback) {
    _abrirModal('modal-error', 'fas fa-circle-xmark', titulo, texto, [
        {
            label   : '<i class="fas fa-times"></i> Cerrar',
            clase   : 'modal-btn btn-error',
            accion  : callback || null,
        },
    ]);
}

function modalWarning(titulo, texto, callback) {
    const botones = callback
        ? [
            {
                label   : '<i class="fas fa-times"></i> Cancelar',
                clase   : 'modal-btn btn-cancel',
                accion  : null,
            },
            {
                label   : '<i class="fas fa-forward"></i> Continuar',
                clase   : 'modal-btn btn-warning',
                accion  : callback,
            },
          ]
        : [
            {
                label   : '<i class="fas fa-times"></i> Cerrar',
                clase   : 'modal-btn btn-warning',
                accion  : null,
            },
          ];

    _abrirModal('modal-warning', 'fas fa-triangle-exclamation', titulo, texto, botones);
}

function _abrirModal(variante, icono, titulo, texto, botones) {
    const overlay  = document.getElementById('modalOverlay');
    const content  = document.getElementById('modalContent');
    const elIcono  = document.getElementById('modalIcon');
    const elTitulo = document.getElementById('modalTitle');
    const elTexto  = document.getElementById('modalText');
    const elAccion = document.getElementById('modalActions');

    content.className    = 'modal-content ' + variante;
    elIcono.className    = 'modal-icon ' + icono;
    elTitulo.textContent = titulo || '';
    elTexto.textContent  = texto  || '';
    elAccion.innerHTML   = '';

    botones.forEach(function (btn) {
        const boton     = document.createElement('button');
        boton.className = btn.clase;
        boton.innerHTML = btn.label;
        boton.addEventListener('click', function () {
            cerrarModal();
            if (typeof btn.accion === 'function') {
                btn.accion();
            }
        });
        elAccion.appendChild(boton);
    });

    overlay.classList.add('show');
}

/* <--- BUSCADOR ---> */
function crearBuscador(config) {
    const {
        input,
        btnClear,
        contenedorSugerencias,
        datos = [],
        campos = [],
        formatearItem = (item) => item.toString(),
        onSeleccion = () => {},
        onBusqueda = () => {},
        onLimpiar = () => {},
        delay = 400,
        usarCache = true
    } = config;

    if (!input || !btnClear || !contenedorSugerencias) return;

    let indexActivo = -1;
    let resultadosActuales = [];
    let timeoutBusqueda;
    let cache = new Map();
    let requestId = 0;

    function normalizar(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function highlight(text, query) {
        if (!text || !query) return text;
        const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${q})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
    }

    async function buscar(query) {
        const q = normalizar(query.trim());
        if (!q) return [];

        if (usarCache && cache.has(q)) {
            return cache.get(q);
        }

        let resultados;

        if (typeof config.buscar === 'function') {
            resultados = await config.buscar(query);
        } else {
            resultados = datos.filter(item =>
                campos.some(campo =>
                    normalizar(item[campo] || '').includes(q)
                )
            );
        }

        if (usarCache) cache.set(q, resultados);

        return resultados;
    }

    function mostrarLoader() {
        contenedorSugerencias.innerHTML =
            `<div class="loading">Buscando...</div>`;
        contenedorSugerencias.classList.add('active');
    }

    async function renderizarSugerencias(query, resultados) {
        resultadosActuales = resultados;
        indexActivo = -1;

        if (!resultados.length) {
            contenedorSugerencias.innerHTML =
                `<div class="no-suggestions">Sin resultados</div>`;
        } else {
            contenedorSugerencias.innerHTML = resultados
                .slice(0, 8)
                .map((item, i) => `
                    <div class="suggestion-item" data-index="${i}">
                        ${formatearItem(item, query, highlight)}
                    </div>
                `).join('');
        }

        contenedorSugerencias.classList.add('active');
    }

    function actualizarActivo() {
        const items = contenedorSugerencias.querySelectorAll('.suggestion-item');
        items.forEach(el => el.classList.remove('active'));

        if (items[indexActivo]) {
            items[indexActivo].classList.add('active');
            items[indexActivo].scrollIntoView({ block: 'nearest' });
        }
    }

    function seleccionar(index) {
        const item = resultadosActuales[index];
        if (!item) return;

        onSeleccion(item);
        contenedorSugerencias.classList.remove('active');
    }

    input.addEventListener('input', function () {
        const val = this.value.trim();
        btnClear.style.display = val ? 'flex' : 'none';

        clearTimeout(timeoutBusqueda);

        if (!val) {
            contenedorSugerencias.classList.remove('active');
            onLimpiar();
            return;
        }

        mostrarLoader();

        timeoutBusqueda = setTimeout(async () => {
            const currentRequest = ++requestId;

            const resultados = await buscar(val);

            if (currentRequest !== requestId) return;

            await renderizarSugerencias(val, resultados);
            onBusqueda(resultados, val);

        }, delay);
    });

    input.addEventListener('keydown', function (e) {
        const total = resultadosActuales.length;
        if (!total) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            indexActivo = (indexActivo + 1) % total;
            actualizarActivo();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            indexActivo = (indexActivo - 1 + total) % total;
            actualizarActivo();
        }

        if (e.key === 'Enter') {
            e.preventDefault();

            if (indexActivo >= 0) {
                seleccionar(indexActivo);
            } else {
                contenedorSugerencias.classList.remove('active');
                onBusqueda(resultadosActuales, this.value);
            }
        }

        if (e.key === 'Escape') {
            contenedorSugerencias.classList.remove('active');
        }
    });

    contenedorSugerencias.addEventListener('click', function (e) {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;

        const index = parseInt(item.dataset.index);
        seleccionar(index);
    });

    btnClear.addEventListener('click', () => {
        input.value = '';
        btnClear.style.display = 'none';
        contenedorSugerencias.classList.remove('active');
        onLimpiar();
        input.focus();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group')) {
            contenedorSugerencias.classList.remove('active');
        }
    });
}
/* <--- CARRUSEL ---> */
function initCarrusel(config) {
    const {
        trackId      = 'carouselTrack',
        cardSelector = '.carousel-card',
        activeClass  = 'active',
        onActivar    = () => {},
        onDesactivar = () => {},
    } = config || {};

    const track = document.getElementById(trackId);
    if (!track) return null;

    const cards = () => track.querySelectorAll(cardSelector);

    let claveActiva = null;

    /* ── Activar / desactivar una card ── */
    function activar(key, card) {
        if (claveActiva === key) {
            /* Toggle: desactivar */
            card.classList.remove(activeClass);
            claveActiva = null;
            onDesactivar(key, card);
            return;
        }

        /* Desactivar la anterior */
        cards().forEach(c => c.classList.remove(activeClass));

        card.classList.add(activeClass);
        claveActiva = key;
        onActivar(key, card);
    }

    /* ── Desactivar todas desde fuera ── */
    function desactivarTodas() {
        cards().forEach(c => c.classList.remove(activeClass));
        claveActiva = null;
    }

    /* ── Activar por clave desde fuera ── */
    function activarPorClave(key) {
        const card = track.querySelector(`${cardSelector}[data-key="${CSS.escape(key)}"]`);
        if (card) activar(key, card);
    }

    /* ── Bind de clicks ── */
    track.addEventListener('click', function (e) {
        const card = e.target.closest(cardSelector);
        if (!card) return;

        /* Ignorar clicks en el checkbox interno */
        if (e.target.closest('.card-check')) return;

        const key = card.dataset.key;
        if (!key) return;

        activar(key, card);
    });

    /* ── Scroll con arrastre (drag-to-scroll) ── */
    let isDown  = false;
    let startX  = 0;
    let scrollL = 0;

    track.addEventListener('mousedown', e => {
        if (e.target.closest('.card-check')) return;
        isDown  = true;
        startX  = e.pageX - track.offsetLeft;
        scrollL = track.scrollLeft;
        track.style.cursor = 'grabbing';
    });

    track.addEventListener('mouseleave', () => {
        isDown = false;
        track.style.cursor = '';
    });

    track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.cursor = '';
    });

    track.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x    = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.2;
        track.scrollLeft = scrollL - walk;
    });

    /* ── API pública ── */
    return {
        activar         : activarPorClave,
        desactivarTodas,
        getClave        : () => claveActiva,
    };
}