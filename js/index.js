// ============================================
// INDEX.JS - Landing page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
});

// ============================================
// VERIFICAR SESIÓN
// ============================================

function checkUserSession() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) return;

  try {
    const user = JSON.parse(userString);
    const username = user.username || 'Usuario';
    const email = user.email || '';

    navAuth.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary dropdown-toggle d-flex align-items-center" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false">
          <img src="${user.avatar_url || 'https://via.placeholder.com/32'}" 
               alt="avatar" 
               width="28" 
               height="28" 
               class="rounded-circle me-2" 
               style="object-fit:cover;">
          <span>${username}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><h6 class="dropdown-header">${username}</h6></li>
          <li><p class="dropdown-item-text mb-0 small text-muted px-3">${email}</p></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="perfil.html">👤 Mi perfil</a></li>
          <li><a class="dropdown-item" href="select.html">🗺️ Nueva actividad</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item text-danger" id="logoutBtn" type="button">🚪 Cerrar sesión</button></li>
        </ul>
      </div>
    `;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
    
  } catch (error) {
    console.error('Error parseando usuario:', error);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  }
}

// ============================================
// LOGOUT
// ============================================

function logout() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    window.location.reload();
  }
}