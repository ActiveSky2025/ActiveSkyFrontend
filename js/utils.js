// Utilidades generales

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implementar notificaciones visuales
}

function showLoading() {
    console.log('Loading...');
    // TODO: Implementar spinner
}

function hideLoading() {
    console.log('Loading complete');
    // TODO: Ocultar spinner
}