// ============================================
// CONFIGURACIÓN GLOBAL - ActiveSky
// ============================================

const CONFIG = {
  // Backend API
  API_BASE_URL: 'http://localhost:8000/api',
  
  // Google Maps
  GOOGLE_MAPS_KEY: 'AIzaSyBYT-hZDZszmDiZL-kd6JB-1N_7FnQpsWc', // ⚠️ CAMBIAR
  
  // Configuración de búsqueda
  DEFAULT_LOCATION: {
    lat: 19.4326,
    lng: -99.1332,
    name: 'Ciudad de México'
  },
  
  SEARCH_RADIUS_KM: 20,
  
  // Actividades
  ACTIVITIES: {
    running: { id: 1, name: 'Running', icon: '🏃', slug: 'running' },
    cycling: { id: 2, name: 'Ciclismo', icon: '🚴', slug: 'cycling' },
    hiking: { id: 3, name: 'Hiking', icon: '🥾', slug: 'hiking' },
    fishing: { id: 4, name: 'Pesca', icon: '🎣', slug: 'fishing' },
    camping: { id: 5, name: 'Camping', icon: '⛺', slug: 'camping' }
  },
  
  // LocalStorage keys
  STORAGE_KEYS: {
    USER: 'activeSkyUser',
    WEATHER_QUERY: 'weatherQuery',
    WEATHER_DATA: 'weatherData',
    SESSION_TOKEN: 'sessionToken'
  }
};

// Exportar para usar en otros archivos
window.CONFIG = CONFIG;