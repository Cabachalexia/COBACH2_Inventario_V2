const SUPABASE_URL='https://kdftpvvfvliepedkprai.supabase.co';
const SUPABASE_KEY='sb_publishable_qbHb6dg5O0T1Jm9L0zR9RQ_cB82y7ym';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let equipment=[]; let profile=null; let session=null;
const canWrite=()=>profile&&['administrador','capturista'].includes(profile.rol);
const isAdmin=()=>profile&&profile.rol==='administrador';

async function init(){
 const {data}=await db.auth.getSession(); session=data.session;
 if(session) await enterApp(); else showLogin();
 db.auth.onAuthStateChange(async(_event,newSession)=>{session=newSession;if(session)await enterApp();else showLogin();});
}
function showLogin(){$('loginScreen').hidden=false;$('appShell').hidden=true;}
async function enterApp(){
 const {data:p,error}=await db.from('perfiles').select('id,nombre,rol,activo').eq('id',session.user.id).single();
 if(error||!p||!p.activo){await db.auth.signOut();$('loginMessage').textContent='Este usuario no tiene un perfil activo autorizado.';return;}
 profile=p;$('loginScreen').hidden=true;$('appShell').hidden=false;$('currentUser').textContent=p.nombre;$('currentRole').textContent=p.rol;
 document.querySelectorAll('.write-only').forEach(x=>x.style.display=canWrite()?'':'none');
 document.querySelectorAll('.admin-only').forEach(x=>x.style.display=isAdmin()?'':'none');
 await loadEquipment();showView('dashboard');
}
$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginMessage').textContent='Ingresando...';const {error}=await db.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});$('loginMessage').textContent=error?('No fue posible iniciar sesión: '+error.message):'';};
$('logoutBtn').onclick=()=>db.auth.signOut();

function showView(id){
  if((id==='form' && !canWrite()) || (id==='admin' && !isAdmin())) return;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(id).classList.add('active');

  document.querySelectorAll('nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === id);
  });

  if(id === 'maintenance'){
    loadMaintenance();
  }
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showView(b.dataset.view));
async function loadEquipment(){const {data,error}=await db.from('equipos').select('*').order('created_at',{ascending:false});if(error){alert('Error al cargar inventario: '+error.message);return;}equipment=data||[];render();}
function nextId(){let max=0;equipment.forEach(x=>{const m=(x.identificacion||'').match(/^CB2-PC-(\d+)$/i);if(m)max=Math.max(max,Number(m[1]));});return 'CB2-PC-'+String(max+1).padStart(3,'0');}
function openNew(){if(!canWrite())return;$('equipmentForm').reset();$('editId').value='';$('formTitle').textContent='Registrar nuevo equipo';$('date').value=new Date().toISOString().slice(0,10);$('equipmentId').value=nextId();$('formMessage').textContent='';showView('form');}
$('equipmentForm').onsubmit=async e=>{e.preventDefault();if(!canWrite())return;const payload={identificacion:$('equipmentId').value.trim(),numero_inventario:$('assetNo').value.trim()||null,numero_serie:$('serial').value.trim()||null,marca:$('brand').value.trim()||null,modelo:$('model').value.trim()||null,ubicacion:$('location').value.trim(),area_aula:$('area').value.trim()||null,responsable:$('responsible').value.trim()||null,procesador:$('cpu').value.trim()||null,memoria_ram:$('ram').value.trim()||null,almacenamiento:$('storage').value.trim()||null,tarjeta_grafica:$('gpu').value.trim()||null,tarjeta_madre_marca:$('motherboardBrand').value.trim()||null,tarjeta_madre_modelo:$('motherboardModel').value.trim()||null,sistema_operativo:$('os').value.trim()||null,monitor_marca:$('monitorBrand').value.trim()||null,monitor_tamano:$('monitorSize').value.trim()||null,estado:$('status').value,fecha_alta:$('date').value||null,observaciones:$('notes').value.trim()||null,creado_por:session.user.id};
 $('formMessage').textContent='Guardando...';const id=$('editId').value;let res;if(id){delete payload.creado_por;res=await db.from('equipos').update(payload).eq('id',Number(id));}else res=await db.from('equipos').insert(payload);if(res.error){$('formMessage').textContent='Error: '+res.error.message;return;}$('formMessage').textContent='';await loadEquipment();showView('inventory');};
function editItem(id){if(!canWrite())return;const x=equipment.find(e=>e.id===id);if(!x)return;$('editId').value=x.id;$('formTitle').textContent='Editar equipo '+x.identificacion;const map={equipmentId:'identificacion',assetNo:'numero_inventario',serial:'numero_serie',brand:'marca',model:'modelo',location:'ubicacion',area:'area_aula',responsible:'responsable',cpu:'procesador',ram:'memoria_ram',storage:'almacenamiento',gpu:'tarjeta_grafica',motherboardBrand:'tarjeta_madre_marca',motherboardModel:'tarjeta_madre_modelo',os:'sistema_operativo',monitorBrand:'monitor_marca',monitorSize:'monitor_tamano',status:'estado',date:'fecha_alta',notes:'observaciones'};Object.entries(map).forEach(([a,b])=>$(a).value=x[b]||'');showView('form');}
async function deleteItem(id){if(!isAdmin())return;if(!confirm('¿Desea eliminar este equipo del inventario?'))return;const {error}=await db.from('equipos').delete().eq('id',id);if(error){alert('No fue posible eliminar: '+error.message);return;}await loadEquipment();}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderTable(){const q=$('search').value.toLowerCase(),f=$('filter').value;const list=equipment.filter(x=>(!f||x.estado===f)&&Object.values(x).join(' ').toLowerCase().includes(q));$('rows').innerHTML=list.map(x=>`<tr><td><b>${esc(x.identificacion)}</b></td><td>${esc(x.numero_inventario||'—')}</td><td>${esc([x.marca,x.modelo].filter(Boolean).join(' ')||'—')}</td><td>${esc(x.ubicacion)}</td><td>${esc(x.responsable||'—')}</td><td><span class="badge">${esc(x.estado)}</span></td><td>${canWrite()?`<button class="row-btn" onclick="editItem(${x.id})">Editar</button>`:''}${isAdmin()?`<button class="row-btn" onclick="deleteItem(${x.id})">Eliminar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:35px;color:#788">No hay equipos registrados.</td></tr>';}
$('search').oninput=renderTable;$('filter').onchange=renderTable;
function render(){$('total').textContent=equipment.length;$('good').textContent=equipment.filter(x=>x.estado==='Bueno').length;$('regular').textContent=equipment.filter(x=>x.estado==='Regular').length;$('service').textContent=equipment.filter(x=>x.estado==='Requiere servicio').length;$('recent').innerHTML=equipment.slice(0,5).map(x=>`<div class="recent-item"><span><b>${esc(x.identificacion)}</b> · ${esc(x.ubicacion)}</span><span>${esc(x.estado)}</span></div>`).join('')||'<p style="color:#788">Aún no se han registrado equipos.</p>';renderTable();}
// ================================
// MODULO DE MANTENIMIENTO
// ================================

let maintenance = [];

async function loadMaintenance(){
  const {data,error}=await db
    .from('mantenimientos')
    .select('*')
    .order('fecha',{ascending:false});

  if(error){
    console.error('Error al cargar mantenimientos:',error);
    return;
  }

  maintenance=data||[];
  renderMaintenanceTable();
}

function loadMaintenanceEquipment(){
  const select=$('maintenanceEquipo');
  if(!select) return;

  select.innerHTML='<option value="">Seleccione un equipo</option>';

  equipment.forEach(e=>{
    const option=document.createElement('option');
    option.value=e.id;
    option.textContent=
      (e.identificacion||'Sin identificación')+
      (e.marca?' - '+e.marca:'')+
      (e.modelo?' '+e.modelo:'');
    select.appendChild(option);
  });
}

function openMaintenanceForm(){
  if(!canWrite()) return;

  $('maintenanceForm').reset();
  maintenanceEditId
  $('maintenanceDate').value=new Date().toISOString().split('T')[0];

  loadMaintenanceEquipment();

  $('maintenanceFormPanel').hidden=false;
}

function closeMaintenanceForm(){
  $('maintenanceForm').reset();
  maintenanceEditId
  $('maintenanceMessage').textContent='';
  $('maintenanceFormPanel').hidden=true;
}

async function saveMaintenance(e){
  e.preventDefault();

  if(!canWrite()) return;

  const id=$('maintenanceEditId').value;

  const payload={
    equipo_id:Number($('maintenanceEquipo').value),
    fecha:$('maintenanceDate').value,
    tipo:$('maintenanceTipo').value,
    tecnico_responsable:$('maintenanceTecnico').value.trim()||null,
    diagnostico:$('maintenanceDiagnostico').value.trim()||null,
    trabajo_realizado:$('maintenanceTrabajo').value.trim()||null,
    componentes_sustituidos:$('maintenanceComponentes').value.trim()||null,
    estado_final:$('maintenanceEstadoFinal').value||null,
    costo:$('maintenanceCosto').value
      ? Number($('maintenanceCosto').value)
      : null,
    proxima_fecha:$('maintenanceProximaFecha').value||null,
    descripcion:$('maintenanceDescripcion').value.trim()||null,
    observaciones:$('maintenanceObservaciones').value.trim()||null
  };

  $('maintenanceMessage').textContent='Guardando...';

  let result;

  if(id){
    result=await db
      .from('mantenimientos')
      .update(payload)
      .eq('id',Number(id));
  }else{
    result=await db
      .from('mantenimientos')
      .insert(payload);
  }

  if(result.error){
    $('maintenanceMessage').textContent=
      'Error: '+result.error.message;
    return;
  }

  $('maintenanceMessage').textContent='Mantenimiento guardado correctamente.';

  await loadMaintenance();

  setTimeout(()=>{
    closeMaintenanceForm();
  },500);
}

function maintenanceEquipmentName(id){
  const e=equipment.find(x=>Number(x.id)===Number(id));

  if(!e) return 'Equipo no localizado';

  return (e.identificacion||'')+
    (e.marca?' - '+e.marca:'')+
    (e.modelo?' '+e.modelo:'');
}

function renderMaintenanceTable(){
  const tbody=$('maintenanceTableBody');

  if(!tbody) return;

  if(!maintenance.length){
    tbody.innerHTML=
      '<tr><td colspan="7">No hay mantenimientos registrados.</td></tr>';
    return;
  }

  tbody.innerHTML=maintenance.map(m=>`
    <tr>
      <td>${esc(m.fecha||'')}</td>
      <td>${esc(maintenanceEquipmentName(m.equipo_id))}</td>
      <td>${esc(m.tipo||'')}</td>
      <td>${esc(m.tecnico_responsable||'')}</td>
      <td>${esc(m.estado_final||'')}</td>
      <td>${esc(m.proxima_fecha||'')}</td>
      <td>
        ${canWrite()
          ? `<button type="button" onclick="editMaintenance(${m.id})">Editar</button>`
          : ''}
        ${isAdmin()
          ? `<button type="button" onclick="deleteMaintenance(${m.id})">Eliminar</button>`
          : ''}
      </td>
    </tr>
  `).join('');
}

async function editMaintenance(id){
  if(!canWrite()) return;

  const m=maintenance.find(x=>Number(x.id)===Number(id));

  if(!m) return;

  loadMaintenanceEquipment();

  $('maintenanceEditId').value=m.id;
  $('maintenanceEquipo').value=m.equipo_id||'';
  $('maintenanceDate').value=m.fecha||'';
  $('maintenanceTipo').value=m.tipo||'';
  $('maintenanceTecnico').value=m.tecnico_responsable||'';
  $('maintenanceDiagnostico').value=m.diagnostico||'';
  $('maintenanceTrabajo').value=m.trabajo_realizado||'';
  $('maintenanceComponentes').value=m.componentes_sustituidos||'';
  $('maintenanceEstadoFinal').value=m.estado_final||'';
  $('maintenanceCosto').value=m.costo??'';
  $('maintenanceProximaFecha').value=m.proxima_fecha||'';
  $('maintenanceDescripcion').value=m.descripcion||'';
  $('maintenanceObservaciones').value=m.observaciones||'';

  $('maintenanceFormPanel').hidden=false;
}

async function deleteMaintenance(id){
  if(!isAdmin()) return;

  if(!confirm('¿Desea eliminar este registro de mantenimiento?')) return;

  const {error}=await db
    .from('mantenimientos')
    .delete()
    .eq('id',id);

  if(error){
    alert('No fue posible eliminar el mantenimiento: '+error.message);
    return;
  }

  await loadMaintenance();
}

if($('newMaintenanceBtn')){
  $('newMaintenanceBtn').onclick=openMaintenanceForm;
}

if($('cancelMaintenanceBtn')){
  $('cancelMaintenanceBtn').onclick=closeMaintenanceForm;
}

if($('maintenanceForm')){
  $('maintenanceForm').onsubmit=saveMaintenance;
}

init();
