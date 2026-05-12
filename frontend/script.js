// ---------- Utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ================================================================
// SISTEMA DE SESIÓN (conectado a base de datos real)
// API: POST /api/login
// ================================================================

const API_URL = 'http://localhost:3000/api';

/**
 * Estado de sesión actual.
 */
let currentSession = {
  loggedIn: false,
  role: null,       // 'alumno' | 'maestro'
  email: null,
  nombre: null,
  id: null,
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
 * LLAMADA REAL A LA API DE LOGIN
 */
async function callRealApiLogin(email, password, role) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: email,
      password: password,
      rolSeleccionado: role
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw { message: data.error };
  }
  
  return {
    success: true,
    user: {
      id: data.usuario.id,
      email: data.usuario.correo,
      role: data.usuario.rol,
      nombre: data.usuario.nombre || data.usuario.correo.split('@')[0]
    }
  };
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
    const response = await callRealApiLogin(email, password, selectedRole);

    if (response.success) {
      currentSession = {
        loggedIn: true,
        role: response.user.role,
        email: response.user.email,
        nombre: response.user.nombre,
        id: response.user.id,
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

// Verificar sesión existente al cargar la página
function checkExistingSession() {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    try {
      const usuario = JSON.parse(usuarioGuardado);
      currentSession = {
        loggedIn: true,
        role: usuario.rol,
        email: usuario.correo,
        nombre: usuario.nombre || usuario.correo.split('@')[0],
        id: usuario.id,
      };
      iniciarSesion(currentSession);
    } catch (e) {
      console.error('Error al parsear usuario guardado');
      localStorage.removeItem('usuario');
    }
  }
}

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
  // Guardar en localStorage con ID incluido
  localStorage.setItem('usuario', JSON.stringify({
    id: session.id,
    correo: session.email,
    rol: session.role,
    nombre: session.nombre
  }));

  // Verificar si ya se ha recargado esta sesión
  if (!sessionStorage.getItem('reloaded')) {
    sessionStorage.setItem('reloaded', 'true');
    
    // Recargar la página automáticamente solo una vez
    setTimeout(() => {
      window.location.reload();
    }, 500);
    return;
  }

  // Limpiar la bandera para futuros logins
  sessionStorage.removeItem('reloaded');

  // Ocultar login, mostrar app
  loginScreen.style.animation = 'fadeOut .3s ease forwards';
  setTimeout(() => { loginScreen.style.display = 'none'; }, 300);

  mainApp.style.display = 'grid';
  mainApp.style.animation = 'fadeIn .5s ease';

  // Configurar interfaz según rol
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
  if (userAvatar && userAvatar.querySelector('span')) {
    userAvatar.querySelector('span').textContent = initials(session.email);
  }

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
const logoutBtn = $('#logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    currentSession = { loggedIn: false, role: null, email: null, nombre: null, id: null };
    localStorage.removeItem('usuario');

    mainApp.style.display = 'none';
    loginScreen.style.display = 'flex';
    loginScreen.style.animation = 'fadeIn .4s ease';
    loginEmail.value = '';
    loginPass.value  = '';
    loginError.textContent = '';
    selectRole('alumno');
  });
}

// ================================================================
// DASHBOARD — FUNCIONALIDADES (se inicializan tras login)
// ================================================================

function initDashboard() {

  // ============ OBTENER USUARIO ============
  const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
  console.log('=== initDashboard ejecutándose ===');
  console.log('Usuario actual:', usuarioActual);

  // ============ GESTIÓN DE ALUMNOS POR MATERIA ============
  async function cargarMateriasMaestro() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    console.log('cargarMateriasMaestro - usuario:', usuario);
    if (!usuario || usuario.rol !== 'maestro') return;
    
    try {
      const response = await fetch(`${API_URL}/maestro/${usuario.id}/materias`);
      const materias = await response.json();
      console.log('Materias recibidas:', materias);
      
      const materiaSelect = document.getElementById('materiaSelect');
      console.log('Elemento materiaSelect encontrado?', materiaSelect);
      
      if (materiaSelect) {
        materiaSelect.innerHTML = '<option value="">-- Selecciona una materia --</option>';
        materias.forEach(materia => {
          materiaSelect.innerHTML += `<option value="${materia.id}">${materia.nombre} (${materia.total_alumnos || 0} alumnos)</option>`;
        });
        console.log('✅ Selector actualizado con', materias.length, 'materias');
      } else {
        console.log('❌ No se encontró el select con id "materiaSelect"');
      }
    } catch (error) {
      console.error('Error cargando materias:', error);
    }
  }

  async function cargarAlumnosDisponibles() {
    try {
      const response = await fetch(`${API_URL}/alumnos`);
      const alumnos = await response.json();
      console.log('Alumnos disponibles:', alumnos);
      
      const nuevoAlumnoSelect = document.getElementById('nuevoAlumnoSelect');
      if (nuevoAlumnoSelect) {
        nuevoAlumnoSelect.innerHTML = '<option value="">-- Selecciona un alumno --</option>';
        alumnos.forEach(alumno => {
          nuevoAlumnoSelect.innerHTML += `<option value="${alumno.id}">${alumno.nombre_completo || alumno.correo} (${alumno.correo})</option>`;
        });
      }
    } catch (error) {
      console.error('Error cargando alumnos:', error);
    }
  }

  async function cargarAlumnosDeMateria(materiaId) {
    if (!materiaId) {
      const alumnosList = document.getElementById('alumnosList');
      if (alumnosList) {
        alumnosList.innerHTML = '<div class="cal-row"><span colspan="4" style="text-align:center;">Selecciona una materia para ver los alumnos</span></div>';
      }
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/materia/${materiaId}/alumnos`);
      const alumnos = await response.json();
      console.log('Alumnos en materia:', alumnos);
      
      const alumnosList = document.getElementById('alumnosList');
      if (alumnos.length === 0) {
        alumnosList.innerHTML = '<div class="cal-row"><span colspan="4" style="text-align:center;">No hay alumnos asignados a esta materia</span></div>';
        return;
      }
      
      alumnosList.innerHTML = alumnos.map(alumno => `
        <div class="cal-row" data-alumno-id="${alumno.id}">
          <span>👤 ${alumno.nombre_completo || alumno.correo.split('@')[0]}</span>
          <span>${alumno.correo}</span>
          <span>${alumno.fecha_inscripcion ? new Date(alumno.fecha_inscripcion).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          <span><button class="btn-remover-alumno" data-alumno-id="${alumno.id}" data-materia-id="${materiaId}" style="background:#ff4444; color:white; border:none; padding:4px 12px; border-radius:6px; cursor:pointer;">❌ Remover</button></span>
        </div>
      `).join('');
      
      document.querySelectorAll('.btn-remover-alumno').forEach(btn => {
        btn.addEventListener('click', async () => {
          const alumnoId = btn.dataset.alumnoId;
          const materiaIdActual = btn.dataset.materiaId;
          await removerAlumnoDeMateria(alumnoId, materiaIdActual);
        });
      });
    } catch (error) {
      console.error('Error cargando alumnos de materia:', error);
    }
  }

  async function asignarAlumnoAMateria(alumnoId, materiaId) {
    try {
      const response = await fetch(`${API_URL}/materia/asignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: parseInt(alumnoId), materia_id: parseInt(materiaId) })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert('✅ Alumno asignado correctamente');
        cargarAlumnosDeMateria(materiaId);
        cargarMateriasMaestro();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Error asignando alumno:', error);
      alert('Error al asignar alumno');
    }
  }

  async function removerAlumnoDeMateria(alumnoId, materiaId) {
    if (!confirm('¿Seguro que deseas remover este alumno de la materia?')) return;
    
    try {
      const response = await fetch(`${API_URL}/materia/remover`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: parseInt(alumnoId), materia_id: parseInt(materiaId) })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert('✅ Alumno removido correctamente');
        cargarAlumnosDeMateria(materiaId);
        cargarMateriasMaestro();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Error removiendo alumno:', error);
      alert('Error al remover alumno');
    }
  }

  async function cargarMateriasAlumno() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'alumno') return;
    
    try {
      const response = await fetch(`${API_URL}/alumno/${usuario.id}/materias`);
      const materias = await response.json();
      console.log('Materias del alumno:', materias);
      
      const materiasGrid = document.querySelector('.materias-grid');
      if (materiasGrid && materias.length > 0) {
        materiasGrid.innerHTML = materias.map(materia => `
          <div class="materia-card glass purple-glow">
            <div class="materia-icon">${materia.nombre.includes('Inglés') ? '🇬🇧' : materia.nombre.includes('Francés') ? '🇫🇷' : '🔤'}</div>
            <div class="materia-info">
              <strong>${materia.nombre}</strong>
              <small>${materia.nivel || 'Nivel'} · ${materia.horario || 'Horario por definir'}</small>
            </div>
            <div class="materia-meta">
              <div class="bar" style="margin-top:8px;"><span style="width:${Math.floor(Math.random() * 50) + 30}%"></span></div>
              <small style="color:var(--muted);font-size:11px;">En progreso</small>
            </div>
            <span class="materia-badge">En curso</span>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error cargando materias del alumno:', error);
    }
  }

  // ============ INICIALIZAR SEGÚN ROL ============
  if (usuarioActual && usuarioActual.rol === 'maestro') {
    console.log('🎓 Inicializando panel de MAESTRO');
    cargarMateriasMaestro();
    cargarAlumnosDisponibles();
    
    const materiaSelect = document.getElementById('materiaSelect');
    if (materiaSelect) {
      materiaSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          cargarAlumnosDeMateria(e.target.value);
        }
      });
    }
    
    const asignarBtn = document.getElementById('asignarAlumnoBtn');
    if (asignarBtn) {
      asignarBtn.addEventListener('click', () => {
        const materiaId = document.getElementById('materiaSelect').value;
        const alumnoId = document.getElementById('nuevoAlumnoSelect').value;
        if (!materiaId || !alumnoId) {
          alert('Selecciona una materia y un alumno');
          return;
        }
        asignarAlumnoAMateria(alumnoId, materiaId);
      });
    }
  } else if (usuarioActual && usuarioActual.rol === 'alumno') {
    console.log('🎓 Inicializando panel de ALUMNO');
    cargarMateriasAlumno();
  } else {
    console.log('❌ No hay usuario o rol no reconocido');
  }

  // ============ MÉTRICAS EN VIVO ==========
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
    const metricLatency = $('[data-metric="latency"]');
    const metricRps     = $('[data-metric="rps"]');
    if (metricLatency) metricLatency.innerHTML = `${state.latency}<small>ms</small>`;
    if (metricRps)     metricRps.textContent   = state.rps;
  }

  const tickInterval = setInterval(tick, 1500);

  // ============ TRÁFICO ANIMADO ==========
  const archNodes = $$('.node[data-node]');
  function pulseRandomNode() {
    const n = archNodes[rand(0, archNodes.length - 1)];
    if (!n) return;
    n.classList.add('busy');
    setTimeout(() => n.classList.remove('busy'), 800);
  }
  const pulseInterval = setInterval(pulseRandomNode, 1100);

  // ============ SIMULADOR ==========
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

  // ============ NAV ACTIVO ==========
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

  // ============ BOTONES GUARDAR CALIFICACIONES ==========
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

  // ============ UPLOAD AREA ==========
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
      }
    });
  }

  // ============ BOTONES PUBLICAR ==========
  $$('.form-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', function () {
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

} // Cierra la función initDashboard

// Inicializar verificación de sesión al cargar la página
checkExistingSession();

// CSS PARA FADE OUT (login)
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity:1; transform:none; }
    to   { opacity:0; transform:translateY(-16px); }
  }
`;
document.head.appendChild(style);