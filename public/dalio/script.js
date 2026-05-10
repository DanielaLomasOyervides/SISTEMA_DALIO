
// ---------- Utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ================================================================
// SISTEMA DE SESIÓN (simulado)
// futura autenticación: reemplazar sessionStorage con tokens JWT
// futura API: POST /api/auth/login → { token, user }
// futura sesión: guardar token en httpOnly cookie (no localStorage)
// ================================================================

/**
 * Estado de sesión actual (simulado).
 * En producción este objeto vendrá del backend.
 */
let currentSession = {
  loggedIn: false,
  role: null,       // 'alumno' | 'maestro'
  email: null,
  nombre: null,
};

// PANTALLA DE LOGIN

const loginScreen  = $('#loginScreen');
const mainApp      = $('#mainApp');
const loginEmail   = $('#loginEmail');
const loginPass    = $('#loginPass');
const loginBtn     = $('#loginBtn');
const loginBtnText = $('#loginBtnText');
const loginSpinner = $('#loginSpinner');
const loginError   = $('#loginError');
const emailGroup   = $('#emailGroup');
const passGroup    = $('#passGroup');
const togglePass   = $('#togglePass');

const roleAlumno  = $('#roleAlumno');
const roleMaestro = $('#roleMaestro');

let selectedRole = 'alumno';

// Selector de rol
function selectRole(role) {
  selectedRole = role;
  roleAlumno.classList.toggle('active', role === 'alumno');
  roleMaestro.classList.toggle('active', role === 'maestro');
}

roleAlumno.addEventListener('click',  () => selectRole('alumno'));
roleMaestro.addEventListener('click', () => selectRole('maestro'));

// Mostrar/ocultar contraseña
togglePass.addEventListener('click', () => {
  const isPassword = loginPass.type === 'password';
  loginPass.type = isPassword ? 'text' : 'password';
});

// Limpiar errores al escribir
loginEmail.addEventListener('input', () => clearFieldError(emailGroup, 'emailError'));
loginPass.addEventListener('input',  () => clearFieldError(passGroup,  'passError'));

function clearFieldError(group, errorId) {
  const wrap = group.querySelector('.form-input-wrap');
  if (wrap) wrap.classList.remove('error-field');
  const err = $('#' + errorId);
  if (err) err.textContent = '';
}

function setFieldError(group, errorId, msg) {
  const wrap = group.querySelector('.form-input-wrap');
  if (wrap) wrap.classList.add('error-field');
  const err = $('#' + errorId);
  if (err) err.textContent = msg;
}

/**
 * Validar formulario de login.
 * futura API: la validación real ocurre en el backend.
 */
function validateLogin(email, password) {
  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError(emailGroup, 'emailError', 'Ingresa un correo electrónico válido.');
    valid = false;
  }

  if (!password || password.length < 6) {
    setFieldError(passGroup, 'passError', 'La contraseña debe tener al menos 6 caracteres.');
    valid = false;
  }

  return valid;
}

/**
 * Simular llamada a API de login.
 * futura API: fetch('/api/auth/login', { method:'POST', body: JSON.stringify({email, password, role}) })
 * futura autenticación: verificar token JWT en respuesta
 */
function simulateApiLogin(email, password, role) {
  return new Promise((resolve, reject) => {
    // Simular latencia de red
    setTimeout(() => {
      // Demo: acepta cualquier email válido + contraseña de 6+ caracteres
      // futura autenticación: aquí se compararía con la DB real
      if (email && password.length >= 6) {
        resolve({
          success: true,
          user: {
            email,
            role,
            nombre: role === 'alumno' ? email.split('@')[0] : email.split('@')[0],
          }
        });
      } else {
        reject({ message: 'Credenciales inválidas.' });
      }
    }, 900);
  });
}

// Iniciar sesión
loginBtn.addEventListener('click', async () => {
  const email    = loginEmail.value.trim();
  const password = loginPass.value;

  loginError.textContent = '';

  if (!validateLogin(email, password)) return;

  // Mostrar spinner
  loginBtnText.textContent = 'Verificando...';
  loginSpinner.classList.add('visible');
  loginBtn.disabled = true;

  try {
    // futura API: reemplazar simulateApiLogin con fetch real
    const response = await simulateApiLogin(email, password, selectedRole);

    if (response.success) {
      currentSession = {
        loggedIn: true,
        role: response.user.role,
        email: response.user.email,
        nombre: response.user.nombre,
      };

      iniciarSesion(currentSession);
    }
  } catch (err) {
    loginError.textContent = err.message || 'Error al iniciar sesión. Intenta de nuevo.';
  } finally {
    loginBtnText.textContent = 'Iniciar Sesión';
    loginSpinner.classList.remove('visible');
    loginBtn.disabled = false;
  }
});

// Enter en password = submit
loginPass.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});
loginEmail.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginPass.focus();
});

// INICIO DE SESIÓN → mostrar panel correcto

const navAlumno   = $('#navAlumno');
const navMaestro  = $('#navMaestro');
const panelAlumno = $('#panelAlumno');
const panelMaestro= $('#panelMaestro');
const userRoleBadge   = $('#userRoleBadge');
const userEmailDisplay= $('#userEmailDisplay');
const alumnoNombre    = $('#alumnoNombre');
const maestroNombre   = $('#maestroNombre');
const userAvatar      = $('#userAvatar');

function iniciarSesion(session) {
  // Ocultar login, mostrar app
  loginScreen.style.animation = 'fadeOut .3s ease forwards';
  setTimeout(() => { loginScreen.style.display = 'none'; }, 300);

  mainApp.style.display = 'grid';
  mainApp.style.animation = 'fadeIn .5s ease';

  // Configurar interfaz según rol
  // futura DB: cargar datos específicos del usuario desde API
  const nombre = capitalize(session.nombre || session.email.split('@')[0]);

  if (session.role === 'alumno') {
    navAlumno.style.display = 'flex';
    navMaestro.style.display = 'none';
    panelAlumno.style.display = 'block';
    panelMaestro.style.display = 'none';
    userRoleBadge.textContent = 'Alumno';
    if (alumnoNombre) alumnoNombre.textContent = nombre;
  } else {
    navAlumno.style.display = 'none';
    navMaestro.style.display = 'flex';
    panelAlumno.style.display = 'none';
    panelMaestro.style.display = 'block';
    userRoleBadge.textContent = 'Maestro';
    if (maestroNombre) maestroNombre.textContent = nombre;
  }

  userEmailDisplay.textContent = session.email;
  userAvatar.querySelector('span').textContent = initials(session.email);

  // Iniciar funcionalidades del dashboard
  initDashboard();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function initials(email) {
  const parts = email.split('@')[0].split(/[._\-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0,2).toUpperCase();
}

// LOGOUT
// futura autenticación: POST /api/auth/logout + limpiar token

const logoutBtn = $('#logoutBtn');
logoutBtn.addEventListener('click', () => {
  currentSession = { loggedIn: false, role: null, email: null, nombre: null };

  // futura autenticación: revocar token JWT en backend
  // futura sesión: eliminar cookie de sesión

  mainApp.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginScreen.style.animation = 'fadeIn .4s ease';
  loginEmail.value = '';
  loginPass.value  = '';
  loginError.textContent = '';
  selectRole('alumno');
});

// DASHBOARD — FUNCIONALIDADES (se inicializan tras login)

function initDashboard() {

  // ---------- Métricas en vivo ----------
  // futura API: GET /api/sistema/metricas → WebSocket para actualizaciones en tiempo real
  const metricUsers = $('[data-metric="users"]');
  const metricCpu   = $('[data-metric="cpu"]');
  const cpuBar      = $('[data-bar="cpu"]');

  let state = {
    users: 128,
    cpu: 34,
    latency: 42,
    rps: 540,
    simulating: false,
  };

  function setCPU(value) {
    state.cpu = Math.max(2, Math.min(99, value));
    if (metricCpu) metricCpu.innerHTML = `${state.cpu}<small>%</small>`;
    if (cpuBar) cpuBar.style.width = state.cpu + '%';
  }

  function tick() {
    if (!state.simulating) {
      state.users   += rand(-3, 5);
      state.users    = Math.max(40, state.users);
      state.latency += rand(-3, 3);
      state.latency  = Math.max(18, Math.min(180, state.latency));
      state.rps     += rand(-20, 25);
      state.rps      = Math.max(120, state.rps);
      setCPU(state.cpu + rand(-2, 3));
    }
    if (metricUsers) metricUsers.textContent = state.users;
    // Latency y RPS pueden no estar presentes en panel maestro
    const metricLatency = $('[data-metric="latency"]');
    const metricRps     = $('[data-metric="rps"]');
    if (metricLatency) metricLatency.innerHTML = `${state.latency}<small>ms</small>`;
    if (metricRps)     metricRps.textContent   = state.rps;
  }

  const tickInterval = setInterval(tick, 1500);

  // ---------- Tráfico animado en arquitectura ----------
  // futura API: los pulsos pueden reflejar tráfico real del sistema
  const archNodes = $$('.node[data-node]');
  function pulseRandomNode() {
    const n = archNodes[rand(0, archNodes.length - 1)];
    if (!n) return;
    n.classList.add('busy');
    setTimeout(() => n.classList.remove('busy'), 800);
  }
  const pulseInterval = setInterval(pulseRandomNode, 1100);

  // ---------- Simulador 1000 estudiantes ----------
  // futura API: enviar carga simulada a /api/simulacion/start
  const simBtn    = $('#simBtn');
  const simStatus = $('#simStatus');

  const loadBars = {
    n1: $('[data-load="n1"]'),
    n2: $('[data-load="n2"]'),
    n3: $('[data-load="n3"]'),
  };
  const loadVals = {
    n1: $('[data-load-val="n1"]'),
    n2: $('[data-load-val="n2"]'),
    n3: $('[data-load-val="n3"]'),
  };

  function paintNode(key, load) {
    const archNode = $(`.node.${key}`);
    if (!archNode) return;
    archNode.classList.remove('warn', 'crit');
    if (load >= 85) archNode.classList.add('crit');
    else if (load >= 60) archNode.classList.add('warn');
  }

  function setLoad(key, load) {
    if (loadBars[key]) loadBars[key].style.width = load + '%';
    if (loadVals[key]) loadVals[key].textContent  = load + '%';
    paintNode(key, load);
  }

  if (simBtn) {
    simBtn.addEventListener('click', () => {
      if (state.simulating) return;
      state.simulating = true;
      simBtn.disabled  = true;
      if (simStatus) simStatus.textContent = '🚀 Distribuyendo 1000 estudiantes entre los nodos...';

      let injected  = 0;
      const total   = 1000;
      const step    = 50;

      const interval = setInterval(() => {
        injected += step;

        const base = Math.min(95, (injected / total) * 80);
        const l1 = Math.min(99, Math.round(base + rand(-6, 8)));
        const l2 = Math.min(99, Math.round(base + rand(-6, 8)));
        const l3 = Math.min(99, Math.round(base + rand(-6, 8)));
        setLoad('n1', l1);
        setLoad('n2', l2);
        setLoad('n3', l3);

        state.users   = 128 + Math.round((injected / total) * 980);
        state.rps     = 540 + Math.round((injected / total) * 4200);
        state.latency = 42  + Math.round((injected / total) * 35) + rand(-4, 4);
        setCPU(20 + Math.round((injected / total) * 70));
        tick();

        if (injected >= total) {
          clearInterval(interval);
          if (simStatus) simStatus.innerHTML = '✅ <strong>1000 estudiantes</strong> distribuidos. Sistema estable, sin SPOF.';
          setTimeout(() => {
            let cool = 100;
            const c = setInterval(() => {
              cool -= 5;
              if (cool <= 0) {
                clearInterval(c);
                setLoad('n1', 12); setLoad('n2', 14); setLoad('n3', 11);
                state.simulating = false;
                simBtn.disabled  = false;
                if (simStatus) simStatus.textContent = 'Sistema en reposo · esperando tráfico…';
              } else {
                const v = Math.max(10, cool);
                setLoad('n1', v + rand(-3, 3));
                setLoad('n2', v + rand(-3, 3));
                setLoad('n3', v + rand(-3, 3));
              }
            }, 220);
          }, 1500);
        }
      }, 220);
    });
  }

  // Init carga inicial
  setLoad('n1', 12); setLoad('n2', 14); setLoad('n3', 11);
  tick();

  // ---------- Nav activo según scroll ----------
  const navLinks = $$('.nav-item');
  const sections = navLinks
    .map(a => ({ a, el: document.querySelector(a.getAttribute('href')) }))
    .filter(x => x.el);

  window.addEventListener('scroll', () => {
    const y = window.scrollY + 140;
    let current = sections[0];
    for (const s of sections) {
      if (s.el.offsetTop <= y) current = s;
    }
    navLinks.forEach(n => n.classList.remove('active'));
    if (current) current.a.classList.add('active');
  }, { passive: true });

  // ---------- Botones "Guardar" calificaciones (maestro) ----------
  // futura API: PUT /api/calificaciones { alumno_id, examen_id, valor }
  $$('.btn-primary').forEach(btn => {
    if (btn.textContent.trim() === 'Guardar') {
      btn.addEventListener('click', function () {
        const row   = this.closest('.cal-row');
        const input = row ? row.querySelector('.grade-input') : null;
        if (!input) return;

        const val = parseFloat(input.value);
        if (isNaN(val) || val < 0 || val > 10) {
          input.style.borderColor = 'rgba(244,114,182,.6)';
          setTimeout(() => input.style.borderColor = '', 1500);
          return;
        }

        // futura DB: aquí se haría el PUT a la API
        btn.textContent = '✓ Guardado';
        btn.style.background = 'rgba(52,211,153,.15)';
        btn.style.color = 'var(--green)';
        btn.style.boxShadow = 'none';
        setTimeout(() => {
          btn.textContent = 'Guardar';
          btn.style = '';
        }, 2500);
      });
    }
  });

  // ---------- Upload area (drag & drop visual) ----------
  // futura API: DROP → FormData → POST /api/materiales
  const uploadArea = $('#uploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.style.borderColor = 'rgba(196,181,253,.7)';
      uploadArea.style.background  = 'rgba(196,181,253,.06)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
      uploadArea.style.background  = '';
    });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background  = '';
      const files = e.dataTransfer.files;
      if (files.length) {
        const name = files[0].name;
        uploadArea.querySelector('strong').textContent = `Archivo listo: ${name}`;
        // futura API: enviar FormData al backend para almacenamiento
      }
    });
  }

  // ---------- Botones publicar (maestro) ----------
  // futura API: POST /api/tareas | /api/examenes con los datos del form
  $$('.form-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', function () {
      const txt = this.textContent.trim();
      const orig = this.textContent;
      this.textContent = '✓ Publicado';
      this.style.background = 'rgba(52,211,153,.2)';
      this.style.color = 'var(--green)';
      this.style.boxShadow = 'none';
      setTimeout(() => {
        this.textContent = orig;
        this.style = '';
      }, 2500);
    });
  });

} // fin initDashboard

// CSS PARA FADE OUT (login)
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity:1; transform:none; }
    to   { opacity:0; transform:translateY(-16px); }
  }
`;
document.head.appendChild(style);