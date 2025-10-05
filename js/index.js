document.addEventListener('DOMContentLoaded', () => {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const stored = localStorage.getItem('activeSkyUser');
  if (!stored) return;

  let user;
  try {
    user = JSON.parse(stored);
  } catch {
    localStorage.removeItem('activeSkyUser');
    return;
  }

  const username = user.username || 'Usuario';
  const email = user.email || '';

navAuth.innerHTML = `
  <div class="dropdown">
    <button class="btn btn-outline-primary dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown" aria-expanded="false">
      <img src="../assets/images/logo.jpg" alt="avatar" width="28" height="28" class="rounded-circle me-2" style="object-fit:cover;">
      <span>${username}</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li><h6 class="dropdown-header">${username}</h6></li>
      <li><p class="dropdown-item-text mb-0 small text-muted px-3">${email}</p></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="/html/perfil.html">Mi perfil</a></li>
      <li><button class="dropdown-item" id="logoutBtn" type="button">Cerrar sesión</button></li>
    </ul>
  </div>
`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('activeSkyUser');
      window.location.reload();
    });
  }
});