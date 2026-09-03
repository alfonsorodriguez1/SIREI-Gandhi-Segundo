// ============================================================
// CONFIGURACIÓN DE ORIGEN DE DATOS
// La aplicación es replicable para otras escuelas. Cada escuela
// se define con 4 parámetros (editables por el admin desde el
// panel "Cambiar datos"):
//   - apiUrl:      enlace /exec de la implementación de Apps
//                  Script de esa escuela.
//   - adminId:     hoja administrador (alumnos, asignaturas,
//                  credenciales, logo, elementos).
//   - checadorId:  hoja checador (registros de entrada).
//   - financieroId: hoja financiero (bloqueo de acceso).
// Toda llamada a la API usa el apiUrl configurado y envía los
// tres IDs como parámetros para que el backend los utilice.
// ============================================================
const DEFAULT_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbyVyQzERbPnp1SQjRn2f-difz2nMSbKAwg-H5tuYt8ZlMeQj-BOSYLPeFOzMwb-zy5k/exec',
  adminId: '1SFeeBkJe5dkSN9LnzX-WCiUhEApBziGrt7ZYUC2txJI',
  checadorId: '1LL_EodpNUFWXguzp-YuFHvRbli7MpY7dll3kShKOvbo',
  financieroId: '12g1PZRAVkqsCvhNFiR9WU5zqGA6dvMf1cUkP4NS4YxE'
};

const CONFIG_KEY = 'sirei_config';

function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      apiUrl: parsed.apiUrl || DEFAULT_CONFIG.apiUrl,
      adminId: parsed.adminId || DEFAULT_CONFIG.adminId,
      checadorId: parsed.checadorId || DEFAULT_CONFIG.checadorId,
      financieroId: parsed.financieroId || DEFAULT_CONFIG.financieroId
    };
  } catch {
    return Object.assign({}, DEFAULT_CONFIG);
  }
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    apiUrl: String(cfg.apiUrl || '').trim(),
    adminId: String(cfg.adminId || '').trim(),
    checadorId: String(cfg.checadorId || '').trim(),
    financieroId: String(cfg.financieroId || '').trim()
  }));
}

function buildApiUrl(query) {
  const cfg = getConfig();
  const params = [
    String(query || ''),
    'adminId=' + encodeURIComponent(cfg.adminId),
    'checadorId=' + encodeURIComponent(cfg.checadorId),
    'financieroId=' + encodeURIComponent(cfg.financieroId)
  ].filter(s => s !== '');
  const sep = cfg.apiUrl.indexOf('?') === -1 ? '?' : '&';
  return cfg.apiUrl + sep + params.join('&');
}

const SESSION_KEY = 'sirei_gandhi_session';

// ============================================================
// FUNCIONES DE SESIÓN
// ============================================================
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ============================================================
// ELEMENTOS DEL LOGIN
// ============================================================
const loginView = document.getElementById('loginView');
const changePasswordView = document.getElementById('changePasswordView');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('loginError');
const errorText = document.getElementById('errorText');
const loginLogo = document.getElementById('loginLogo');

// Modal de acceso bloqueado (archivo "Financiero")
const blockedModal = document.getElementById('blockedModal');
const blockedModalClose = document.getElementById('blockedModalClose');

// Captcha
const captchaInput = document.getElementById('captcha');
const captchaA = document.getElementById('captchaA');
const captchaB = document.getElementById('captchaB');
const captchaRefresh = document.getElementById('captchaRefresh');

// Cambio de contraseña
const changePasswordForm = document.getElementById('changePasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordError = document.getElementById('changePasswordError');
const changePasswordErrorText = document.getElementById('changePasswordErrorText');
const passwordRequirements = document.getElementById('passwordRequirements');

// ============================================================
// CAPTCHA MATEMÁTICO
// ============================================================
let captchaResult = 0;

function regenerarCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  captchaResult = a + b;
  captchaA.textContent = a;
  captchaB.textContent = b;
  captchaInput.value = '';
}

captchaRefresh.addEventListener('click', regenerarCaptcha);

// ============================================================
// NORMALIZACIÓN PARA BLOQUEO (minúsculas, sin tildes)
// ============================================================
function normalizaClave(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ============================================================
// AYUDAS DE MENSAJES
// ============================================================
function restaurarLoginBtn() {
  loginBtn.disabled = false;
  loginBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> <span>Entrar</span>';
}

function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.add('show');
}

function hideError() {
  errorMsg.classList.remove('show');
}

function showChangeError(msg) {
  changePasswordErrorText.textContent = msg;
  changePasswordError.classList.add('show');
}

function hideChangeError() {
  changePasswordError.classList.remove('show');
}

// Limpia los campos del login tras un intento fallido.
function limpiarLogin() {
  usernameInput.value = '';
  passwordInput.value = '';
  regenerarCaptcha();
}

// Modal grande e independiente de acceso bloqueado.
function showBlockedModal() {
  if (!blockedModal) return;
  hideError();
  blockedModal.classList.add('show');
}

function hideBlockedModal() {
  if (!blockedModal) return;
  blockedModal.classList.remove('show');
}

if (blockedModal) {
  if (blockedModalClose) blockedModalClose.addEventListener('click', hideBlockedModal);
  blockedModal.addEventListener('click', (e) => {
    if (e.target === blockedModal) hideBlockedModal();
  });
}

// ============================================================
// CONSTRUCCIÓN DE LA SESIÓN
// ============================================================
function buildSession(username, idx, data) {
  const usuarios = data.Usuarios1 || [];
  const nombres = data.Alumnos1 || [];
  const roles = data.Roles1 || [];
  const fotos = data.Fotografía || [];
  const curps = data.CURP1 || [];
  const grupos = data.Grupo1 || [];

  const curp = (curps && curps[idx]) ? curps[idx] : '';
  return {
    username: username,
    name: nombres[idx] || username,
    role: roles[idx] || 'Sin rol',
    photo: fotos[idx] || '',
    rowIndex: idx,
    curp: curp,
    grupo: grupos[idx] || '',
    loggedIn: true,
    rawData: data
  };
}

// ============================================================
// CAMBIO DE CONTRASEÑA (primer acceso)
// ============================================================
let pendingLogin = null;

const REQUISITOS = {
  min:     (p) => p.length >= 8,
  upper:   (p) => /[A-Z]/.test(p),
  lower:   (p) => /[a-z]/.test(p),
  num:     (p) => /\d/.test(p),
  special: (p) => /[^A-Za-z0-9]/.test(p),
  match:   (p, confirm) => p === confirm && p.length > 0
};

function validarRequisitosContrasena() {
  const nueva = newPasswordInput.value;
  const confirm = confirmPasswordInput.value;
  let ok = true;
  passwordRequirements.querySelectorAll('li').forEach(li => {
    const req = li.dataset.req;
    const cumple = REQUISITOS[req](nueva, confirm);
    li.classList.toggle('cumple', cumple);
    if (!cumple) ok = false;
  });
  return ok;
}

newPasswordInput.addEventListener('input', validarRequisitosContrasena);
confirmPasswordInput.addEventListener('input', validarRequisitosContrasena);

changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!pendingLogin) {
    showChangeError('La sesión no es válida. Vuelve a iniciar sesión.');
    return;
  }

  if (!validarRequisitosContrasena()) {
    showChangeError('La contraseña no cumple todos los requisitos.');
    return;
  }

  changePasswordBtn.disabled = true;
  changePasswordBtn.innerHTML = '<span class="spinner"></span> Guardando...';
  hideChangeError();

  try {
    const body = new URLSearchParams({
      tipo: 'changePassword',
      usuario: pendingLogin.username,
      nuevaPassword: newPasswordInput.value
    });
    const res = await fetch(buildApiUrl(''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await res.json();
    if (data.ok) {
      setSession(buildSession(pendingLogin.username, pendingLogin.idx, pendingLogin.data));
      window.location.href = 'gandhi.html';
      return;
    }
    showChangeError(data.error || 'No se pudo actualizar la contraseña. Intenta de nuevo.');
  } catch (err) {
    console.error(err);
    showChangeError('Error al conectar con el servidor. Revisa tu conexión.');
  } finally {
    changePasswordBtn.disabled = false;
    changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> <span>Guardar y entrar</span>';
  }
});

function mostrarCambioPassword(loginData) {
  pendingLogin = loginData;
  loginView.style.display = 'none';
  changePasswordView.style.display = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  hideChangeError();
  passwordRequirements.querySelectorAll('li').forEach(li => li.classList.remove('cumple'));
  newPasswordInput.focus();
}

// ============================================================
// CARGAR LOGO DESDE LA API
// ============================================================
async function loadLoginLogo() {
  loginLogo.onerror = () => { loginLogo.style.display = 'none'; };
  try {
    const res = await fetch(buildApiUrl(''));
    const data = await res.json();
    if (data.Logo) {
      loginLogo.src = data.Logo;
      loginLogo.alt = 'Logo de la institución';
      loginLogo.style.display = 'block';
    } else {
      loginLogo.style.display = 'none';
    }
  } catch {
    loginLogo.style.display = 'none';
  }
}

// ============================================================
// AUTENTICACIÓN
// ============================================================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    showError('Por favor ingresa usuario y contraseña.');
    limpiarLogin();
    return;
  }

  // Validación del captcha
  if (parseInt(captchaInput.value.trim(), 10) !== captchaResult) {
    showError('Captcha incorrecto. Intenta de nuevo.');
    limpiarLogin();
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner"></span> Verificando...';
  hideError();

  try {
    const res = await fetch(buildApiUrl(''));
    const data = await res.json();

    const usuarios = data.Usuarios1 || [];
    const passwords = data.Password1 || [];
    const nombres = data.Alumnos1 || [];
    const bloqueados = (data.Bloqueados || []).map(normalizaClave);

    const idx = usuarios.indexOf(username);
    if (idx === -1) {
      showError('Usuario no encontrado.');
      limpiarLogin();
      return;
    }
    if (passwords[idx] !== password) {
      showError('Contraseña incorrecta.');
      limpiarLogin();
      return;
    }

    // ===== Bloqueo de acceso (archivo "Financiero") =====
    const nombreBloqueo = normalizaClave(nombres[idx]);
    const usuarioBloqueo = normalizaClave(username);
    if (bloqueados.indexOf(nombreBloqueo) !== -1 || bloqueados.indexOf(usuarioBloqueo) !== -1) {
      limpiarLogin();
      showBlockedModal();
      return;
    }

    // ===== Primer acceso: usuario == contraseña, forzar cambio =====
    if (passwords[idx] === username) {
      mostrarCambioPassword({ username, idx, data });
      return;
    }

    setSession(buildSession(username, idx, data));
    window.location.href = 'gandhi.html';

  } catch (err) {
    console.error(err);
    showError('Error al conectar con el servidor. Revisa tu conexión.');
    limpiarLogin();
  } finally {
    restaurarLoginBtn();
  }
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
loadLoginLogo();
regenerarCaptcha();

// Spinner CSS
const style = document.createElement('style');
style.textContent = `
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);
