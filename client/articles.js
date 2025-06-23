// Funciones para manejo de artículos

// Función para limpiar formulario de artículo
function limpia_articulo() {
  limpiarFormulario([
    'articulo_nombre',
    'articulo_descripcion',
    'articulo_precio',
    'articulo_cantidad',
  ])

  get('articulo_imagen').src = 'articulo_sin_foto.png'
  AppConfig.fotoArticulo = null
}

// Función para quitar foto de artículo
function quita_foto_articulo() {
  AppConfig.fotoArticulo = null
  get('articulo_imagen').src = 'articulo_sin_foto.png'
  get('articulo_file').value = ''
}

// Función para dar de alta un artículo
function alta_articulo() {
  // Validar campos obligatorios
  const camposRequeridos = [
    'articulo_nombre',
    'articulo_precio',
    'articulo_cantidad',
  ]

  if (!validarCamposRequeridos(camposRequeridos)) {
    return
  }

  // Validaciones específicas
  const nombre = get('articulo_nombre').value.trim()
  const precio = parseFloat(get('articulo_precio').value)
  const cantidad = parseInt(get('articulo_cantidad').value)
  const descripcion = get('articulo_descripcion').value.trim()

  if (nombre.length > AppConfig.VALIDATION.MAX_TEXT_LENGTH) {
    showNotification(
      `El nombre no puede exceder ${AppConfig.VALIDATION.MAX_TEXT_LENGTH} caracteres`,
      'error'
    )
    return
  }

  if (descripcion.length > AppConfig.VALIDATION.MAX_DESCRIPTION_LENGTH) {
    showNotification(
      `La descripción no puede exceder ${AppConfig.VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres`,
      'error'
    )
    return
  }

  if (isNaN(precio) || precio <= 0) {
    showNotification('El precio debe ser mayor a cero', 'error')
    return
  }

  if (isNaN(cantidad) || cantidad < 0) {
    showNotification('La cantidad no puede ser negativa', 'error')
    return
  }

  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión para crear artículos', 'error')
    return
  }

  // Mostrar indicador de carga
  toggleLoadingButton('articulo_nombre', true)

  const cliente = new WSClient(AppConfig.URL)
  const articulo = {
    nombre: nombre,
    descripcion: descripcion || null,
    precio: precio,
    cantidad: cantidad,
    foto: AppConfig.fotoArticulo,
    id_usuario: AppConfig.usuarioActual.id_usuario,
    token: AppConfig.usuarioActual.token,
  }

  cliente.postJson(
    'alta_articulo',
    { articulo: articulo },
    function (code, result) {
      // Ocultar indicador de carga
      toggleLoadingButton('articulo_nombre', false)

      if (code == 200) {
        showNotification('Artículo guardado correctamente', 'success')
        limpia_articulo()
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para inicializar la pantalla de compra
function iniciar_compra() {
  // Limpiar el campo de búsqueda
  if (get('busqueda_articulo')) {
    get('busqueda_articulo').value = ''
  }

  // Cargar todos los artículos sin filtro
  cargar_articulos('')

  // Actualizar el badge del carrito
  actualizarBadgeCarrito()
}

// Función para cargar los artículos disponibles
function cargar_articulos(palabraClave) {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión para ver los artículos', 'error')
    return
  }

  const container = get('lista_articulos')
  if (!container) return

  // Mostrar indicador de carga
  container.innerHTML =
    '<div style="text-align: center; padding: 20px;"><div class="loader"></div><p>Cargando artículos...</p></div>'

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'consulta_articulos',
    {
      palabra_clave: palabraClave || '',
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      if (code == 200) {
        mostrarArticulos(result, container)
      } else {
        container.innerHTML = `<div class="empty-state">
                <span class="empty-state-icon">⚠️</span>
                <div class="empty-state-message">Error al cargar artículos</div>
            </div>`
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para mostrar artículos en la interfaz
function mostrarArticulos(articulos, container) {
  if (articulos.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">📦</span>
                <div class="empty-state-message">No se encontraron artículos</div>
                <p>Intente con una búsqueda diferente</p>
            </div>
        `
    return
  }

  container.innerHTML = ''

  articulos.forEach((articulo) => {
    if (articulo.cantidad > 0) {
      // Solo mostrar artículos con stock
      container.innerHTML += generarHTMLArticulo(articulo)
    }
  })

  // Si después del filtro no hay artículos disponibles
  if (container.innerHTML === '') {
    container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">📦</span>
                <div class="empty-state-message">No hay artículos disponibles</div>
                <p>Todos los artículos están agotados</p>
            </div>
        `
  }
}

// Función para buscar artículos con debounce
const buscar_articulos = debounce(function () {
  const palabraClave = get('busqueda_articulo').value.trim()
  cargar_articulos(palabraClave)
}, 300)

// Función para comprar un artículo (agregar al carrito)
function comprar_articulo(id_articulo, nombre, precio, fotoBase64) {
  if (!AppConfig.usuarioActual) {
    showNotification('Debe iniciar sesión para comprar', 'error')
    return
  }

  // Obtener el elemento de cantidad
  const cantidadElement = get('cantidad_' + id_articulo)
  if (!cantidadElement) {
    showNotification(
      'Error: No se pudo encontrar la cantidad para este artículo',
      'error'
    )
    return
  }

  // Validar la cantidad
  const cantidad = parseInt(cantidadElement.value)
  if (isNaN(cantidad) || cantidad <= 0) {
    showNotification(
      'Por favor ingrese una cantidad válida mayor a cero',
      'error'
    )
    cantidadElement.focus()
    return
  }

  const maxCantidad = parseInt(cantidadElement.getAttribute('max'))
  if (cantidad > maxCantidad) {
    showNotification(`La cantidad máxima disponible es ${maxCantidad}`, 'error')
    cantidadElement.value = maxCantidad
    return
  }

  // Mostrar indicador de carga en el botón
  const btnCompra = cantidadElement.nextElementSibling
  const textoOriginal = btnCompra.innerHTML
  btnCompra.innerHTML = '🔄 Agregando...'
  btnCompra.disabled = true

  const cliente = new WSClient(AppConfig.URL)
  cliente.postJson(
    'compra_articulo',
    {
      id_articulo: id_articulo,
      cantidad: cantidad,
      id_usuario: AppConfig.usuarioActual.id_usuario,
      token: AppConfig.usuarioActual.token,
    },
    function (code, result) {
      // Restaurar el botón
      btnCompra.innerHTML = textoOriginal
      btnCompra.disabled = false

      if (code == 200) {
        // Actualizar el carrito local
        agregarAlCarritoLocal(id_articulo, nombre, precio, cantidad, fotoBase64)

        // Actualizar el badge del carrito
        actualizarBadgeCarrito()

        // Mostrar mensaje de éxito
        showNotification(AppConfig.MESSAGES.CART_ADD_SUCCESS, 'success')

        // Restablecer la cantidad a 1
        cantidadElement.value = '1'

        // Recargar artículos para actualizar stock
        const palabraClave = get('busqueda_articulo').value.trim()
        cargar_articulos(palabraClave)
      } else {
        handleHTTPError(code, result)
      }
    }
  )
}

// Función para agregar artículo al carrito local
function agregarAlCarritoLocal(
  id_articulo,
  nombre,
  precio,
  cantidad,
  fotoBase64
) {
  // Verificar si ya existe el artículo en el carrito
  let encontrado = false
  for (let i = 0; i < AppConfig.carritoActual.length; i++) {
    if (AppConfig.carritoActual[i].id_articulo === id_articulo) {
      // Actualizar cantidad
      AppConfig.carritoActual[i].cantidad += cantidad
      encontrado = true
      break
    }
  }

  // Si no se encontró, agregar como nuevo
  if (!encontrado) {
    AppConfig.carritoActual.push({
      id_articulo: id_articulo,
      nombre: nombre,
      precio: precio,
      cantidad: cantidad,
      foto: fotoBase64,
    })
  }
}

// Función para validar entrada de cantidad en tiempo real
function validarCantidadInput(input) {
  const valor = parseInt(input.value)
  const min = parseInt(input.getAttribute('min')) || 1
  const max = parseInt(input.getAttribute('max')) || 999

  if (isNaN(valor) || valor < min) {
    input.value = min
  } else if (valor > max) {
    input.value = max
    showNotification(`Cantidad máxima disponible: ${max}`, 'warning')
  }
}

// Función para filtrar artículos por categoría (si se implementa en el futuro)
function filtrarPorCategoria(categoria) {
  const palabraClave = categoria === 'todos' ? '' : categoria
  cargar_articulos(palabraClave)
}

// Event listener para validación en tiempo real de cantidades
document.addEventListener('input', function (e) {
  if (e.target.classList.contains('quantity-input')) {
    validarCantidadInput(e.target)
  }
})

// Event listener para manejar Enter en búsqueda
document.addEventListener('keyup', function (e) {
  if (e.target.id === 'busqueda_articulo' && e.key === 'Enter') {
    buscar_articulos()
  }
})
