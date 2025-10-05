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
    
    const visitData = {
      visit_date: weatherQuery.day.substring(0, 4) + '-' + 
                  weatherQuery.day.substring(4, 6) + '-' + 
                  weatherQuery.day.substring(6, 8),
      notes: `Visita planificada - ${CONFIG.ACTIVITIES[weatherQuery.activity].name}`,
      weather_data: weatherData.analytics
    };

    const response = await fetch(
      `${API_BASE_URL}/spots/${weatherQuery.spotId}/visit?user_id=${user.id || 'temp'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData)
      }
    );

    if (!response.ok) throw new Error('Error al guardar');

    alert('✅ Visita guardada exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar visita');
  }
}

// ============================================
// AGREGAR RESEÑA
// ============================================

function addReview() {
  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) {
    alert('Debes iniciar sesión para dejar reseñas');
    window.location.href = 'login.html';
    return;
  }

  const rating = prompt('Califica este lugar (1-5 estrellas):');
  if (!rating || rating < 1 || rating > 5) return;

  const comment = prompt('Escribe tu comentario:');
  if (!comment) return;

  submitReview(parseInt(rating), comment);
}

async function submitReview(rating, comment) {
  try {
    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER));

    const response = await fetch(
      `${API_BASE_URL}/spots/${weatherQuery.spotId}/reviews?user_id=${user.id || 'temp'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating, 
          comment,
          spot_id: weatherQuery.spotId 
        })
      }
    );

    if (!response.ok) throw new Error('Error al enviar reseña');
    console.log('Reseña enviada:', JSON.stringify({ rating, comment }))
    alert('✅ Reseña enviada exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    console.log('Reseña enviada:', JSON.stringify({ rating, comment, spot_id: weatherQuery.spotId  }))



    alert('Error al enviar reseña');
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