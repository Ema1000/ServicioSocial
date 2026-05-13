/* <--- PRELOADER ---> */
function initPreloader() {
    function ocultarPreloader() {
        var preloader = document.getElementById('preloader');
        if (!preloader) return;
        preloader.classList.add('hidden');
        preloader.addEventListener('transitionend', function () {
            if (preloader.parentNode) preloader.remove();
        }, { once: true });
        /* Fallback: si la transición no dispara (display:none), limpiar a los 600ms */
        setTimeout(function () {
            if (preloader.parentNode) preloader.remove();
        }, 600);
    }

    if (document.readyState === 'complete') {
        ocultarPreloader();
    } else {
        window.addEventListener('load', ocultarPreloader, { once: true });
    }
}

/* <--- MODAL UNIVERSAL ---> */

function _onEscapeKey(e) {
    if (e.key === 'Escape') cerrarModal();
}

/* <--- initModal ---> */
function initModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrarModal();
        });
    }
    document.removeEventListener('keydown', _onEscapeKey);
    document.addEventListener('keydown', _onEscapeKey);
}

/* <--- cerrarModal ---> */
function cerrarModal() {
    var overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.removeAttribute('aria-hidden');
    if (overlay._triggerEl && typeof overlay._triggerEl.focus === 'function') {
        overlay._triggerEl.focus();
        overlay._triggerEl = null;
    }
}

/* <--- modalSuccess ---> */
function modalSuccess(titulo, texto, callback) {
    _abrirModal('modal-success', 'fas fa-check-circle', titulo, texto, [
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar', clase: 'modal-btn btn-success', accion: callback || null },
    ]);
}

/* <--- modalError ---> */
function modalError(titulo, texto, callback) {
    _abrirModal('modal-error', 'fas fa-circle-xmark', titulo, texto, [
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar', clase: 'modal-btn btn-error', accion: callback || null },
    ]);
}

/* <--- modalWarning ---> */
function modalWarning(titulo, texto, callback) {
    _abrirModal('modal-warning', 'fas fa-exclamation-triangle', titulo, texto, [
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar', clase: 'modal-btn btn-warning', accion: callback || null },
    ]);
}

/* <--- modalConfirmSuccess ---> */
function modalConfirmSuccess(titulo, texto, callback) {
    _abrirModal('modal-success', 'fas fa-circle-question', titulo, texto, [
        { label: '<i class="fas fa-times" aria-hidden="true"></i> Cancelar', clase: 'modal-btn btn-white',   accion: null },
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar',  clase: 'modal-btn btn-success', accion: callback || null },
    ]);
}

/* <--- modalConfirmError ---> */
function modalConfirmError(titulo, texto, callback) {
    _abrirModal('modal-error', 'fas fa-exclamation-triangle', titulo, texto, [
        { label: '<i class="fas fa-times" aria-hidden="true"></i> Cancelar', clase: 'modal-btn btn-white', accion: null },
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar',  clase: 'modal-btn btn-error',  accion: callback || null },
    ]);
}

/* <--- modalConfirmWarning ---> */
function modalConfirmWarning(titulo, texto, callback) {
    _abrirModal('modal-warning', 'fas fa-exclamation-triangle', titulo, texto, [
        { label: '<i class="fas fa-times" aria-hidden="true"></i> Cancelar', clase: 'modal-btn btn-white',   accion: null },
        { label: '<i class="fas fa-check" aria-hidden="true"></i> Aceptar',  clase: 'modal-btn btn-warning', accion: callback || null },
    ]);
}

/* <--- _abrirModal ---> */
function _abrirModal(variante, icono, titulo, texto, botones) {
    var overlay  = document.getElementById('modalOverlay');
    var content  = document.getElementById('modalContent');
    var elIcono  = document.getElementById('modalIcon');
    var elTitulo = document.getElementById('modalTitle');
    var elTexto  = document.getElementById('modalText');
    var elAccion = document.getElementById('modalActions');

    if (!overlay || !content || !elIcono || !elTitulo || !elTexto || !elAccion) {
        console.error('Modal: faltan elementos en el DOM. Verifica los IDs del HTML.');
        return;
    }

    overlay._triggerEl = document.activeElement;

    content.className    = 'modal-content ' + variante;
    elIcono.className    = 'modal-icon ' + icono;
    elTitulo.textContent = titulo || '';
    /* textContent previene XSS — NO usar innerHTML para texto de usuario */
    elTexto.textContent  = texto  || '';
    elAccion.innerHTML   = '';

    botones.forEach(function (btn) {
        var boton       = document.createElement('button');
        boton.type      = 'button';
        boton.className = btn.clase;
        /* label es HTML interno controlado, no entrada de usuario */
        boton.innerHTML = btn.label;
        boton.addEventListener('click', function () {
            cerrarModal();
            if (typeof btn.accion === 'function') btn.accion();
        });
        elAccion.appendChild(boton);
    });

    overlay.classList.add('show');
    /* Trampa de foco: enfocar primer botón del modal */
    var primerBoton = elAccion.querySelector('button');
    if (primerBoton) {
        requestAnimationFrame(function () { primerBoton.focus(); });
    }
}

/* <--- initPasswordStrength ---> */
function initPasswordStrength(opciones) {
    var fillId  = (opciones && opciones.fillId)  || 'passStrengthFill';
    var labelId = (opciones && opciones.labelId) || 'passStrengthLabel';
    var inputId = (opciones && opciones.inputId) || 'password';
    var minLen  = (opciones && opciones.minLen)  || 5;
    var maxLen  = (opciones && opciones.maxLen)  || 20;

    var COLOR_CLASES = ['pass--muy-debil', 'pass--debil', 'pass--buena', 'pass--fuerte'];

    function limpiarColorClases(el) {
        COLOR_CLASES.forEach(function (c) { el.classList.remove(c); });
    }

    /* CORRECCIÓN: score 0 explícito cuando longitud < minLen */
    function calcularScore(v) {
        if (v.length < minLen) return 0;
        var s = 1; /* longitud mínima cumplida */
        if (/[A-Z]/.test(v))       s++;
        if (/[0-9]/.test(v))       s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        return Math.min(s, 4);
    }

    function actualizarFortaleza(v) {
        var fill  = document.getElementById(fillId);
        var label = document.getElementById(labelId);
        if (!fill || !label) return;

        limpiarColorClases(fill);
        limpiarColorClases(label);

        if (v.length === 0) {
            fill.style.width  = '0%';
            fill.setAttribute('aria-valuenow', '0');
            label.textContent = 'Escribe para ver la fortaleza';
            return;
        }

        if (v.length > maxLen) {
            fill.style.width  = '100%';
            fill.setAttribute('aria-valuenow', '100');
            fill.classList.add('pass--muy-debil');
            label.classList.add('pass--muy-debil');
            label.textContent = 'Máximo ' + maxLen + ' caracteres';
            return;
        }

        /* CORRECCIÓN: eliminado índice duplicado en configs (antes índice 0 y 1 eran iguales,
           causando que score=1 se tratara como score=0) */
        var configs = [
            { pct: '15%',  clase: 'pass--muy-debil', text: 'Mínimo ' + minLen + ' caracteres' },
            { pct: '25%',  clase: 'pass--muy-debil', text: 'Muy débil'                        },
            { pct: '50%',  clase: 'pass--debil',     text: 'Débil'                            },
            { pct: '75%',  clase: 'pass--buena',     text: 'Buena'                            },
            { pct: '100%', clase: 'pass--fuerte',    text: 'Muy fuerte'                       },
        ];

        var score = calcularScore(v);
        var cfg   = configs[score] || configs[0];
        fill.style.width  = cfg.pct;
        fill.setAttribute('aria-valuenow', parseInt(cfg.pct, 10));
        fill.classList.add(cfg.clase);
        label.classList.add(cfg.clase);
        label.textContent = cfg.text;
    }

    var input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('input', function () {
            actualizarFortaleza(this.value);
        });
    }

    return { actualizarFortaleza: actualizarFortaleza };
}

/* <--- initPasswordMatch ---> */
function initPasswordMatch(opciones) {
    var inputNuevaId   = opciones.inputNuevaId   || 'nueva_password';
    var inputRepetirId = opciones.inputRepetirId || 'repetir_password';
    var btnGuardarId   = opciones.btnGuardarId   || 'btnGuardarPass';
    var msgId          = opciones.msgId          || 'msg-pass';
    var fillId         = opciones.fillId         || 'passStrengthFill2';
    var labelId        = opciones.labelId        || 'passStrengthLabel2';
    var maxLen         = opciones.maxLen         || 20;

    var strengthCtrl = initPasswordStrength({
        inputId : inputNuevaId,
        fillId  : fillId,
        labelId : labelId,
        maxLen  : maxLen,
    });

    function validar() {
        var nueva   = document.getElementById(inputNuevaId);
        var repetir = document.getElementById(inputRepetirId);
        var btn     = document.getElementById(btnGuardarId);
        var msg     = document.getElementById(msgId);
        if (!nueva || !repetir || !btn || !msg) return;

        var v1 = nueva.value;
        var v2 = repetir.value;

        msg.classList.remove('msg-pass--ok', 'msg-pass--error', 'msg-pass--hidden');

        if (!v1 && !v2) {
            msg.classList.add('msg-pass--hidden');
            btn.disabled = true;
            return;
        }

        /* CORRECCIÓN: verificar longitud mínima antes de habilitar botón */
        if (v1.length < 5) {
            msg.textContent = 'Mínimo 5 caracteres.';
            msg.classList.add('msg-pass--error');
            btn.disabled = true;
            return;
        }

        if (v1 !== v2) {
            msg.textContent = 'Las contraseñas no coinciden.';
            msg.classList.add('msg-pass--error');
            btn.disabled = true;
        } else {
            msg.textContent = '¡Las contraseñas coinciden!';
            msg.classList.add('msg-pass--ok');
            btn.disabled = false;
        }
    }

    var inputNueva   = document.getElementById(inputNuevaId);
    var inputRepetir = document.getElementById(inputRepetirId);
    if (inputNueva)   inputNueva.addEventListener('input',   validar);
    if (inputRepetir) inputRepetir.addEventListener('input', validar);
}

/* <--- initRadioSexo ---> */
function initRadioSexo() {
    document.querySelectorAll('.perfil-radio').forEach(function (card) {
        card.addEventListener('click', function () {
            var group = card.closest('.radio-group');
            if (!group || group.classList.contains('disabled')) return;
            group.querySelectorAll('.radio-card').forEach(function (c) { c.classList.remove('selected'); });
            card.classList.add('selected');
            var inp = card.querySelector('input[type="radio"]');
            if (inp) inp.checked = true;
        });

        /* CORRECCIÓN: soporte navegación por teclado en radio-cards */
        card.addEventListener('keydown', function (e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

/* <--- crearBuscador ---> */
function crearBuscador(config) {
    var input                 = config.input;
    var btnClear              = config.btnClear;
    var contenedorSugerencias = config.contenedorSugerencias;
    var datos                 = config.datos           || [];
    var campos                = config.campos          || [];
    var formatearItem         = config.formatearItem   || function (item) { return String(item); };
    var onSeleccion           = config.onSeleccion     || function () {};
    var onBusqueda            = config.onBusqueda      || function () {};
    var onLimpiar             = config.onLimpiar       || function () {};
    var delay                 = config.delay           !== undefined ? config.delay : 300;
    var usarCache             = config.usarCache       !== undefined ? config.usarCache : true;
    var maxSugerencias        = config.maxSugerencias  || 8;

    if (!input || !btnClear || !contenedorSugerencias) {
        console.error('[crearBuscador] Faltan elementos requeridos (input, btnClear, contenedorSugerencias).');
        return;
    }

    /* Atributos ARIA para accesibilidad */
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    contenedorSugerencias.setAttribute('role', 'listbox');

    var indexActivo        = -1;
    var resultadosActuales = [];
    var timeoutBusqueda;
    var cache     = new Map();
    var requestId = 0;

    /* <--- normalizar ---> */
    function normalizar(str) {
        return (str || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /* <--- highlight ---> */
    function highlight(text, query) {
        if (!text || !query) return String(text || '');
        var safe = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        var q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safe.replace(new RegExp('(' + q + ')', 'gi'), '<span class="highlight">$1</span>');
    }

    /* <--- buscar ---> */
    async function buscar(query) {
        var q = normalizar(query.trim());
        if (!q) return [];
        if (usarCache && cache.has(q)) return cache.get(q);

        var resultados;
        try {
            if (typeof config.buscar === 'function') {
                resultados = await config.buscar(query);
            } else {
                resultados = datos.filter(function (item) {
                    return campos.some(function (campo) {
                        return normalizar(String(item[campo] || '')).includes(q);
                    });
                });
            }
        } catch (err) {
            console.error('[crearBuscador] Error en búsqueda:', err);
            resultados = [];
        }

        if (usarCache) {
            /* LRU simple: evitar crecimiento ilimitado */
            if (cache.size >= 120) cache.delete(cache.keys().next().value);
            cache.set(q, resultados);
        }
        return resultados;
    }

    /* <--- mostrarLoader ---> */
    function mostrarLoader() {
        contenedorSugerencias.innerHTML = '<div class="no-suggestions" role="status">Buscando...</div>';
        contenedorSugerencias.classList.add('active');
        input.setAttribute('aria-expanded', 'true');
    }

    /* <--- renderizarSugerencias ---> */
    function renderizarSugerencias(query, resultados) {
        resultadosActuales = resultados;
        indexActivo = -1;

        if (resultados.length === 0) {
            contenedorSugerencias.innerHTML = '<div class="no-suggestions" role="status">Sin resultados</div>';
        } else {
            contenedorSugerencias.innerHTML = resultados.slice(0, maxSugerencias).map(function (item, i) {
                return '<div class="suggestion-item" role="option" aria-selected="false" data-index="' + i + '">'
                     + formatearItem(item, query, highlight)
                     + '</div>';
            }).join('');
        }

        contenedorSugerencias.classList.add('active');
        input.setAttribute('aria-expanded', 'true');
    }

    /* <--- actualizarActivo ---> */
    function actualizarActivo() {
        var items = contenedorSugerencias.querySelectorAll('.suggestion-item');
        items.forEach(function (el, i) {
            el.classList.toggle('active', i === indexActivo);
            el.setAttribute('aria-selected', i === indexActivo ? 'true' : 'false');
        });
        if (items[indexActivo]) {
            items[indexActivo].scrollIntoView({ block: 'nearest' });
        }
    }

    /* <--- seleccionar ---> */
    function seleccionar(index) {
        var item = resultadosActuales[index];
        if (!item) return;
        onSeleccion(item, resultadosActuales);
        contenedorSugerencias.classList.remove('active');
        input.setAttribute('aria-expanded', 'false');
    }

    /* Eventos del input */
    input.addEventListener('input', function () {
        var val = this.value.trim();
        btnClear.style.display = val ? 'flex' : 'none';
        clearTimeout(timeoutBusqueda);

        if (!val) {
            contenedorSugerencias.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            onLimpiar();
            return;
        }

        mostrarLoader();

        timeoutBusqueda = setTimeout(async function () {
            var currentRequest = ++requestId;
            var resultados = await buscar(val);
            /* CORRECCIÓN: descartar respuestas de solicitudes obsoletas */
            if (currentRequest !== requestId) return;
            renderizarSugerencias(val, resultados);
            onBusqueda(resultados, val);
        }, delay);
    });

    input.addEventListener('keydown', function (e) {
        var total = resultadosActuales.length;
        if (total === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            indexActivo = (indexActivo + 1) % total;
            actualizarActivo();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            indexActivo = (indexActivo - 1 + total) % total;
            actualizarActivo();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (indexActivo >= 0) {
                seleccionar(indexActivo);
            } else {
                contenedorSugerencias.classList.remove('active');
                input.setAttribute('aria-expanded', 'false');
                onSeleccion(null, resultadosActuales);
            }
        } else if (e.key === 'Escape') {
            contenedorSugerencias.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            indexActivo = -1;
        }
    });

    contenedorSugerencias.addEventListener('click', function (e) {
        var item = e.target.closest('.suggestion-item');
        if (!item) return;
        seleccionar(parseInt(item.dataset.index, 10));
    });

    btnClear.addEventListener('click', function () {
        input.value = '';
        btnClear.style.display = 'none';
        contenedorSugerencias.classList.remove('active');
        input.setAttribute('aria-expanded', 'false');
        indexActivo = -1;
        onLimpiar();
        input.focus();
    });

    /* Cerrar sugerencias al hacer clic fuera */
    document.addEventListener('click', function (e) {
        if (!contenedorSugerencias.contains(e.target) && e.target !== input) {
            contenedorSugerencias.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
        }
    });

    return {
        limpiar: function () {
            input.value = '';
            btnClear.style.display = 'none';
            contenedorSugerencias.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            resultadosActuales = [];
            indexActivo = -1;
            onLimpiar();
        }
    };
}

/* <--- initCarrusel ---> */
function initCarrusel(config) {
    var trackId      = (config && config.trackId)      || 'carouselTrack';
    var cardSelector = (config && config.cardSelector) || '.carousel-card';
    var activeClass  = (config && config.activeClass)  || 'active';
    var onActivar    = (config && config.onActivar)    || function () {};
    var onDesactivar = (config && config.onDesactivar) || function () {};

    var track = document.getElementById(trackId);
    if (!track) return null;

    var claveActiva = null;

    function cards() { return track.querySelectorAll(cardSelector); }

    /* <--- activar ---> */
    function activar(key, card) {
        if (claveActiva === key) {
            card.classList.remove(activeClass);
            claveActiva = null;
            onDesactivar(key, card);
            return;
        }
        cards().forEach(function (c) { c.classList.remove(activeClass); });
        card.classList.add(activeClass);
        claveActiva = key;
        onActivar(key, card);
    }

    /* <--- desactivarTodas ---> */
    function desactivarTodas() {
        cards().forEach(function (c) { c.classList.remove(activeClass); });
        claveActiva = null;
    }

    /* <--- activarPorClave ---> */
    function activarPorClave(key) {
        /* CORRECCIÓN: CSS.escape puede no estar disponible en todos los entornos —
           usar atributo directo es más seguro */
        var card = track.querySelector(cardSelector + '[data-key="' + key.replace(/"/g, '\\"') + '"]');
        if (card) activar(key, card);
    }

    track.addEventListener('click', function (e) {
        var card = e.target.closest(cardSelector);
        if (!card) return;
        if (e.target.closest('.card-check')) return;
        var key = card.dataset.key;
        if (!key) return;
        activar(key, card);
    });

    /* Drag-scroll con mouse */
    var isDown  = false;
    var startX  = 0;
    var scrollL = 0;
    var dragged = false;

    track.addEventListener('mousedown', function (e) {
        if (e.target.closest('.card-check')) return;
        isDown  = true;
        dragged = false;
        startX  = e.pageX - track.offsetLeft;
        scrollL = track.scrollLeft;
        track.style.cursor = 'grabbing';
    });

    track.addEventListener('mouseleave', function () { isDown = false; dragged = false; track.style.cursor = ''; });
    track.addEventListener('mouseup',    function () { isDown = false; track.style.cursor = ''; });

    track.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        dragged = true;
        var x    = e.pageX - track.offsetLeft;
        var walk = (x - startX) * 1.2;
        track.scrollLeft = scrollL - walk;
    });

    /* CORRECCIÓN: evitar activar card cuando el usuario solo arrastraba */
    track.addEventListener('click', function (e) {
        if (dragged) { dragged = false; e.stopPropagation(); }
    }, true);

    /* Soporte táctil para móvil */
    var touchStartX  = 0;
    var touchScrollL = 0;

    track.addEventListener('touchstart', function (e) {
        touchStartX  = e.touches[0].pageX - track.offsetLeft;
        touchScrollL = track.scrollLeft;
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
        var x    = e.touches[0].pageX - track.offsetLeft;
        var walk = (x - touchStartX) * 1.2;
        track.scrollLeft = touchScrollL - walk;
    }, { passive: true });

    return {
        activar         : activarPorClave,
        desactivarTodas : desactivarTodas,
        getClave        : function () { return claveActiva; },
    };
}

/* <--- getColumns ---> */
function getColumns(count) {
    var isMobile = window.innerWidth <= 480;

    if (isMobile) {
        if (count <= 1) return 1;
        if (count <= 2) return 2;
        if (count <= 4) return 2;
        if (count <= 6) return 2;
        if (count <= 8) return 4;
        if (count === 9) return 3;
        return 4;
    }

    if (count <= 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count === 4) return 2;
    if (count <= 6)  return 3;
    if (count <= 8)  return 4;
    if (count === 9) return 3;
    return 4;
}

/* <--- getGridMargin ---> */
function getGridMargin(count) {
    if (count <= 4) return '2rem';
    if (count <= 6) return '1.5rem';
    if (count <= 9) return '1rem';
    return '0.5rem';
}

/* <--- getCardPadding ---> */
function getCardPadding(count) {
    var isMobile = window.innerWidth <= 480;

    if (isMobile) {
        if (count <= 4)  return '4.8rem 1.4rem';
        if (count === 5) return '1.5rem 1.4rem';
        if (count <= 6)  return '2rem 1.4rem';
        return '1.8rem 1.4rem';
    }

    if (count <= 4)  return '4.8rem 1.4rem';
    if (count === 5) return '3.5rem 1.4rem';
    if (count <= 6)  return '2rem 1.4rem';
    return '1.8rem 1.4rem';
}

/* <--- applyDynamicGrid ---> */
function applyDynamicGrid(gridSelector) {
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var cardsList = Array.from(grid.querySelectorAll('.dashboard-card'));
    var count     = cardsList.length;
    if (count === 0) return;

    var cols      = getColumns(count);
    var remainder = count % cols;

    grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

    var margin = getGridMargin(count);
    grid.style.marginTop    = margin;
    grid.style.marginBottom = margin;

    var padding = getCardPadding(count);
    cardsList.forEach(function (card) {
        card.style.padding    = padding;
        card.style.gridColumn = '';
    });

    if (remainder !== 0) {
        var emptyCols = cols - remainder;
        var startCol  = Math.floor(emptyCols / 2) + 1;

        cardsList.slice(count - remainder).forEach(function (card, i) {
            card.style.gridColumn = (startCol + i) + ' / ' + (startCol + i + 1);
        });
    }
}

/* Inicialización automática de componentes disponibles en el DOM */
document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.dashboard-grid')) {
        applyDynamicGrid('.dashboard-grid');
    }
    if (document.querySelector('.perfil-radio')) {
        initRadioSexo();
    }
});
