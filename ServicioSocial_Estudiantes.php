<?php
session_start();
require_once 'Conexion.php';

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.html');
    exit();
}

if (!isset($_SESSION['ServicioSocial_logueado']) || $_SESSION['ServicioSocial_logueado'] !== true) {
    header('Location: ServicioSocial_Login.php');
    exit();
}

if (isset($_GET['buscar_sugerencias'])) {
    header('Content-Type: application/json');
    $termino = $_GET['termino'] ?? '';

    if (strlen($termino) < 2) {
        echo json_encode(['sugerencias' => []]);
        exit();
    }

    try {
        $stmt = $pdo->prepare("
            SELECT 
                Numero_Control,
                CONCAT(Nombres, ' ', Ap_Paterno, ' ', IFNULL(Ap_Materno, '')) AS nombre_completo
            FROM estudiantes
            WHERE
                Numero_Control LIKE ? OR
                Nombres       LIKE ? OR
                Ap_Paterno    LIKE ? OR
                Ap_Materno    LIKE ?
            ORDER BY Nombres ASC
            LIMIT 10
        ");
        $t = "%{$termino}%";
        $stmt->execute([$t, $t, $t, $t]);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sugerencias = array_map(fn($r) => [
            'numero_control' => $r['Numero_Control'],
            'nombre'         => trim($r['nombre_completo'])
        ], $resultados);

        echo json_encode(['sugerencias' => $sugerencias]);
    } catch (PDOException $e) {
        echo json_encode(['sugerencias' => [], 'error' => $e->getMessage()]);
    }
    exit();
}

$datos_estudiante = [];
$nc_seleccionado  = $_GET['nc'] ?? '';

if (!empty($nc_seleccionado)) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM estudiantes WHERE Numero_Control = ? LIMIT 1");
        $stmt->execute([$nc_seleccionado]);
        $datos_estudiante = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    } catch (PDOException $e) {
        $datos_estudiante = [];
    }
}

$usuario     = $_SESSION['usuario']     ?? 'Usuario';
$departamento = $_SESSION['departamento'] ?? 'Departamento';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Información Estudiante</title>
    <link rel="icon" type="image/png" href="tec.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="style_componentes.css?v=<?php echo time(); ?>">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        }

        body {
            background-image: url('iondoItssat.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.10);
            z-index: 0;
        }

        .main-container { 
            position: relative; 
            z-index: 1; 
        }

        .form-container {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            padding: 1.5rem 3rem 2rem;
            min-height: 100vh;
        }
        
        .form-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .form-title {
            margin-left: 25rem;
            font-size: 38px;
            font-weight: 800;
            background: linear-gradient(135deg, #38ca0c 0%, #2ba809 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -1px;
            animation: float 3s ease-in-out infinite;
        }

        .empty-state {
            text-align: center;
            padding: 10rem 2rem;
            color: #9ca3af;
        }

        .empty-state i { font-size: 4rem; color: #d1d5db; margin-bottom: 1rem; }
        .empty-state p { font-size: 1.1rem; }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }

        .info-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .info-field label {
            font-size: 12px;
            font-weight: 700;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-field .field-value {
            padding: 10px 14px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 15px;
            color: #111827;
            min-height: 42px;
        }

        .field-value.empty { color: #9ca3af; font-style: italic; }

        /* Foto */
        .student-photo {
            width: 140px; height: 170px;
            border-radius: 6px;
            object-fit: cover;
            border: 3px solid #d1fae5;
        }

        .photo-placeholder {
            width: 140px; height: 170px;
            border-radius: 6px;
            border: 3px dashed #a0a0c0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #f0f0f8; color: #9ca3af; gap: 6px;
        }

        .photo-placeholder i { font-size: 3rem; }

        /* Layout foto + datos */
        .student-layout {
            display: flex;
            gap: 2rem;
            align-items: flex-start;
        }

        .photo-col { flex-shrink: 0; }
        
        /* <--- Zoom Foto ---> */
        .zoom-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            cursor: zoom-out;
        }

        .zoom-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .zoom-img-container {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            transform: scale(0.8);
            transition: transform 0.3s ease;
        }

        .zoom-overlay.active .zoom-img-container {
            transform: scale(1);
        }

        .zoom-img-container img {
            max-width: 100%;
            max-height: 85vh;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            object-fit: contain;
            display: block;
        }

        .zoom-close {
            position: absolute;
            top: -18px;
            right: -18px;
            width: 36px;
            height: 36px;
            background: #ef4444;
            border: none;
            border-radius: 50%;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.2s;
            z-index: 10000;
        }

        .zoom-close:hover {
            background: #dc2626;
            transform: scale(1.1);
        }

        .student-photo {
            cursor: zoom-in;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .student-photo:hover {
            transform: scale(1.04);
            box-shadow: 0 8px 24px rgba(34,197,94,0.35);
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #374151;
            border-bottom: 2px solid #d1fae5;
            padding-bottom: 6px;
            margin: 1.5rem 0 1rem;
            grid-column: 1 / -1;
        }

        @keyframes float {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-8px); }
        }

        @media (max-width: 768px) {
            .main-container { padding: 1rem; }
            .form-container { padding: 1rem 1.2rem; }
            .form-header { flex-direction: column; align-items: flex-start; }
            .filter-group { width: 100%; }
            .student-layout { flex-direction: column; align-items: center; }
            .form-title { font-size: 26px; }
        }
    </style>
</head>
<body>
    <!-- ==== PRELOADER ==== -->
    <div class="preloader" id="preloader">
        <div class="loader"></div>
    </div>

<div class="main-container">
    <div class="form-container">

        <!-- Cabecera: título + buscador -->
        <div class="form-header">
            <h1 class="form-title">Información Estudiante</h1>

            <div class="filter-group">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input
                        type="text"
                        class="search-main-input"
                        id="searchInput"
                        placeholder="Buscar por nombre o N° control..."
                        autocomplete="off"
                        value="<?php echo htmlspecialchars($datos_estudiante['Numero_Control'] ?? ''); ?>"
                    >
                    <button class="clear-search" id="clearBtn" title="Limpiar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-suggestions" id="suggestions"></div>
            </div>
        </div>

        <!-- Contenido -->
        <?php if (empty($datos_estudiante)): ?>
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <p>Busca un estudiante para ver su información</p>
            </div>
        <?php else: ?>
            <div class="student-layout">

                <!-- Foto -->
                <div class="photo-col">
                    <?php if (!empty($datos_estudiante['Foto']) && file_exists($datos_estudiante['Foto'])): ?>
                        <img src="<?php echo htmlspecialchars($datos_estudiante['Foto']); ?>" class="student-photo" alt="Foto">
                    <?php else: ?>
                        <div class="photo-placeholder">
                            <i class="fas fa-user-circle"></i>
                            <small>Sin foto</small>
                        </div>
                    <?php endif; ?>
                </div>
                
                <!-- Modal de Zoom -->
                    <div class="zoom-overlay" id="zoomOverlay">
                        <div class="zoom-img-container" id="zoomContainer">
                            <button class="zoom-close" id="zoomClose" title="Cerrar">
                                <i class="fas fa-times"></i>
                            </button>
                            <img src="" id="zoomImg" alt="Foto ampliada">
                        </div>
                    </div>

                <!-- Datos -->
                <div style="flex:1">
                    <div class="info-grid">

                        <div class="section-title">Datos Personales</div>

                        <div class="info-field">
                            <label>Nombres</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Nombres']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Nombres']) ? htmlspecialchars($datos_estudiante['Nombres']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Apellido Paterno</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Ap_Paterno']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Ap_Paterno']) ? htmlspecialchars($datos_estudiante['Ap_Paterno']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Apellido Materno</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Ap_Materno']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Ap_Materno']) ? htmlspecialchars($datos_estudiante['Ap_Materno']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Sexo</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Sexo']) ? 'empty' : ''; ?>">
                                <?php
                                    $sexo = $datos_estudiante['Sexo'] ?? '';
                                    echo $sexo === 'M' ? 'Masculino' : ($sexo === 'F' ? 'Femenino' : 'Sin datos');
                                ?>
                            </div>
                        </div>

                        <div class="section-title">Contacto</div>

                        <div class="info-field">
                            <label>Teléfono</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Telefono']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Telefono']) ? htmlspecialchars($datos_estudiante['Telefono']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Correo Personal</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Correo_Personal']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Correo_Personal']) ? htmlspecialchars($datos_estudiante['Correo_Personal']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Correo Institucional</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Correo_Institucional']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Correo_Institucional']) ? htmlspecialchars($datos_estudiante['Correo_Institucional']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="section-title">Datos Académicos</div>

                        <div class="info-field">
                            <label>Número de Control</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Numero_Control']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Numero_Control']) ? htmlspecialchars($datos_estudiante['Numero_Control']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Carrera</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Carrera']) ? 'empty' : ''; ?>">
                                <?php
                                    $carreras = [
                                        'ISC'  => 'Ingeniería en Sistemas Computacionales',
                                        'IGE'  => 'Ingeniería en Gestión Empresarial',
                                        'MEC'  => 'Ingeniería Mecatrónica',
                                        'II'   => 'Ingeniería Industrial',
                                        'IA'   => 'Ingeniería Ambiental',
                                        'IINF' => 'Ingeniería en Informática',
                                        'IE'   => 'Ingeniería Electromecánica',
                                        'LA'   => 'Licenciatura en Administración',
                                    ];
                                    $c = $datos_estudiante['Carrera'] ?? '';
                                    echo htmlspecialchars($carreras[$c] ?? ($c ?: 'Sin datos'));
                                ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Semestre</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Semestre']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Semestre']) ? htmlspecialchars($datos_estudiante['Semestre']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Modalidad</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Modalidad']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Modalidad']) ? htmlspecialchars($datos_estudiante['Modalidad']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="section-title">Dirección</div>

                        <div class="info-field">
                            <label>Código Postal</label>
                            <div class="field-value <?php echo empty($datos_estudiante['CodigoPostal']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['CodigoPostal']) ? htmlspecialchars($datos_estudiante['CodigoPostal']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Ciudad</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Ciudad']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Ciudad']) ? htmlspecialchars($datos_estudiante['Ciudad']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Calle</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Calle']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Calle']) ? htmlspecialchars($datos_estudiante['Calle']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Colonia</label>
                            <div class="field-value <?php echo empty($datos_estudiante['Colonia']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['Colonia']) ? htmlspecialchars($datos_estudiante['Colonia']) : 'Sin datos'; ?>
                            </div>
                        </div>

                        <div class="info-field">
                            <label>Número de Casa</label>
                            <div class="field-value <?php echo empty($datos_estudiante['No_Casa']) ? 'empty' : ''; ?>">
                                <?php echo !empty($datos_estudiante['No_Casa']) ? htmlspecialchars($datos_estudiante['No_Casa']) : 'Sin datos'; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>

     <!-- === MODAL UNIVERSAL === -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal-content" id="modalContent">
            <i class="modal-icon"      id="modalIcon"></i>
            <div class="modal-title"   id="modalTitle"></div>
            <div class="modal-text"    id="modalText"></div>
            <div class="modal-actions" id="modalActions"></div>
        </div>
    </div>
     <!-- SCRIPTS -->
    <script src="componentes.js"></script>

    <script>
        /* BLOQUEAR RETROCESO */
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', function () {
            history.go(1);
            window.location.replace('ServicioSocial_Menu.php');
        });
    </script>
    <script>
    const overlay    = document.getElementById('zoomOverlay');
    const zoomImg    = document.getElementById('zoomImg');
    const zoomClose  = document.getElementById('zoomClose');
    const zoomContainer = document.getElementById('zoomContainer');

     /* PRELOADER (componentes.js)*/
        initPreloader();

        /* MODAL UNIVERSAL (componentes.js) */
        initModal();

    // Abrir zoom al hacer clic en la foto
    document.querySelectorAll('.student-photo').forEach(img => {
        img.addEventListener('click', () => {
            zoomImg.src = img.src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Cerrar con el botón ✕
    zoomClose.addEventListener('click', cerrarZoom);

    // Cerrar al hacer clic fuera de la imagen
    overlay.addEventListener('click', (e) => {
        if (!zoomContainer.contains(e.target)) cerrarZoom();
    });

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarZoom();
    });

    function cerrarZoom() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
</script>
<script>
(function () {
    const input       = document.getElementById('searchInput');
    const suggestions = document.getElementById('suggestions');
    const clearBtn    = document.getElementById('clearBtn');
    let   timer;

    // Mostrar botón limpiar si hay texto al cargar
    if (input.value.trim()) clearBtn.style.display = 'flex';

    function getInitials(nombre) {
        const partes = nombre.trim().split(' ');
        return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '??';
    }

    function render(data) {
        suggestions.innerHTML = '';
        if (!data.length) {
            suggestions.innerHTML = '<div class="no-suggestions"><i class="fas fa-search"></i> Sin resultados</div>';
        } else {
            data.forEach(s => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <div class="suggestion-avatar">${getInitials(s.nombre)}</div>
                    <div class="suggestion-info">
                        <div class="suggestion-name">${s.nombre}</div>
                        <div class="suggestion-control">${s.numero_control}</div>
                    </div>`;
                item.addEventListener('mousedown', () => {
                    // Redirige a la misma página con el número de control
                    window.location.href = `?nc=${encodeURIComponent(s.numero_control)}`;
                });
                suggestions.appendChild(item);
            });
        }
        suggestions.classList.add('active');
    }

    input.addEventListener('input', function () {
        const q = this.value.trim();
        clearBtn.style.display = q ? 'flex' : 'none';
        clearTimeout(timer);
        if (q.length < 2) { suggestions.classList.remove('active'); return; }

        timer = setTimeout(() => {
            fetch(`?buscar_sugerencias=1&termino=${encodeURIComponent(q)}`)
                .then(r => r.json())
                .then(data => render(data.sugerencias ?? []))
                .catch(() => suggestions.classList.remove('active'));
        }, 300);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => suggestions.classList.remove('active'), 200);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        suggestions.classList.remove('active');
        // Limpiar la vista si hay estudiante cargado
        if (window.location.search) window.location.href = window.location.pathname;
        input.focus();
    });
})();
</script>
<script>
    history.pushState(null, null, location.href);
window.addEventListener('popstate', function () {
    window.location.replace('ServicioSocial_Menu.php');
});
</script>
</body>
</html>