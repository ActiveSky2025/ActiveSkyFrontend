// ============================================
// RESULTADOS.JS - Mostrar análisis climático
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;
let weatherData = null;
let weatherQuery = null;
let resultMap = null;

// ============================================
// INICIALIZAR
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadWeatherData();
  checkUserSession();   
});

function logout() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    window.location.reload();
  }
}

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
// CARGAR DATOS
// ============================================

function loadWeatherData() {
  try {
    const queryString = localStorage.getItem(CONFIG.STORAGE_KEYS.WEATHER_QUERY);
    const dataString = localStorage.getItem(CONFIG.STORAGE_KEYS.WEATHER_DATA);

    if (!queryString || !dataString) {
      showError('No hay datos de consulta. Por favor realiza una búsqueda primero.');
      return;
    }

    weatherQuery = JSON.parse(queryString);
    weatherData = JSON.parse(dataString);

    console.log('📊 Query:', weatherQuery);
    console.log('📊 Data:', weatherData);

    displayResults();
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    showError('Error al cargar los datos: ' + error.message);
  }
}

// ============================================
// MOSTRAR RESULTADOS
// ============================================

function displayResults() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('results-content').style.display = 'block';

  const { analytics, metadata } = weatherData;

  // Título
  const dateObj = new Date(
    weatherQuery.day.substring(0, 4),
    parseInt(weatherQuery.day.substring(4, 6)) - 1,
    weatherQuery.day.substring(6, 8)
  );
  const dateFormatted = dateObj.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  document.getElementById('result-title').textContent = 
    `${weatherQuery.spotName} - ${dateFormatted}`;

  // Temperatura
  const tempMin = analytics.temperature.min.average;
  const tempMax = analytics.temperature.max.average;
  document.getElementById('temp-display').textContent = 
    `${tempMin}°C - ${tempMax}°C`;

  // Descripción del clima
  const cloudClass = analytics.clouds.classification;
  document.getElementById('weather-desc').textContent = cloudClass;

  // Precipitación
  const rainProb = analytics.precipitation.probability_of_rain;
  document.getElementById('precipitation-prob').textContent = `${rainProb}%`;
  document.getElementById('precipitation-prob').className = 
    getRainClass(rainProb);

  // Viento
  document.getElementById('wind-speed').textContent = 
    `${analytics.wind.average_speed} m/s (${analytics.wind.classification})`;

  // Nubosidad
  document.getElementById('cloud-coverage').textContent = 
    `${analytics.clouds.average_coverage}%`;

  // UV
  document.getElementById('uv-index').textContent = 
    `${analytics.uv.average_index} (${analytics.uv.risk_level})`;

  // Recomendación
  const recommendation = generateRecommendation(analytics, weatherQuery.activity);
  document.getElementById('recommendation-text').textContent = recommendation;
  document.getElementById('recommendation-box').className = 
    `recommendation-box mt-3 ${getRecommendationClass(rainProb)}`;

  // Metadata
  document.getElementById('data-source').textContent = metadata.source;
  document.getElementById('years-analyzed').textContent = 
    `${metadata.total_years} años (${metadata.date_range})`;
  document.getElementById('data-points').textContent = 
    `${weatherData.raw_data ? weatherData.raw_data.length : metadata.total_years} puntos`;

  // Spot info
  document.getElementById('spot-name').textContent = weatherQuery.spotName;
  document.getElementById('spot-coords').textContent = 
    `${weatherQuery.lat.toFixed(4)}, ${weatherQuery.lon.toFixed(4)}`;

  // Event listeners
  setupEventListeners();
}

// ============================================
// MAPA DE RESULTADOS
// ============================================

function initResultMap() {
  if (!weatherQuery) return;

  const location = { lat: weatherQuery.lat, lng: weatherQuery.lon };

  resultMap = new google.maps.Map(document.getElementById('result-map'), {
    center: location,
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true
  });

  new google.maps.Marker({
    position: location,
    map: resultMap,
    title: weatherQuery.spotName
  });
}

// ============================================
// GENERAR RECOMENDACIÓN
// ============================================

function generateRecommendation(analytics, activity) {
  const rainProb = analytics.precipitation.probability_of_rain;
  const temp = analytics.temperature.max.average;
  const wind = analytics.wind.average_speed;

  let recommendation = '';

  // Análisis de lluvia
  if (rainProb > 70) {
    recommendation += '🌧️ Alta probabilidad de lluvia. ';
  } else if (rainProb > 40) {
    recommendation += '☁️ Probabilidad moderada de lluvia. ';
  } else {
    recommendation += '☀️ Baja probabilidad de lluvia. ';
  }

  // Análisis de temperatura
  if (temp > 30) {
    recommendation += '🔥 Hace mucho calor. Hidrátate bien. ';
  } else if (temp < 10) {
    recommendation += '🥶 Hace frío. Lleva ropa abrigada. ';
  } else {
    recommendation += '🌡️ Temperatura agradable. ';
  }

  // Análisis de viento
  if (wind > 10) {
    recommendation += '💨 Viento fuerte. Ten precaución. ';
  }

  // Recomendación por actividad
  const activityRec = getActivityRecommendation(activity, analytics);
  recommendation += activityRec;

  return recommendation;
}

function getActivityRecommendation(activity, analytics) {
  const rainProb = analytics.precipitation.probability_of_rain;

  switch(activity) {
    case 'running':
      if (rainProb < 30) return '🏃 Perfecto para correr.';
      return '🏃 Considera correr en interior.';
    
    case 'cycling':
      if (rainProb < 30 && analytics.wind.average_speed < 8) 
        return '🚴 Excelente para ciclismo.';
      return '🚴 Condiciones no ideales para ciclismo.';
    
    case 'hiking':
      if (rainProb < 40) return '🥾 Buen día para senderismo.';
      return '🥾 Pospón el senderismo si es posible.';
    
    case 'camping':
      if (rainProb < 30) return '⛺ Perfecto para acampar.';
      return '⛺ Prepara equipo impermeable.';
    
    case 'fishing':
      return '🎣 Condiciones aceptables para pesca.';
    
    default:
      return '✅ Planifica según las condiciones.';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Descargar JSON
  document.getElementById('btn-download-json').addEventListener('click', () => {
    downloadData('json');
  });

  // Descargar CSV
  document.getElementById('btn-download-csv').addEventListener('click', () => {
    downloadData('csv');
  });

  // Guardar visita
  document.getElementById('btn-save-visit').addEventListener('click', saveVisit);

  // Agregar reseña
  document.getElementById('btn-add-review').addEventListener('click', addReview);
}

// ============================================
// DESCARGAR DATOS
// ============================================

async function downloadData(format) {
  try {
    const url = `${API_BASE_URL}/weather/forecast/download?day=${weatherQuery.day}&lat=${weatherQuery.lat}&lon=${weatherQuery.lon}&activity=${weatherQuery.activity}&format=${format}`;
    
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('Error descargando:', error);
    alert('Error al descargar datos');
  }
}

// ============================================
// GUARDAR VISITA
// ============================================
async function saveVisit() {
  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) {
    alert('Debes iniciar sesión para guardar visitas');
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userString);
    
    // Validar que el usuario tenga ID
    if (!user || !user.id) {
      alert('⚠️ Usuario inválido. Por favor inicia sesión nuevamente.');
      return;
    }
    
    // Formatear fecha YYYYMMDD -> YYYY-MM-DD
    const formattedDate = weatherQuery.day.substring(0, 4) + '-' + 
                         weatherQuery.day.substring(4, 6) + '-' + 
                         weatherQuery.day.substring(6, 8);
    
    // Estructurar según el schema VisitCreate
    const visitData = {
      visit_date: formattedDate,
      notes: `Visita planificada - ${CONFIG.ACTIVITIES[weatherQuery.activity].name}`,
      user_id: user.id,
      weather_data: {}  // ← Ahora va en el body (puedes agregar datos si quieres)
    };

    console.log('📤 Enviando visita:', visitData);  // Debug

    const response = await fetch(
      `${API_BASE_URL}/spots/${weatherQuery.spotId}/visit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.detail || 'Error al guardar');
    }

    const result = await response.json();
    console.log('✅ Visita guardada:', result);
    alert('✅ Visita guardada exitosamente');
    
  } catch (error) {
    console.error('Error guardando visita:', error);
    alert(`❌ Error al guardar visita: ${error.message}`);
  }
}
// ============================================
// AGREGAR RESEÑA
// ============================================
let selectedRating = 0;
let reviewModal = null;

function addReview() {
  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) {
    alert('Debes iniciar sesión para dejar reseñas');
    window.location.href = 'login.html';
    return;
  }

  // Inicializar modal si no existe
  if (!reviewModal) {
    reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    setupReviewModal();
  }

  // Resetear formulario
  selectedRating = 0;
  document.getElementById('rating-value').value = '';
  document.getElementById('review-comment').value = '';
  document.getElementById('rating-text').textContent = 'Selecciona una calificación';
  document.getElementById('submit-review-btn').disabled = true;
  
  // Resetear estrellas
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('btn-warning');
    btn.classList.add('btn-outline-warning');
  });

  // Mostrar modal
  reviewModal.show();
}

function setupReviewModal() {
  const starButtons = document.querySelectorAll('.star-btn');
  const ratingInput = document.getElementById('rating-value');
  const ratingText = document.getElementById('rating-text');
  const commentTextarea = document.getElementById('review-comment');
  const submitBtn = document.getElementById('submit-review-btn');

  // Event listeners para las estrellas
  starButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const rating = parseInt(this.dataset.rating);
      selectedRating = rating;
      ratingInput.value = rating;

      // Actualizar visualización de estrellas
      starButtons.forEach((star, index) => {
        if (index < rating) {
          star.classList.remove('btn-outline-warning');
          star.classList.add('btn-warning');
        } else {
          star.classList.remove('btn-warning');
          star.classList.add('btn-outline-warning');
        }
      });

      // Actualizar texto
      const ratingLabels = {
        1: '⭐ Malo',
        2: '⭐⭐ Regular',
        3: '⭐⭐⭐ Bueno',
        4: '⭐⭐⭐⭐ Muy bueno',
        5: '⭐⭐⭐⭐⭐ Excelente'
      };
      ratingText.textContent = ratingLabels[rating];
      ratingText.className = 'text-warning fw-bold';

      // Validar formulario
      validateReviewForm();
    });
  });

  // Event listener para el textarea
  commentTextarea.addEventListener('input', validateReviewForm);

  // Event listener para enviar
  submitBtn.addEventListener('click', handleSubmitReview);
}

function validateReviewForm() {
  const rating = parseInt(document.getElementById('rating-value').value);
  const comment = document.getElementById('review-comment').value.trim();
  const submitBtn = document.getElementById('submit-review-btn');

  // Validar: rating entre 1-5 y comentario mínimo 10 caracteres
  if (rating >= 1 && rating <= 5 && comment.length >= 10) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

async function handleSubmitReview() {
  const rating = parseInt(document.getElementById('rating-value').value);
  const comment = document.getElementById('review-comment').value.trim();
  
  if (!rating || rating < 1 || rating > 5) {
    alert('⚠️ Por favor selecciona una calificación válida');
    return;
  }

  if (comment.length < 10) {
    alert('⚠️ El comentario debe tener al menos 10 caracteres');
    return;
  }

  await submitReview(rating, comment);
}

async function submitReview(rating, comment) {
  const submitBtn = document.getElementById('submit-review-btn');
  const spinner = document.getElementById('review-spinner');
  
  try {
    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER));
    
    if (!user || !user.id) {
      alert('⚠️ Debes iniciar sesión para dejar una reseña');
      reviewModal.hide();
      window.location.href = 'login.html';
      return;
    }

    // Mostrar spinner
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');

    const response = await fetch(
      `${API_BASE_URL}/spots/${weatherQuery.spotId}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating, 
          comment,
          user_id: user.id
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al enviar reseña');
    }
    
    const result = await response.json();
    console.log('✅ Reseña enviada:', result);
    
    // Cerrar modal
    reviewModal.hide();
    
    // Mostrar mensaje de éxito
    alert('✅ Reseña enviada exitosamente. ¡Gracias por tu opinión!');
    
  } catch (error) {
    console.error('Error:', error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    // Ocultar spinner
    spinner.classList.add('d-none');
    submitBtn.disabled = false;
  }
}

// ============================================
// MOSTRAR ERROR
// ============================================

function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// ============================================
// UTILIDADES
// ============================================

function getRainClass(probability) {
  if (probability < 30) return 'text-success';
  if (probability < 60) return 'text-warning';
  return 'text-danger';
}

function getRecommendationClass(rainProb) {
  if (rainProb < 30) return 'rec-good';
  if (rainProb < 60) return 'rec-warning';
  return 'rec-danger';
}

// Exponer funciones globales
window.initResultMap = initResultMap;