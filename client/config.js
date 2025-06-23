// Configuración global de la aplicación
const AppConfig = {
  // URL del servicio web
  URL: '/Servicio/rest/ws',

  // Variables globales de la aplicación
  usuarioActual: null,
  foto: null,
  fotoArticulo: null,
  pantallaSolicitada: null,
  carritoActual: [],

  // Configuración de la interfaz
  UI: {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // Mensajes de la aplicación
  MESSAGES: {
    LOGIN_SUCCESS: '¡Bienvenido!',
    LOGIN_ERROR: 'Email/contraseña inválidos',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    REQUIRED_FIELDS: 'Debe completar todos los campos obligatorios',
    SAVE_SUCCESS: 'Guardado exitosamente',
    DELETE_SUCCESS: 'Eliminado exitosamente',
    DELETE_CONFIRM: '¿Está seguro que desea eliminar este elemento?',
    CART_ADD_SUCCESS: 'Artículo agregado al carrito',
    CART_REMOVE_SUCCESS: 'Artículo eliminado del carrito',
    CART_EMPTY: 'Tu carrito está vacío',
    PURCHASE_SUCCESS: '¡Compra realizada con éxito!',
    NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
    INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten imágenes.',
    FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 5MB.',
  },

  // Configuración de validación
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
    MIN_PASSWORD_LENGTH: 6,
    MAX_TEXT_LENGTH: 255,
    MAX_DESCRIPTION_LENGTH: 1000,
  },
}

// Hacer la configuración disponible globalmente
window.AppConfig = AppConfig
