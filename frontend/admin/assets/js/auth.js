const ADMIN_TOKEN_KEY = 'admin_token';

function isAdminLoggedIn() {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

function requireAdminLogin() {
    if (!isAdminLoggedIn()) {
        window.location.replace('login.html');
    }
}

function saveAdminToken(token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function logoutAdmin() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.href = 'login.html';
}
