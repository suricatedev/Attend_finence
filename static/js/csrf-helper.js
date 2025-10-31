// Helper para CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getCSRFToken() {
    return getCookie('csrftoken');
}

// Adicionar CSRF token a todas as requisições fetch
window.fetchWithCSRF = function(url, options = {}) {
    const csrftoken = getCSRFToken();
    
    if (!options.headers) {
        options.headers = {};
    }
    
    options.headers['X-CSRFToken'] = csrftoken;
    options.headers['Content-Type'] = 'application/json';
    
    return fetch(url, options);
};

