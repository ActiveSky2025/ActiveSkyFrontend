// ============================================
// PERFIL.JS - Perfil de usuario COMPLETO
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadUserProfile();
  setupEventListeners();
});

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================

function checkAuth() {
  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) {
    alert('Debes iniciar sesión para ver tu perfil');
    window.location.href = 'login.html';
    return;
  }

  try {
    currentUser = JSON.parse(userString);
    console.log('👤 Usuario actual:', currentUser);
  } catch (error) {
    console.error('Error parseando usuario:', error);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    window.location.href = 'login.html';
  }
}

// ============================================
// CARGAR PERFIL COMPLETO
// ============================================

async function loadUserProfile() {
  if (!currentUser) return;

  // Datos básicos del usuario
  document.getElementById('profile-name').textContent = currentUser.full_name || currentUser.username;
  document.getElementById('profile-email').textContent = currentUser.email;
  
  // Avatar
  const avatarSrc = currentUser.avatar_url || 'https://via.placeholder.com/200';
  document.getElementById('profile-avatar').src = avatarSrc;

  // Cargar datos desde el backend
  await Promise.all([
    loadUserActivities(),
    loadUserComments()
  ]);

  // Actualizar navbar
  updateNavbar();
}

// ============================================
// CARGAR ACTIVIDADES/VISITAS
// ============================================

async function loadUserActivities() {
  try {
    console.log('📊 Cargando visitas del usuario:', currentUser.id);
    
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/visits`);

    if (!response.ok) {
      throw new Error('Error al cargar visitas');
    }

    const data = await response.json();
    const visits = data.visits || [];

    console.log(`✅ Visitas cargadas: ${visits.length} `);

    const container = document.getElementById('user-activities');

    if (visits.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-muted mb-3">No tienes visitas registradas aún</p>
          <a href="select.html" class="btn btn-primary">
            🗺️ Explorar lugares
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = visits.map(visit => {
      const spot = visit.spots || {};
      const activity = spot.activities || {};
      const icon = activity.icon || '📍';
      const spotName = spot.name || 'Lugar desconocido';
      const location = [spot.city, spot.country].filter(Boolean).join(', ') || 'Sin ubicación';
      const date = formatDate(visit.visit_date);
      
      return `
        <div class="activity-card">
          <div class="d-flex align-items-start gap-3">
            <div class="activity-icon">${icon}</div>
            <div class="flex-grow-1">
              <h6 class="mb-1">
                <a href="spot_detail.html?id=${spot.id}" class="text-decoration-none text-dark">
                  ${spotName}
                </a>
              </h6>
              <p class="mb-1 small text-muted">📍 ${location}</p>
              <p class="mb-1 small">📅 ${date}</p>
              ${visit.notes ? `<p class="mb-0 small mt-2"><em>"${visit.notes}"</em></p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('❌ Error cargando actividades:', error);
    document.getElementById('user-activities').innerHTML = 
      '<p class="text-danger">Error al cargar actividades. Verifica que el backend esté corriendo.</p>';
  }
}

// ============================================
// CARGAR COMENTARIOS/RESEÑAS
// ============================================

async function loadUserComments() {
  try {
    console.log('💬 Cargando reseñas del usuario:', currentUser.id);
    
    const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/reviews`);

    if (!response.ok) {
      throw new Error('Error al cargar reseñas');
    }

    const data = await response.json();
    const reviews = data.reviews || [];

    console.log(`✅ Reseñas cargadas: ${reviews.length}`);

    const container = document.getElementById('user-comments');

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-muted mb-3">No has dejado reseñas aún</p>
          <a href="select.html" class="btn btn-outline-primary">
            ⭐ Explorar y reseñar
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(review => {
      const spot = review.spots || {};
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const spotName = spot.name || 'Lugar';
      const location = [spot.city].filter(Boolean).join(', ') || '';
      const date = formatDate(review.created_at);
      
      return `
        <div class="comment-card mb-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-1">
                <a href="spot_detail.html?id=${spot.id}" class="text-decoration-none text-dark">
                  ${spotName}
                </a>
              </h6>
              ${location ? `<small class="text-muted">${location}</small>` : ''}
            </div>
            <div class="text-warning">${stars}</div>
          </div>
          <p class="mb-1">${review.comment || 'Sin comentario'}</p>
          <small class="text-muted">${date}</small>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('❌ Error cargando comentarios:', error);
    document.getElementById('user-comments').innerHTML = 
      '<p class="text-danger">Error al cargar comentarios.</p>';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Editar perfil
  const editForm = document.getElementById('editProfileForm');
  if (editForm) {
    editForm.addEventListener('submit', updateProfile);
  }

  // Eliminar cuenta
  const deleteBtn = document.getElementById('delete-account-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteAccount);
  }

  // Avatar preview
  const avatarInput = document.getElementById('avatarInput');
  if (avatarInput) {
    avatarInput.addEventListener('change', previewAvatar);
  }
}

// ============================================
// PREVIEW AVATAR
// ============================================

function previewAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('modalAvatarPreview').src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================
// ACTUALIZAR PERFIL
// ============================================

async function updateProfile(e) {
  e.preventDefault();

  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const avatarFile = document.getElementById('avatarInput').files[0];

  if (!username) {
    alert('El nombre de usuario es requerido');
    return;
  }

  try {
    let avatarUrl = currentUser.avatar_url;

    // Subir nueva foto si existe
    if (avatarFile) {
      avatarUrl = await uploadAvatar(avatarFile);
    }

    const updateData = {
      username: username,
      avatar_url: avatarUrl
    };

    console.log('📤 Actualizando perfil:', updateData);

    const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar');
    }

    const result = await response.json();
    const updatedUser = result.user;

    console.log('✅ Perfil actualizado:', updatedUser);

    // Actualizar localStorage
    currentUser = updatedUser;
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    alert('✅ Perfil actualizado exitosamente');

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
    if (modal) modal.hide();

    // Recargar perfil
    loadUserProfile();

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al actualizar perfil: ' + error.message);
  }
}

// ============================================
// SUBIR AVATAR
// ============================================

async function uploadAvatar(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      
      // ⚠️ En producción subir a Supabase Storage
      // const { data, error } = await supabase.storage
      //   .from('avatars')
      //   .upload(`${currentUser.id}/avatar.jpg`, file)
      
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// ============================================
// ELIMINAR CUENTA
// ============================================

function deleteAccount() {
  const confirmation = prompt(
    'Esta acción es irreversible. Escribe "ELIMINAR" para confirmar:'
  );

  if (confirmation !== 'ELIMINAR') {
    alert('Cancelado');
    return;
  }

  // ⚠️ En producción llamar endpoint DELETE
  localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
  
  alert('Cuenta eliminada');
  window.location.href = 'index.html';
}

// ============================================
// ACTUALIZAR NAVBAR
// ============================================

function updateNavbar() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const avatarSrc = currentUser.avatar_url || 'https://via.placeholder.com/32';

  navAuth.innerHTML = `
    <div class="dropdown">
      <button class="btn btn-outline-primary dropdown-toggle d-flex align-items-center" 
              type="button" 
              data-bs-toggle="dropdown">
        <img src="${avatarSrc}" 
             alt="avatar" 
             width="28" 
             height="28" 
             class="rounded-circle me-2"
             style="object-fit:cover;">
        <span>${currentUser.username}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${currentUser.full_name || currentUser.username}</h6></li>
        <li><p class="dropdown-item-text mb-0 small text-muted px-3">${currentUser.email}</p></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="perfil.html">👤 Mi perfil</a></li>
        <li><a class="dropdown-item" href="select.html">🗺️ Nueva actividad</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger" onclick="logout()">🚪 Cerrar sesión</button></li>
      </ul>
    </div>
  `;
}

// ============================================
// LOGOUT
// ============================================

function logout() {
  if (confirm('¿Cerrar sesión?')) {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    window.location.href = 'index.html';
  }
}

// ============================================
// UTILIDADES
// ============================================

function formatDate(dateString) {
  if (!dateString) return 'Fecha desconocida';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Exponer logout globalmente
window.logout = logout;