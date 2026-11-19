'use strict';
const WHATSAPP = '573213013467';
const currency = value => `$${new Intl.NumberFormat('es-CO').format(value)}`;
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const safeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeImage = value => /^assets\/img\/[a-z0-9-]+\.webp$/i.test(value || '') ? value : '';
const categories = ['Todas','Pizzas','Hamburguesas de res','Pollo apanado','Perros calientes','Salchipapas','Especiales','Bebidas'];
const icons = {'Todas':'✳','Pizzas':'◉','Hamburguesas de res':'≋','Pollo apanado':'≋','Perros calientes':'〰','Salchipapas':'✦','Especiales':'★','Bebidas':'◌'};
const state = {products:[],category:'Todas',query:'',sort:'featured',visible:12,cart:[],optionProduct:null};
const $ = id => document.getElementById(id);

function renderFilters() {
  $('categoryFilters').innerHTML = categories.map(category => `<button type="button" class="filter-chip ${state.category===category?'active':''}" data-category="${safeText(category)}" aria-pressed="${state.category===category}"><span aria-hidden="true">${icons[category]} </span>${safeText(category)}</button>`).join('');
}
function displayProducts() {
  let items=state.products.filter(product=>product.available!==false && (state.category==='Todas'||product.category===state.category) && normalize([product.name,product.description,product.category].join(' ')).includes(normalize(state.query)));
  if (state.sort==='priceAsc') items.sort((a,b)=>a.price-b.price);
  else if (state.sort==='priceDesc') items.sort((a,b)=>b.price-a.price);
  else if (state.sort==='name') items.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const total=items.length;
  const shown=items.slice(0,state.visible);
  $('resultCount').textContent=`${total} producto${total===1?'':'s'} disponible${total===1?'':'s'}`;
  $('catalogEmpty').hidden=total!==0;
  $('loadMore').hidden=state.visible>=total;
  $('productGrid').innerHTML=shown.map(product=>{
    const image=safeImage(product.image);
    const media=image?`<img src="${image}" alt="Fotografía ilustrativa de ${safeText(product.category)}" loading="lazy">`:`<div class="product-photo product-photo-placeholder"><span class="placeholder-mark" aria-hidden="true">BOB</span><small>${safeText(product.category)}</small></div>`;
    return `<article class="product-card"><div class="product-photo">${media}<span class="product-tag">${safeText(product.category)}</span></div><div class="product-body"><span class="product-category">PIZZA'S BOB</span><h3>${safeText(product.name)}</h3><p class="product-description">${safeText(product.description||'Consulta los detalles al realizar tu pedido.')}</p><div class="product-footer"><strong class="product-price">${currency(product.price)}</strong><button type="button" class="add-button" data-add="${safeText(product.id)}" aria-label="Agregar ${safeText(product.name)} al pedido"><span aria-hidden="true">+</span><span class="add-label">Agregar</span></button></div></div></article>`;
  }).join('');
}
function selectCategory(category) {state.category=categories.includes(category)?category:'Todas';state.visible=12;renderFilters();displayProducts();}
function addToCart(product,option='') {
  const key=product.id+'|'+option;
  const previous=state.cart.find(item=>item.key===key);
  if (previous) previous.quantity++;
  else state.cart.push({key,id:product.id,name:product.name,price:product.price,option,quantity:1});
  renderCart();
  const buttons=document.querySelectorAll(`[data-add="${CSS.escape(product.id)}"]`);
  buttons.forEach(button=>{button.classList.add('was-added');const label=button.querySelector('.add-label');if(label)label.textContent='¡Listo!';setTimeout(()=>{button.classList.remove('was-added');if(label)label.textContent='Agregar';},900);});
}
function handleAdd(id) {
  const product=state.products.find(p=>p.id===id&&p.available!==false);
  if(!product)return;
  if(product.options?.values?.length){
    state.optionProduct=product;
    $('optionsTitle').textContent=product.name;
    $('optionsLabel').textContent=product.options.label||'Opción';
    $('optionsSelect').innerHTML='<option value="" selected disabled>Selecciona un sabor</option>'+product.options.values.map(v=>`<option value="${safeText(v)}">${safeText(v)}</option>`).join('');
    $('optionsDialog').showModal();
    $('optionsSelect').focus();
  }else addToCart(product);
}
function renderCart(){
  const count=state.cart.reduce((sum,item)=>sum+item.quantity,0);
  const total=state.cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  $('cartCount').textContent=count;
  $('floatingCount').textContent=count;
  $('cartTotal').textContent=currency(total);
  $('sendOrder').disabled=count===0;
  $('cartEmpty').hidden=count>0;
  $('cartItems').innerHTML=state.cart.map(item=>`<div class="cart-line"><div><div class="cart-line-name">${safeText(item.name)}</div>${item.option?`<div class="cart-line-option">${safeText(item.option)}</div>`:''}<div class="cart-line-controls"><button type="button" class="qty-button" data-change="${safeText(item.key)}" data-delta="-1" aria-label="Restar una unidad">−</button><strong>${item.quantity}</strong><button type="button" class="qty-button" data-change="${safeText(item.key)}" data-delta="1" aria-label="Agregar una unidad">+</button><button type="button" class="remove-button" data-remove="${safeText(item.key)}">Quitar</button></div></div><strong class="cart-line-price">${currency(item.price*item.quantity)}</strong></div>`).join('');
}
function changeQuantity(key,delta){const item=state.cart.find(item=>item.key===key);if(!item)return;item.quantity+=delta;if(item.quantity<=0)state.cart=state.cart.filter(other=>other!==item);renderCart();}
function openCart(){document.body.classList.add('drawer-open');$('cartOverlay').hidden=false;$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');$('closeCart').focus();}
function closeCart(){document.body.classList.remove('drawer-open');$('cartOverlay').hidden=true;$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');}
function getOrderMessage(){
  const total=state.cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const lines=['Hola, quiero consultar este pedido de Pizza\'s Bob:','',...state.cart.map(item=>`• ${item.quantity} × ${item.name}${item.option?` (${item.option})`:''} — ${currency(item.quantity*item.price)}`),'',`Subtotal de productos: ${currency(total)}`];
  const name=$('customerName').value.trim(),address=$('customerAddress').value.trim();
  if(name)lines.push(`Nombre: ${name}`);
  if(address)lines.push(`Dirección / indicaciones: ${address}`);
  lines.push('','Por favor, confirmen disponibilidad y valor final, incluido domicilio si aplica. ¡Gracias!');
  return lines.join('\n');
}
function sendOrder(){if(!state.cart.length)return;const url=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(getOrderMessage())}`;window.open(url,'_blank','noopener,noreferrer');}

async function loadCatalog(){
  try{
    const response=await fetch('data/catalogo.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Error HTTP ${response.status}`);
    const catalog=await response.json();
    if(!Array.isArray(catalog.products))throw new Error('Formato de catálogo incorrecto');
    state.products=catalog.products.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(p.price)&&p.price>=0);
    renderFilters();displayProducts();
  }catch(error){$('resultCount').textContent='No se pudo cargar el menú';$('productGrid').innerHTML='<p>Comprueba tu conexión o abre este sitio mediante un servidor local. Si el problema continúa, contacta al establecimiento.</p>';console.error('Error al cargar el catálogo:',error);}
}

document.addEventListener('DOMContentLoaded',()=>{
  $('year').textContent=new Date().getFullYear();
  $('menuToggle').addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
  $('mainNav').addEventListener('click',e=>{if(e.target.closest('a')){$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}});
  $('categoryFilters').addEventListener('click',e=>{const chip=e.target.closest('[data-category]');if(chip)selectCategory(chip.dataset.category);});
  $('catalogSearch').addEventListener('input',e=>{state.query=e.target.value;state.visible=12;displayProducts();});
  $('sortProducts').addEventListener('change',e=>{state.sort=e.target.value;state.visible=12;displayProducts();});
  $('loadMore').addEventListener('click',()=>{state.visible+=12;displayProducts();});
  $('clearFilters').addEventListener('click',()=>{$('catalogSearch').value='';state.query='';selectCategory('Todas');});
  $('productGrid').addEventListener('click',e=>{const button=e.target.closest('[data-add]');if(button)handleAdd(button.dataset.add);});
  document.querySelectorAll('[data-go-category]').forEach(link=>link.addEventListener('click',()=>{selectCategory(link.dataset.goCategory);$('catalogSearch').value='';state.query='';displayProducts();}));
  [$('openCart'),$('floatingCart'),$('ctaCart')].forEach(button=>button.addEventListener('click',openCart));
  [$('closeCart'),$('cartOverlay')].forEach(button=>button.addEventListener('click',closeCart));
  $('cartItems').addEventListener('click',e=>{const change=e.target.closest('[data-change]');const remove=e.target.closest('[data-remove]');if(change)changeQuantity(change.dataset.change,Number(change.dataset.delta));if(remove){state.cart=state.cart.filter(i=>i.key!==remove.dataset.remove);renderCart();}});
  $('sendOrder').addEventListener('click',sendOrder);
  $('confirmOption').addEventListener('click',()=>{if(!state.optionProduct)return;if(!$('optionsSelect').value){$('optionsSelect').reportValidity();return;}addToCart(state.optionProduct,`${state.optionProduct.options.label}: ${$('optionsSelect').value}`);$('optionsDialog').close();state.optionProduct=null;});
  $('optionsDialog').addEventListener('close',()=>{state.optionProduct=null;});
  document.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{$('photoFull').src=button.dataset.lightbox;$('photoFull').alt=button.dataset.alt;$('photoCaption').textContent=button.dataset.alt;$('photoDialog').showModal();}));
  $('closePhoto').addEventListener('click',()=>$('photoDialog').close());
  $('photoDialog').addEventListener('click',e=>{if(e.target===$('photoDialog'))$('photoDialog').close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cartDrawer').classList.contains('open'))closeCart();});
  loadCatalog();
});
