/* ================================================================
 *  login-init.js
 *  Bootstrap del login — antes era el <script> inline en login.html.
 *  Separado para cumplir con CSP sin 'unsafe-inline'.
 * ================================================================ */
(function () {
    var params = new URLSearchParams(window.location.search);
    var role   = params.get('role') || '';
    var paso   = params.get('paso') || '1';

    if (!role) {
        window.location.replace('index.html');
        return;
    }

    /* Bloquear retroceso del navegador */
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function () {
        history.go(1);
        window.location.replace('index.html');
    });

    /* Pedir estado inicial al servidor */
    fetch('login.php?role=' + encodeURIComponent(role) + '&paso=' + encodeURIComponent(paso), {
        credentials: 'same-origin'
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.redirect) {
            window.location.replace(data.redirect);
            return;
        }
        _inicializar(data);
    })
    .catch(function () {
        window.location.replace('index.html');
    });

    /* ============================================================
     *  _inicializar — monta la UI con los datos del servidor
     * ============================================================ */
    function _inicializar(cfg) {

        /* Título y subtítulo dinámicos */
        document.getElementById('tituloBienvenida').textContent   = cfg.titulo;
        document.getElementById('subtituloBienvenida').textContent = cfg.subtitulo;
        document.title = 'Acceso · ' + cfg.titulo + ' · ITSSAT';

        /* Rellenar todos los campos csrf_token */
        _setCSRF('csrfLogin',     cfg.csrf_token);
        _setCSRF('csrfRecuperar', cfg.csrf_token);

        /* Construir contenido dinámico */
        _buildChallengeForm(cfg);
        _buildResetPassForm(cfg);

        /* Inicializar componentes globales */
        if (typeof initPreloader === 'function') initPreloader();
        if (typeof initModal     === 'function') initModal();

        initLogin({
            campoLogin      : 'correo',
            validarCorreo   : true,
            campoRecuperar  : 'correo_recuperar',
            validarCorreoRec: true,
            txtIniciando    : 'Iniciando...',
            txtRecuperando  : 'Recuperando...'
        });

        /* Toggle contraseña — login */
        document.getElementById('togglePasswordBtn').addEventListener('click', function () {
            togglePassword('password', this);
        });

        /* Toggle contraseña — claves secretas (paso 2) */
        document.querySelectorAll('#challengeFormInner .toggle-password').forEach(function (btn) {
            btn.addEventListener('click', function () {
                togglePassword(this.dataset.target, this);
            });
        });

        /* Toggle contraseña — paso 3 */
        var tnb = document.getElementById('toggleNuevaBtn');
        var trb = document.getElementById('toggleRepetirBtn');
        if (tnb) tnb.addEventListener('click', function () { togglePassword('nueva_password',   this); });
        if (trb) trb.addEventListener('click', function () { togglePassword('repetir_password', this); });

        /* Navegación entre formularios */
        var loginForm     = document.getElementById('loginForm');
        var recoveryForm  = document.getElementById('recoveryForm');
        var challengeForm = document.getElementById('challengeForm');
        var resetPassForm = document.getElementById('resetPassForm');
        var todos         = [loginForm, recoveryForm, challengeForm, resetPassForm];

        function mostrarSolo(el) {
            todos.forEach(function (f) { if (f) f.classList.remove('active'); });
            if (el) {
                el.classList.add('active');
                var primer = el.querySelector('input:not([disabled]), button:not([disabled]):not([aria-hidden])');
                if (primer) primer.focus();
            }
        }

        window.mostrarLogin        = function () { mostrarSolo(loginForm);    };
        window.mostrarRecuperacion = function () { mostrarSolo(recoveryForm); };

        document.getElementById('irRecuperacionBtn').addEventListener('click', mostrarRecuperacion);
        document.getElementById('irLoginBtn').addEventListener('click', mostrarLogin);

        var be  = document.getElementById('irLoginDesdeExpired');
        var brd = document.getElementById('irLoginDesdeReset');
        if (be)  be.addEventListener('click', mostrarLogin);
        if (brd) brd.addEventListener('click', mostrarLogin);

        /* Medidor de fortaleza + validación de coincidencia (paso 3) */
        if (typeof initPasswordMatch === 'function') {
            initPasswordMatch({
                inputNuevaId   : 'nueva_password',
                inputRepetirId : 'repetir_password',
                btnGuardarId   : 'btnGuardarPass',
                msgId          : 'msg-pass',
                fillId         : 'passStrengthFill2',
                labelId        : 'passStrengthLabel2',
                maxLen         : 20,
            });
        }

        /* Activar el formulario correcto según el servidor */
        mostrarSolo(document.getElementById(cfg.pasoActivo));

        /* Avisos contextuales */
        if (cfg.pasoActivo === 'challengeForm') {
            modalWarning('Verifica tu identidad',
                'Escribe tus 3 respuestas en orden, tal como las registraste. Respeta mayúsculas y minúsculas.');
        }
        if (cfg.pasoActivo === 'resetPassForm') {
            modalWarning('Nueva contraseña',
                'Mínimo 8 y máximo 20 caracteres. Puedes usar mayúsculas, minúsculas y caracteres especiales.');
        }

        /* Alertas provenientes del servidor (PRG) */
        if (cfg.alerta) {
            var msg  = cfg.alerta.msg;
            var tipo = cfg.alerta.tipo;
            if      (tipo === 'success') modalSuccess('¡Contraseña actualizada!', msg, function () { mostrarLogin(); });
            else if (tipo === 'info')    modalWarning('Aviso', msg,               function () { mostrarLogin(); });
            else                         modalError('Error', msg);
        }

        /* Envío de formularios vía fetch */
        _bindSubmit('formLogin',     cfg.selfUrl);
        _bindSubmit('formRecuperar', cfg.selfUrl);

        var fi = document.getElementById('challengeFormInner');
        if (fi) _bindSubmit('challengeFormInner', cfg.selfUrl);

        var fn = document.getElementById('formNuevaPass');
        if (fn) _bindSubmit('formNuevaPass', cfg.selfUrl);

        document.querySelectorAll('form[data-accion-cancelar]').forEach(function (f) {
            _bindSubmit(f.id, cfg.selfUrl);
        });
    }

    /* ============================================================
     *  Helpers privados
     * ============================================================ */

    function _setCSRF(id, token) {
        var el = document.getElementById(id);
        if (el) el.value = token;
    }

    function _bindSubmit(formId, actionUrl) {
        var form = typeof formId === 'string'
            ? document.getElementById(formId)
            : formId;
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var data = new FormData(form);
            fetch(actionUrl, {
                method     : 'POST',
                body       : data,
                credentials: 'same-origin'
            })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (resp) {
                if (resp.redirect) {
                    window.location.href = resp.redirect;
                }
            })
            .catch(function () {
                if (typeof modalError === 'function')
                    modalError('Error', 'No se pudo conectar con el servidor. Intente nuevamente.');
            });
        });
    }

    function _bindSubmitAfterBuild(formId, selfUrl) {
        setTimeout(function () { _bindSubmit(formId, selfUrl); }, 0);
    }

    function _buildChallengeForm(cfg) {
        var container = document.getElementById('challengeFormContent');
        if (!container) return;

        if (cfg.tiene_sesion_recuperacion) {
            container.innerHTML = [
                '<form method="POST" id="challengeFormInner" novalidate>',
                '  <input type="hidden" name="accion"     value="recuperar_paso2">',
                '  <input type="hidden" name="csrf_token" value="' + _esc(cfg.csrf_token) + '">',

                [0, 1, 2].map(function (i) {
                    return [
                        '<div class="form-group recovery-input-wrap">',
                        '  <label for="respuesta_' + i + '" class="sr-only">Clave secreta ' + (i + 1) + '</label>',
                        '  <span class="icon" aria-hidden="true">🔑</span>',
                        '  <input type="password" name="respuestas[' + i + ']" id="respuesta_' + i + '"',
                        '         placeholder="Clave secreta ' + (i + 1) + '"',
                        '         autocomplete="off" maxlength="20" required>',
                        '  <button type="button" class="toggle-password"',
                        '          aria-label="Mostrar clave secreta ' + (i + 1) + '"',
                        '          data-target="respuesta_' + i + '">👁️</button>',
                        '</div>',
                    ].join('');
                }).join(''),

                '  <div class="btn-group btn-group-margin">',
                '    <button type="submit" class="btn-login btn-verde-login">Verificar</button>',
                '  </div>',
                '  <div class="separador"></div>',
                '</form>',

                '<div class="btn-group">',
                '  <form id="formCancelarChallenge" novalidate style="margin:0" data-accion-cancelar>',
                '    <input type="hidden" name="accion"     value="cancelar_restablecer">',
                '    <input type="hidden" name="csrf_token" value="' + _esc(cfg.csrf_token) + '">',
                '    <button type="submit" class="btn-login btn-red-login">Cancelar</button>',
                '  </form>',
                '</div>',
            ].join('');

            _bindSubmitAfterBuild('formCancelarChallenge', cfg.selfUrl);

        } else {
            container.innerHTML = [
                '<p class="sesion-expirada" role="alert">Sesión expirada.</p>',
                '<div class="btn-group" style="margin-top:1rem;">',
                '  <button type="button" class="btn-login btn-verde-login" id="irLoginDesdeExpired">Volver al Login</button>',
                '</div>',
            ].join('');
        }
    }

    function _buildResetPassForm(cfg) {
        var container = document.getElementById('resetPassFormContent');
        if (!container) return;

        if (cfg.tiene_sesion_restablecer) {
            container.innerHTML = [
                '<div class="form-header">',
                '  <div class="icon-header" aria-hidden="true"><i class="fas fa-lock-open"></i></div>',
                '  <h2>Nueva Contraseña</h2>',
                '</div>',
                '<form id="formNuevaPass" novalidate>',
                '  <input type="hidden" name="accion"     value="restablecer_password">',
                '  <input type="hidden" name="csrf_token" value="' + _esc(cfg.csrf_token) + '">',

                '  <div class="form-group">',
                '    <label for="nueva_password" class="sr-only">Nueva contraseña</label>',
                '    <span class="icon" aria-hidden="true">🔒</span>',
                '    <input type="password" id="nueva_password" name="nueva_password"',
                '           placeholder="Nueva contraseña" autocomplete="new-password" maxlength="20" required>',
                '    <button type="button" class="toggle-password" id="toggleNuevaBtn"',
                '            aria-label="Mostrar nueva contraseña">👁️</button>',
                '  </div>',

                '  <div class="pass-strength" role="progressbar"',
                '       aria-label="Fortaleza de contraseña" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">',
                '    <div class="pass-strength-fill" id="passStrengthFill2"></div>',
                '  </div>',
                '  <span class="pass-hint" id="passStrengthLabel2" aria-live="polite">',
                '    Escribe para ver la fortaleza',
                '  </span>',

                '  <div class="form-group">',
                '    <label for="repetir_password" class="sr-only">Repite la contraseña</label>',
                '    <span class="icon" aria-hidden="true">🔒</span>',
                '    <input type="password" id="repetir_password" name="repetir_password"',
                '           placeholder="Repite la contraseña" autocomplete="new-password" maxlength="20" required>',
                '    <button type="button" class="toggle-password" id="toggleRepetirBtn"',
                '            aria-label="Mostrar repetición de contraseña">👁️</button>',
                '  </div>',

                '  <p id="msg-pass" class="msg-pass msg-pass--hidden" aria-live="polite" role="alert"></p>',

                '  <div class="btn-group">',
                '    <button type="submit" id="btnGuardarPass" class="btn-login btn-verde-login" disabled>Confirmar</button>',
                '  </div>',
                '</form>',

                '<div class="separador"></div>',
                '<div class="btn-group">',
                '  <form id="formCancelarReset" novalidate style="margin:0" data-accion-cancelar>',
                '    <input type="hidden" name="accion"     value="cancelar_restablecer">',
                '    <input type="hidden" name="csrf_token" value="' + _esc(cfg.csrf_token) + '">',
                '    <button type="submit" class="btn-login btn-red-login">Cancelar</button>',
                '  </form>',
                '</div>',
            ].join('');

            _bindSubmitAfterBuild('formCancelarReset', cfg.selfUrl);

        } else {
            container.innerHTML = [
                '<div class="form-header">',
                '  <div class="icon-header" aria-hidden="true"><i class="fas fa-lock-open"></i></div>',
                '  <h2>Nueva Contraseña</h2>',
                '</div>',
                '<p class="sesion-expirada" role="alert">Sesión expirada.</p>',
                '<div class="btn-group" style="margin-top:1rem;">',
                '  <button type="button" class="btn-login btn-verde-login" id="irLoginDesdeReset">Volver al Login</button>',
                '</div>',
            ].join('');
        }
    }

    function _esc(str) {
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;');
    }

}());
