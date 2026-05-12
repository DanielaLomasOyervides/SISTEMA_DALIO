// initDB.js
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('database.db');

// Eliminar tablas existentes
db.exec(`DROP TABLE IF EXISTS alumno_materias`);
db.exec(`DROP TABLE IF EXISTS materias`);
db.exec(`DROP TABLE IF EXISTS usuarios`);

// Crear tabla de usuarios
db.exec(`
  CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correo TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('alumno', 'maestro')),
    nombre_completo TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Crear tabla de materias
db.exec(`
  CREATE TABLE materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    maestro_id INTEGER NOT NULL,
    nivel TEXT,
    horario TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maestro_id) REFERENCES usuarios(id)
  );
`);

// Crear tabla de relación alumno-materias
db.exec(`
  CREATE TABLE alumno_materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES usuarios(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    UNIQUE(alumno_id, materia_id)
  );
`);

// Insertar usuarios
const usuarios = [
  { correo: 'carlos.lara@dalio.mx', password: '123456', rol: 'alumno', nombre: 'Carlos Lara' },
  { correo: 'laura.villa@dalio.mx', password: '123456', rol: 'maestro', nombre: 'Laura Villa' },
  { correo: 'juan.perez@dalio.mx', password: '123456', rol: 'alumno', nombre: 'Juan Pérez' },
  { correo: 'ana.garcia@dalio.mx', password: '123456', rol: 'maestro', nombre: 'Ana García' }
];

const insertUser = db.prepare('INSERT INTO usuarios (correo, password_hash, rol, nombre_completo) VALUES (?, ?, ?, ?)');

for (const user of usuarios) {
  const hash = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.correo, hash, user.rol, user.nombre);
  console.log(`✅ Usuario: ${user.correo} (${user.rol})`);
}

// Insertar materias (asignadas a maestros)
const materias = [
  { nombre: 'Inglés Intermedio B1', descripcion: 'Curso de inglés nivel intermedio', maestro_email: 'laura.villa@dalio.mx', nivel: 'B1', horario: 'Lun/Mie 3-5pm' },
  { nombre: 'Francés Básico A1', descripcion: 'Curso de francés para principiantes', maestro_email: 'laura.villa@dalio.mx', nivel: 'A1', horario: 'Mar/Jue 4-6pm' },
  { nombre: 'Conversación Avanzada', descripcion: 'Práctica de conversación en inglés', maestro_email: 'ana.garcia@dalio.mx', nivel: 'C1', horario: 'Vie 3-5pm' }
];

const insertMateria = db.prepare('INSERT INTO materias (nombre, descripcion, maestro_id, nivel, horario) VALUES (?, ?, ?, ?, ?)');

for (const materia of materias) {
  const maestro = db.prepare('SELECT id FROM usuarios WHERE correo = ? AND rol = ?').get(materia.maestro_email, 'maestro');
  if (maestro) {
    insertMateria.run(materia.nombre, materia.descripcion, maestro.id, materia.nivel, materia.horario);
    console.log(`✅ Materia: ${materia.nombre} (Maestro: ${materia.maestro_email})`);
  } else {
    console.log(`❌ Maestro no encontrado: ${materia.maestro_email}`);
  }
}

// Asignar alumnos a materias
const asignaciones = [
  { alumno_email: 'carlos.lara@dalio.mx', materia_nombre: 'Inglés Intermedio B1' },
  { alumno_email: 'carlos.lara@dalio.mx', materia_nombre: 'Francés Básico A1' },
  { alumno_email: 'juan.perez@dalio.mx', materia_nombre: 'Inglés Intermedio B1' }
];

const insertAsignacion = db.prepare('INSERT INTO alumno_materias (alumno_id, materia_id) VALUES (?, ?)');

for (const asig of asignaciones) {
  const alumno = db.prepare('SELECT id FROM usuarios WHERE correo = ? AND rol = ?').get(asig.alumno_email, 'alumno');
  const materia = db.prepare('SELECT id FROM materias WHERE nombre = ?').get(asig.materia_nombre);
  if (alumno && materia) {
    try {
      insertAsignacion.run(alumno.id, materia.id);
      console.log(`✅ Asignado: ${asig.alumno_email} → ${asig.materia_nombre}`);
    } catch (e) {
      console.log(`⚠️ Ya existe: ${asig.alumno_email} → ${asig.materia_nombre}`);
    }
  } else {
    console.log(`❌ No se pudo asignar: ${asig.alumno_email} → ${asig.materia_nombre}`);
  }
}

console.log('\n📦 Base de datos inicializada correctamente');
db.close();