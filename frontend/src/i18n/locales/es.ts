export const es = {
  common: {
    backToHome: '← Volver al inicio',
    or: 'o',
    terms: 'Términos de Servicio',
    privacy: 'Política de Privacidad',
    close: 'Cerrar',
    loading: 'Cargando...',
  },

  nav: {
    features: 'Características',
    about: 'Acerca de',
    signIn: 'Iniciar sesión',
    getStarted: 'Comenzar',
  },

  landing: {
    badge: 'Un nuevo estándar para la academia',
    title1: 'Estudio Sincrónico,',
    title2: 'Reinventado.',
    subtitle:
      'Experimenta un espacio de trabajo digital colaborativo diseñado para reducir la carga cognitiva y mejorar el enfoque. Audio de alta fidelidad, grillas de video dinámicas y herramientas académicas persistentes, todo en una plataforma accesible.',
    ctaPrimary: 'Comenzar',
    ctaSecondary: 'Unirse a una sala',
    googleCta: 'Continuar con Google',
    legal: 'Al continuar, aceptas los',
    and: 'y la',
    features: {
      heading: 'Herramientas de Precisión para Estudiantes Serios',
      subheading:
        'Nuestra plataforma se integra perfectamente a tu flujo de trabajo académico, brindando claridad de alto contraste y entornos estructurados.',
      video: {
        title: 'Video y Audio en Tiempo Real',
        description:
          'Grillas de video que se adaptan automáticamente. El resaltado del hablante activo con bordes teal de alto contraste asegura que nunca pierdas el hilo en discusiones complejas.',
      },
      chat: {
        title: 'Chat Persistente',
        description:
          'Conversaciones en hilo, adjuntos de archivos e historiales buscables mapeados perfectamente a la grilla lateral fija.',
      },
      screen: {
        title: 'Compartición de Pantalla Impecable',
        description:
          'Comparte presentaciones, IDEs o pizarras digitales con latencia mínima. Nuestro diseño prioriza tu lienzo sobre la interfaz.',
        cta: 'Verlo en acción',
      },
    },
    footer: {
      privacy: 'Privacidad',
      terms: 'Términos',
      accessibility: 'Accesibilidad',
    },
  },

  login: {
    title: 'Bienvenido a\nStudySphere',
    subtitle: 'Conecta, colabora y conquista tus tareas juntos.',
    emailLabel: 'Correo Electrónico Institucional',
    emailPlaceholder: 'estudiante@universidad.edu',
    passwordLabel: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submitButton: 'Iniciar Sesión',
    submitting: 'Iniciando sesión...',
    googleButton: 'Continuar con Google',
    noAccount: '¿No tienes cuenta?',
    createAccount: 'Crear cuenta',
    // Forgot password mode
    forgotSubtitle: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
    forgotEmailLabel: 'Correo Electrónico',
    sendLink: 'Enviar enlace',
    sending: 'Enviando...',
    backToLogin: '← Volver al inicio de sesión',
    // Sent confirmation
    sentTitle: 'Correo enviado',
    sentDesc: 'Revisa tu bandeja en {{email}} y sigue las instrucciones para restablecer tu contraseña.',
    sentNote: 'Si no lo ves en unos minutos, revisa la carpeta de spam.',
    backToSignIn: 'Volver al inicio de sesión',
  },

  register: {
    title: 'Crear cuenta',
    subtitle: 'Conecta, colabora y conquista tus tareas juntos.',
    avatarLabel: 'Foto de perfil (opcional)',
    firstNameLabel: 'Nombre',
    firstNamePlaceholder: 'Ana',
    lastNameLabel: 'Apellidos',
    lastNamePlaceholder: 'García',
    usernameLabel: 'Nombre de usuario',
    emailLabel: 'Correo Electrónico',
    emailPlaceholder: 'ana.garcia@universidad.edu',
    passwordLabel: 'Contraseña',
    confirmPasswordLabel: 'Confirmar Contraseña',
    submitButton: 'Registrarse',
    submitting: 'Creando cuenta...',
    googleButton: 'Registrarse con Google',
    termsPrefix: 'Al registrarte, aceptas nuestros',
    termsAnd: 'y la',
    alreadyAccount: '¿Ya tienes cuenta?',
    signIn: 'Inicia sesión',
  },

  completeProfile: {
    title: 'Casi listo',
    subtitle: 'Elige un nombre de usuario para completar tu perfil académico.',
    usernameLabel: 'Nombre de usuario',
    submitButton: 'Finalizar registro',
    submitting: 'Guardando...',
    termsPrefix: 'Al finalizar, aceptas nuestros',
  },

  dashboard: {
    welcome: '¡Bienvenido{{name}}!',
    profileSection: 'Tu perfil',
    nameField: 'Nombre',
    emailField: 'Correo',
    providerField: 'Proveedor',
    signOut: 'Cerrar sesión',
  },

  validation: {
    firstNameRequired: 'El nombre es requerido.',
    firstNameMin: 'Mínimo 2 caracteres.',
    lastNameRequired: 'Los apellidos son requeridos.',
    lastNameMin: 'Mínimo 2 caracteres.',
    usernameRequired: 'El nombre de usuario es requerido.',
    usernameUnavailable: 'Elige un nombre de usuario válido y disponible.',
    usernameMin: 'Mínimo 3 caracteres requeridos.',
    usernameMax: 'Máximo 20 caracteres permitidos.',
    usernameChars: 'Solo letras, números, guiones y guiones bajos.',
    usernameTaken: 'Este nombre ya está en uso, elige otro.',
    emailRequired: 'El correo es requerido.',
    emailInvalid: 'Ingresa un correo válido (ej: nombre@correo.com)',
    emailDomain: 'Debes usar tu correo institucional (@{{domain}}).',
    passwordRequired: 'La contraseña es requerida.',
    passwordMin: 'Mínimo 8 caracteres.',
    passwordWeak: 'La contraseña debe tener al menos 6 caracteres.',
    confirmMismatch: 'Las contraseñas no coinciden.',
  },

  authErrors: {
    accessDenied: 'Acceso Denegado',
    invalidCredentials: 'Credenciales incorrectas. Verifica e intenta de nuevo.',
    tooManyRequests: 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.',
    userDisabled: 'Esta cuenta ha sido deshabilitada.',
    invalidEmail: 'El correo no tiene un formato válido.',
    networkError: 'Sin conexión. Verifica tu red e inténtalo de nuevo.',
    generic: 'Ocurrió un error. Inténtalo de nuevo.',
    emailInUse: 'Este correo ya está en uso.',
    signInPrompt: '¿Quieres iniciar sesión?',
    googleError: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    profileError: 'No se pudo guardar tu perfil. Inténtalo de nuevo.',
    resetError: 'No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.',
    accountCreated: 'Cuenta creada',
    welcomeMsg: '¡Bienvenido a StudySphere!',
    profileSavedTitle: '¡Listo!',
    profileSavedMsg: 'Tu perfil ha sido completado.',
  },

  strength: {
    veryWeak: 'Muy débil',
    weak: 'Débil',
    fair: 'Regular',
    strong: 'Fuerte',
    veryStrong: 'Muy fuerte',
  },
} as const;
