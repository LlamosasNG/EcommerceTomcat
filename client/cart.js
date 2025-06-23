// Funciones para manejo del carrito de compras

// Función para actualizar el badge del carrito
function actualizarBadgeCarrito() {
  let totalItems = 0
  let totalCosto = 0

  for (let i = 0; i < AppConfig.carritoActual.length; i++) {
    totalItems += AppConfig.carritoActual[i].cantidad
    totalCosto +=
      AppConfig.carritoActual[i].precio * AppConfig.carritoActual[i].cantidad
  }

  // Actualizar el badge
  const badge = get('carrito_badge')
  const btnCarrito = get('btn_carrito')

  if (badge && btnCarrito) {
    if (totalItems > 0) {
      badge.textContent = totalItems
      badge.style.display = 'inline-block'
      btnCarrito.title = `Total: $${formatearPrecio(
        totalCosto
      )} (${totalItems} artículos)`
    } else {
      badge.style.display = 'none'
      btnCarrito.title = 'Carrito vacío'
    }
  }
}

// Función para mostrar la pantalla de artículos en el carrito
function mostrar_pantalla_carrito() {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión para ver el carrito', 'error')
    return
  }

  // Ocultar la pantalla de compra
  oculta('compra_articulos')

  // Mostrar la pantalla del carrito
  muestra('articulos_carrito')

  // Cargar los artículos del carrito
  cargar_carrito_local()
}

// Función para cargar los artículos del carrito desde la variable local
function cargar_carrito_local() {
  const container = get('articulos_carrito_items')
  const totalElement = get('carrito_total_detalle')

  if (!container || !totalElement) return

  let total = 0

  if (AppConfig.carritoActual.length === 0) {
    // Carrito vacío
    container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🛒</span>
                <div class="empty-state-message">${AppConfig.MESSAGES.CART_EMPTY}</div>
                <button onclick="seguir_comprando()" class="btn btn-primary">
                    🛍️ Ir a la tienda
                </button>
            </div>
        `
    totalElement.innerHTML = 'Total: $0.00'

    // Deshabilitar botones
    toggleCartButtons(false)
    return
  }

  // Habilitar los botones
  toggleCartButtons(true)

  // Construir HTML para cada artículo
  container.innerHTML = ''
  AppConfig.carritoActual.forEach((item) => {
    const subtotal = item.precio * item.cantidad
    total += subtotal
    container.innerHTML += generarHTMLCarritoItem(item)
  })

  // Actualizar el total
  totalElement.innerHTML = `Total: $${formatearPrecio(total)}`
}

// Función para habilitar/deshabilitar botones del carrito
function toggleCartButtons(enabled) {
  const buttons = ['btn_finalizar_compra', 'btn_eliminar_carrito']
  buttons.forEach((buttonId) => {
    const button = get(buttonId)
    if (button) {
      button.disabled = !enabled
    }
  })

  // El botón de seguir comprando siempre está habilitado
  const btnSeguir = get('btn_seguir_comprando')
  if (btnSeguir) {
    btnSeguir.disabled = false
  }
}

// Función para volver a la pantalla de compra (Seguir comprando)
function seguir_comprando() {
  // Ocultar la pantalla del carrito
  oculta('articulos_carrito')

  // Mostrar la pantalla de compra
  muestra('compra_articulos')

  // Refrescar lista de artículos disponibles
  const palabraClave = get('busqueda_articulo')
    ? get('busqueda_articulo').value.trim()
    : ''
  cargar_articulos(palabraClave)
}

// Función para eliminar un artículo específico del carrito
function eliminar_articulo_carrito(id_articulo) {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión', 'error')
    return
  }

  // Buscar el nombre del artículo para la confirmación
  let nombreArticulo = 'este artículo'
  const articulo = AppConfig.carritoActual.find(
    (item) => item.id_articulo === id_articulo
  )
  if (articulo) {
    nombreArticulo = articulo.nombre
  }

  // Mostrar confirmación
  if (
    !confirm(`¿Está seguro que desea eliminar "${nombreArticulo}" del carrito?`)
  ) {
    return
  }

  // Identificar el elemento de la interfaz para dar feedback visual
  const elementos = document.querySelectorAll('.cart-item')
  let elementoAEliminar = null

  elementos.forEach((elemento) => {
    const boton = elemento.querySelector(
      `button[onclick="eliminar_articulo_carrito(${id_articulo})"]`
    )
    if (boton) {
      elementoAEliminar = elemento
    }
  })

  if (elementoAEliminar) {
    // Aplicar estilo visual de "eliminando"
    elementoAEliminar.style.opacity = '0.5'
    const btnEliminar = elementoAEliminar.querySelector('.btn-remove')
    if (btnEliminar) {
      btnEliminar.innerHTML = '🔄 Eliminando...'
      btnEliminar.disabled = true
    }
  }

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'elimina_articulo_carrito_compra',
    {
      id_articulo: id_articulo,
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      if (code == 200) {
        // Eliminar del carrito local
        AppConfig.carritoActual = AppConfig.carritoActual.filter(
          (item) => item.id_articulo !== id_articulo
        )

        // Actualizar interfaz
        cargar_carrito_local()
        actualizarBadgeCarrito()

        showNotification(AppConfig.MESSAGES.CART_REMOVE_SUCCESS, 'success')

        // Si el carrito está vacío, mostrar opción de seguir comprando
        if (AppConfig.carritoActual.length === 0) {
          setTimeout(() => {
            if (confirm('El carrito está vacío. ¿Desea continuar comprando?')) {
              seguir_comprando()
            }
          }, 1000)
        }
      } else {
        // Error - restaurar la apariencia normal
        if (elementoAEliminar) {
          elementoAEliminar.style.opacity = '1'
          const btnEliminar = elementoAEliminar.querySelector('.btn-remove')
          if (btnEliminar) {
            btnEliminar.innerHTML = '🗑️ Eliminar'
            btnEliminar.disabled = false
          }
        }
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para eliminar todo el carrito
function eliminar_carrito() {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión', 'error')
    return
  }

  if (AppConfig.carritoActual.length === 0) {
    showNotification('El carrito ya está vacío', 'info')
    return
  }

  // Mostrar confirmación con detalles
  const totalItems = AppConfig.carritoActual.reduce(
    (sum, item) => sum + item.cantidad,
    0
  )
  const confirmMessage = `¿Está seguro que desea eliminar todo el carrito?\n\nSe eliminarán ${totalItems} artículos.`

  if (!confirm(confirmMessage)) {
    return
  }

  // Mostrar indicador de carga
  const btnEliminarCarrito = get('btn_eliminar_carrito')
  toggleLoadingButton('btn_eliminar_carrito', true)

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'elimina_carrito_compra',
    {
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      // Restaurar el botón
      toggleLoadingButton('btn_eliminar_carrito', false)

      if (code == 200) {
        // Vaciar carrito local
        AppConfig.carritoActual = []

        // Actualizar interfaz
        cargar_carrito_local()
        actualizarBadgeCarrito()

        showNotification('Carrito eliminado correctamente', 'success')

        // Preguntar si desea seguir comprando
        setTimeout(() => {
          if (confirm('¿Desea continuar comprando?')) {
            seguir_comprando()
          }
        }, 1500)
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para finalizar la compra
function finalizar_compra() {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión', 'error')
    return
  }

  if (AppConfig.carritoActual.length === 0) {
    showNotification('El carrito está vacío', 'info')
    return
  }

  // Calcular total de la compra
  const totalCompra = AppConfig.carritoActual.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  )
  const totalItems = AppConfig.carritoActual.reduce(
    (sum, item) => sum + item.cantidad,
    0
  )

  // Mostrar resumen de compra
  const resumenCompra = `
Resumen de su compra:
• ${totalItems} artículos
• Total: ${formatearPrecio(totalCompra)}

¿Confirma la compra?`

  if (!confirm(resumenCompra)) {
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('btn_finalizar_compra', true)

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'finalizar_compra',
    {
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
      total: totalCompra,
      articulos: AppConfig.carritoActual,
    },
    function (code, result) {
      // Restaurar el botón
      toggleLoadingButton('btn_finalizar_compra', false)

      if (code == 200) {
        // Vaciar carrito local (compra exitosa)
        AppConfig.carritoActual = []

        // Actualizar interfaz
        cargar_carrito_local()
        actualizarBadgeCarrito()

        // Mostrar mensaje de éxito
        showNotification(AppConfig.MESSAGES.PURCHASE_SUCCESS, 'success')

        // Mostrar detalles de la compra
        setTimeout(() => {
          alert(
            `¡Compra realizada exitosamente!\n\nTotal pagado: ${formatearPrecio(
              totalCompra
            )}\nArtículos: ${totalItems}\n\n¡Gracias por su compra!`
          )
        }, 1000)

        // Regresar al menú principal después de un tiempo
        setTimeout(() => {
          if (
            confirm('¿Desea continuar comprando o regresar al menú principal?')
          ) {
            seguir_comprando()
          } else {
            oculta_pantalla('articulos_carrito')
          }
        }, 3000)
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para obtener el total del carrito
function obtenerTotalCarrito() {
  return AppConfig.carritoActual.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  )
}

// Función para obtener la cantidad total de artículos en el carrito
function obtenerCantidadTotalCarrito() {
  return AppConfig.carritoActual.reduce((sum, item) => sum + item.cantidad, 0)
}

// Función para verificar si un artículo está en el carrito
function articuloEnCarrito(id_articulo) {
  return AppConfig.carritoActual.find(
    (item) => item.id_articulo === id_articulo
  )
}

// Función para actualizar la cantidad de un artículo en el carrito
function actualizarCantidadCarrito(id_articulo, nuevaCantidad) {
  const articulo = AppConfig.carritoActual.find(
    (item) => item.id_articulo === id_articulo
  )
  if (articulo) {
    if (nuevaCantidad <= 0) {
      // Si la cantidad es 0 o menor, eliminar el artículo
      eliminar_articulo_carrito(id_articulo)
    } else {
      articulo.cantidad = nuevaCantidad
      cargar_carrito_local()
      actualizarBadgeCarrito()
    }
  }
}

// Función para limpiar el carrito local (sin hacer petición al servidor)
function limpiarCarritoLocal() {
  AppConfig.carritoActual = []
  cargar_carrito_local()
  actualizarBadgeCarrito()
}

// Función para guardar el carrito en localStorage (opcional, para persistencia)
function guardarCarritoLocal() {
  try {
    localStorage.setItem(
      'carrito_' + AppConfig.usuarioActual.id_usuario,
      JSON.stringify(AppConfig.carritoActual)
    )
  } catch (error) {
    console.warn('No se pudo guardar el carrito en localStorage:', error)
  }
}

// Función para cargar el carrito desde localStorage (opcional)
function cargarCarritoLocal() {
  if (!AppConfig.usuarioActual) return

  try {
    const carritoGuardado = localStorage.getItem(
      'carrito_' + AppConfig.usuarioActual.id_usuario
    )
    if (carritoGuardado) {
      AppConfig.carritoActual = JSON.parse(carritoGuardado)
      actualizarBadgeCarrito()
    }
  } catch (error) {
    console.warn('No se pudo cargar el carrito desde localStorage:', error)
    AppConfig.carritoActual = []
  }
}

// Función para sincronizar el carrito con el servidor
function sincronizarCarrito() {
  if (!AppConfig.usuarioActual) return

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'obtener_carrito',
    {
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      if (code == 200) {
        AppConfig.carritoActual = result.articulos || []
        actualizarBadgeCarrito()

        // Si estamos en la pantalla del carrito, actualizar la vista
        const carritoScreen = get('articulos_carrito')
        if (carritoScreen && carritoScreen.style.display !== 'none') {
          cargar_carrito_local()
        }
      }
    }
  )
}

// Event listeners para el carrito
document.addEventListener('DOMContentLoaded', function () {
  // Sincronizar carrito cada cierto tiempo si hay usuario logueado
  setInterval(() => {
    if (AppConfig.usuarioActual) {
      sincronizarCarrito()
    }
  }, 60000) // Cada minuto
})

// Función para manejar cambios en la cantidad desde la interfaz del carrito
function cambiarCantidadCarrito(id_articulo, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad)
  if (isNaN(cantidad) || cantidad < 1) {
    showNotification('La cantidad debe ser mayor a cero', 'error')
    return
  }

  actualizarCantidadCarrito(id_articulo, cantidad)
}

// Función para obtener estadísticas del carrito
function obtenerEstadisticasCarrito() {
  const total = obtenerTotalCarrito()
  const cantidad = obtenerCantidadTotalCarrito()
  const articulos = AppConfig.carritoActual.length

  return {
    total: total,
    cantidad: cantidad,
    articulos: articulos,
    promedioPorArticulo: articulos > 0 ? total / articulos : 0,
  }
}
