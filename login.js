/* <--- BLOQUEAR RETROCESO ---> */
(function () {
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function () {
        history.go(1);
        /* CORRECCIÓN: usar location.replace en lugar de asignación directa
           para que no agregue entrada al historial */
        window.location.replace('index.html');
    });
})();

/* <--- Funciones de navegación entre formularios ---> */

/* <--- quitarFocus ---> */
function quitarFocus() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
}

/* <--- togglePassword ---> */
function togglePassword(inputId, iconElement) {
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.textContent = '🔒';
        /* CORRECCIÓN: actualizar aria-label dinámicamente para accesibilidad */
        iconElement.setAttribute('aria-label', 'Ocultar contraseña');
    } else {
        input.type = 'password';
        iconElement.textContent = '👁️';
        iconElement.setAttribute('aria-label', 'Mostrar contraseña');
    }
}

/* <--- HELPERS INTERNOS ---> */

/* <--- _initFilledInputs ---> */
function _initFilledInputs() {
    document.querySelectorAll('.form-group input').forEach(function (input) {
        input.addEventListener('blur', function () {
            input.classList.toggle('filled', input.value.trim() !== '');
        });
        /* Estado inicial si el campo ya tiene valor (ej: autocompletado del navegador) */
        if (input.value.trim() !== '') {
            input.classList.add('filled');
        }
    });
}

/* <--- _bloquearBoton ---> */
function _bloquearBoton(btn, textoEspera, ms) {
    if (!btn) return;
    ms = ms || 3000;
    var txtOrigen   = btn.textContent;
    btn.textContent = textoEspera;
    btn.disabled    = true;
    /* CORRECCIÓN: guardar referencia al timeout para poder cancelarlo si es necesario */
    var tid = setTimeout(function () {
        btn.textContent = txtOrigen;
        btn.disabled    = false;
    }, ms);
    btn._bloqueoTimeout = tid;
}

/* <--- _esCorreoValido ---> */
function _esCorreoValido(correo) {
    /* RFC 5322 simplificado — suficiente para validación en frontend */
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/* <--- _initHint ---> */
function _initHint(inputId, hintId) {
    var input = document.getElementById(inputId);
    var hint  = document.getElementById(hintId);
    if (!input || !hint) return;
    input.addEventListener('focus', function () { hint.classList.add('show'); });
    input.addEventListener('blur',  function () { hint.classList.remove('show'); });
}

/* <--- _initCorreoMayusculas ---> */
function _initCorreoMayusculas(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', function () {
        var cursor  = this.selectionStart;
        var partes  = this.value.split('@');
        var nuevo   = partes[1]
            ? partes[0].toUpperCase() + '@' + partes[1]
            : this.value.toUpperCase();
        /* CORRECCIÓN: preservar posición del cursor al forzar mayúsculas */
        if (this.value !== nuevo) {
            this.value = nuevo;
            this.setSelectionRange(cursor, cursor);
        }
    });
}

/* <--- INICIALIZACIÓN PRINCIPAL ---> */

/**
 * Punto de entrada. Cada login llama esta función con su configuración.
 *
 * @param {Object} cfg
 *
 * — Login form —
 * @param {string}   cfg.campoLogin          ID del campo principal de login
 * @param {boolean}  [cfg.validarCorreo]     Si debe validar formato de correo
 * @param {string}   [cfg.txtIniciando]      Texto del botón mientras procesa
 *
 * — Recovery form —
 * @param {string}   cfg.campoRecuperar      ID del campo del form de recuperación
 * @param {boolean}  [cfg.validarCorreoRec]  Si debe validar formato de correo en recuperación
 * @param {string}   [cfg.txtRecuperando]    Texto del botón mientras procesa
 *
 * — Extras opcionales —
 * @param {boolean}  [cfg.correoMayusculas]  Activa mayúsculas en parte local del correo de login
 * @param {Array}    [cfg.hints]             Lista de {inputId, hintId} para activar hints
 */
/* <--- initLogin ---> */
function initLogin(cfg) {
    /* CORRECCIÓN: initPreloader e initModal ya se invocan desde el HTML inline;
       llamarlos aquí también causaba doble registro de listeners.
       Se mantienen solo como guardia por si initLogin se usa en otro contexto. */
    if (typeof initPreloader === 'function') initPreloader();
    if (typeof initModal     === 'function') initModal();

    document.addEventListener('DOMContentLoaded', function () {
        quitarFocus();
        _initFilledInputs();

        /* Mayúsculas en correo (opcional) */
        if (cfg.correoMayusculas && cfg.campoLogin) {
            _initCorreoMayusculas(cfg.campoLogin);
        }

        /* Hints (opcional) */
        if (Array.isArray(cfg.hints)) {
            cfg.hints.forEach(function (h) {
                _initHint(h.inputId, h.hintId);
            });
        }

        /* CORRECCIÓN: también detectar autocompletado tardío del navegador */
        setTimeout(function () {
            document.querySelectorAll('.form-group input').forEach(function (input) {
                if (input.value.trim() !== '') input.classList.add('filled');
            });
        }, 300);

        /* Validación login */
        var loginForm = document.querySelector('#loginForm form');
        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                /* CORRECCIÓN: usar cfg.campoLogin, no 'correo' harcodeado */
                var campoId = cfg.campoLogin || cfg.campoUsuario || 'correo';
                var campo   = document.getElementById(campoId);
                var pass    = document.getElementById('password');

                if (!campo || !pass) return;

                var valor    = campo.value.trim();
                var password = pass.value;

                if (!valor || !password) {
                    e.preventDefault();
                    modalError('Error', 'Por favor, complete todos los campos');
                    return;
                }

                if (cfg.validarCorreo && !_esCorreoValido(valor)) {
                    e.preventDefault();
                    modalError('Error', 'Por favor, ingrese un correo válido');
                    return;
                }

                _bloquearBoton(
                    e.target.querySelector('button[type="submit"]'),
                    cfg.txtIniciando || 'Iniciando...'
                );
            });
        }

        /* Validación recuperación */
        var recoveryForm = document.querySelector('#recoveryForm form');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', function (e) {
                var campo = document.getElementById(cfg.campoRecuperar);
                if (!campo) return;

                var valor = campo.value.trim();

                if (!valor) {
                    e.preventDefault();
                    modalError('Error', 'Por favor, ingrese los datos requeridos');
                    return;
                }

                if (cfg.validarCorreoRec && !_esCorreoValido(valor)) {
                    e.preventDefault();
                    modalError('Error', 'Por favor, ingrese un correo válido');
                    return;
                }

                _bloquearBoton(
                    e.target.querySelector('button[type="submit"]'),
                    cfg.txtRecuperando || 'Recuperando...'
                );
            });
        }
    });
}