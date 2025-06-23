// Funciones utilitarias generales

// Función para obtener elementos del DOM
function get(id) {
  return document.getElementById(id)
}

// Funciones para mostrar/ocultar elementos
function muestra(id) {
  const element = get(id)
  if (element) {
    element.style.display = 'block'
  }
}

function oculta(id) {
  const element = get(id)
  if (element) {
    element.style.display = 'none'
  }
}

// Funciones para manejo de pantallas
function muestra_pantalla(id) {
  // Ocultar todas las pantallas
  const screens = document.querySelectorAll('.screen, #menu')
  screens.forEach((screen) => {
    screen.style.display = 'none'
  })

  // Mostrar la pantalla solicitada
  muestra(id)
}

function oculta_pantalla(id) {
  oculta(id)
  muestra('menu')
}

// Función para leer archivos de imagen
function readSingleFile(files, imagen) {
  const file = files[0]
  if (!file) return

  // Validar tipo de archivo
  if (!AppConfig.UI.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    showNotification(AppConfig.MESSAGES.INVALID_FILE_TYPE, 'error')
    return
  }

  // Validar tamaño de archivo
  if (file.size > AppConfig.UI.MAX_FILE_SIZE) {
    showNotification(AppConfig.MESSAGES.FILE_TOO_LARGE, 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = function (e) {
    imagen.src = reader.result
    // reader.result incluye al principio: "data:image/jpeg;base64,"
    AppConfig.foto = reader.result.split(',')[1]
  }
  reader.readAsDataURL(file)
}

// Función para leer archivos de artículos
function readArticuloFile(files, imagen) {
  const file = files[0]
  if (!file) return

  // Validar tipo de archivo
  if (!AppConfig.UI.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    showNotification(AppConfig.MESSAGES.INVALID_FILE_TYPE, 'error')
    return
  }

  // Validar tamaño de archivo
  if (file.size > AppConfig.UI.MAX_FILE_SIZE) {
    showNotification(AppConfig.MESSAGES.FILE_TOO_LARGE, 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = function (e) {
    imagen.src = reader.result
    AppConfig.fotoArticulo = reader.result.split(',')[1]
  }
  reader.readAsDataURL(file)
}

// Función para formatear fechas
function formatearFecha(fecha) {
  const date = new Date(fecha)
  const año = date.getFullYear()
  const mes = (date.getMonth() + 1).toString().padStart(2, '0')
  const dia = date.getDate().toString().padStart(2, '0')
  const horas = date.getHours().toString().padStart(2, '0')
  const minutos = date.getMinutes().toString().padStart(2, '0')
  const segundos = date.getSeconds().toString().padStart(2, '0')
  return `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}`
}

// Función para formatear precios
function formatearPrecio(precio) {
  return parseFloat(precio).toFixed(2)
}

// Función para validar email
function validarEmail(email) {
  return AppConfig.VALIDATION.EMAIL_REGEX.test(email)
}

// Función para validar teléfono
function validarTelefono(telefono) {
  return AppConfig.VALIDATION.PHONE_REGEX.test(telefono)
}

// Función para validar campos requeridos
function validarCamposRequeridos(campos) {
  for (let campo of campos) {
    const elemento = get(campo)
    if (!elemento || !elemento.value.trim()) {
      showNotification(
        `El campo ${campo.replace('_', ' ')} es obligatorio`,
        'error'
      )
      elemento.focus()
      return false
    }
  }
  return true
}

// Función para limpiar formularios
function limpiarFormulario(campos) {
  campos.forEach((campo) => {
    const elemento = get(campo)
    if (elemento) {
      if (elemento.type === 'file') {
        elemento.value = ''
      } else {
        elemento.value = ''
      }
    }
  })
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message

  // Agregar al DOM
  document.body.appendChild(notification)

  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show')
  }, 100)

  // Ocultar después del tiempo configurado
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, AppConfig.UI.NOTIFICATION_DURATION)
}

// Función para mostrar indicador de carga en botones
function toggleLoadingButton(buttonId, loading = true, originalText = null) {
  const button = get(buttonId)
  if (!button) return

  if (loading) {
    button.dataset.originalText = button.textContent
    button.textContent = 'Cargando...'
    button.disabled = true
    button.classList.add('loading')
  } else {
    button.textContent =
      originalText || button.dataset.originalText || button.textContent
    button.disabled = false
    button.classList.remove('loading')
    delete button.dataset.originalText
  }
}

// Función para generar HTML de artículos
function generarHTMLArticulo(articulo) {
  const precioFormateado = formatearPrecio(articulo.precio)
  const imagenSrc = articulo.foto
    ? `data:image/jpeg;base64,${articulo.foto}`
    : 'articulo_sin_foto.png'

  return `
        <div class="article-item">
            <div class="article-content">
                <div class="article-image">
                    ${
                      articulo.foto
                        ? `<img src="${imagenSrc}" style="width: 100%; height: 100%; object-fit: cover;">`
                        : '<div>Sin imagen</div>'
                    }
                </div>
                <div class="article-info">
                    <div class="article-name">${articulo.nombre}</div>
                    <div class="article-description">${
                      articulo.descripcion || 'Sin descripción'
                    }</div>
                    <div class="article-price">Precio: $${precioFormateado}</div>
                    <div class="article-stock">Disponibles: ${
                      articulo.cantidad
                    }</div>
                    
                    <div class="article-actions">
                        <label for="cantidad_${
                          articulo.id_articulo
                        }">Cantidad:</label>
                        <input type="number" id="cantidad_${
                          articulo.id_articulo
                        }" 
                               class="quantity-input" min="1" max="${
                                 articulo.cantidad
                               }" value="1">
                        <button onclick="comprar_articulo(${
                          articulo.id_articulo
                        }, '${articulo.nombre}', ${articulo.precio}, '${
    articulo.foto || ''
  }')" 
                                class="btn btn-success">
                            🛒 Comprar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Función para generar HTML de artículos en carrito
function generarHTMLCarritoItem(item) {
  const subtotal = item.precio * item.cantidad
  const imagenSrc = item.foto
    ? `data:image/jpeg;base64,${item.foto}`
    : 'articulo_sin_foto.png'

  return `
        <div class="cart-item">
            <div class="cart-item-content">
                <div class="cart-item-image">
                    ${
                      item.foto
                        ? `<img src="${imagenSrc}" style="width: 100%; height: 100%; object-fit: cover;">`
                        : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">Sin imagen</div>'
                    }
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-details">
                        <div>
                            <div class="cart-item-quantity">Cantidad: <strong>${
                              item.cantidad
                            }</strong></div>
                            <div class="cart-item-price">Precio unitario: <strong>$${formatearPrecio(
                              item.precio
                            )}</strong></div>
                        </div>
                        <div style="text-align: right;">
                            <div class="cart-item-total">Total: $${formatearPrecio(
                              subtotal
                            )}</div>
                            <button onclick="eliminar_articulo_carrito(${
                              item.id_articulo
                            })" class="btn-remove">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Función para manejo de errores HTTP
function handleHTTPError(code, result) {
  let message = AppConfig.MESSAGES.NETWORK_ERROR

  switch (code) {
    case 400:
      message = result.mensaje || 'Solicitud inválida'
      break
    case 401:
      message = 'No autorizado. Inicie sesión nuevamente.'
      break
    case 403:
      message = 'Acceso denegado'
      break
    case 404:
      message = 'Recurso no encontrado'
      break
    case 500:
      message = 'Error interno del servidor'
      break
    default:
      if (result && result.mensaje) {
        message = result.mensaje
      }
  }

  showNotification(message, 'error')
  return message
}

// Función para debounce (útil para búsquedas)
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Función para throttle (útil para eventos de scroll)
function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
