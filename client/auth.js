// Funciones de autenticación y manejo de usuario

// Función para verificar si el usuario está autenticado
function verificaAutenticacion(pantalla) {
  if (AppConfig.usuarioActual == null) {
    // Usuario no autenticado, guardamos la pantalla solicitada y mostramos login
    AppConfig.pantallaSolicitada = pantalla
    muestra_pantalla('login')
    return false
  }
  return true
}

// Función para realizar el login
function login() {
  const email = get('login_email').value.trim()
  const password = get('login_password').value

  // Validaciones básicas
  if (!email || !password) {
    showNotification(AppConfig.MESSAGES.REQUIRED_FIELDS, 'error')
    return
  }

  if (!validarEmail(email)) {
    showNotification('Ingrese un email válido', 'error')
    return
  }

  if (password.length < AppConfig.VALIDATION.MIN_PASSWORD_LENGTH) {
    showNotification(
      `La contraseña debe tener al menos ${AppConfig.VALIDATION.MIN_PASSWORD_LENGTH} caracteres`,
      'error'
    )
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('login_email', true)

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'login',
    {
      email: email,
      password: password,
    },
    function (code, result) {
      // Ocultar indicador de carga
      toggleLoadingButton('login_email', false)

      if (code == 200) {
        // Verificar si el token está vacío (autenticación fallida)
        if (!result.token || result.token === '') {
          showNotification(AppConfig.MESSAGES.LOGIN_ERROR, 'error')
          return
        }

        // Guardar información del usuario logueado
        AppConfig.usuarioActual = {
          email: email,
          token: result.token,
          id_usuario: result.id_usuario,
          nombre: result.nombre,
        }

        // Limpiar campos de login
        limpiarFormulario(['login_email', 'login_password'])

        // Mostrar mensaje de bienvenida
        showNotification(
          `${AppConfig.MESSAGES.LOGIN_SUCCESS} ${result.nombre}`,
          'success'
        )

        // Actualizar la información de usuario
        actualizarInfoUsuario()

        // Redirigir a la pantalla solicitada
        redirigirDespuesLogin()

        // Inicializar carrito vacío
        AppConfig.carritoActual = []

        // Actualizar visibilidad del botón de logout
        actualizarBotonLogout()
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para redirigir después del login
function redirigirDespuesLogin() {
  if (AppConfig.pantallaSolicitada) {
    if (AppConfig.pantallaSolicitada === 'captura_articulo') {
      limpia_articulo()
      muestra_pantalla('captura_articulo')
    } else if (AppConfig.pantallaSolicitada === 'compra_articulos') {
      iniciar_compra()
      muestra_pantalla('compra_articulos')
    }
    AppConfig.pantallaSolicitada = null
  } else {
    oculta('login')
    muestra('menu')
  }
}

// Función para actualizar la información de usuario en la interfaz
function actualizarInfoUsuario() {
  if (AppConfig.usuarioActual) {
    get('user-display').textContent =
      AppConfig.usuarioActual.nombre || 'Usuario logueado'
    get('login-status').style.display = 'block'
    get('login-placeholder').style.display = 'none'
  } else {
    get('login-status').style.display = 'none'
    get('login-placeholder').style.display = 'block'
  }
}

// Función para cerrar sesión
function logout() {
  if (confirm('¿Está seguro que desea cerrar sesión?')) {
    AppConfig.usuarioActual = null
    AppConfig.carritoActual = []
    AppConfig.foto = null
    AppConfig.fotoArticulo = null

    // Limpiar todos los formularios
    limpiarTodosLosFormularios()

    muestra('menu')
    showNotification(AppConfig.MESSAGES.LOGOUT_SUCCESS, 'success')

    // Actualizar interfaz
    actualizarInfoUsuario()
    actualizarBotonLogout()
    actualizarBadgeCarrito()
  }
}

// Función para limpiar todos los formularios
function limpiarTodosLosFormularios() {
  // Login
  limpiarFormulario(['login_email', 'login_password'])

  // Alta usuario
  limpia_alta()

  // Consulta usuario
  limpia_consulta()

  // Borrar usuario
  limpia_borra()

  // Artículo
  limpia_articulo()

  // Búsqueda
  if (get('busqueda_articulo')) {
    get('busqueda_articulo').value = ''
  }
}

// Función para mostrar/ocultar el botón de logout
function actualizarBotonLogout() {
  const btnLogout = get('btn_logout')
  if (btnLogout) {
    if (AppConfig.usuarioActual) {
      btnLogout.style.display = 'block'
    } else {
      btnLogout.style.display = 'none'
    }
  }
}

// Función para verificar si la sesión sigue activa
function verificarSesion() {
  if (!AppConfig.usuarioActual) return

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'verificar_sesion',
    {
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      if (code !== 200) {
        // Sesión expirada
        showNotification(
          'Su sesión ha expirado. Por favor inicie sesión nuevamente.',
          'warning'
        )
        logout()
      }
    }
  )
}

// Función para auto-logout después de inactividad
let inactivityTimer
const INACTIVITY_TIME = 30 * 60 * 1000 // 30 minutos

function resetInactivityTimer() {
  clearTimeout(inactivityTimer)
  if (AppConfig.usuarioActual) {
    inactivityTimer = setTimeout(() => {
      showNotification('Sesión cerrada por inactividad', 'info')
      logout()
    }, INACTIVITY_TIME)
  }
}

// Eventos para detectar actividad del usuario
document.addEventListener('mousedown', resetInactivityTimer)
document.addEventListener('mousemove', throttle(resetInactivityTimer, 1000))
document.addEventListener('keypress', resetInactivityTimer)
document.addEventListener('scroll', throttle(resetInactivityTimer, 1000))
document.addEventListener('touchstart', resetInactivityTimer)

// Verificar sesión periódicamente
setInterval(() => {
  if (AppConfig.usuarioActual) {
    verificarSesion()
  }
}, 5 * 60 * 1000) // Cada 5 minutos

// Funciones para abrir pantallas con verificación de autenticación
function abrirCapturaArticulo() {
  if (verificaAutenticacion('captura_articulo')) {
    limpia_articulo()
    muestra_pantalla('captura_articulo')
  }
}

function abrirCompraArticulos() {
  if (verificaAutenticacion('compra_articulos')) {
    iniciar_compra()
    muestra_pantalla('compra_articulos')
  }
}
