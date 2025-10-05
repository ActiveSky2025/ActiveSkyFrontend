document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      if (!email) document.getElementById('login-email').classList.add('is-invalid');
      if (!password) document.getElementById('login-password').classList.add('is-invalid');
      return;
    }

    // Simulación de login exitoso
    const username = email.split('@')[0];
    const user = { username, email };
    localStorage.setItem('activeSkyUser', JSON.stringify(user));

    window.location.href = 'index.html';
  });

  ['login-email', 'login-password'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
    });
  });
});