'use strict';
const $=id=>document.getElementById(id);
const money=amount=>`$${new Intl.NumberFormat('es-CO').format(amount)}`;
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const imagePath=value=>/^assets\/img\/[a-z0-9-]+\.webp$/i.test(value||'')?value:'';
const categories=['Pizzas','Hamburguesas de res','Pollo apanado','Perros calientes','Salchipapas','Especiales','Bebidas'];
const images=['burger-hero','burger-super','burger-texana','burger-res','burger-doble','burger-pollo','burger-patacon','perro-super','perro-americano','perro-especial','salchipapa','salchipapa-grande','pizza','pizza-bbq','pizza-especial','pizza-porcion','alitas','lasana','papas','malteada','malteada-brownie','jugo','limonada'];
const state={catalog:{currency:'COP',products:[]},selectedId:'',dirty:false,sha:null,token:null,remote:null,loading:false};
const repoFile='data/catalogo.json';

function flash(message,type='info'){
  const node=$('statusMessage');node.textContent=message;node.hidden=false;node.className=`feedback ${type==='error'?'error':type==='success'?'success':''}`;node.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function setDirty(){state.dirty=true;$('pushGitHub').textContent=state.remote?'Publicar cambios en GitHub · pendientes':'Publicar cambios en GitHub';updateCounts();}
function updateCounts(){
  $('activeCount').textContent=state.catalog.products.filter(p=>p.available!==false).length;
  $('productCount').textContent=`(${state.catalog.products.length})`;
}
function listProducts(){
  const search=$('adminSearch').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const category=$('adminCategory').value;
  const matches=state.catalog.products.filter(p=>(category==='Todas'||category===p.category)&&[p.name,p.category,p.description].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search));
  $('productsList').innerHTML=matches.map(p=>`<button type="button" class="list-item ${state.selectedId===p.id?'selected':''}" data-edit="${safe(p.id)}"><span>${imagePath(p.image)?`<img src="${p.image}" alt="" loading="lazy">`:'<span class="list-placeholder">BOB</span>'}</span><span class="list-copy"><strong>${safe(p.name)}${p.available===false?' <span class="hidden-pill">Oculto</span>':''}</strong><small>${safe(p.category)}</small></span><span class="list-price">${money(p.price)}</span></button>`).join('')||'<p style="padding:20px;color:#718590">No se encontraron productos.</p>';
  updateCounts();
}
function resetForm(){
  state.selectedId='';$('productForm').reset();$('productId').value='';$('productAvailable').checked=true;
  $('editTitle').textContent='Nuevo producto';$('deleteProduct').disabled=true;listProducts();
}
function selectProduct(id){
  const p=state.catalog.products.find(p=>p.id===id);if(!p)return;
  state.selectedId=p.id;$('productId').value=p.id;$('productName').value=p.name;$('productCategory').value=p.category;$('productPrice').value=p.price;$('productDescription').value=p.description||'';
  $('productImage').value=imagePath(p.image);$('productAvailable').checked=p.available!==false;
  $('editTitle').textContent='Editar producto';$('deleteProduct').disabled=false;listProducts();
  if(window.innerWidth<1000)document.querySelector('.edit-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
function nextId(){const max=Math.max(0,...state.catalog.products.map(p=>Number(String(p.id).match(/^pb-(\d+)$/)?.[1])||0));return `pb-${String(max+1).padStart(3,'0')}`;}
function saveProduct(event){
  event.preventDefault();
  const name=$('productName').value.trim(),category=$('productCategory').value,price=Number($('productPrice').value),description=$('productDescription').value.trim();
  if(!name||!categories.includes(category)||!Number.isInteger(price)||price<0||price>10000000){flash('Revisa nombre, categoría y precio. El precio debe ser un número entero válido.','error');return;}
  const previous=state.catalog.products.find(p=>p.id===state.selectedId);
  const product={id:previous?.id||nextId(),category,name,price,description,image:$('productImage').value,available:$('productAvailable').checked};
  if(previous){if(previous.options)product.options=previous.options;Object.assign(previous,product);}else state.catalog.products.push(product);
  setDirty();selectProduct(product.id);flash(previous?'Producto actualizado en esta sesión. Recuerda descargar o publicar el JSON.':'Producto creado. Recuerda descargar o publicar el JSON.','success');
}
function deleteProduct(){
  const product=state.catalog.products.find(p=>p.id===state.selectedId);
  if(!product)return;
  if(!confirm(`¿Eliminar definitivamente «${product.name}» del catálogo? Si solo quieres ocultarlo, desmarca «Visible en el catálogo público».`))return;
  state.catalog.products=state.catalog.products.filter(p=>p.id!==product.id);setDirty();resetForm();flash('Producto eliminado de esta sesión. Recuerda descargar o publicar el JSON.','success');
}
function validateCatalog(catalog){
  if(!catalog||!Array.isArray(catalog.products)||!catalog.products.length)throw new Error('El JSON debe contener una lista products no vacía.');
  const seen=new Set();
  for(const p of catalog.products){
    if(!p||typeof p.id!=='string'||!p.id.trim()||seen.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!categories.includes(p.category)||!Number.isInteger(p.price)||p.price<0||typeof p.available!=='boolean')throw new Error('Hay productos con identificadores duplicados o campos inválidos.');
    seen.add(p.id);
    if(p.options&&(!Array.isArray(p.options.values)||typeof p.options.label!=='string'))throw new Error('Formato de opciones inválido.');
  }
  return catalog;
}
function downloadCatalog(){
  const output={...state.catalog,lastUpdated:new Date().toISOString().slice(0,10)};
  const blob=new Blob([JSON.stringify(output,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='catalogo.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  flash('Archivo catalogo.json descargado. Reemplaza data/catalogo.json en tu repositorio para aplicar esta versión.','success');
}
function base64EncodeUnicode(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
function base64DecodeUnicode(text){const binary=atob(text.replace(/\s+/g,''));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
function apiUrl(){if(!state.remote)throw new Error('Conecta el repositorio antes de publicar.');const {owner,repo,branch}=state.remote;return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${repoFile}?ref=${encodeURIComponent(branch)}`;}
function authHeaders(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${state.token}`,'X-GitHub-Api-Version':'2022-11-28'};}
async function parseApiError(response){
  let responseText='';try{responseText=(await response.json()).message||'';}catch{}
  const prefix=response.status===401?'Token inválido o vencido.':response.status===403?'Permisos insuficientes o acceso restringido.':response.status===404?'No se encontró el repositorio, la rama o el archivo data/catalogo.json.':response.status===409?'Conflicto: la versión remota cambió. Vuelve a conectar antes de intentar publicar.':`GitHub respondió ${response.status}.`;
  throw new Error(`${prefix} ${responseText}`.trim());
}
function setConnected(connected){
  $('connectStatus').classList.toggle('connected',connected);$('connectStatus').textContent=connected?`Conectado: ${state.remote.owner}/${state.remote.repo}`:'Sin conectar';
  $('pushGitHub').disabled=!connected;$('disconnectGitHub').disabled=!connected;$('connectGitHub').textContent=connected?'Volver a cargar desde GitHub':'Conectar y cargar catálogo remoto';
}
async function connect(event){
  event.preventDefault();
  if(state.loading)return;
  if(state.dirty&&!confirm('Tienes cambios locales sin publicar. Conectar a GitHub reemplazará esta versión en memoria. Descarga el JSON si quieres conservarla. ¿Continuar?'))return;
  const owner=$('repoOwner').value.trim(),repo=$('repoName').value.trim(),branch=$('repoBranch').value.trim(),token=$('githubToken').value.trim();
  if(!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo)||!/^[\w./-]+$/.test(branch)||!token){flash('Revisa el usuario, el repositorio, la rama y el token.','error');return;}
  state.loading=true;$('connectGitHub').disabled=true;
  const previous={token:state.token,remote:state.remote,sha:state.sha};
  state.token=token;state.remote={owner,repo,branch};$('githubToken').value='';
  try{
    const response=await fetch(apiUrl(),{headers:authHeaders(),cache:'no-store'});
    if(!response.ok)await parseApiError(response);
    const body=await response.json();const catalog=validateCatalog(JSON.parse(base64DecodeUnicode(body.content)));
    state.catalog=catalog;state.sha=body.sha;state.dirty=false;resetForm();setConnected(true);flash(`Catálogo de ${owner}/${repo} cargado correctamente. Ya puedes editar y publicar cambios.`, 'success');
  }catch(error){state.token=previous.token;state.remote=previous.remote;state.sha=previous.sha;setConnected(!!previous.remote);flash(`No fue posible conectar: ${error.message}`,'error');}
  finally{state.loading=false;$('connectGitHub').disabled=false;}
}
async function push(){
  if(!state.token||!state.remote||!state.sha)return flash('Primero conecta el repositorio y carga el archivo remoto.','error');
  if(state.loading)return;
  if(!confirm(`¿Publicar ${state.catalog.products.length} productos en ${state.remote.owner}/${state.remote.repo} (${state.remote.branch})?`))return;
  state.loading=true;$('pushGitHub').disabled=true;
  try{
    validateCatalog(state.catalog);
    const output={...state.catalog,lastUpdated:new Date().toISOString().slice(0,10)};
    const encoded=base64EncodeUnicode(JSON.stringify(output,null,2)+'\n');
    const url=apiUrl().split('?')[0];
    const response=await fetch(url,{method:'PUT',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({message:'Actualizar productos y precios de Pizza\'s Bob',content:encoded,sha:state.sha,branch:state.remote.branch})});
    if(!response.ok)await parseApiError(response);
    const body=await response.json();state.sha=body.content?.sha||state.sha;state.catalog=output;state.dirty=false;flash('Cambios enviados a GitHub correctamente. GitHub Pages puede tardar unos minutos en reflejarlos.','success');$('pushGitHub').textContent='Publicar cambios en GitHub';
  }catch(error){flash(`No se pudo publicar: ${error.message}`,'error');}
  finally{state.loading=false;$('pushGitHub').disabled=!state.remote;}
}
function disconnect(){state.token=null;state.remote=null;state.sha=null;setConnected(false);$('githubToken').value='';flash('Desconectado. El token se eliminó de la memoria de esta página.','success');}

async function loadLocal(){
  try{
    const response=await fetch('data/catalogo.json',{cache:'no-store'});if(!response.ok)throw new Error(`Error HTTP ${response.status}`);
    state.catalog=validateCatalog(await response.json());resetForm();
  }catch(error){flash(`No se pudo abrir el catálogo. Si ejecutas el archivo localmente, utiliza un servidor HTTP. ${error.message}`,'error');}
}
async function importJson(event){
  const file=event.target.files?.[0];if(!file)return;
  try{
    const catalog=validateCatalog(JSON.parse(await file.text()));
    if(state.dirty&&!confirm('Importar reemplazará los cambios que hiciste en esta sesión. ¿Continuar?'))return;
    state.catalog=catalog;setDirty();resetForm();flash(`Se importaron ${catalog.products.length} productos. Revisa los cambios antes de publicar.`,'success');
  }catch(error){flash(`No se pudo importar: ${error.message}`,'error');}finally{$('importFile').value='';}
}
document.addEventListener('DOMContentLoaded',()=>{
  for(const category of categories){$('productCategory').add(new Option(category,category));$('adminCategory').add(new Option(category,category));}
  for(const image of images)$('productImage').add(new Option(image.replaceAll('-',' '),`assets/img/${image}.webp`));
  $('productForm').addEventListener('submit',saveProduct);
  $('deleteProduct').addEventListener('click',deleteProduct);
  $('resetEditor').addEventListener('click',resetForm);
  $('newProduct').addEventListener('click',()=>{resetForm();if(window.innerWidth<1000)document.querySelector('.edit-panel').scrollIntoView({behavior:'smooth'});});
  $('productsList').addEventListener('click',event=>{const button=event.target.closest('[data-edit]');if(button)selectProduct(button.dataset.edit);});
  $('adminSearch').addEventListener('input',listProducts);$('adminCategory').addEventListener('change',listProducts);
  [$('exportJson'),$('exportTop')].forEach(button=>button.addEventListener('click',downloadCatalog));
  $('importJson').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',importJson);
  $('githubForm').addEventListener('submit',connect);$('pushGitHub').addEventListener('click',push);$('disconnectGitHub').addEventListener('click',disconnect);
  window.addEventListener('pagehide',()=>{state.token=null;});
  loadLocal();
});
