// ============================================
// SELECT2.JS - Versión refactorizada
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

const AppState = {
  map: null,
  markers: [],
  customMarker: null,
  infoWindow: null,
  searchBox: null,
  flatpickr: null,
  selectedSpot: null,
  selectedActivity: null,
  selectedDate: null,
  selectedCoordinates: null,
  spotReviews: [],
  showAllReviews: false
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
  setupActivityListeners();
  setupButtonListeners();
});

function initMap() {
  const defaultLocation = CONFIG.DEFAULT_LOCATION;

  AppState.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: defaultLocation.lat, lng: defaultLocation.lng },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  AppState.infoWindow = new google.maps.InfoWindow();
  
  setupSearchBox();
  setupMapClickListener();
  setupCalendar();
  setupZoomControls();
  getUserLocation();
}

// ============================================
// CALENDARIO
// ============================================

function setupCalendar() {
  AppState.flatpickr = flatpickr("#calendar-inline", {
    defaultDate: new Date(),
    minDate: "today",
    maxDate: new Date().fp_incr(365),
    inline: true,
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
      AppState.selectedDate = dateStr;
      document.getElementById('fecha-input').value = dateStr;
      updateSelectionSummary();
      checkReadyToConsult();
      console.log('📅 Fecha seleccionada:', dateStr);
    }
  });
}

// ============================================
// ACTIVIDADES
// ============================================

function setupActivityListeners() {
  const activityRadios = document.querySelectorAll('.activity-radio');
  
  activityRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        // Remover clase activa de todas las tarjetas
        document.querySelectorAll('.activity-card').forEach(card => {
          card.classList.remove('border-primary', 'bg-primary/10', 'dark:bg-primary/20');
          card.classList.add('border-black/10', 'dark:border-white/10');
        });

        // Agregar clase activa a la seleccionada
        const selectedCard = this.closest('.activity-card');
        selectedCard.classList.remove('border-black/10', 'dark:border-white/10');
        selectedCard.classList.add('border-primary', 'bg-primary/10', 'dark:bg-primary/20');

        AppState.selectedActivity = this.value;
        updateSelectionSummary();

        // Cargar spots de la actividad
        const center = AppState.map.getCenter();
        loadNearbySpots(center.lat(), center.lng());

        console.log(`💡 Actividad seleccionada: ${CONFIG.ACTIVITIES[this.value].name}`);
      }
    });
  });
}

// ============================================
// BÚSQUEDA Y GEOLOCALIZACIÓN
// ============================================

function setupSearchBox() {
  const input = document.getElementById('search-input');
  AppState.searchBox = new google.maps.places.SearchBox(input);

  AppState.map.addListener('bounds_changed', () => {
    AppState.searchBox.setBounds(AppState.map.getBounds());
  });

  AppState.searchBox.addListener('places_changed', () => {
    const places = AppState.searchBox.getPlaces();
    if (places.length === 0) return;

    const place = places[0];
    if (!place.geometry || !place.geometry.location) return;

    AppState.map.setCenter(place.geometry.location);
    AppState.map.setZoom(14);

    if (AppState.selectedActivity) {
      loadNearbySpots(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
    }
  });
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        AppState.map.setCenter(userLocation);
        
        new google.maps.Marker({
          position: userLocation,
          map: AppState.map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Tu ubicación'
        });

        if (AppState.selectedActivity) {
          loadNearbySpots(userLocation.lat, userLocation.lng);
        }
      },
      (error) => console.warn('Error obteniendo ubicación:', error)
    );
  }
}

// ============================================
// CLICK EN MAPA
// ============================================

function setupMapClickListener() {
  AppState.map.addListener('click', (event) => {
    if (!AppState.selectedActivity) {
      showNotification('⚠️ Por favor selecciona una actividad primero');
      return;
    }

    const lat = event.latLng.lat();
    const lon = event.latLng.lng();
    showCustomLocationConfirmation(lat, lon, event.latLng);
  });
}

function showCustomLocationConfirmation(lat, lon, latLng) {
  if (AppState.customMarker) {
    AppState.customMarker.setMap(null);
  }

  AppState.customMarker = new google.maps.Marker({
    position: latLng,
    map: AppState.map,
    animation: google.maps.Animation.DROP,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#FF5722',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    }
  });

  const activityName = CONFIG.ACTIVITIES[AppState.selectedActivity].name;
  const activityIcon = CONFIG.ACTIVITIES[AppState.selectedActivity].icon;

  const content = `
    <div class="p-3 max-w-xs">
      <h6 class="font-bold mb-2">📍 Ubicación Personalizada</h6>
      <p class="text-sm mb-2"><strong>Actividad:</strong> ${activityIcon} ${activityName}</p>
      <p class="text-xs text-gray-600 mb-1">Lat: ${lat.toFixed(6)}</p>
      <p class="text-xs text-gray-600 mb-3">Lon: ${lon.toFixed(6)}</p>
      <button onclick="selectCustomLocation(${lat}, ${lon}, '${activityName}')" class="w-full mb-2 rounded bg-green-500 text-white px-3 py-2 text-sm font-medium hover:bg-green-600">
        ✅ Usar esta ubicación
      </button>
      <button onclick="cancelCustomLocation()" class="w-full rounded bg-gray-200 text-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-300">
        ❌ Cancelar
      </button>
    </div>
  `;

  AppState.infoWindow.setContent(content);
  AppState.infoWindow.setPosition(latLng);
  AppState.infoWindow.open(AppState.map);
}

async function selectCustomLocation(lat, lon, activityName) {
  try {
    const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?.id || null;

    const spotData = {
      name: `Ubicación personalizada - ${activityName}`,
      description: `Spot personalizado para ${activityName}`,
      latitude: lat,
      longitude: lon,
      activity_id: CONFIG.ACTIVITIES[AppState.selectedActivity].id,
      address: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`,
      city: "Ubicación personalizada",
      country: "Usuario"
    };

    const url = userId 
      ? `${API_BASE_URL}/spots?user_id=${userId}`
      : `${API_BASE_URL}/spots`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spotData)
    });

    if (!response.ok) throw new Error('Error al crear spot');

    const result = await response.json();
    const realSpotId = result.spot?.id || result.id;

    AppState.selectedSpot = {
      id: realSpotId,
      name: spotData.name,
      lat: lat,
      lon: lon,
      isCustom: true
    };

    AppState.selectedCoordinates = `${lat},${lon}`;

    if (AppState.customMarker) {
      AppState.customMarker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#4CAF50',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      });
    }

    showNotification('✅ Ubicación guardada exitosamente');
    updateSelectionSummary();
    checkReadyToConsult();
    AppState.infoWindow.close();

  } catch (error) {
    console.error('Error:', error);
    showNotification('❌ Error al guardar ubicación');
  }
}

function cancelCustomLocation() {
  if (AppState.customMarker) {
    AppState.customMarker.setMap(null);
    AppState.customMarker = null;
  }
  AppState.infoWindow.close();
}

// ============================================
// CARGAR SPOTS
// ============================================

async function loadNearbySpots(lat, lon) {
  if (!AppState.selectedActivity) return;

  try {
    clearMarkers();

    const activityId = CONFIG.ACTIVITIES[AppState.selectedActivity].id;
    const response = await fetch(
      `${API_BASE_URL}/spots/nearby?lat=${lat}&lon=${lon}&radius_km=${CONFIG.SEARCH_RADIUS_KM}&activity_id=${activityId}`
    );

    if (!response.ok) throw new Error('Error al cargar spots');

    const data = await response.json();
    const spots = data.spots;

    console.log(`📍 Encontrados ${spots.length} spots`);

    if (spots.length === 0) {
      showNotification('No hay spots cercanos. Haz click en el mapa para crear uno.');
      return;
    }

    spots.forEach(spot => createSpotMarker(spot));

  } catch (error) {
    console.error('Error cargando spots:', error);
  }
}

function createSpotMarker(spot) {
  const activityIcon = CONFIG.ACTIVITIES[AppState.selectedActivity].icon;

  const marker = new google.maps.Marker({
    position: { lat: spot.latitude, lng: spot.longitude },
    map: AppState.map,
    title: spot.name,
    label: {
      text: activityIcon,
      fontSize: '28px',
      fontWeight: 'bold'
    },
    animation: google.maps.Animation.DROP,
    zIndex: 100
  });

  marker.addListener('click', () => showSpotInfo(spot, marker));
  AppState.markers.push(marker);
}

// ============================================
// INFO WINDOW SPOTS
// ============================================

async function showSpotInfo(spot, marker) {
  AppState.showAllReviews = false;
  marker.spot = spot;
  
  const reviews = await getSpotReviews(spot.id);
  const reviewsHTML = generateReviewsHTML(reviews);

  const content = `
    <div class="p-3 max-w-xs">
      <h6 class="font-bold mb-2">${spot.name}</h6>
      <p class="text-sm text-gray-600 mb-2">${spot.description || 'Sin descripción'}</p>
      <p class="text-xs text-gray-500 mb-2">📍 ${spot.city || ''}, ${spot.country || ''}</p>
      
      ${reviewsHTML}
      
      <button onclick="selectSpot('${spot.id}', '${spot.name}', ${spot.latitude}, ${spot.longitude})" class="w-full rounded bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90 mt-2">
        ✅ Seleccionar este lugar
      </button>
    </div>
  `;

  AppState.infoWindow.setContent(content);
  AppState.infoWindow.open(AppState.map, marker);
}

async function getSpotReviews(spotId) {
  try {
    const response = await fetch(`${API_BASE_URL}/spots/${spotId}/reviews`);
    if (!response.ok) throw new Error('Error al cargar reseñas');
    
    const data = await response.json();
    AppState.spotReviews = data.reviews || [];
    
    return AppState.spotReviews;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

function generateReviewsHTML(reviews) {
  if (reviews.length === 0) {
    return '<p class="text-xs text-gray-500 mb-2">Sin reseñas aún</p>';
  }

  const reviewsToShow = AppState.showAllReviews ? reviews : reviews.slice(0, 2);
  
  let html = `
    <div class="mb-2">
      <p class="font-bold text-sm mb-2">📝 Reseñas (${reviews.length}):</p>
      <div class="max-h-48 overflow-y-auto space-y-2">
  `;

  reviewsToShow.forEach(review => {
    html += `
      <div class="bg-gray-50 p-2 rounded-lg border-l-2 border-green-500">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs">${generateStars(review.rating)}</span>
          <span class="bg-green-500 text-white text-xs px-2 py-0.5 rounded">${review.rating}/5</span>
        </div>
        <p class="text-xs text-gray-700">${review.comment || 'Sin comentario'}</p>
        <small class="text-xs text-gray-400">${new Date(review.created_at).toLocaleDateString('es-ES')}</small>
      </div>
    `;
  });

  html += '</div>';

  if (reviews.length > 2) {
    html += `
      <button onclick="toggleReviews()" class="text-xs text-primary hover:underline mt-1">
        ${AppState.showAllReviews ? '👆 Ver menos' : '👇 Ver todas las reseñas'}
      </button>
    `;
  }

  html += '</div>';
  return html;
}

async function toggleReviews() {
  AppState.showAllReviews = !AppState.showAllReviews;
  const currentSpot = AppState.markers.find(m => m.getAnimation() !== null)?.spot;
  if (currentSpot) {
    await showSpotInfo(currentSpot, AppState.markers.find(m => m.spot === currentSpot));
  }
}

// ============================================
// SELECCIONAR SPOT
// ============================================

function selectSpot(spotId, spotName, lat, lon) {
  if (AppState.customMarker) {
    AppState.customMarker.setMap(null);
    AppState.customMarker = null;
  }

  AppState.selectedSpot = { 
    id: spotId, 
    name: spotName, 
    lat: lat, 
    lon: lon,
    isCustom: false
  };
  
  AppState.selectedCoordinates = `${lat},${lon}`;

  updateSelectionSummary();
  checkReadyToConsult();
  AppState.infoWindow.close();
  
  showNotification('✅ Lugar seleccionado');
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================

function updateSelectionSummary() {
  const summary = document.getElementById('selection-summary');
  
  if (AppState.selectedActivity || AppState.selectedDate || AppState.selectedSpot) {
    summary.classList.remove('hidden');
    
    if (AppState.selectedActivity) {
      const activity = CONFIG.ACTIVITIES[AppState.selectedActivity];
      document.getElementById('summary-activity').textContent = activity.icon + ' ' + activity.name;
      document.getElementById('summary-description').textContent = activity.name;
    }
    
    document.getElementById('summary-date').textContent = AppState.selectedDate || '-';
    
    const spotName = AppState.selectedSpot ? AppState.selectedSpot.name : '-';
    const customLabel = AppState.selectedSpot?.isCustom ? ' (Personalizada)' : '';
    document.getElementById('summary-location').textContent = spotName + customLabel;
    
    document.getElementById('summary-lat').textContent = 
      AppState.selectedSpot ? AppState.selectedSpot.lat.toFixed(6) : '-';
    
    document.getElementById('summary-lon').textContent = 
      AppState.selectedSpot ? AppState.selectedSpot.lon.toFixed(6) : '-';
  } else {
    summary.classList.add('hidden');
  }
}

// ============================================
// BOTONES
// ============================================

function setupButtonListeners() {
  document.getElementById('btn-consultar').addEventListener('click', consultWeather);
  document.getElementById('btn-reset').addEventListener('click', resetSelection);
}

function setupZoomControls() {
  document.getElementById('zoom-in').addEventListener('click', () => {
    AppState.map.setZoom(AppState.map.getZoom() + 1);
  });
  
  document.getElementById('zoom-out').addEventListener('click', () => {
    AppState.map.setZoom(AppState.map.getZoom() - 1);
  });
}

function checkReadyToConsult() {
  const btn = document.getElementById('btn-consultar');
  btn.disabled = !(AppState.selectedActivity && AppState.selectedDate && AppState.selectedSpot);
}

async function consultWeather() {
  if (!AppState.selectedActivity || !AppState.selectedDate || !AppState.selectedSpot) {
    showNotification('⚠️ Completa todos los campos');
    return;
  }

  const dateFormatted = AppState.selectedDate.replace(/-/g, '');

  const weatherQuery = {
    day: dateFormatted,
    lat: AppState.selectedSpot.lat,
    lon: AppState.selectedSpot.lon,
    coordinates: AppState.selectedCoordinates,
    activity: AppState.selectedActivity,
    spotName: AppState.selectedSpot.name,
    spotId: AppState.selectedSpot.id,
    isCustomLocation: AppState.selectedSpot.isCustom || false
  };

  localStorage.setItem(CONFIG.STORAGE_KEYS.WEATHER_QUERY, JSON.stringify(weatherQuery));

  const btn = document.getElementById('btn-consultar');
  btn.innerHTML = '⏳ Consultando...';
  btn.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/weather/forecast?day=${dateFormatted}&lat=${AppState.selectedSpot.lat}&lon=${AppState.selectedSpot.lon}&activity=${AppState.selectedActivity}&place_name=${encodeURIComponent(AppState.selectedSpot.name)}`
    );

    if (!response.ok) throw new Error('Error al consultar clima');

    const weatherData = await response.json();
    localStorage.setItem(CONFIG.STORAGE_KEYS.WEATHER_DATA, JSON.stringify(weatherData));

    window.location.href = 'resultados.html';

  } catch (error) {
    console.error('Error:', error);
    showNotification('❌ Error al consultar clima');
    btn.innerHTML = '🌦️ Consultar Clima';
    btn.disabled = false;
  }
}

function resetSelection() {
  AppState.selectedSpot = null;
  AppState.selectedActivity = null;
  AppState.selectedDate = null;
  AppState.selectedCoordinates = null;

  if (AppState.customMarker) {
    AppState.customMarker.setMap(null);
    AppState.customMarker = null;
  }

  document.querySelectorAll('.activity-radio').forEach(radio => radio.checked = false);
  document.querySelectorAll('.activity-card').forEach(card => {
    card.classList.remove('border-primary', 'bg-primary/10', 'dark:bg-primary/20');
    card.classList.add('border-black/10', 'dark:border-white/10');
  });
  
  document.getElementById('fecha-input').value = '';
  AppState.flatpickr.clear();
  
  clearMarkers();
  updateSelectionSummary();
  checkReadyToConsult();
  AppState.infoWindow.close();

  showNotification('🔄 Selección limpiada');
}

// ============================================
// UTILIDADES
// ============================================

function clearMarkers() {
  AppState.markers.forEach(marker => marker.setMap(null));
  AppState.markers = [];
}

function showNotification(message) {
  // Puedes implementar un sistema de notificaciones más elegante
  console.log(message);
}

function checkUserSession() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  
  if (!userString) {
    navAuth.innerHTML = `
      <a href="login.html" class="text-sm font-medium hover:text-primary transition-colors">Iniciar sesión</a>
    `;
    return;
  }

  try {
    const user = JSON.parse(userString);
    const username = user.username || 'Usuario';
    const email = user.email || '';
    const avatar = user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=13a4ec&color=fff';

    navAuth.innerHTML = `
      <div class="relative group">
        <!-- Botón del menú -->
        <button type="button" 
                class="flex items-center gap-2 rounded-full border-2 border-transparent hover:border-primary transition-all duration-200 pr-3">
          <img src="${avatar}" 
               alt="${username}" 
               class="w-10 h-10 rounded-full object-cover shadow-md">
          <span class="font-medium text-sm hidden sm:block">${username}</span>
          <svg class="w-4 h-4 transition-transform group-hover:rotate-180" 
               fill="currentColor" 
               viewBox="0 0 256 256" 
               xmlns="http://www.w3.org/2000/svg">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div class="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-background-dark shadow-2xl border border-black/10 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          
          <!-- Header del menú -->
          <div class="p-4 border-b border-black/10 dark:border-white/10">
            <div class="flex items-center gap-3">
              <img src="${avatar}" 
                   alt="${username}" 
                   class="w-12 h-12 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm truncate">${username}</h4>
                <p class="text-xs text-black/50 dark:text-white/50 truncate">${email}</p>
              </div>
            </div>
          </div>

          <!-- Opciones del menú -->
          <div class="p-2">
            <a href="perfil.html" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group/item">
              <svg class="w-5 h-5 text-black/50 dark:text-white/50 group-hover/item:text-primary" 
                   fill="currentColor" 
                   viewBox="0 0 256 256" 
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
              <span class="text-sm font-medium">Mi Perfil</span>
            </a>


          <!-- Separador -->
          <div class="h-px bg-black/10 dark:bg-white/10 my-2"></div>

          <!-- Logout -->
          <div class="p-2">
            <button type="button" 
                    id="logoutBtn"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/item">
              <svg class="w-5 h-5 text-red-500 group-hover/item:text-red-600" 
                   fill="currentColor" 
                   viewBox="0 0 256 256" 
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"></path>
              </svg>
              <span class="text-sm font-medium text-red-500 group-hover/item:text-red-600">Cerrar Sesión</span>
            </button>
          </div>
        </div>
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


function logout() {
  localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
  showNotification('👋 Sesión cerrada');
  window.location.href = 'login.html';
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================

window.initMap = initMap;
window.selectSpot = selectSpot;
window.selectCustomLocation = selectCustomLocation;
window.cancelCustomLocation = cancelCustomLocation;
window.toggleReviews = toggleReviews;