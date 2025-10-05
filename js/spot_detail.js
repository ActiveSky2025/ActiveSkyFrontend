// ============================================
// SPOT_DETAIL.JS - Detalle del spot
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;
let currentSpot = null;
let spotMap = null;
let selectedRating = 5;

// ============================================
// INICIALIZAR
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const spotId = getSpotIdFromURL();
  
  if (!spotId) {
    showError('No se especificó un lugar válido');
    return;
  }

  loadSpotDetails(spotId);
  setupEventListeners();
  setupStarRating();
});

// ============================================
// OBTENER SPOT ID DE URL
// ============================================

function getSpotIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// ============================================
// CARGAR DETALLES DEL SPOT
// ============================================

async function loadSpotDetails(spotId) {
  try {
    const response = await fetch(`${API_BASE_URL}/spots/${spotId}`);
    
    if (!response.ok) {
      throw new Error('Spot no encontrado');
    }

    currentSpot = await response.json();
    console.log('📍 Spot cargado:', currentSpot);

    displaySpotDetails();
    loadPhotos(spotId);
    loadReviews(spotId);
    loadNearbySpots();
    
  } catch (error) {
    console.error('Error cargando spot:', error);
    showError('Error al cargar la información del lugar: ' + error.message);
  }
}

// ============================================
// MOSTRAR DETALLES
// ============================================

function displaySpotDetails() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('spot-content').style.display = 'block';

  // Hero
  const heroImg = currentSpot.photos && currentSpot.photos[0] 
    ? currentSpot.photos[0].photo_url 
    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';
  
  document.getElementById('spot-hero').style.backgroundImage = `url(${heroImg})`;

  // Título y rating
  document.getElementById('spot-title').textContent = currentSpot.name;
  document.getElementById('spot-rating').textContent = (currentSpot.rating_avg || 0).toFixed(1);
  document.getElementById('spot-reviews-count').textContent = currentSpot.total_reviews || 0;

  // Actividad
  const activity = currentSpot.activities || {};
  document.getElementById('spot-activity-icon').textContent = activity.icon || '📍';
  document.getElementById('spot-activity-name').textContent = activity.name || 'Actividad';

  // Información
  document.getElementById('spot-description').textContent = 
    currentSpot.description || 'Sin descripción disponible.';

  const location = [currentSpot.city, currentSpot.country].filter(Boolean).join(', ') || 'Ubicación no especificada';
  document.getElementById('spot-location').textContent = location;
  
  document.getElementById('spot-visits').textContent = currentSpot.total_visits || 0;
  
  document.getElementById('spot-verified').textContent = 
    currentSpot.is_verified ? '✅ Verificado' : '⏳ Pendiente';

  // Coordenadas
  document.getElementById('spot-lat').textContent = currentSpot.latitude.toFixed(4);
  document.getElementById('spot-lon').textContent = currentSpot.longitude.toFixed(4);

  // Creador (si existe)
  if (currentSpot.created_by) {
    // Por ahora mostrar datos simulados
    document.getElementById('creator-name').textContent = 'Usuario ActiveSky';
    document.getElementById('creator-date').textContent = formatDate(currentSpot.created_at);
  }
}

// ============================================
// CARGAR FOTOS
// ============================================

async function loadPhotos(spotId) {
  try {
    const response = await fetch(`${API_BASE_URL}/spots/${spotId}/photos`);
    
    if (!response.ok) throw new Error('Error cargando fotos');

    const data = await response.json();
    const photos = data.photos || [];

    const gallery = document.getElementById('photo-gallery');
    
    if (photos.length === 0) {
      gallery.innerHTML = `
        <div class="photo-item add-photo-btn" onclick="openUploadModal()">
          <div>📷</div>
          <div>Agregar primera foto</div>
        </div>
      `;
      return;
    }

    gallery.innerHTML = photos.map(photo => `
      <div class="photo-item" onclick="viewPhoto('${photo.photo_url}')">
        <img src="${photo.photo_url}" alt="${photo.caption || 'Foto del lugar'}">
      </div>
    `).join('') + `
      <div class="photo-item add-photo-btn" onclick="openUploadModal()">
        <div>📷</div>
        <div>Agregar foto</div>
      </div>
    `;

  } catch (error) {
    console.error('Error cargando fotos:', error);
  }
}

// ============================================
// CARGAR RESEÑAS
// ============================================

async function loadReviews(spotId) {
  try {
    const response = await fetch(`${API_BASE_URL}/spots/${spotId}/reviews`);
    
    if (!response.ok) throw new Error('Error cargando reseñas');

    const data = await response.json();
    const reviews = data.reviews || [];

    const container = document.getElementById('reviews-container');

    if (reviews.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay reseñas aún. ¡Sé el primero en dejar una!</p>';
      return;
    }

    container.innerHTML = reviews.map(review => `
      <div class="review-card">
        <div class="review-header">
          <img src="${review.users?.avatar_url || 'https://via.placeholder.com/48'}" 
               alt="${review.users?.username || 'Usuario'}" 
               class="review-avatar">
          <div class="flex-grow-1">
            <div class="review-author">${review.users?.username || 'Usuario Anónimo'}</div>
            <div class="review-date">${formatDate(review.created_at)}</div>
          </div>
          <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
        </div>
        <p class="mb-0">${review.comment || 'Sin comentario'}</p>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando reseñas:', error);
  }
}

// ============================================
// CARGAR SPOTS CERCANOS
// ============================================

async function loadNearbySpots() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spots/nearby?lat=${currentSpot.latitude}&lon=${currentSpot.longitude}&radius_km=5&activity_id=${currentSpot.activity_id}`
    );

    if (!response.ok) throw new Error('Error');

    const data = await response.json();
    const spots = data.spots.filter(s => s.id !== currentSpot.id).slice(0, 5);

    const container = document.getElementById('nearby-spots');

    if (spots.length === 0) {
      container.innerHTML = '<p class="text-muted small">No hay lugares cercanos</p>';
      return;
    }

    container.innerHTML = spots.map(spot => `
      <div class="mb-2">
        <a href="spot_detail.html?id=${spot.id}" class="text-decoration-none">
          <div class="d-flex align-items-center gap-2 p-2 rounded hover-bg">
            <span style="font-size: 1.5rem;">${spot.activities?.icon || '📍'}</span>
            <div class="flex-grow-1">
              <div class="fw-bold small">${spot.name}</div>
              <div class="text-muted" style="font-size: 0.75rem;">
                ⭐ ${(spot.rating_avg || 0).toFixed(1)}
              </div>
            </div>
          </div>
        </a>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando spots cercanos:', error);
  }
}

// ============================================
// MAPA
// ============================================

function initSpotMap() {
  if (!currentSpot) {
    setTimeout(initSpotMap, 100);
    return;
  }

  const location = { lat: currentSpot.latitude, lng: currentSpot.longitude };

  spotMap = new google.maps.Map(document.getElementById('spot-map'), {
    center: location,
    zoom: 15,
    disableDefaultUI: true,
    zoomControl: true
  });

  new google.maps.Marker({
    position: location,
    map: spotMap,
    title: currentSpot.name,
    label: {
      text: currentSpot.activities?.icon || '📍',
      fontSize: '24px'
    }
  });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Consultar clima
  document.getElementById('btn-check-weather').addEventListener('click', () => {
    if (!currentSpot) return;
    
    // Guardar spot en localStorage y redirigir a select
    const prefilledData = {
      spotId: currentSpot.id,
      spotName: currentSpot.name,
      lat: currentSpot.latitude,
      lon: currentSpot.longitude,
      activitySlug: currentSpot.activities?.slug || 'running'
    };
    
    localStorage.setItem('prefilledSpot', JSON.stringify(prefilledData));
    window.location.href = 'select.html';
  });

  // Agregar visita
  document.getElementById('btn-add-visit').addEventListener('click', markAsVisited);

  // Agregar reseña
  document.getElementById('btn-add-review').addEventListener('click', () => {
    checkAuthAndExecute(() => {
      const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
      modal.show();
    });
  });

  // Compartir
  document.getElementById('btn-share').addEventListener('click', shareSpot);

  // Cómo llegar
  document.getElementById('btn-directions').addEventListener('click', openDirections);

  // Subir foto
  document.getElementById('btn-upload-photo').addEventListener('click', () => {
    checkAuthAndExecute(openUploadModal);
  });

  // Form de reseña
  document.getElementById('review-form').addEventListener('submit', submitReview);

  // Form de foto
  document.getElementById('upload-photo-form').addEventListener('submit', uploadPhoto);
}

// ============================================
// MARCAR COMO VISITADO
// ============================================

async function markAsVisited() {
  checkAuthAndExecute(async () => {
    try {
      const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER));
      
      const visitData = {
        visit_date: new Date().toISOString().split('T')[0],
        notes: `Visita registrada desde el detalle del spot`
      };

      const response = await fetch(
        `${API_BASE_URL}/spots/${currentSpot.id}/visit?user_id=${user.id || 'temp'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitData)
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      alert('✅ Visita registrada exitosamente');
      
      // Actualizar contador
      currentSpot.total_visits = (currentSpot.total_visits || 0) + 1;
      document.getElementById('spot-visits').textContent = currentSpot.total_visits;

    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar visita');
    }
  });
}

// ============================================
// ENVIAR RESEÑA
// ============================================

async function submitReview(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER));
  const comment = document.getElementById('review-comment').value.trim();

  if (!comment) {
    alert('Por favor escribe un comentario');
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/spots/${currentSpot.id}/reviews?user_id=${user.id || 'temp'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment
        })
      }
    );

    if (!response.ok) throw new Error('Error al enviar reseña');

    alert('✅ Reseña enviada exitosamente');
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
    modal.hide();

    // Recargar reseñas
    loadReviews(currentSpot.id);

    // Limpiar form
    document.getElementById('review-comment').value = '';

  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar reseña');
  }
}

// ============================================
// SUBIR FOTO
// ============================================

async function uploadPhoto(e) {
  e.preventDefault();

  const fileInput = document.getElementById('photo-file');
  const caption = document.getElementById('photo-caption').value.trim();
  const file = fileInput.files[0];

  if (!file) {
    alert('Selecciona una imagen');
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER));

    // SIMULACIÓN - En producción subir a Supabase Storage
    const fakeUrl = URL.createObjectURL(file);
    
    const response = await fetch(
      `${API_BASE_URL}/spots/${currentSpot.id}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: fakeUrl,
          caption: caption,
          user_id: user.id || 'temp'
        })
      }
    );

    if (!response.ok) throw new Error('Error al subir foto');

    alert('✅ Foto subida exitosamente');

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadPhotoModal'));
    modal.hide();

    // Recargar fotos
    loadPhotos(currentSpot.id);

    // Limpiar form
    fileInput.value = '';
    document.getElementById('photo-caption').value = '';

  } catch (error) {
    console.error('Error:', error);
    alert('Error al subir foto');
  }
}

// ============================================
// RATING STARS
// ============================================

function setupStarRating() {
  const stars = document.querySelectorAll('#star-rating .star');
  
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updateStars(selectedRating);
      document.getElementById('rating-value').value = selectedRating;
    });

    star.addEventListener('mouseenter', () => {
      updateStars(index + 1);
    });
  });

  document.getElementById('star-rating').addEventListener('mouseleave', () => {
    updateStars(selectedRating);
  });

  updateStars(5); // Default 5 estrellas
}

function updateStars(rating) {
  const stars = document.querySelectorAll('#star-rating .star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.style.color = '#ffc107';
    } else {
      star.style.color = '#ddd';
    }
  });
}

// ============================================
// UTILIDADES
// ============================================

function checkAuthAndExecute(callback) {
  const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!user) {
    alert('Debes iniciar sesión para realizar esta acción');
    window.location.href = 'login.html';
    return;
  }

  callback();
}

function shareSpot() {
  const url = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: currentSpot.name,
      text: `Mira este lugar en ActiveSky: ${currentSpot.name}`,
      url: url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert('✅ Enlace copiado al portapapeles');
  }
}

function openDirections() {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${currentSpot.latitude},${currentSpot.longitude}`;
  window.open(url, '_blank');
}

function openUploadModal() {
  checkAuthAndExecute(() => {
    const modal = new bootstrap.Modal(document.getElementById('uploadPhotoModal'));
    modal.show();
  });
}

function viewPhoto(url) {
  window.open(url, '_blank');
}

function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Exponer funciones globales
window.initSpotMap = initSpotMap;
window.openUploadModal = openUploadModal;
window.viewPhoto = viewPhoto;