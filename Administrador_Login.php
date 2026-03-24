<?php /* <--- Conexion ---> */
session_start();
require_once 'conexion.php';

if (isset($_SESSION['admin_logueado']) && $_SESSION['admin_logueado'] === true) {
    header('Location: Administrador_BD.php');
    exit();
}

/* <--- Procesar Login y Recuperación ---> */
$mensaje        = '';
$error          = '';
$mostrar_alerta = false;
$tipo_alerta    = '';

if (isset($_POST['accion'])) {

    if ($_POST['accion'] === 'login') {
        $correo   = trim($_POST['correo']   ?? '');
        $password = trim($_POST['password'] ?? '');

        if (empty($correo) || empty($password)) {
            $_SESSION['error']       = 'Correo y contraseña son obligatorios';
            $_SESSION['tipo_alerta'] = 'error';
        } else {
            try {
                $stmt = $pdo->prepare("SELECT id, nombre, correo, contraseña FROM administradores WHERE correo = ?");
                $stmt->execute([$correo]);

                if ($stmt->rowCount() > 0) {
                    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($password === $admin['contraseña']) {
                        $_SESSION['admin_logueado'] = true;
                        $_SESSION['admin_id']       = $admin['id'];
                        $_SESSION['admin_nombre']   = $admin['nombre'];
                        $_SESSION['admin_correo']   = $admin['correo'];
                        header('Location: Administrador_BD.php');
                        exit();
                    } else {
                        $_SESSION['error']       = 'Correo o contraseña incorrectos';
                        $_SESSION['tipo_alerta'] = 'error';
                    }
                } else {
                    $_SESSION['error']       = 'Correo o contraseña incorrectos';
                    $_SESSION['tipo_alerta'] = 'error';
                }
            } catch (PDOException $e) {
                $_SESSION['error']       = 'Error de conexión: ' . $e->getMessage();
                $_SESSION['tipo_alerta'] = 'error';
            }
        }
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit();
    }

    elseif ($_POST['accion'] === 'recuperar') {
        $correo_recuperar = trim($_POST['correo_recuperar'] ?? '');

        if (empty($correo_recuperar)) {
            $_SESSION['error']       = 'Por favor ingrese su correo electrónico';
            $_SESSION['tipo_alerta'] = 'error';
        } else {
            try {
                $stmt = $pdo->prepare("SELECT contraseña FROM administradores WHERE correo = ?");
                $stmt->execute([$correo_recuperar]);

                if ($stmt->rowCount() > 0) {
                    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
                    $_SESSION['mensaje']     = 'Su contraseña es: ' . $admin['contraseña'];
                    $_SESSION['tipo_alerta'] = 'success';
                } else {
                    $_SESSION['error']       = 'El correo electrónico no está registrado en el sistema';
                    $_SESSION['tipo_alerta'] = 'error';
                }
            } catch (PDOException $e) {
                $_SESSION['error']       = 'Error de conexión: ' . $e->getMessage();
                $_SESSION['tipo_alerta'] = 'error';
            }
        }
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit();
    }
}

/* <--- Recuperar mensajes de sesión ---> */
if (isset($_SESSION['mensaje'])) {
    $mensaje        = $_SESSION['mensaje'];
    $mostrar_alerta = true;
    $tipo_alerta    = $_SESSION['tipo_alerta'];
    unset($_SESSION['mensaje'], $_SESSION['tipo_alerta']);
}

if (isset($_SESSION['error'])) {
    $error          = $_SESSION['error'];
    $mostrar_alerta = true;
    $tipo_alerta    = $_SESSION['tipo_alerta'];
    unset($_SESSION['error'], $_SESSION['tipo_alerta']);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Sistema de Administrador</title>
    <link rel="icon" type="image/png" href="tec.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="style_login.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="style_componentes.css?v=<?php echo time(); ?>">
</head>
<body>
<!-- ===== PRELOADER ===== -->
    <div class="preloader" id="preloader">
        <div class="loader"></div>
    </div>

    <!-- ===== CONTENEDOR IZQUIERDO ===== -->
    <div class="container-izquierdo">
        <img src="Itssat.png" class="logo" alt="Logo ITSSAT">
        <div class="bienvenida">
            <h1>¡Bienvenido Administrador!</h1>
            <p>Accede con tu usuario para Consultar y Administrar la base de datos</p>
        </div>
    </div>

    <!-- ===== CONTENEDOR DERECHO ===== -->
    <div class="container-derecho">
        <div class="form-container">

            <!-- Formulario de Login -->
            <div id="loginForm" class="form-section active">
                <div class="form-header">
                    <h2>Iniciar Sesión</h2>
                </div>
                <form method="POST" action="">
                    <input type="hidden" name="accion" value="login">
                    <div class="form-group">
                        <span class="icon">📧</span>
                        <input type="email" id="correo" name="correo" placeholder="Correo Electrónico" required>
                    </div>
                    <div class="form-group">
                        <span class="icon">🔑</span>
                        <input type="password" id="password" name="password" placeholder="Contraseña" required>
                        <span class="toggle-password" onclick="togglePassword('password', this)">👁️</span>
                    </div>
                    <div class="btn-group">
                        <button type="submit" id="loginBtn" class="btn btn-verde">Iniciar Sesión</button>
                    </div>
                    <div class="separador"></div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-red" onclick="mostrarRecuperacion()">¿Olvidé mi Contraseña?</button>
                    </div>
                </form>
            </div>

            <!-- Formulario de Recuperación -->
            <div id="recoveryForm" class="form-section">
                <div class="form-header">
                    <h2>Recuperar Contraseña</h2>
                </div>
                <form method="POST" action="">
                    <input type="hidden" name="accion" value="recuperar">
                    <div class="form-group">
                        <span class="icon">📧</span>
                        <input type="email" id="correo_recuperar" name="correo_recuperar" placeholder="Correo Electrónico" required>
                    </div>
                    <div class="btn-group">
                        <button type="submit" id="recoveryBtn" class="btn btn-verde">Recuperar Contraseña</button>
                    </div>
                    <div class="separador"></div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-red" onclick="mostrarLogin()">Volver al Login</button>
                    </div>
                </form>
            </div>

        </div>
    </div>

    <!-- ===== MODAL UNIVERSAL ===== -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal-content" id="modalContent">
            <div class="modal-body">
                <i class="modal-icon"      id="modalIcon"></i>
                <div class="modal-title"   id="modalTitle"></div>
                <div class="modal-text"    id="modalText"></div>
                <div class="modal-actions" id="modalActions"></div>
            </div>
        </div>
    </div>

    <script> /* <--- BLOQUEAR RETROCESO ---> */
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', function () {
            history.go(1);
            window.location.replace('index.html');
        });
    </script>

    <script src="componentes.js"></script>

    <script> /* <--- MAIN ---> */
        initPreloader();
        initModal();

        function quitarFocus() {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }

        function mostrarLogin() {
            document.getElementById('loginForm').classList.add('active');
            document.getElementById('recoveryForm').classList.remove('active');
            quitarFocus();
        }

        function mostrarRecuperacion() {
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('recoveryForm').classList.add('active');
            quitarFocus();
        }

        function togglePassword(inputId, iconElement) {
            const input = document.getElementById(inputId);
            if (input.type === 'password') {
                input.type              = 'text';
                iconElement.textContent = '🔒';
            } else {
                input.type              = 'password';
                iconElement.textContent = '👁️';
            }
        }

        document.addEventListener('DOMContentLoaded', function () {
            quitarFocus();

            /* <--- Mantener estilo si el campo tiene texto ---> */
            document.querySelectorAll('.form-group input').forEach(function (input) {
                input.addEventListener('blur', function () {
                    input.classList.toggle('filled', input.value.trim() !== '');
                });
                if (input.value.trim() !== '') {
                    input.classList.add('filled');
                }
            });

            /* <--- Validación login ---> */
            const loginForm = document.querySelector('#loginForm form');
            if (loginForm) {
                loginForm.addEventListener('submit', function (e) {
                    const correo   = document.getElementById('correo').value.trim();
                    const password = document.getElementById('password').value;

                    if (!correo || !password) {
                        e.preventDefault();
                        modalError('Error', 'Por favor, complete todos los campos');
                        return;
                    }

                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                        e.preventDefault();
                        modalError('Error', 'Por favor, ingrese un correo válido');
                        return;
                    }

                    const btn       = e.target.querySelector('button[type="submit"]');
                    const txtOrigen = btn.textContent;
                    btn.textContent = 'Iniciando...';
                    btn.disabled    = true;
                    setTimeout(function () {
                        btn.textContent = txtOrigen;
                        btn.disabled    = false;
                    }, 3000);
                });
            }

            /* <--- Validación recuperación ---> */
            const recoveryForm = document.querySelector('#recoveryForm form');
            if (recoveryForm) {
                recoveryForm.addEventListener('submit', function (e) {
                    const correo = document.getElementById('correo_recuperar').value.trim();

                    if (!correo) {
                        e.preventDefault();
                        modalError('Error', 'Por favor, ingrese su correo electrónico');
                        return;
                    }

                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                        e.preventDefault();
                        modalError('Error', 'Por favor, ingrese un correo válido');
                        return;
                    }

                    const btn       = e.target.querySelector('button[type="submit"]');
                    const txtOrigen = btn.textContent;
                    btn.textContent = 'Recuperando...';
                    btn.disabled    = true;
                    setTimeout(function () {
                        btn.textContent = txtOrigen;
                        btn.disabled    = false;
                    }, 3000);
                });
            }

            /* <--- Alertas desde PHP ---> */
            <?php if ($mostrar_alerta): ?>
                <?php if ($tipo_alerta === 'success'): ?>
                    modalSuccess(
                        '¡Éxito!',
                        '<?php echo addslashes($mensaje ?: $error); ?>',
                        function () {
                            mostrarLogin();
                        }
                    );
                <?php else: ?>
                    modalError(
                        'Error',
                        '<?php echo addslashes($error ?: $mensaje); ?>'
                    );
                <?php endif; ?>
            <?php endif; ?>
        });
    </script>
</body>
</html>