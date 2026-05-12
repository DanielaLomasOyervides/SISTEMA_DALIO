// server.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a BD
const db = new Database('database.db');

// ENDPOINT DE LOGIN (VALIDANDO ROL)
app.post('/api/login', (req, res) => {
  const { correo, password, rolSeleccionado } = req.body;
  
  console.log(`Intento de login: ${correo}, rol seleccionado: ${rolSeleccionado}`);

  // 1. Validar que llegaron todos los datos
  if (!correo || !password || !rolSeleccionado) {
    return res.status(400).json({ 
      error: 'Faltan datos: correo, contraseña o rol' 
    });
  }

  // 2. Validar que rolSeleccionado sea válido
  if (!['alumno', 'maestro'].includes(rolSeleccionado)) {
    return res.status(400).json({ 
      error: 'Rol inválido. Debe ser "alumno" o "maestro"' 
    });
  }

  // 3. Buscar usuario por correo
  const user = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);

  // 4. Si no existe el correo
  if (!user) {
    return res.status(401).json({ 
      error: '❌ Correo no registrado en el sistema' 
    });
  }

  // 5. Verificar contraseña
  const passwordValida = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValida) {
    return res.status(401).json({ 
      error: '❌ Contraseña incorrecta' 
    });
  }

  // 6. ⭐ VALIDACIÓN CRÍTICA: El rol seleccionado debe coincidir con el rol del usuario
  if (user.rol !== rolSeleccionado) {
    return res.status(403).json({ 
      error: `⚠️ Este correo pertenece a un ${user.rol}, no a un ${rolSeleccionado}. 
               Por favor selecciona "${user.rol}" en "Ingresar como"` 
    });
  }

  // 7. Éxito - todo correcto
  res.json({ 
    success: true,
    mensaje: `✅ Bienvenido ${user.nombre_completo || user.correo}`,
    usuario: { 
      id: user.id, 
      correo: user.correo, 
      rol: user.rol,
      nombre: user.nombre_completo
    }
  });
});

// ENDPOINT OPCIONAL: Obtener todos los usuarios (para depuración)
app.get('/api/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT id, correo, rol, nombre_completo FROM usuarios').all();
  res.json(usuarios);
});

// ============ ENDPOINTS PARA GESTIÓN DE MATERIAS ============

// Obtener materias de un maestro
app.get('/api/maestro/:id/materias', (req, res) => {
  const maestroId = req.params.id;
  console.log(`Buscando materias del maestro: ${maestroId}`);
  
  const materias = db.prepare(`
    SELECT m.*, 
      (SELECT COUNT(*) FROM alumno_materias WHERE materia_id = m.id) as total_alumnos
    FROM materias m 
    WHERE m.maestro_id = ?
  `).all(maestroId);
  
  console.log(`Materias encontradas: ${materias.length}`);
  res.json(materias);
});

// Obtener todos los alumnos
app.get('/api/alumnos', (req, res) => {
const alumnos = db.prepare('SELECT id, correo, nombre_completo FROM usuarios WHERE rol = ?').all('alumno');
  console.log(`Alumnos encontrados: ${alumnos.length}`);
  res.json(alumnos);
});

// Obtener alumnos de una materia específica
app.get('/api/materia/:id/alumnos', (req, res) => {
  const materiaId = req.params.id;
  console.log(`Buscando alumnos de materia: ${materiaId}`);
  
  const alumnos = db.prepare(`
    SELECT u.id, u.correo, u.nombre_completo, am.fecha_inscripcion
    FROM usuarios u
    JOIN alumno_materias am ON u.id = am.alumno_id
    WHERE am.materia_id = ?
  `).all(materiaId);
  
  console.log(`Alumnos encontrados: ${alumnos.length}`);
  res.json(alumnos);
});

// Asignar alumno a materia
app.post('/api/materia/asignar', (req, res) => {
  const { alumno_id, materia_id } = req.body;
  console.log(`Asignando alumno ${alumno_id} a materia ${materia_id}`);
  
  try {
    db.prepare('INSERT INTO alumno_materias (alumno_id, materia_id) VALUES (?, ?)').run(alumno_id, materia_id);
    res.json({ success: true, message: 'Alumno asignado correctamente' });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    res.status(400).json({ error: 'El alumno ya está asignado a esta materia' });
  }
});

// Remover alumno de materia
app.delete('/api/materia/remover', (req, res) => {
  const { alumno_id, materia_id } = req.body;
  console.log(`Removiendo alumno ${alumno_id} de materia ${materia_id}`);
  
  const result = db.prepare('DELETE FROM alumno_materias WHERE alumno_id = ? AND materia_id = ?').run(alumno_id, materia_id);
  if (result.changes > 0) {
    res.json({ success: true, message: 'Alumno removido correctamente' });
  } else {
    res.status(404).json({ error: 'Asignación no encontrada' });
  }
});

// Obtener materias de un alumno
app.get('/api/alumno/:id/materias', (req, res) => {
  const alumnoId = req.params.id;
  console.log(`Buscando materias del alumno: ${alumnoId}`);
  
  const materias = db.prepare(`
    SELECT m.* 
    FROM materias m
    JOIN alumno_materias am ON m.id = am.materia_id
    WHERE am.alumno_id = ?
  `).all(alumnoId);
  
  console.log(`Materias encontradas: ${materias.length}`);
  res.json(materias);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Endpoints disponibles:`);
  console.log(`   POST http://localhost:${port}/api/login`);
  console.log(`   GET  http://localhost:${port}/api/usuarios`);
});

