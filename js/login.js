// ============================================
// LOGIN.JS - Autenticación COMPLETA
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;

document.addEventListener('DOMContentLoaded', () => {
  setupLoginForm();
  setupRegisterForm();
  checkRedirectHash();
});

// ============================================
// SETUP FORMS
// ============================================

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await simulateLogin(email, password);
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al iniciar sesión: ' + error.message);
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const fullname = document.getElementById('register-fullname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const bio = document.getElementById('register-bio').value.trim();
    // ⚠️ Comentar esto:
    // const avatarFile = document.getElementById('register-avatar').files[0];

    if (!username || !fullname || !email || !password) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // ⚠️ Pasar null como avatarFile
      await registerUser(username, fullname, email, password, bio, null);
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error al registrarse: ' + error.message);
    }
  });
}

// ============================================
// SIMULACIÓN DE LOGIN
// ============================================

async function simulateLogin(email, password) {
  console.log('🔐 Iniciando sesión...');

  // ⚠️ SIMULACIÓN - En producción validar con Supabase Auth
  try {
    // Buscar usuario por email (simulado - debería validar password)
    const response = await fetch(`${API_BASE_URL}/users/by-email/${email}`);
    
    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    const user = await response.json();
    
    // Guardar en localStorage
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN, generateToken());

    console.log('✅ Login exitoso:', user);

    window.location.href = 'index.html';
    
  } catch (error) {
    // Si no existe, crear usuario temporal
    console.warn('Usuario no encontrado, creando uno nuevo...');
    await registerUser(
      email.split('@')[0],
      email.split('@')[0],
      email,
      password,
      null,
      null
    );
  }
}

// ============================================
// REGISTRO DE USUARIO
// ============================================

async function registerUser(username, fullname, email, password, bio, avatarFile) {
  console.log('📝 Registrando usuario...');

  let avatarUrl = null;

  if (avatarFile) {
    console.log('📸 Foto detectada, pero usando avatar generado...');
  }

  avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=0dcaf0&color=fff&size=200&bold=true`;

  const payload = {
    username: username,
    email: email,
    full_name: fullname,
    bio: bio || null,
    avatar_url: avatarUrl,
    password: password
  };

  console.log('📤 Enviando al backend:', payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Respuesta del servidor:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor:', errorText);
      
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      
      throw new Error(errorDetail);
    }

    const result = await response.json();
    const user = result.user;

    console.log('✅ Usuario registrado:', user);

    // Guardar solo datos esenciales
    const userToSave = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    const userString = JSON.stringify(userToSave);
    const sizeKB = (userString.length * 2) / 1024;
    
    console.log(`📦 Tamaño del usuario: ${sizeKB.toFixed(2)} KB`);

    if (sizeKB > 100) {
      console.warn('⚠️ Usuario muy grande, guardando solo esencial...');
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url
      }));
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, userString);
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN, generateToken());

    console.log('✅ Datos guardados en localStorage');

    // ⭐ CERRAR MODAL DE FORMA SEGURA
    try {
      const modalElement = document.getElementById('register-modal');
      if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        } else {
          // Si no hay instancia, crear una y cerrar
          const newModal = new bootstrap.Modal(modalElement);
          newModal.hide();
        }
        
        // Remover backdrop manualmente por si acaso
        setTimeout(() => {
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('padding-right');
        }, 300);
      }
    } catch (modalError) {
      console.warn('⚠️ Error cerrando modal:', modalError);
    }

    alert(`¡Bienvenido ${user.full_name}! 🎉`);
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);

  } catch (error) {
    console.error('❌ Error completo:', error);
    
    if (error.name === 'AbortError') {
      alert('⏱️ Timeout: El servidor tardó demasiado en responder.');
    } else if (error.message.includes('Failed to fetch')) {
      alert('❌ No se pudo conectar con el backend. Verifica que esté corriendo.');
    } else if (error.name === 'QuotaExceededError') {
      alert('⚠️ Error de almacenamiento. Limpiando caché...');
      localStorage.clear();
      alert('✅ Caché limpiado. Intenta registrarte de nuevo.');
      location.reload();
    } else {
      alert('❌ Error al registrar: ' + error.message);
    }
    
    throw error;
  }
}

// ============================================
// SUBIR AVATAR (SIMULADO)
// ============================================

async function uploadAvatar(file) {
  // ⚠️ NO USAR POR AHORA - evita llenar localStorage con base64
  
  console.warn('⚠️ uploadAvatar: Subida de fotos deshabilitada temporalmente');
  console.log('💡 En producción: implementar Supabase Storage');
  
  return null;
  
  /*
  // EN PRODUCCIÓN: Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/avatar-${Date.now()}.jpg`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: publicURL } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);
  
  return publicURL.publicUrl;
  */
}

// ============================================
// UTILIDADES
// ============================================

function generateToken() {
  return btoa(Date.now() + Math.random().toString(36));
}

function checkRedirectHash() {
  if (window.location.hash === '#register-modal') {
    const modal = new bootstrap.Modal(document.getElementById('register-modal'));
    modal.show();
  }
}

async function registerUser(username, fullname, email, password, bio, avatarFile) {
  console.log('📝 Registrando usuario...');

  let avatarUrl = null;

  // ⚠️ NO SUBIR AVATAR POR AHORA (evita base64 grande)
  if (avatarFile) {
    console.log('📸 Foto detectada, pero usando avatar generado por seguridad...');
    // En producción: subir a Supabase Storage
  }

  // Generar avatar con iniciales (ligero, solo URL)
  avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=0dcaf0&color=fff&size=200&bold=true`;

  const payload = {
    username: username,
    email: email,
    full_name: fullname,
    bio: bio || null,
    avatar_url: avatarUrl,
    password: password
  };

  console.log('📤 Enviando al backend:', payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Respuesta del servidor:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor:', errorText);
      
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      
      throw new Error(errorDetail);
    }

    const result = await response.json();
    const user = result.user;

    console.log('✅ Usuario registrado:', user);

    // ⭐ GUARDAR SOLO DATOS ESENCIALES (sin avatar base64)
    const userToSave = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      bio: user.bio,
      avatar_url: user.avatar_url,  // Solo URL, no base64
      created_at: user.created_at
    };

    // Verificar tamaño antes de guardar
    const userString = JSON.stringify(userToSave);
    const sizeKB = (userString.length * 2) / 1024;
    
    console.log(`📦 Tamaño del usuario: ${sizeKB.toFixed(2)} KB`);

    if (sizeKB > 100) {
      console.warn('⚠️ Usuario muy grande, guardando solo esencial...');
      // Guardar versión mínima
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url
      }));
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, userString);
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN, generateToken());

    console.log('✅ Datos guardados en localStorage');

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('register-modal'));
    if (modal) modal.hide();

    alert(`¡Bienvenido ${user.full_name}! 🎉`);
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);

  } catch (error) {
    console.error('❌ Error completo:', error);
    
    if (error.name === 'AbortError') {
      alert('⏱️ Timeout: El servidor tardó demasiado en responder.');
    } else if (error.message.includes('Failed to fetch')) {
      alert('❌ No se pudo conectar con el backend. Verifica que esté corriendo.');
    } else if (error.name === 'QuotaExceededError') {
      alert('⚠️ Error de almacenamiento. Limpiando caché...');
      localStorage.clear();
      alert('✅ Caché limpiado. Intenta registrarte de nuevo.');
    } else {
      alert('❌ Error al registrar: ' + error.message);
    }
    
    throw error;
  }
}