// ============================================
// SELECT.JS - Selección de actividad y lugar
// ============================================

const API_BASE_URL = CONFIG.API_BASE_URL;
let map;
let markers = [];
let customMarker = null; // Marker personalizado del usuario
let selectedSpot = null;
let selectedActivity = null;
let selectedDate = null;
let selectedCoordinates = null;
let infoWindow;
let searchBox;
let flatpickrInstance;

// ============================================
// INICIALIZAR MAPA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
});


function initMap() {
  const defaultLocation = CONFIG.DEFAULT_LOCATION;

  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: defaultLocation.lat, lng: defaultLocation.lng },
    zoom: 12,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  infoWindow = new google.maps.InfoWindow();
  setupSearchBox();
  getUserLocation();
  setupEventListeners();
  
  // ⭐ NUEVO: Permitir click en el mapa
  setupMapClickListener();
}

// ============================================
// ⭐ NUEVO: CLICK EN EL MAPA
// ============================================

function setupMapClickListener() {
  map.addListener('click', (event) => {
    if (!selectedActivity) {
      alert('⚠️ Por favor selecciona una actividad primero');
      return;
    }

    const lat = event.latLng.lat();
    const lon = event.latLng.lng();

    // Mostrar confirmación con coordenadas
    showCustomLocationConfirmation(lat, lon, event.latLng);
  });
}

// ============================================
// ⭐ NUEVO: CONFIRMAR UBICACIÓN PERSONALIZADA
// ============================================

function showCustomLocationConfirmation(lat, lon, latLng) {
  // Limpiar marker personalizado anterior
  if (customMarker) {
    customMarker.setMap(null);
  }

  // Crear marker temporal en el punto clickeado
  customMarker = new google.maps.Marker({
    position: latLng,
    map: map,
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

  // Info window para confirmar
  const activityName = CONFIG.ACTIVITIES[selectedActivity].name;
  const activityIcon = CONFIG.ACTIVITIES[selectedActivity].icon;

  const content = `
    <div class="spot-info">
      <h6>📍 Ubicación Personalizada</h6>
      <p><strong>Actividad:</strong> ${activityIcon} ${activityName}</p>
      <p class="mb-1"><small>Lat: ${lat.toFixed(6)}</small></p>
      <p class="mb-2"><small>Lon: ${lon.toFixed(6)}</small></p>
      <button class="btn btn-sm btn-success w-100 mb-2" onclick="selectCustomLocation(${lat}, ${lon}, '${activityName}')">
        ✅ Usar esta ubicación
      </button>
      <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelCustomLocation()">
        ❌ Cancelar
      </button>
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.setPosition(latLng);
  infoWindow.open(map);

  console.log('📍 Punto clickeado:', { lat, lon });
}

// ============================================
// ⭐ NUEVO: SELECCIONAR UBICACIÓN PERSONALIZADA
// ============================================

async function selectCustomLocation(lat, lon, activityName) {
  try {
    // Mostrar loading
    infoWindow.setContent(`
      <div class="spot-info">
        <h6>📍 Creando ubicación...</h6>
        <p>⏳ Guardando en la base de datos...</p>
      </div>
    `);

    // Obtener user_id si existe
    const userString = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?.id || null;

    // Crear el spot en la base de datos
    const spotData = {
      name: `Ubicación personalizada - ${activityName}`,
      description: `Spot personalizado para ${activityName} creado por el usuario`,
      latitude: lat,
      longitude: lon,
      activity_id: CONFIG.ACTIVITIES[selectedActivity].id,
      address: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`,
      city: "Ubicación personalizada",
      country: "Usuario"
    };

    // Construir URL con user_id si existe
    const url = userId 
      ? `${API_BASE_URL}/spots?user_id=${userId}`
      : `${API_BASE_URL}/spots`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spotData)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Spot creado en la base de datos:', result);

    // Usar el ID real devuelto por la API
    const realSpotId = result.spot?.id || result.id;
    
    if (!realSpotId) {
      throw new Error('No se recibió ID del spot creado');
    }

    selectedSpot = {
      id: realSpotId, // ⭐ IMPORTANTE: Usar el ID real de la base de datos
      name: spotData.name,
      lat: lat,
      lon: lon,
      isCustom: true
    };

    selectedCoordinates = `${lat},${lon}`;

    console.log('✅ Ubicación personalizada seleccionada con ID real:', selectedSpot);
    console.log('📍 Coordenadas:', selectedCoordinates);

    // Cambiar icono del marker a confirmar selección
    if (customMarker) {
      customMarker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#4CAF50', // Verde para confirmar
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      });
    }

    // Mostrar confirmación
    infoWindow.setContent(`
      <div class="spot-info">
        <h6>✅ Ubicación guardada</h6>
        <p><strong>${spotData.name}</strong></p>
        <p class="mb-1"><small>ID: ${realSpotId}</small></p>
        <p class="mb-2"><small>📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}</small></p>
        <button class="btn btn-sm btn-success w-100" onclick="closeInfoWindow()">
          👍 Continuar
        </button>
      </div>
    `);

    updateSelectionInfo();
    checkReadyToConsult();

  } catch (error) {
    console.error('❌ Error creando spot personalizado:', error);
    
    // Mostrar error al usuario
    infoWindow.setContent(`
      <div class="spot-info">
        <h6>❌ Error</h6>
        <p>No se pudo guardar la ubicación en la base de datos.</p>
        <p class="mb-2"><small>${error.message}</small></p>
        <button class="btn btn-sm btn-warning w-100 mb-2" onclick="selectCustomLocation(${lat}, ${lon}, '${activityName}')">
          🔄 Reintentar
        </button>
        <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelCustomLocation()">
          ❌ Cancelar
        </button>
      </div>
    `);
  }
}

// ============================================
// ⭐ NUEVO: CANCELAR UBICACIÓN PERSONALIZADA
// ============================================

function cancelCustomLocation() {
  if (customMarker) {
    customMarker.setMap(null);
    customMarker = null;
  }
  infoWindow.close();
}

// ============================================
// BÚSQUEDA DE LUGARES
// ============================================

function setupSearchBox() {
  const input = document.getElementById('search-input');
  searchBox = new google.maps.places.SearchBox(input);

  map.addListener('bounds_changed', () => {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener('places_changed', () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;

    const place = places[0];
    if (!place.geometry || !place.geometry.location) return;

    map.setCenter(place.geometry.location);
    map.setZoom(14);

    if (selectedActivity) {
      loadNearbySpots(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
    }
  });
}

// ============================================
// GEOLOCALIZACIÓN
// ============================================

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.setCenter(userLocation);
        
        new google.maps.Marker({
          position: userLocation,
          map: map,
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

        // ⭐ CARGAR SPOTS AUTOMÁTICAMENTE si hay actividad
        if (selectedActivity) {
          loadNearbySpots(userLocation.lat, userLocation.lng);
        }
      },
      (error) => {
        console.warn('Error obteniendo ubicación:', error);
      }
    );
  }
}

// ============================================
// CARGAR SPOTS DESDE API
// ============================================

async function loadNearbySpots(lat, lon) {
  if (!selectedActivity) {
    return;
  }

  try {
    clearMarkers();

    const activityId = CONFIG.ACTIVITIES[selectedActivity].id;

    const response = await fetch(
      `${API_BASE_URL}/spots/nearby?lat=${lat}&lon=${lon}&radius_km=${CONFIG.SEARCH_RADIUS_KM}&activity_id=${activityId}`
    );

    if (!response.ok) {
      throw new Error('Error al cargar spots');
    }

    const data = await response.json();
    const spots = data.spots;

    console.log(`📍 Encontrados ${spots.length} spots de ${CONFIG.ACTIVITIES[selectedActivity].name}`);

    if (spots.length === 0) {
      // ⭐ MEJORADO: Mensaje cuando no hay spots
      infoWindow.setContent(`
        <div class="spot-info">
          <h6>No hay spots de ${CONFIG.ACTIVITIES[selectedActivity].name} cercanos</h6>
          <p class="mb-2">💡 Puedes hacer click en el mapa para seleccionar una ubicación personalizada</p>
          <button class="btn btn-sm btn-info w-100" onclick="closeInfoWindow()">Entendido</button>
        </div>
      `);
      infoWindow.setPosition({ lat, lng: lon });
      infoWindow.open(map);
      return;
    }

    // ⭐ CREAR MARKERS PARA CADA SPOT
    spots.forEach(spot => {
      createSpotMarker(spot);
    });

  } catch (error) {
    console.error('Error cargando spots:', error);
    
    // ⭐ MEJORADO: No mostrar alert, solo mensaje en consola
    console.warn('No se pudieron cargar spots. Puedes hacer click en el mapa para seleccionar ubicación.');
  }
}

// ============================================
// CREAR MARKERS
// ============================================

function createSpotMarker(spot) {
  const activityIcon = CONFIG.ACTIVITIES[selectedActivity].icon;

  const marker = new google.maps.Marker({
    position: { lat: spot.latitude, lng: spot.longitude },
    map: map,
    title: spot.name,
    label: {
      text: activityIcon,
      fontSize: '28px',
      fontWeight: 'bold'
    },
    animation: google.maps.Animation.DROP,
    // ⭐ MEJORADO: Agregar z-index para que estén por encima
    zIndex: 100
  });

  // Click en marker muestra info
  marker.addListener('click', () => {
    showSpotInfo(spot, marker);
  });

  markers.push(marker);
}

// ============================================
// INFO WINDOW DE SPOT
// ============================================

function showSpotInfo(spot, marker) {
  const content = `
    <div class="spot-info">
      <h6>${spot.name}</h6>
      <p>${spot.description || 'Sin descripción'}</p>
      <p class="mb-1"><small>📍 ${spot.city || ''}, ${spot.country || ''}</small></p>
      <p class="mb-2"><small>⭐ ${spot.rating_avg || 'N/A'} (${spot.total_reviews || 0} reseñas)</small></p>
      <button class="btn btn-sm btn-info text-white w-100" onclick="selectSpot('${spot.id}', '${spot.name}', ${spot.latitude}, ${spot.longitude})">
        ✅ Seleccionar este lugar
      </button>
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.open(map, marker);
}

// ============================================
// SELECCIONAR SPOT
// ============================================

function selectSpot(spotId, spotName, lat, lon) {
  // Limpiar marker personalizado si existe
  if (customMarker) {
    customMarker.setMap(null);
    customMarker = null;
  }

  selectedSpot = { 
    id: spotId, 
    name: spotName, 
    lat: lat, 
    lon: lon,
    isCustom: false
  };
  
  selectedCoordinates = `${lat},${lon}`;

  console.log('📍 Spot seleccionado:', selectedSpot);
  console.log('📍 Coordenadas:', selectedCoordinates);

  updateSelectionInfo();
  checkReadyToConsult();
  infoWindow.close();
}

// ============================================
// ACTUALIZAR PANEL DE INFORMACIÓN
// ============================================

function updateSelectionInfo() {
  const infoPanel = document.getElementById('selected-info');
  
  if (selectedActivity || selectedDate || selectedSpot) {
    infoPanel.style.display = 'block';
    
    document.getElementById('info-activity').textContent = 
      selectedActivity ? CONFIG.ACTIVITIES[selectedActivity].name : '-';
    
    document.getElementById('info-date').textContent = selectedDate || '-';
    
    // ⭐ MEJORADO: Mostrar si es ubicación personalizada
    const spotName = selectedSpot ? selectedSpot.name : '-';
    const customLabel = selectedSpot?.isCustom ? ' (Personalizada)' : '';
    document.getElementById('info-spot').textContent = spotName + customLabel;
    
    document.getElementById('info-lat').textContent = 
      selectedSpot ? selectedSpot.lat.toFixed(6) : '-';
    
    document.getElementById('info-lon').textContent = 
      selectedSpot ? selectedSpot.lon.toFixed(6) : '-';
  } else {
    infoPanel.style.display = 'none';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Selección de actividad
  const activityCheckboxes = document.querySelectorAll('.activity-checkbox');
  activityCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        selectedActivity = this.value;
        updateSelectionInfo();
        
        // Cargar spots de la nueva actividad
        const center = map.getCenter();
        loadNearbySpots(center.lat(), center.lng());

        // ⭐ NUEVO: Mostrar hint
        console.log(`💡 Ahora puedes:
1. Hacer click en un marcador ${CONFIG.ACTIVITIES[selectedActivity].icon} existente
2. O hacer click en cualquier punto del mapa para crear tu propia ubicación`);
      }
    });
  });

  // Calendario inline
  flatpickrInstance = flatpickr("#calendar-inline", {
    defaultDate: new Date(),
    minDate: "today",
    maxDate: new Date().fp_incr(365),
    inline: true,
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
      selectedDate = dateStr;
      document.getElementById('fecha').value = dateStr;
      updateSelectionInfo();
      checkReadyToConsult();
      console.log('📅 Fecha seleccionada:', selectedDate);
    }
  });

  // Botón consultar
  document.getElementById('btn-consultar').addEventListener('click', consultWeather);

  // Botón reset
  document.getElementById('btn-reset').addEventListener('click', resetSelection);
}

// ============================================
// VERIFICAR SI ESTÁ LISTO
// ============================================

function checkReadyToConsult() {
  const btnConsultar = document.getElementById('btn-consultar');
  
  if (selectedActivity && selectedDate && selectedSpot) {
    btnConsultar.disabled = false;
  } else {
    btnConsultar.disabled = true;
  }
}

// ============================================
// CONSULTAR CLIMA
// ============================================

async function consultWeather() {
  if (!selectedActivity || !selectedDate || !selectedSpot) {
    alert('Por favor completa todos los campos');
    return;
  }

  const dateFormatted = selectedDate.replace(/-/g, '');

  const weatherQuery = {
    day: dateFormatted,
    lat: selectedSpot.lat,
    lon: selectedSpot.lon,
    coordinates: selectedCoordinates,
    activity: selectedActivity,
    spotName: selectedSpot.name,
    spotId: selectedSpot.id,
    isCustomLocation: selectedSpot.isCustom || false // ⭐ NUEVO: Flag de ubicación personalizada
  };

  console.log('🌦️ Consultando clima:', weatherQuery);

  localStorage.setItem(CONFIG.STORAGE_KEYS.WEATHER_QUERY, JSON.stringify(weatherQuery));

  const btnConsultar = document.getElementById('btn-consultar');
  const originalText = btnConsultar.innerHTML;
  btnConsultar.innerHTML = '⏳ Consultando NASA...';
  btnConsultar.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/weather/forecast?day=${dateFormatted}&lat=${selectedSpot.lat}&lon=${selectedSpot.lon}&activity=${selectedActivity}&place_name=${encodeURIComponent(selectedSpot.name)}`
    );

    if (!response.ok) {
      throw new Error('Error al consultar clima');
    }

    const weatherData = await response.json();
    localStorage.setItem(CONFIG.STORAGE_KEYS.WEATHER_DATA, JSON.stringify(weatherData));

    console.log('✅ Datos recibidos:', weatherData);

    window.location.href = 'resultados.html';

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al consultar el clima. Verifica que el backend esté corriendo en http://localhost:8000');
    btnConsultar.innerHTML = originalText;
    btnConsultar.disabled = false;
  }
}

// ============================================
// RESET
// ============================================

function resetSelection() {
  selectedSpot = null;
  selectedActivity = null;
  selectedDate = null;
  selectedCoordinates = null;

  // Limpiar marker personalizado
  if (customMarker) {
    customMarker.setMap(null);
    customMarker = null;
  }

  document.querySelectorAll('.activity-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('fecha').value = '';
  flatpickrInstance.clear();
  clearMarkers();
  updateSelectionInfo();
  checkReadyToConsult();
  infoWindow.close();

  console.log('🔄 Selección limpiada');
}

// ============================================
// UTILIDADES
// ============================================

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

function closeInfoWindow() {
  infoWindow.close();
}

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


// Exponer funciones globales
window.initMap = initMap;
window.selectSpot = selectSpot;
window.selectCustomLocation = selectCustomLocation;
window.cancelCustomLocation = cancelCustomLocation;
window.closeInfoWindow = closeInfoWindow;