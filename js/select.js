// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';
let map;
let markers = [];
let selectedSpot = null;
let selectedActivity = null;
let selectedDate = null;
let selectedCoordinates = null; // String "lat,lon"
let infoWindow;
let searchBox;
let flatpickrInstance;

// ============================================
// INICIALIZAR MAPA
// ============================================

function initMap() {
  // Ubicación inicial (CDMX por defecto)
  const defaultLocation = { lat: 19.4326, lng: -99.1332 };

  // Crear mapa
  map = new google.maps.Map(document.getElementById('map'), {
    center: defaultLocation,
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

  // Info Window para mostrar detalles
  infoWindow = new google.maps.InfoWindow();

  // Configurar búsqueda de lugares
  setupSearchBox();

  // Intentar obtener ubicación del usuario
  getUserLocation();

  // Event listeners
  setupEventListeners();
}

// ============================================
// BÚSQUEDA DE LUGARES (Google Places)
// ============================================

function setupSearchBox() {
  const input = document.getElementById('search-input');
  searchBox = new google.maps.places.SearchBox(input);

  // Bias resultados al viewport actual
  map.addListener('bounds_changed', () => {
    searchBox.setBounds(map.getBounds());
  });

  // Listener cuando usuario selecciona un lugar
  searchBox.addListener('places_changed', () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;

    const place = places[0];
    if (!place.geometry || !place.geometry.location) return;

    // Centrar mapa en el lugar buscado
    map.setCenter(place.geometry.location);
    map.setZoom(14);

    // Cargar spots cercanos si hay actividad seleccionada
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
        
        // Agregar marker de ubicación del usuario
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

        // Si hay actividad seleccionada, cargar spots
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
    alert('Por favor selecciona una actividad primero');
    return;
  }

  try {
    // Limpiar markers anteriores
    clearMarkers();

    // Obtener ID de actividad
    const activityId = getActivityId(selectedActivity);

    // Llamar a API
    const response = await fetch(
      `${API_BASE_URL}/spots/nearby?lat=${lat}&lon=${lon}&radius_km=10&activity_id=${activityId}`
    );

    if (!response.ok) {
      throw new Error('Error al cargar spots');
    }

    const data = await response.json();
    const spots = data.spots;

    if (spots.length === 0) {
      infoWindow.setContent(`
        <div class="spot-info">
          <h6>No hay spots de ${selectedActivity} cercanos</h6>
          <p>Intenta buscar en otra ubicación o crea uno nuevo</p>
        </div>
      `);
      infoWindow.setPosition({ lat, lng: lon });
      infoWindow.open(map);
      return;
    }

    // Crear markers para cada spot
    spots.forEach(spot => {
      createSpotMarker(spot);
    });

  } catch (error) {
    console.error('Error cargando spots:', error);
    alert('Error al cargar lugares. Verifica que el backend esté corriendo en http://localhost:8000');
  }
}

// ============================================
// CREAR MARKERS
// ============================================

function createSpotMarker(spot) {
  const activityIcon = getActivityIcon(selectedActivity);

  const marker = new google.maps.Marker({
    position: { lat: spot.latitude, lng: spot.longitude },
    map: map,
    title: spot.name,
    label: {
      text: activityIcon,
      fontSize: '24px'
    },
    animation: google.maps.Animation.DROP
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
      <p class="mb-2"><small>⭐ Rating: ${spot.rating_avg || 'N/A'} (${spot.total_reviews || 0} reseñas)</small></p>
      <button class="btn btn-sm btn-info btn-select-spot text-white" onclick="selectSpot('${spot.id}', '${spot.name}', ${spot.latitude}, ${spot.longitude})">
        Seleccionar este lugar
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
  selectedSpot = {
    id: spotId,
    name: spotName,
    lat: lat,
    lon: lon
  };

  // Guardar coordenadas como string "lat,lon"
  selectedCoordinates = `${lat},${lon}`;

  console.log('📍 Coordenadas seleccionadas:', selectedCoordinates);

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
      selectedActivity ? selectedActivity.toUpperCase() : '-';
    
    document.getElementById('info-date').textContent = 
      selectedDate || '-';
    
    document.getElementById('info-spot').textContent = 
      selectedSpot ? selectedSpot.name : '-';
    
    document.getElementById('info-lat').textContent = 
      selectedSpot ? selectedSpot.lat.toFixed(4) : '-';
    
    document.getElementById('info-lon').textContent = 
      selectedSpot ? selectedSpot.lon.toFixed(4) : '-';
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
      }
    });
  });

  // Calendario - INLINE (desplegable)
  flatpickrInstance = flatpickr("#calendar-inline", {
    defaultDate: new Date(),
    minDate: "today",
    maxDate: new Date().fp_incr(365), // 1 año adelante
    inline: true, // Mostrar calendario desplegado
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
      selectedDate = dateStr;
      
      // Actualizar el input también
      document.getElementById('fecha').value = dateStr;
      
      updateSelectionInfo();
      checkReadyToConsult();
      
      console.log('📅 Fecha seleccionada:', selectedDate);
    }
  });

  // Input de fecha (por si el usuario escribe manualmente)
  document.getElementById('fecha').addEventListener('change', function() {
    selectedDate = this.value;
    flatpickrInstance.setDate(this.value);
    updateSelectionInfo();
    checkReadyToConsult();
  });

  // Botón consultar
  document.getElementById('btn-consultar').addEventListener('click', consultWeather);

  // Botón reset
  document.getElementById('btn-reset').addEventListener('click', resetSelection);
}

// ============================================
// VERIFICAR SI ESTÁ LISTO PARA CONSULTAR
// ============================================

function checkReadyToConsult() {
  const btnConsultar = document.getElementById('btn-consultar');
  
  if (selectedActivity && selectedDate && selectedSpot) {
    btnConsultar.disabled = false;
    btnConsultar.classList.remove('btn-secondary');
    btnConsultar.classList.add('btn-primary');
  } else {
    btnConsultar.disabled = true;
    btnConsultar.classList.remove('btn-primary');
    btnConsultar.classList.add('btn-secondary');
  }
}

// ============================================
// CONSULTAR CLIMA (ENVIAR AL BACKEND)
// ============================================

async function consultWeather() {
  if (!selectedActivity || !selectedDate || !selectedSpot) {
    alert('Por favor completa todos los campos');
    return;
  }

  // Convertir fecha a formato YYYYMMDD para el backend
  const dateFormatted = selectedDate.replace(/-/g, '');

  // Preparar datos para el backend
  const weatherQuery = {
    day: dateFormatted,                    // "20251005"
    lat: selectedSpot.lat,                 // 19.4326
    lon: selectedSpot.lon,                 // -99.1332
    coordinates: selectedCoordinates,      // "19.4326,-99.1332" (string)
    activity: selectedActivity,            // "running"
    spotName: selectedSpot.name,          // "Bosque de Chapultepec"
    spotId: selectedSpot.id               // UUID del spot
  };

  console.log('🌦️ Datos para consultar clima:', weatherQuery);
  console.log('📍 Coordenadas (string):', selectedCoordinates);

  // Guardar en localStorage para pasar a resultados.html
  localStorage.setItem('weatherQuery', JSON.stringify(weatherQuery));

  // Mostrar loading
  const btnConsultar = document.getElementById('btn-consultar');
  const originalText = btnConsultar.innerHTML;
  btnConsultar.innerHTML = '⏳ Consultando...';
  btnConsultar.disabled = true;

  try {
    // Llamar a tu API backend
    const response = await fetch(
      `${API_BASE_URL}/weather/forecast?day=${dateFormatted}&lat=${selectedSpot.lat}&lon=${selectedSpot.lon}&activity=${selectedActivity}&place_name=${encodeURIComponent(selectedSpot.name)}`
    );

    if (!response.ok) {
      throw new Error('Error al consultar clima');
    }

    const weatherData = await response.json();

    // Guardar respuesta completa
    localStorage.setItem('weatherData', JSON.stringify(weatherData));

    console.log('✅ Datos de clima recibidos:', weatherData);

    // Redirigir a resultados
    window.location.href = 'resultados.html';

  } catch (error) {
    console.error('❌ Error consultando clima:', error);
    alert('Error al consultar el clima. Verifica que el backend esté corriendo.');
    
    // Restaurar botón
    btnConsultar.innerHTML = originalText;
    btnConsultar.disabled = false;
  }
}

// ============================================
// RESET SELECCIÓN
// ============================================

function resetSelection() {
  selectedSpot = null;
  selectedActivity = null;
  selectedDate = null;
  selectedCoordinates = null;

  // Limpiar checkboxes
  document.querySelectorAll('.activity-checkbox').forEach(cb => cb.checked = false);

  // Limpiar fecha
  document.getElementById('fecha').value = '';
  flatpickrInstance.clear();

  // Limpiar markers
  clearMarkers();

  // Actualizar UI
  updateSelectionInfo();
  checkReadyToConsult();

  console.log('🔄 Selección limpiada');
}

// ============================================
// UTILIDADES
// ============================================

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

function getActivityId(activitySlug) {
  const activityMap = {
    'running': 1,
    'cycling': 2,
    'hiking': 3,
    'fishing': 4,
    'camping': 5
  };
  return activityMap[activitySlug] || 1;
}

function getActivityIcon(activitySlug) {
  const iconMap = {
    'running': '🏃',
    'cycling': '🚴',
    'hiking': '🥾',
    'fishing': '🎣',
    'camping': '⛺'
  };
  return iconMap[activitySlug] || '📍';
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================

window.initMap = initMap;
window.selectSpot = selectSpot;