// Funciones para manejo de usuarios

// Función para limpiar formulario de alta de usuario
function limpia_alta() {
  limpiarFormulario([
    'alta_email',
    'alta_password',
    'alta_nombre',
    'alta_apellido_paterno',
    'alta_apellido_materno',
    'alta_fecha_nacimiento',
    'alta_telefono',
  ])

  get('alta_genero').value = ''
  get('alta_imagen').src = 'usuario_sin_foto.png'
  AppConfig.foto = null
}

// Función para dar de alta un usuario
function alta() {
  // Validar campos obligatorios
  const camposRequeridos = [
    'alta_email',
    'alta_password',
    'alta_nombre',
    'alta_apellido_paterno',
    'alta_fecha_nacimiento',
  ]

  if (!validarCamposRequeridos(camposRequeridos)) {
    return
  }

  // Validaciones específicas
  const email = get('alta_email').value.trim()
  const password = get('alta_password').value
  const telefono = get('alta_telefono').value.trim()

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

  if (telefono && !validarTelefono(telefono)) {
    showNotification('Ingrese un teléfono válido', 'error')
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('alta_email', true)

  const cliente = new WSClient(AppConfig.URL)
  const usuario = {
    email: email,
    password: password,
    nombre: get('alta_nombre').value.trim(),
    apellido_paterno: get('alta_apellido_paterno').value.trim(),
    apellido_materno: get('alta_apellido_materno').value.trim() || null,
    fecha_nacimiento: get('alta_fecha_nacimiento').value
      ? new Date(get('alta_fecha_nacimiento').value).toISOString()
      : null,
    telefono: telefono || null,
    genero: convertirGenero(get('alta_genero').value),
    foto: AppConfig.foto,
  }

  cliente.postJson(
    'alta_usuario',
    { usuario: usuario },
    function (code, result) {
      // Ocultar indicador de carga
      toggleLoadingButton('alta_email', false)

      if (code == 200) {
        showNotification('Usuario registrado exitosamente', 'success')
        limpia_alta()
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para limpiar formulario de consulta
function limpia_consulta() {
  limpiarFormulario([
    'consulta_email',
    'consulta_password',
    'consulta_nombre',
    'consulta_apellido_paterno',
    'consulta_apellido_materno',
    'consulta_fecha_nacimiento',
    'consulta_telefono',
  ])

  get('consulta_genero').value = ''
  get('consulta_imagen').src = 'usuario_sin_foto.png'
  AppConfig.foto = null
}

// Función para cerrar pantalla de consulta
function cierra_pantalla_consulta() {
  oculta_pantalla('consulta_usuario')
  muestra('encabezado_consulta')
  muestra('boton_consulta')
  oculta('encabezado_modifica')
  oculta('modifica_usuario')
  get('consulta_email').readOnly = false
}

// Función para quitar foto en consulta
function quita_foto() {
  AppConfig.foto = null
  get('consulta_imagen').src = 'usuario_sin_foto.png'
  get('consulta_file').value = ''
}

// Función para consultar usuario
function consulta() {
  const email = get('consulta_email').value.trim()

  if (!email) {
    showNotification('Debe ingresar un email', 'error')
    return
  }

  if (!validarEmail(email)) {
    showNotification('Ingrese un email válido', 'error')
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('consulta_email', true)

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'consulta_usuario',
    { email: email },
    function (code, result) {
      // Ocultar indicador de carga
      toggleLoadingButton('consulta_email', false)

      if (code == 200) {
        // Llenar formulario con datos del usuario
        llenarFormularioConsulta(result)

        // Cambiar vista a modo edición
        oculta('encabezado_consulta')
        muestra('encabezado_modifica')
        muestra('modifica_usuario')
        oculta('boton_consulta')
        get('consulta_email').readOnly = true

        showNotification('Usuario encontrado', 'success')
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para llenar formulario de consulta con datos
function llenarFormularioConsulta(result) {
  get('consulta_email').value = result.email
  get('consulta_password').value = result.password
  get('consulta_nombre').value = result.nombre
  get('consulta_apellido_paterno').value = result.apellido_paterno
  get('consulta_apellido_materno').value = result.apellido_materno || ''

  if (result.fecha_nacimiento) {
    get('consulta_fecha_nacimiento').value = formatearFecha(
      new Date(result.fecha_nacimiento + 'Z').toLocaleString('en-US')
    )
  }

  get('consulta_telefono').value = result.telefono || ''
  get('consulta_genero').value = convertirGeneroDisplay(result.genero)

  AppConfig.foto = result.foto
  get('consulta_imagen').src = result.foto
    ? 'data:image/jpeg;base64,' + result.foto
    : 'usuario_sin_foto.png'
}

// Función para modificar usuario
function modifica() {
  // Validar campos obligatorios
  const camposRequeridos = [
    'consulta_email',
    'consulta_password',
    'consulta_nombre',
    'consulta_apellido_paterno',
    'consulta_fecha_nacimiento',
  ]

  if (!validarCamposRequeridos(camposRequeridos)) {
    return
  }

  // Validaciones específicas
  const email = get('consulta_email').value.trim()
  const password = get('consulta_password').value
  const telefono = get('consulta_telefono').value.trim()

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

  if (telefono && !validarTelefono(telefono)) {
    showNotification('Ingrese un teléfono válido', 'error')
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('consulta_password', true)

  const cliente = new WSClient(AppConfig.URL)
  const usuario = {
    email: email,
    password: password,
    nombre: get('consulta_nombre').value.trim(),
    apellido_paterno: get('consulta_apellido_paterno').value.trim(),
    apellido_materno: get('consulta_apellido_materno').value.trim() || null,
    fecha_nacimiento: get('consulta_fecha_nacimiento').value
      ? new Date(get('consulta_fecha_nacimiento').value).toISOString()
      : null,
    telefono: telefono || null,
    genero: convertirGenero(get('consulta_genero').value),
    foto: AppConfig.foto,
  }

  cliente.postJson(
    'modifica_usuario',
    { usuario: usuario },
    function (code, result) {
      // Ocultar indicador de carga
      toggleLoadingButton('consulta_password', false)

      if (code == 200) {
        showNotification('Usuario modificado exitosamente', 'success')
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para limpiar formulario de borrar usuario
function limpia_borra() {
  limpiarFormulario(['borra_email'])
}

// Función para borrar usuario
function borra() {
  const email = get('borra_email').value.trim()

  if (!email) {
    showNotification('Debe ingresar un email', 'error')
    return
  }

  if (!validarEmail(email)) {
    showNotification('Ingrese un email válido', 'error')
    return
  }

  if (
    !confirm(`¿Está seguro que desea eliminar el usuario con email: ${email}?`)
  ) {
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('borra_email', true)

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson('borra_usuario', { email: email }, function (code, result) {
    // Ocultar indicador de carga
    toggleLoadingButton('borra_email', false)

    if (code == 200) {
      showNotification('Usuario eliminado exitosamente', 'success')
      limpia_borra()
    } else {
      handleHTTPError(code, result)
    }
  })
}

// Funciones auxiliares para conversión de género
function convertirGenero(generoDisplay) {
  switch (generoDisplay) {
    case 'Masculino':
      return 'M'
    case 'Femenino':
      return 'F'
    default:
      return null
  }
}

function convertirGeneroDisplay(generoCode) {
  switch (generoCode) {
    case 'M':
      return 'Masculino'
    case 'F':
      return 'Femenino'
    default:
      return ''
  }
}
