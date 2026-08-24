// ============================================================
// 1. VALIDACIÓN DE SESIÓN
// ============================================================
if (typeof getSession !== 'function') {
  window.location.href = 'index.html';
}

const session = getSession();
if (!session || !session.loggedIn) {
  window.location.href = 'index.html';
}

// Mostrar la página principal
document.getElementById('gandhiPage').style.display = 'flex';

// El usuario admin solo ve el panel "Cambiar datos".
const isAdmin = (session.username || '').toLowerCase() === 'admin';

// ============================================================
// 2. FUNCIÓN PARA CONVERTIR URL DE GOOGLE DRIVE A DIRECTO
// ============================================================
function getDriveDirectUrl(url) {
  if (!url) return null;
  if (url.includes('lh3.googleusercontent.com')) return url;
  let match = url.match(/[?&]id=([^&]+)/);
  if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  match = url.match(/\/file\/d\/([^\/]+)/);
  if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url;
}

// ============================================================
// 3. REFERENCIAS A ELEMENTOS DEL DOM
// ============================================================
const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarRole = document.getElementById('sidebarRole');
const topName = document.getElementById('topName');
const topRole = document.getElementById('topRole');
const topAvatar = document.getElementById('topAvatar');
const inicioName = document.getElementById('inicioName');
const inicioPhoto = document.getElementById('inicioPhoto');
const inicioSemestre = document.getElementById('inicioSemestre');
const inicioPeriodo = document.getElementById('inicioPeriodo');
const inicioLogo = document.getElementById('inicioLogo');
const sidebarLogo = document.getElementById('sidebarLogo');
const qrcodeContainer = document.getElementById('qrcode');

// ============================================================
// 4. ASIGNAR DATOS DEL USUARIO (nombre, rol, foto)
// ============================================================
const name = session.name || 'Usuario';
const role = session.role || '—';
const photo = getDriveDirectUrl(session.photo) || '';

sidebarName.textContent = name;
sidebarRole.textContent = role;
sidebarAvatar.src = photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e2e8f0"/%3E%3Ccircle cx="50" cy="35" r="18" fill="%2394a3b8"/%3E%3Ccircle cx="50" cy="78" r="24" fill="%2394a3b8"/%3E%3C/svg%3E';

topName.textContent = name;
topRole.textContent = role;
topAvatar.src = photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e2e8f0"/%3E%3Ccircle cx="50" cy="35" r="18" fill="%2394a3b8"/%3E%3Ccircle cx="50" cy="78" r="24" fill="%2394a3b8"/%3E%3C/svg%3E';

inicioName.textContent = name;
inicioPhoto.src = photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e2e8f0"/%3E%3Ccircle cx="50" cy="35" r="18" fill="%2394a3b8"/%3E%3Ccircle cx="50" cy="78" r="24" fill="%2394a3b8"/%3E%3C/svg%3E';

// ============================================================
// 5. DATOS DE LA HOJA DE CÁLCULO
// ============================================================
const data = session.rawData || {};

// 5.1 Logo institucional
if (data.Logo) {
  const logoUrl = getDriveDirectUrl(data.Logo);
  if (logoUrl) {
    inicioLogo.src = logoUrl;
    sidebarLogo.src = logoUrl;
  } else {
    inicioLogo.style.display = 'none';
    sidebarLogo.style.display = 'none';
  }
} else {
  inicioLogo.style.display = 'none';
  sidebarLogo.style.display = 'none';
}

// 5.2 Semestre
inicioSemestre.textContent = data.Semestre || 'No definido';

// 5.3 Periodo (NUEVO)
inicioPeriodo.textContent = data.Periodo || 'No definido';

// ============================================================
// 6. CÓDIGO QR (usando el CURP guardado en sesión)
// ============================================================
let qrText = session.curp || 'Sin CURP';

if (typeof QRCode !== 'undefined') {
  new QRCode(qrcodeContainer, {
    text: qrText,
    width: 180,
    height: 180,
    colorDark: '#1a3a5c',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
} else {
  qrcodeContainer.textContent = 'Librería QR no cargada.';
}

// ============================================================
// 6b. VISIBILIDAD DE ELEMENTOS (casillas del rango "Elementos")
// El elemento "QR" controla si se muestra el QR del Menú Inicio.
// ============================================================
const qrCard = document.getElementById('qrCard');
let elementosVisibles = null;

async function cargarVisibilidadElementos() {
  try {
    const res = await fetch(buildApiUrl('tipo=elementos'));
    if (!res.ok) return;
    const data = await res.json();
    elementosVisibles = (data.Elementos && data.Elementos.visibles) ? data.Elementos.visibles : {};
    const qrActivo = elementosVisibles['QR'];
    if (qrCard && qrActivo === false) qrCard.style.display = 'none';
  } catch (err) {
    console.error('Error cargando visibilidad de elementos:', err);
  }
}

cargarVisibilidadElementos();

// ============================================================
// 7. MENÚ LATERAL Y NAVEGACIÓN
// ============================================================
const navLinks = document.querySelectorAll('.sidebar-nav a');
const panels = {
  inicio: document.getElementById('panel-inicio'),
  asistencias: document.getElementById('panel-asistencias'),
  actitudinal: document.getElementById('panel-actitudinal'),
  academico: document.getElementById('panel-academico'),
  resultados: document.getElementById('panel-resultados'),
  configuracion: document.getElementById('panel-configuracion')
};
const panelTitle = document.getElementById('panelTitle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

const titles = {
  inicio: 'Inicio',
  asistencias: 'Asistencias',
  actitudinal: 'Actitudinal',
  academico: 'Académico',
  resultados: 'Resultados',
  configuracion: 'Cambiar datos'
};

function activatePanel(panelId) {
  Object.values(panels).forEach(p => p.classList.remove('active'));
  if (panels[panelId]) panels[panelId].classList.add('active');
  panelTitle.textContent = titles[panelId] || panelId;
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.panel === panelId);
  });
  sidebar.classList.remove('open');
  overlay.classList.remove('show');

  if (panelId === 'asistencias') loadAsistencias();
  if (panelId === 'actitudinal') loadActitudinal();
  if (panelId === 'academico') loadAcademico();
  if (panelId === 'resultados') loadResultados();
  if (panelId === 'configuracion') activarPanelConfiguracion();
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const panel = link.dataset.panel;
    if (panel) activatePanel(panel);
  });
});

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
});

// ============================================================
// 8. MENÚ DE ASISTENCIAS
// ============================================================
const asistenciaLoading = document.getElementById('asistenciaLoading');
const asistenciaError = document.getElementById('asistenciaError');
const asistenciaErrorMsg = document.getElementById('asistenciaErrorMsg');
const asistenciaEmpty = document.getElementById('asistenciaEmpty');
const asistenciaEmptyText = document.getElementById('asistenciaEmptyText');
const asistenciaList = document.getElementById('asistenciaList');
const asistenciaSubtitle = document.getElementById('asistenciaSubtitle');
const asistenciaStats = document.getElementById('asistenciaStats');

const asistenciaSeccionInstituto = document.getElementById('asistenciaSeccionInstituto');
const asistenciaSeccionClases = document.getElementById('asistenciaSeccionClases');
const asistenciaTabs = document.querySelectorAll('.asistencia-tab');

const clasesChips = document.getElementById('asistenciaClasesChips');
const clasesLoading = document.getElementById('asistenciaClasesLoading');
const clasesError = document.getElementById('asistenciaClasesError');
const clasesErrorMsg = document.getElementById('asistenciaClasesErrorMsg');
const clasesEmpty = document.getElementById('asistenciaClasesEmpty');
const clasesEmptyText = document.getElementById('asistenciaClasesEmptyText');
const clasesDetail = document.getElementById('asistenciaClasesDetail');

function activarAsistenciaSeccion(seccion) {
  asistenciaTabs.forEach(tab => {
    const activa = tab.dataset.seccion === seccion;
    tab.classList.toggle('active', activa);
  });
  const mostrarInstituto = seccion === 'instituto';
  asistenciaSeccionInstituto.style.display = mostrarInstituto ? '' : 'none';
  asistenciaSeccionClases.style.display = mostrarInstituto ? 'none' : '';

  if (seccion === 'clases') loadAsistenciasClases();
}

asistenciaTabs.forEach(tab => {
  tab.addEventListener('click', () => activarAsistenciaSeccion(tab.dataset.seccion));
});

let asistenciasCargadas = false;
let asistenciasFetching = false;

async function loadAsistencias() {
  if (asistenciasCargadas || asistenciasFetching) return;
  asistenciasFetching = true;
  asistenciaLoading.style.display = 'flex';
  asistenciaError.style.display = 'none';
  asistenciaEmpty.style.display = 'none';
  asistenciaList.innerHTML = '';
  asistenciaStats.style.display = 'none';

  try {
    const res = await fetch(buildApiUrl('tipo=asistencias'));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('El servidor respondió HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 400) : ''));
    }
    const data = await res.json();
    const registros = data.Registros || [];
    renderAsistencias(registros, data.prueba);
    asistenciasCargadas = true;
  } catch (err) {
    console.error('Error cargando asistencias:', err);
    asistenciaLoading.style.display = 'none';
    asistenciaError.style.display = 'block';
    asistenciaErrorMsg.textContent = (err && err.message && err.message.indexOf('HTTP') !== -1)
      ? err.message
      : 'Error al conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  } finally {
    asistenciasFetching = false;
  }
}

const MESES_ABREV = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES_FULL = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function parseRegistro(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : new Date(value.getTime());
  if (typeof value !== 'string') return null;

  const s = value.trim();
  if (!s) return null;

  // ISO con 'T' o 'Z' -> new Date ya lo entiende
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Fechas en texto tipo "d/m/yyyy hh:mm[:ss]" (apoya día primero o mes primero)
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i);
  if (m) {
    let dia = parseInt(m[1], 10);
    let mes = parseInt(m[2], 10);
    let anio = parseInt(m[3], 10);
    if (anio < 100) anio += 2000;
    let hr = parseInt(m[4], 10);
    let mi = parseInt(m[5], 10);
    let se = parseInt(m[6] || 0, 10);
    const ap = (m[7] || '').toLowerCase();
    if (ap.indexOf('p') === 0 && hr < 12) hr += 12;
    if (ap.indexOf('a') === 0 && hr === 12) hr = 0;
    if (mes > 12) { const t = dia; dia = mes; mes = t; }
    d = new Date(anio, mes - 1, dia, hr, mi, se);
    if (!isNaN(d.getTime())) return d;
  }

  // Fecha sola "d/m/yyyy" (sin hora)
  const m2 = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m2) {
    let dia = parseInt(m2[1], 10);
    let mes = parseInt(m2[2], 10);
    let anio = parseInt(m2[3], 10);
    if (anio < 100) anio += 2000;
    if (mes > 12) { const t = dia; dia = mes; mes = t; }
    d = new Date(anio, mes - 1, dia, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function formatHora(d) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function renderAsistencias(registros, prueba) {
  asistenciaLoading.style.display = 'none';

  const curp = (session && session.curp) ? session.curp.trim().toUpperCase() : '';

  // Normalizar (validar fecha y mayúsculas)
  const validos = [];
  registros.forEach(r => {
    const d = parseRegistro(r.ts);
    if (!d) return;
    validos.push({
      d,
      fecha: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      hora: d,
      tipo: (r.tipo || '').toLowerCase(),
      observaciones: (r.observaciones || '').trim(),
      curp: (r.curp || '').trim().toUpperCase(),
      nombre: (r.nombre || '').trim(),
      puntualidad: (r.puntualidad || '').trim(),
      grupo: (r.grupo || '').trim()
    });
  });

  if (validos.length === 0) {
    console.log('Registros recibidos (primeros):', registros.slice(0, 5));
    console.log('Filas crudas (prueba):', prueba);
    const info = JSON.stringify({ registros: registros.slice(0, 3), prueba: (prueba || []).slice(0, 2) }).slice(0, 700);
    showAsistenciaEmpty('No pudimos procesar los registros. Datos que recibimos: ' + (info || 'ninguno') + ' ¡Coméntanos este texto!');
    return;
  }

  // Grupos del alumno (derivados de sus propios registros)
  const misGrupos = new Set();
  validos.forEach(r => { if (r.curp === curp && r.grupo) misGrupos.add(r.grupo); });
  // Grupo conocido desde la hoja "Alumnos" (sirve aunque el alumno no tenga registros)
  if (session && session.grupo && session.grupo.trim()) misGrupos.add(session.grupo.trim());

  // Días que "tuvo clase el grupo": cualquier registro de los grupos del alumno
  const fechasClase = new Map(); // fecha -> array de registros
  validos.forEach(r => {
    if (r.curp === curp) misGrupos.add(r.grupo); // por si un registro propio sin grupo
  });
  validos.forEach(r => {
    if (misGrupos.size === 0) {
      // sin grupo identificado: propios registros
      if (r.curp === curp) {
        if (!fechasClase.has(r.fecha)) fechasClase.set(r.fecha, []);
        fechasClase.get(r.fecha).push(r);
      }
      return;
    }
    if (misGrupos.has(r.grupo)) {
      if (!fechasClase.has(r.fecha)) fechasClase.set(r.fecha, []);
      fechasClase.get(r.fecha).push(r);
    }
  });

  const fechas = Array.from(fechasClase.keys()).sort();
  if (fechas.length === 0) {
    showAsistenciaEmpty('No encontramos días de clase para tu grupo.');
    return;
  }

  asistenciaSubtitle.textContent = `Grupo: ${Array.from(misGrupos).join(' · ') || 'Todos'}`;

  // Stats
  let totalDias = fechas.length;
  let asistenciasP = 0;
  let retardos = 0;
  fechas.forEach(f => {
    const mis = fechasClase.get(f).filter(r => r.curp === curp);
    if (mis.length > 0) {
      mis.forEach(r => {
        const esEntrada = (r.tipo || '').includes('entrada') || (r.tipo || '').includes('ent');
        if (!esEntrada) return; // las salidas no se clasifican como a tiempo/retardo
        const p = r.puntualidad.toLowerCase();
        if (p.includes('ret') || p.includes('tarde')) retardos++;
        else asistenciasP++;
      });
    }
  });
  renderStats(totalDias, asistenciasP, retardos);
  // --- placeholder de stats ---

  // Render lista
  fechas.forEach((fecha, idx) => {
    const grupoRegistros = fechasClase.get(fecha).slice().sort((a,b) => a.hora - b.hora);
    const mis = grupoRegistros.filter(r => r.curp === curp);
    const card = document.createElement('div');
    card.className = 'asistencia-date-card';

    const first = parseRegistro(grupoRegistros[0].d) || new Date();
    const badgeMonth = MESES_ABREV[first.getMonth()];

    const head = document.createElement('div');
    head.className = 'asistencia-date-head';
    head.innerHTML = `
      <div class="date-badge"><span class="day">${first.getDate()}</span><span class="month">${badgeMonth}</span></div>
      <div class="date-info">
        <div class="date-full">${DIAS_SEMANA[first.getDay()]} ${first.getDate()} de ${MESES_FULL[first.getMonth()]} de ${first.getFullYear()}</div>
        <div class="date-sub">Grupo: ${grupoRegistros[0].grupo || '—'}</div>
      </div>
    `;

    card.appendChild(head);

    const rows = document.createElement('div');
    rows.className = 'asistencia-rows';

    if (mis.length === 0) {
      const solo = document.createElement('div');
      solo.className = 'solo sin-registro';
      solo.innerHTML = `<i class="fas fa-circle-xmark"></i> Sin registro`;
      rows.appendChild(solo);
    } else {
      mis.forEach(rec => {
        const esEntrada = rec.tipo.includes('entrada') || rec.tipo.includes('ent');
        const iconClass = esEntrada ? 'entrada' : 'salida';
        const icon = esEntrada ? 'fas fa-right-to-bracket' : 'fas fa-right-from-bracket';
        const tipoLabel = esEntrada ? 'Entrada' : 'Salida';
        const chipHTML = esEntrada
          ? ((rec.puntualidad.toLowerCase().includes('ret') || rec.puntualidad.toLowerCase().includes('tarde'))
              ? '<span class="chip retardo">Retardo</span>'
              : '<span class="chip a-tiempo">A tiempo</span>')
          : '';

        const row = document.createElement('div');
        row.className = 'asistencia-row';
        row.innerHTML = `
          <div class="row-time">${formatHora(rec.hora)}</div>
          <div class="row-icon ${iconClass}"><i class="${icon}"></i></div>
          <div class="row-type">${tipoLabel}<small>${tipoLabel === 'Entrada' ? 'Inicio de clase' : 'Fin de clase'}</small></div>
          ${chipHTML}
        `;
        if (rec.observaciones) {
          const obs = document.createElement('span');
          obs.className = 'chip observacion';
          obs.innerHTML = `<i class="fas fa-note-sticky"></i> ${rec.observaciones}`;
          row.appendChild(obs);
        }
        rows.appendChild(row);
      });
    }
    card.appendChild(rows);
    asistenciaList.appendChild(card);
  });
}

function renderStats(dias, asistencias, retardos) {
  const hay = dias > 0 || asistencias > 0 || retardos > 0;
  asistenciaStats.style.display = hay ? 'grid' : 'none';
  if (!hay) return;
  asistenciaStats.innerHTML = `
    <div class="stat-card"><i class="fas fa-calendar-days"></i><div><div class="stat-num">${dias}</div><div class="stat-label">Días de clase</div></div></div>
    <div class="stat-card"><i class="fas fa-check-circle"></i><div><div class="stat-num">${asistencias}</div><div class="stat-label">A tiempo</div></div></div>
    <div class="stat-card"><i class="fas fa-clock"></i><div><div class="stat-num">${retardos}</div><div class="stat-label">Retardos</div></div></div>
  `;
}

function showAsistenciaEmpty(msg) {
  asistenciaEmptyText.textContent = msg;
  asistenciaEmpty.style.display = 'flex';
  asistenciaStats.style.display = 'none';
}

// ============================================================
// 8b. ASISTENCIA A CLASES
// ============================================================
const ASIGNACIONES = {
  a:  { codigo: 'A',  label: 'Asistió',   cls: 'asg-asistio' },
  i:  { codigo: 'I',  label: 'Inasistió', cls: 'asg-inasistio' },
  ne: { codigo: 'Ne', label: 'No entró',  cls: 'asg-no-entro' },
  r:  { codigo: 'R',  label: 'Retardó',   cls: 'asg-retardo' },
  e:  { codigo: 'E',  label: 'Escapó',    cls: 'asg-escapo' },
  j:  { codigo: 'J',  label: 'Justificó', cls: 'asg-justifico' }
};

function getAsignacionInfo(valor) {
  const v = (valor || '').trim().toLowerCase().replace(/\s+/g, '');
  const info = ASIGNACIONES[v];
  if (info) return info;
  const crudo = (valor || '').trim();
  return { codigo: crudo || '?', label: crudo || 'Sin dato', cls: 'asg-desconocido' };
}

let clasesCargadas = false;
let clasesFetching = false;
let clasesData = null;
let asignaturaActiva = null;

async function loadAsistenciasClases() {
  if (clasesCargadas || clasesFetching) return;
  clasesFetching = true;
  clasesLoading.style.display = 'flex';
  clasesError.style.display = 'none';
  clasesEmpty.style.display = 'none';
  clasesChips.innerHTML = '';
  clasesDetail.innerHTML = '';

  try {
    const nombre = (session && session.name) ? session.name.trim() : '';
    const res = await fetch(buildApiUrl('tipo=clases&alumno=' + encodeURIComponent(nombre)));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('El servidor respondió HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 400) : ''));
    }
    const data = await res.json();
    clasesData = data.Asignaturas || [];
    clasesCargadas = true;
    renderAsignaturas();
  } catch (err) {
    console.error('Error cargando asistencias de clases:', err);
    clasesLoading.style.display = 'none';
    clasesError.style.display = 'block';
    clasesErrorMsg.textContent = (err && err.message && err.message.indexOf('HTTP') !== -1)
      ? err.message
      : 'Error al conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  } finally {
    clasesFetching = false;
  }
}

function renderAsignaturas() {
  clasesLoading.style.display = 'none';

  if (clasesData.length === 0) {
    showClasesEmpty('No encontramos las hojas de asignatura. Avísales al equipo para revisarlo.');
    return;
  }

  // Conservar solo asignaturas con registros para el alumno
  const conRegistros = clasesData.filter(a => (a.registros || []).length > 0);
  if (conRegistros.length === 0) {
    showClasesEmpty('No encontramos registros de asistencia a clases para ti.');
    return;
  }

  clasesChips.innerHTML = '';
  conRegistros.forEach(a => {
    const chip = document.createElement('button');
    chip.className = 'asignatura-chip' + (asignaturaActiva === a.nombre ? ' active' : '');
    chip.textContent = a.nombre;
    chip.addEventListener('click', () => {
      asignaturaActiva = a.nombre;
      document.querySelectorAll('.asignatura-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderAsignaturaDetalle(a);
    });
    clasesChips.appendChild(chip);
  });

  const primera = conRegistros[0];
  asignaturaActiva = primera.nombre;
  const chipActivo = clasesChips.querySelector('.asignatura-chip');
  if (chipActivo) chipActivo.classList.add('active');
  renderAsignaturaDetalle(primera);
}

function renderAsignaturaDetalle(asignatura) {
  clasesDetail.innerHTML = '';

  const registros = (asignatura.registros || [])
    .map(r => ({ fecha: parseRegistro(r.fecha), raw: r }))
    .filter(r => r.fecha)
    .sort((a, b) => a.fecha - b.fecha);

  if (registros.length === 0) {
    showClasesEmpty('Sin registros en esta asignatura.');
    return;
  }

  registros.forEach(r => {
    const info = getAsignacionInfo(r.raw.asignacion);
    const d = r.fecha;
    const badgeMonth = MESES_ABREV[d.getMonth()];

    const row = document.createElement('div');
    row.className = 'clase-row';
    row.innerHTML = `
      <div class="date-badge"><span class="day">${d.getDate()}</span><span class="month">${badgeMonth}</span></div>
      <span class="chip ${info.cls}">${info.codigo} · ${info.label}</span>
    `;
    clasesDetail.appendChild(row);
  });
}

function showClasesEmpty(msg) {
  clasesEmptyText.textContent = msg;
  clasesEmpty.style.display = 'flex';
  clasesDetail.innerHTML = '';
}

// ============================================================
// 8c. MENÚ ACTITUDINAL
// ============================================================
const actRegistrosSeccion = document.getElementById('actRegistrosSeccion');
const actInsigniasSeccion = document.getElementById('actInsigniasSeccion');
const actTabs = document.querySelectorAll('.actitudinal-tab[data-seccion]');

const actRegChips = document.getElementById('actRegistrosChips');
const actRegLoading = document.getElementById('actRegistrosLoading');
const actRegError = document.getElementById('actRegistrosError');
const actRegErrorMsg = document.getElementById('actRegistrosErrorMsg');
const actRegEmpty = document.getElementById('actRegistrosEmpty');
const actRegEmptyText = document.getElementById('actRegistrosEmptyText');
const actRegDetail = document.getElementById('actRegistrosDetail');

const actInsigniasLoading = document.getElementById('actInsigniasLoading');
const actInsigniasError = document.getElementById('actInsigniasError');
const actInsigniasErrorMsg = document.getElementById('actInsigniasErrorMsg');
const actInsigniasEmpty = document.getElementById('actInsigniasEmpty');
const actInsigniasEmptyText = document.getElementById('actInsigniasEmptyText');
const actInsigniasGrid = document.getElementById('actInsigniasGrid');
const actNegativasBlock = document.getElementById('actNegativasBlock');
const actNegativasList = document.getElementById('actNegativasList');

function activarActitudinalSeccion(seccion) {
  actTabs.forEach(tab => {
    const activa = tab.dataset.seccion === seccion;
    tab.classList.toggle('active', activa);
  });
  const mostrarRegistros = seccion === 'registros';
  actRegistrosSeccion.style.display = mostrarRegistros ? '' : 'none';
  actInsigniasSeccion.style.display = mostrarRegistros ? 'none' : '';

  if (seccion === 'insignias') renderInsignias();
}

actTabs.forEach(tab => {
  tab.addEventListener('click', () => activarActitudinalSeccion(tab.dataset.seccion));
});

let actitudinalCargado = false;
let actitudinalFetching = false;
let actitudinalData = null;
let actAsignaturaActiva = null;

async function loadActitudinal() {
  if (actitudinalCargado || actitudinalFetching) return;
  actitudinalFetching = true;
  actRegLoading.style.display = 'flex';
  actRegError.style.display = 'none';
  actRegEmpty.style.display = 'none';
  actRegChips.innerHTML = '';
  actRegDetail.innerHTML = '';
  actInsigniasLoading.style.display = 'flex';
  actInsigniasError.style.display = 'none';
  actInsigniasEmpty.style.display = 'none';
  actInsigniasGrid.innerHTML = '';
  actNegativasBlock.style.display = 'none';

  try {
    const nombre = (session && session.name) ? session.name.trim() : '';
    const res = await fetch(buildApiUrl('tipo=actitudinal&alumno=' + encodeURIComponent(nombre)));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('El servidor respondió HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 400) : ''));
    }
    const data = await res.json();
    actitudinalData = {
      Asignaturas: data.Asignaturas || [],
      Insignias: data.Insignias || [],
      Negativas: data.Negativas || []
    };
    actitudinalCargado = true;
    renderRegistrosActitudinales();
    renderInsignias();
  } catch (err) {
    console.error('Error cargando actitudinal:', err);
    actRegLoading.style.display = 'none';
    actInsigniasLoading.style.display = 'none';
    actRegError.style.display = 'block';
    actRegErrorMsg.textContent = (err && err.message && err.message.indexOf('HTTP') !== -1)
      ? err.message
      : 'Error al conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
    actInsigniasError.style.display = 'block';
    actInsigniasErrorMsg.textContent = actRegErrorMsg.textContent;
  } finally {
    actitudinalFetching = false;
  }
}

function renderRegistrosActitudinales() {
  actRegLoading.style.display = 'none';

  const conRegistros = (actitudinalData.Asignaturas || []).filter(a => (a.registros || []).length > 0);
  if (conRegistros.length === 0) {
    showActRegEmpty('No encontramos registros actitudinales para ti.');
    return;
  }

  actRegChips.innerHTML = '';
  conRegistros.forEach(a => {
    const chip = document.createElement('button');
    chip.className = 'asignatura-chip' + (actAsignaturaActiva === a.nombre ? ' active' : '');
    chip.textContent = a.nombre;
    chip.addEventListener('click', () => {
      actAsignaturaActiva = a.nombre;
      document.querySelectorAll('.asignatura-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderAsignaturaActitudinal(a);
    });
    actRegChips.appendChild(chip);
  });

  const primera = conRegistros[0];
  actAsignaturaActiva = primera.nombre;
  const chipActivo = actRegChips.querySelector('.asignatura-chip');
  if (chipActivo) chipActivo.classList.add('active');
  renderAsignaturaActitudinal(primera);
}

function renderAsignaturaActitudinal(asignatura) {
  actRegDetail.innerHTML = '';

  const registros = (asignatura.registros || []).filter(r => (r.actitud || '').trim());
  if (registros.length === 0) {
    showActRegEmpty('Sin registros en esta asignatura.');
    return;
  }

  registros.forEach(r => {
    const actitud = (r.actitud || '').trim();
    const esNegativa = actitud.startsWith('❌');
    const row = document.createElement('div');
    row.className = 'actividad-registro';
    const chip = document.createElement('span');
    chip.className = 'chip ' + (esNegativa ? 'act-negativa' : 'act-positiva');
    chip.textContent = actitud;
    row.appendChild(chip);
    actRegDetail.appendChild(row);
  });
}

function showActRegEmpty(msg) {
  actRegEmptyText.textContent = msg;
  actRegEmpty.style.display = 'flex';
  actRegDetail.innerHTML = '';
}

function renderInsignias() {
  if (!actitudinalData) return;

  const insignias = actitudinalData.Insignias || [];
  const negativas = actitudinalData.Negativas || [];

  actInsigniasLoading.style.display = 'none';

  if (insignias.length === 0 && negativas.length === 0) {
    showInsigniasEmpty('No encontramos insignias definidas.');
    return;
  }

  // --- Insignias ---
  if (insignias.length > 0) {
    actInsigniasGrid.style.display = '';
    actInsigniasGrid.innerHTML = '';
    insignias.forEach(ins => {
      const conseguida = esInsigniaConseguida(ins);
      const pct = getPctBarra(ins.veces, ins.maxVeces);
      const imgSrc = conseguida
        ? (ins.imgLograda || '')
        : (ins.imgNoLograda || '');
      const card = document.createElement('div');
      card.className = 'insignia-card' + (conseguida ? ' conseguida' : '');
      card.innerHTML = `
        <div class="insignia-img${conseguida ? '' : ' locked'}">
          ${imgSrc
            ? `<img src="${getDriveDirectUrl(imgSrc)}" alt="${escapeHtml(ins.nombre)}" />`
            : '<i class="fas fa-medal"></i>'}
        </div>
        <div class="insignia-name">${escapeHtml(ins.nombre)}</div>
        <div class="insignia-count">${ins.veces} de ${ins.maxVeces} veces</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      `;
      actInsigniasGrid.appendChild(card);
    });
  } else {
    actInsigniasGrid.style.display = 'none';
  }

  // --- Negativas (retroalimentación) ---
  if (negativas.length > 0) {
    actNegativasBlock.style.display = '';
    actNegativasList.innerHTML = '';
    negativas.forEach(neg => {
      const pct = getPctBarra(neg.veces, neg.max);
      const row = document.createElement('div');
      row.className = 'negativa-row';
      row.innerHTML = `
        <div class="negativa-name">${escapeHtml(neg.nombre)}</div>
        <div class="negativa-count">${neg.veces} de ${neg.max}</div>
        <div class="progress-bar"><div class="progress-fill fill-negativa" style="width:${pct}%"></div></div>
      `;
      actNegativasList.appendChild(row);
    });
  } else {
    actNegativasBlock.style.display = 'none';
  }
}

function showInsigniasEmpty(msg) {
  actInsigniasEmptyText.textContent = msg;
  actInsigniasEmpty.style.display = 'flex';
  actInsigniasGrid.innerHTML = '';
  actNegativasBlock.style.display = 'none';
}

function getPctBarra(veces, max) {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.round(((veces || 0) / max) * 100));
}

function esInsigniaConseguida(ins) {
  if (!ins || !ins.maxVeces || ins.maxVeces <= 0) return false;
  const umbral = (ins.pctConseguida == null || isNaN(ins.pctConseguida)) ? 0 : ins.pctConseguida;
  const pctActual = ((ins.veces || 0) / ins.maxVeces) * 100;
  return pctActual >= umbral;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}

// ============================================================
// 8d. MENÚ ACADÉMICO
// ============================================================
const acadBimestre1Seccion = document.getElementById('acadBimestre1Seccion');
const acadBimestre2Seccion = document.getElementById('acadBimestre2Seccion');
const acadTabs = document.querySelectorAll('.actitudinal-tab[data-bimestre]');

const acadB1Chips = document.getElementById('acadB1Chips');
const acadB1Loading = document.getElementById('acadB1Loading');
const acadB1Error = document.getElementById('acadB1Error');
const acadB1ErrorMsg = document.getElementById('acadB1ErrorMsg');
const acadB1Empty = document.getElementById('acadB1Empty');
const acadB1EmptyText = document.getElementById('acadB1EmptyText');
const acadB1Detail = document.getElementById('acadB1Detail');

const acadB2Chips = document.getElementById('acadB2Chips');
const acadB2Loading = document.getElementById('acadB2Loading');
const acadB2Error = document.getElementById('acadB2Error');
const acadB2ErrorMsg = document.getElementById('acadB2ErrorMsg');
const acadB2Empty = document.getElementById('acadB2Empty');
const acadB2EmptyText = document.getElementById('acadB2EmptyText');
const acadB2Detail = document.getElementById('acadB2Detail');

const acadChipsPorBimestre = { 1: acadB1Chips, 2: acadB2Chips };
const acadLoadingPorBimestre = { 1: acadB1Loading, 2: acadB2Loading };
const acadErrorPorBimestre = { 1: acadB1Error, 2: acadB2Error };
const acadErrorMsgPorBimestre = { 1: acadB1ErrorMsg, 2: acadB2ErrorMsg };
const acadEmptyPorBimestre = { 1: acadB1Empty, 2: acadB2Empty };
const acadEmptyTextPorBimestre = { 1: acadB1EmptyText, 2: acadB2EmptyText };
const acadDetailPorBimestre = { 1: acadB1Detail, 2: acadB2Detail };

let academicoCargado = false;
let academicoFetching = false;
let academicoFailed = false;
let academicoData = null;
let acadBimestreActivo = 1;
const acadAsignaturaActiva = { 1: null, 2: null };

function activarAcademicoBimestre(bim) {
  acadTabs.forEach(tab => {
    tab.classList.toggle('active', Number(tab.dataset.bimestre) === bim);
  });
  acadBimestre1Seccion.style.display = bim === 1 ? '' : 'none';
  acadBimestre2Seccion.style.display = bim === 1 ? 'none' : '';
  acadBimestreActivo = bim;
  renderAcBimestre(bim);
}

acadTabs.forEach(tab => {
  tab.addEventListener('click', () => activarAcademicoBimestre(Number(tab.dataset.bimestre)));
});

async function loadAcademico() {
  if (academicoCargado || academicoFetching) return;
  academicoFetching = true;
  academicoFailed = false;

  [1, 2].forEach(b => {
    acadLoadingPorBimestre[b].style.display = 'flex';
    acadErrorPorBimestre[b].style.display = 'none';
    acadEmptyPorBimestre[b].style.display = 'none';
    acadChipsPorBimestre[b].innerHTML = '';
    acadDetailPorBimestre[b].innerHTML = '';
  });

  try {
    const nombre = (session && session.name) ? session.name.trim() : '';
    const res = await fetch(buildApiUrl('tipo=academico&alumno=' + encodeURIComponent(nombre)));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('El servidor respondió HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 400) : ''));
    }
    const data = await res.json();
    academicoData = data.Asignaturas || [];
    academicoCargado = true;
    renderAcBimestre(acadBimestreActivo);
  } catch (err) {
    console.error('Error cargando académico:', err);
    academicoFailed = true;
    const msg = (err && err.message && err.message.indexOf('HTTP') !== -1)
      ? err.message
      : 'Error al conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
    acadB1Loading.style.display = 'none';
    acadB2Loading.style.display = 'none';
    acadB1Error.style.display = 'block';
    acadB1ErrorMsg.textContent = msg;
    acadB2Error.style.display = 'block';
    acadB2ErrorMsg.textContent = msg;
  } finally {
    academicoFetching = false;
  }
}

function acadRegistrosDe(asignatura, bim) {
  return bim === 1 ? (asignatura.bimestre1 || []) : (asignatura.bimestre2 || []);
}

function renderAcBimestre(bim) {
  if (!academicoData) return;
  if (academicoFailed) return;

  const loading = acadLoadingPorBimestre[bim];
  const chips = acadChipsPorBimestre[bim];
  const empty = acadEmptyPorBimestre[bim];
  const detail = acadDetailPorBimestre[bim];

  loading.style.display = 'none';

  const conRegistros = academicoData.filter(a => acadRegistrosDe(a, bim).length > 0);
  if (conRegistros.length === 0) {
    empty.style.display = 'flex';
    acadEmptyTextPorBimestre[bim].textContent = 'No encontramos evidencias para ti en este bimestre.';
    detail.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  chips.innerHTML = '';
  conRegistros.forEach(a => {
    const chip = document.createElement('button');
    chip.className = 'asignatura-chip' + (acadAsignaturaActiva[bim] === a.nombre ? ' active' : '');
    chip.textContent = a.nombre;
    chip.addEventListener('click', () => {
      acadAsignaturaActiva[bim] = a.nombre;
      chips.querySelectorAll('.asignatura-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderAcAsignatura(a, bim);
    });
    chips.appendChild(chip);
  });

  let seleccionada = acadAsignaturaActiva[bim]
    ? conRegistros.find(a => a.nombre === acadAsignaturaActiva[bim])
    : null;
  if (!seleccionada) {
    seleccionada = conRegistros[0];
    acadAsignaturaActiva[bim] = seleccionada.nombre;
  }
  renderAcAsignatura(seleccionada, bim);
}

function renderAcAsignatura(asignatura, bim) {
  const detail = acadDetailPorBimestre[bim];
  detail.innerHTML = '';

  const registros = acadRegistrosDe(asignatura, bim);
  if (registros.length === 0) {
    acadEmptyTextPorBimestre[bim].textContent = 'Sin registros en esta asignatura.';
    acadEmptyPorBimestre[bim].style.display = 'flex';
    return;
  }
  acadEmptyPorBimestre[bim].style.display = 'none';

  registros.forEach(r => {
    const evidencia = (r.evidencia || '').trim();
    const calificacion = (r.calificacion || '').trim();
    const link = (r.link || '').trim();
    const row = document.createElement('div');
    row.className = 'academico-registro';
    row.innerHTML = `
      <div class="academico-evidencia">
        ${link ? `<a class="evidencia-enlace" href="${escapeHtml(link)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Ver descripción</a>` : ''}
        <div class="academico-evidencia-titulo">${escapeHtml(evidencia)}</div>
      </div>
      <span class="chip ${claseCalificacion(calificacion)}">${escapeHtml(calificacion || '—')}</span>
    `;
    detail.appendChild(row);
  });
}

function claseCalificacion(cal) {
  const v = (cal || '').trim().toLowerCase();
  if (v.includes('no entregad')) return 'acad-rojo';
  const num = parseFloat(String(cal).trim());
  if (isNaN(num)) return 'acad-neutro';
  if (num >= 9) return 'acad-verde';
  if (num >= 7) return 'acad-amarillo';
  return 'acad-naranja';
}

// ============================================================
// 8e. MENÚ RESULTADOS
// ============================================================
const RESULTADOS_COLUMNAS = [
  { clave: 'Calificación B1',    etiqueta: 'Bimestre 1',        tipo: 'num' },
  { clave: 'Calificación B2',    etiqueta: 'Bimestre 2',        tipo: 'num' },
  { clave: 'Promedio',           etiqueta: 'Promedio',          tipo: 'num' },
  { clave: 'Estatus',            etiqueta: 'Estatus',           tipo: 'estatus' },
  { clave: 'Nueva evaluación',   etiqueta: 'Nueva evaluación',  tipo: 'num' },
  { clave: 'Calificación final', etiqueta: 'Promedio final',    tipo: 'num' },
  { clave: 'Acta',               etiqueta: 'Acta',              tipo: 'num' }
];

const resultadosLoading = document.getElementById('resultadosLoading');
const resultadosError = document.getElementById('resultadosError');
const resultadosErrorMsg = document.getElementById('resultadosErrorMsg');
const resultadosEmpty = document.getElementById('resultadosEmpty');
const resultadosEmptyText = document.getElementById('resultadosEmptyText');
const resultadosTableWrap = document.getElementById('resultadosTableWrap');
const resultadosThead = document.getElementById('resultadosThead');
const resultadosTbody = document.getElementById('resultadosTbody');

let resultadosCargados = false;
let resultadosFetching = false;

async function loadResultados() {
  if (resultadosCargados || resultadosFetching) return;
  resultadosFetching = true;
  resultadosLoading.style.display = 'flex';
  resultadosError.style.display = 'none';
  resultadosEmpty.style.display = 'none';
  resultadosTableWrap.style.display = 'none';
  resultadosThead.innerHTML = '';
  resultadosTbody.innerHTML = '';

  try {
    const nombre = (session && session.name) ? session.name.trim() : '';
    const res = await fetch(buildApiUrl('tipo=resultados&alumno=' + encodeURIComponent(nombre)));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('El servidor respondió HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 400) : ''));
    }
    const data = await res.json();
    const visibles = (data.Elementos && data.Elementos.visibles)
      ? data.Elementos.visibles
      : (elementosVisibles || {});
    renderResultados(data.Asignaturas || [], visibles);
    resultadosCargados = true;
  } catch (err) {
    console.error('Error cargando resultados:', err);
    resultadosLoading.style.display = 'none';
    resultadosError.style.display = 'block';
    resultadosErrorMsg.textContent = (err && err.message && err.message.indexOf('HTTP') !== -1)
      ? err.message
      : 'Error al conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  } finally {
    resultadosFetching = false;
  }
}

function columnasResultadosVisibles(visibles) {
  return RESULTADOS_COLUMNAS.filter(c => visibles[c.clave] === true);
}

const MAX_CALIFICACION = 10;
const MAX_DECIMALES = 5;

function fmtResultado(v) {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'number') {
    if (isNaN(v)) return '—';
    return String(Number(Math.min(v, MAX_CALIFICACION).toFixed(MAX_DECIMALES)));
  }
  const s = String(v).trim();
  if (!s) return '—';
  if (/^\d/.test(s)) {
    const num = parseFloat(s.replace(',', '.'));
    if (!isNaN(num)) return String(Number(Math.min(num, MAX_CALIFICACION).toFixed(MAX_DECIMALES)));
  }
  return s;
}

function chipEstatus(v) {
  const s = v.trim().toLowerCase();
  if (s.includes('extra')) return 'cal-rojo';
  if (s.includes('ordin')) return 'cal-amarillo';
  if (s.includes('exent')) return 'cal-verde';
  return 'estatus-neutro';
}

function claseCalificacionRango(valor) {
  const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.').trim());
  if (isNaN(num)) return '';
  if (num < 7) return 'cal-rojo';
  if (num < 9) return 'cal-amarillo';
  return 'cal-verde';
}

function valorResultadoColumna(asignatura, col) {
  if (col.clave === 'Acta') return asignatura.acta;
  return asignatura.elementos ? asignatura.elementos[col.clave] : undefined;
}

function renderResultados(asignaturas, visibles) {
  resultadosLoading.style.display = 'none';

  const columnas = columnasResultadosVisibles(visibles);
  if (columnas.length === 0 || asignaturas.length === 0) {
    resultadosEmpty.style.display = 'flex';
    resultadosEmptyText.textContent = columnas.length === 0
      ? 'Los resultados aún no se han habilitado para mostrarse.'
      : 'Aún no encontramos calificaciones para ti.';
    return;
  }

  // Encabezados
  const theadRow = document.createElement('tr');
  const thAsig = document.createElement('th');
  thAsig.textContent = 'Asignatura';
  theadRow.appendChild(thAsig);
  columnas.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.etiqueta;
    theadRow.appendChild(th);
  });
  resultadosThead.appendChild(theadRow);

  // Filas
  asignaturas.forEach(a => {
    const tr = document.createElement('tr');
    const tdAsig = document.createElement('td');
    tdAsig.className = 'resultado-asignatura';
    tdAsig.textContent = a.nombre;
    tr.appendChild(tdAsig);

    columnas.forEach(col => {
      const valor = fmtResultado(valorResultadoColumna(a, col));
      const td = document.createElement('td');
      if (col.tipo === 'estatus') {
        if (valor !== '—') {
          const chip = document.createElement('span');
          chip.className = 'chip ' + chipEstatus(valor);
          chip.textContent = valor;
          td.appendChild(chip);
        } else {
          td.textContent = valor;
          td.classList.add('missing');
        }
      } else {
        td.textContent = valor;
        if (valor === '—') {
          td.classList.add('missing');
        } else {
          const clase = claseCalificacionRango(valorResultadoColumna(a, col));
          if (clase) td.classList.add(clase);
        }
      }
      tr.appendChild(td);
    });

    resultadosTbody.appendChild(tr);
  });

  resultadosTableWrap.style.display = 'block';
}

// ============================================================
// 9. CERRAR SESIÓN
// ============================================================
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (typeof clearSession === 'function') {
    clearSession();
  } else {
    sessionStorage.removeItem('sirei_gandhi_session');
  }
  window.location.href = 'index.html';
});

// ============================================================
// 9b. PANEL DE CONFIGURACIÓN DE ORIGEN DE DATOS
// (visible únicamente para el usuario administrador)
// ============================================================
const configLockEl = document.getElementById('configLock');
const configFormEl = document.getElementById('configForm');
const configUnlockFormEl = document.getElementById('configUnlockForm');
const configPasswordEl = document.getElementById('configPassword');
const configUnlockBtn = document.getElementById('configUnlockBtn');
const configUnlockErrorEl = document.getElementById('configUnlockError');
const configUnlockErrorText = document.getElementById('configUnlockErrorText');
const configApiUrlEl = document.getElementById('configApiUrl');
const configAdminIdEl = document.getElementById('configAdminId');
const configChecadorIdEl = document.getElementById('configChecadorId');
const configFinancieroIdEl = document.getElementById('configFinancieroId');
const configSaveBtnEl = document.getElementById('configSaveBtn');
const configCancelBtnEl = document.getElementById('configCancelBtn');
const configSaveMsgEl = document.getElementById('configSaveMsg');

function activarPanelConfiguracion() {
  if (!configLockEl) return;
  configLockEl.style.display = '';
  configFormEl.style.display = 'none';
  configPasswordEl.value = '';
  configUnlockErrorEl.classList.remove('show');
  configSaveMsgEl.classList.remove('show', 'ok', 'error');
  configSaveMsgEl.textContent = '';
  configPasswordEl.focus();
}

function showConfigUnlockError(msg) {
  configUnlockErrorText.textContent = msg;
  configUnlockErrorEl.classList.add('show');
}

function showConfigSaveMsg(tipo, msg) {
  configSaveMsgEl.classList.remove('ok', 'error');
  configSaveMsgEl.classList.add(tipo);
  configSaveMsgEl.textContent = msg;
}

configUnlockFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pass = configPasswordEl.value.trim();
  if (!pass) {
    showConfigUnlockError('Ingresa tu contraseña.');
    return;
  }

  configUnlockErrorEl.classList.remove('show');
  configUnlockBtn.disabled = true;
  configUnlockBtn.innerHTML = '<span class="spinner"></span> Verificando...';

  try {
    // Verifica la contraseña contra la hoja administrador configurada.
    const res = await fetch(buildApiUrl(''));
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('HTTP ' + res.status + (txt ? ' · ' + txt.slice(0, 300) : ''));
    }
    const data = await res.json();
    const usuarios = data.Usuarios1 || [];
    const passwords = data.Password1 || [];
    const idx = usuarios.indexOf(session.username);
    if (idx === -1 || passwords[idx] !== pass) {
      showConfigUnlockError('Contraseña incorrecta.');
      configPasswordEl.value = '';
      configPasswordEl.focus();
      return;
    }

    const cfg = getConfig();
    configApiUrlEl.value = cfg.apiUrl;
    configAdminIdEl.value = cfg.adminId;
    configChecadorIdEl.value = cfg.checadorId;
    configFinancieroIdEl.value = cfg.financieroId;
    configLockEl.style.display = 'none';
    configFormEl.style.display = '';
  } catch (err) {
    console.error('Error verificando la contraseña:', err);
    showConfigUnlockError('Error al conectar con el servidor. Revisa tu conexión.');
  } finally {
    configUnlockBtn.disabled = false;
    configUnlockBtn.innerHTML = '<i class="fas fa-key"></i> <span>Verificar y continuar</span>';
  }
});

configSaveBtnEl.addEventListener('click', () => {
  const apiUrl = configApiUrlEl.value.trim();
  const adminId = configAdminIdEl.value.trim();
  const checadorId = configChecadorIdEl.value.trim();
  const financieroId = configFinancieroIdEl.value.trim();

  const errores = [];
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\/exec$/.test(apiUrl)) {
    errores.push('El enlace de la aplicación web no parece válido (debe terminar en "/exec").');
  }
  if (!/^[A-Za-z0-9_-]{20,}$/.test(adminId)) errores.push('El ID de la hoja administrador no parece válido.');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(checadorId)) errores.push('El ID de la hoja checador no parece válido.');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(financieroId)) errores.push('El ID de la hoja financiero no parece válido.');
  if (errores.length) {
    showConfigSaveMsg('error', errores.join(' '));
    return;
  }

  configSaveBtnEl.disabled = true;
  configSaveBtnEl.innerHTML = '<span class="spinner"></span> Guardando...';

  try {
    saveConfig({ apiUrl: apiUrl, adminId: adminId, checadorId: checadorId, financieroId: financieroId });
    clearSession();
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Error guardando la configuración:', err);
    showConfigSaveMsg('error', 'No se pudieron guardar los cambios. Intenta de nuevo.');
    configSaveBtnEl.disabled = false;
    configSaveBtnEl.innerHTML = '<i class="fas fa-save"></i> <span>Guardar y volver a iniciar sesión</span>';
  }
});

configCancelBtnEl.addEventListener('click', activarPanelConfiguracion);

// ============================================================
// 9c. ACTIVAR PANEL INICIAL (según el rol)
// ============================================================
if (isAdmin) {
  document.querySelectorAll('.nav-student-link').forEach(link => {
    link.style.display = 'none';
  });
  const configNavLink = document.getElementById('configNavLink');
  if (configNavLink) configNavLink.style.display = '';
  activatePanel('configuracion');
  activarPanelConfiguracion();
} else {
  activatePanel('inicio');
}