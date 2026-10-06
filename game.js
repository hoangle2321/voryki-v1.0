import {createState,act,advanceTime,getQuestObjective,getSummary,countItem,serializeState,deserializeState,cropProgress,ITEMS,CROPS,SHOP} from './game-state.js';
import {WORLD,OBJECTS,validFoot,nearbyPoint,findPath} from './map-data.js';
import {iconSvg,iconURL} from './icons.js';
import {showScreen,toast,refreshContinue} from './shell.js';

const QA=new URLSearchParams(location.search).has('test');
const SAVE_KEY=QA?'voryki.qa.save.v3':'voryki.save.v3',game=document.getElementById('game');
game.innerHTML=`<canvas id="worldCanvas" width="960" height="540" tabindex="0" aria-label="Bản đồ Greenwake. WASD di chuyển, E tương tác."></canvas>
 <div class="game-hud"><div class="hud-top"><div class="location-card"><strong>Greenwake Vale</strong><small id="clockLabel">Nông trại ven sông · Ngày 1 · 08:00</small></div><div class="status-card"><span class="hud-gold" id="goldLabel"></span><div><div class="energy-label" id="energyLabel"></div><div class="energy-bar"><i id="energyFill"></i></div></div><button class="hud-button" id="pauseButton" aria-label="Tạm dừng">Ⅱ</button></div></div>
 <button class="quest-card" id="questButton"><span class="quest-eyebrow">HÀNH TRÌNH ĐẦU TIÊN · J</span><strong id="questTitle"></strong><p id="questText"></p></button><div class="save-status" id="saveStatus">Lưu tự động</div><div class="pet-badge" id="petBadge" hidden>◆ V01 · Bạn đồng hành</div>
 <button class="context-prompt" id="contextPrompt" hidden><kbd>E</kbd><span></span></button><div class="hud-bottom"><div class="hotbar" id="hotbar" aria-label="Công cụ và hạt giống"></div><div class="hud-help"><span><kbd>WASD</kbd> Di chuyển · <kbd>E</kbd> Tương tác · Nhấp để đi</span><div class="hud-menu"><button id="bagButton">B · Túi đồ</button><button id="mapButton">M · Bản đồ</button><button id="petsButton">V · Linh thú</button><button id="helpButton">? · Hướng dẫn</button></div></div></div></div>
 <div class="map-loading" id="mapLoading" hidden>Đang mở thung lũng…</div><div id="gameModal" class="game-modal" hidden role="dialog" aria-modal="true" aria-label="Tương tác"><div id="gamePanel" class="game-panel"></div></div>`;
const $=id=>document.getElementById(id),canvas=$('worldCanvas'),ctx=canvas.getContext('2d'),modal=$('gameModal'),panel=$('gamePanel');
let state=null,art,atlas,frames,icons={},active=false,keys=new Set(),path=[],autoTarget=null,camera={x:0,y:0},nearest=null,selectedTool=0,modalState=null,chosenSlot=0,bagFilter='all',moving=false,last=0,walkTime=0,saveTime=0,trail=[],wild={x:997,y:564,facing:'left'},follower={x:730,y:612,facing:'up'},loading=false;
const hotItems=['hand','axe','pickaxe','hoe','watering_can','carrot_seed','wheat_seed','berry_seed'];
const hotNames=['Tương tác','Rìu','Cuốc chim','Cuốc đất','Bình tưới','Hạt củ cải','Hạt lúa mì','Hạt quả mọng'];
const imageLoad=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Không mở được ${src}`));img.src=src;});
let assetPromise;
function loadAssets(){
 if(assetPromise)return assetPromise;
 assetPromise=Promise.all([imageLoad('assets/map.png'),imageLoad('assets/sprites.png'),fetch('assets/sprites.json').then(r=>{if(!r.ok)throw Error('Bộ chuyển động chưa tải được.');return r.json();}),...Object.keys(ITEMS).concat(['axe','pickaxe','hoe','watering_can','hand','gold']).map(async id=>{icons[id]=await imageLoad(iconURL(id));})]).then(([m,s,f])=>{art=m;atlas=s;frames=f;}).catch(error=>{assetPromise=null;throw error;});return assetPromise;
}
loadAssets().catch(()=>{});
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function live(){return active&&state&&window.VorykiShell.currentScreen==='game';}
function save(announce=false){
 if(!state)return false;
 try{state.session.screen='game';localStorage.setItem(SAVE_KEY,serializeState(state));$('saveStatus').textContent='✓ Đã lưu';refreshContinue();if(announce)toast('Đã lưu hành trình trên máy này.');return true;}catch(error){$('saveStatus').textContent='Chưa lưu được';toast('Chưa lưu được tiến độ. Hãy xuất bản lưu trong menu tạm dừng.');console.error(error);return false;}
}
function closeModal(){modal.hidden=true;modalState=null;keys.clear();game.querySelector('.game-hud').inert=false;canvas.inert=false;canvas.focus({preventScroll:true});}
function openPanel(type,data={}){keys.clear();path=[];autoTarget=null;modalState={type,...data};modal.hidden=false;game.querySelector('.game-hud').inert=true;canvas.inert=true;renderModal();panel.querySelector('button')?.focus({preventScroll:true});}
function dialogue(speaker,text,choices=[],after=null){openPanel('dialogue',{speaker,pages:Array.isArray(text)?text:[text],page:0,choices,after});}
function execute(action,payload={},feedback=true){const r=act(state,action,payload);if(feedback&&r.message)toast(r.message);if(r.ok){save();updateHUD();}return r;}
function feedback(message){const p=$('panelFeedback');if(p)p.textContent=message;else toast(message);}
function nextDialogue(){if(!modalState||modalState.type!=='dialogue')return;if(modalState.page<modalState.pages.length-1){modalState.page++;renderModal();}else if(!modalState.choices.length){const after=modalState.after;closeModal();if(after)after();}}
function titleMarkup(title,sub=''){return `<header class="panel-heading"><div><h2>${escapeHTML(title)}</h2>${sub?`<span>${escapeHTML(sub)}</span>`:''}</div><button class="close-panel" data-do="close" aria-label="Đóng">✕</button></header>`;}
function button(text,fn,primary=false,disabled=false){return {text,fn,primary,disabled};}
let callbacks=[];
function actionMarkup(actions){callbacks=actions;return `<div class="action-buttons">${actions.map((a,i)=>`<button data-call="${i}"${a.primary?' class="primary"':''}${a.disabled?' disabled':''}>${escapeHTML(a.text)}</button>`).join('')}</div>`;}
function renderModal(){
 if(!modalState)return;callbacks=[];panel.className='game-panel';
 const type=modalState.type;
 if(type==='dialogue'){
  panel.classList.add('dialogue-panel');const d=modalState,isLast=d.page===d.pages.length-1;
  const choices=isLast&&d.choices.length?d.choices:[button(isLast?'Đã hiểu · E':'Tiếp tục · E',nextDialogue,true)];
  panel.innerHTML=`<div class="dialogue-name">${escapeHTML(d.speaker)}</div><p>${escapeHTML(d.pages[d.page])}</p>${actionMarkup(choices)}`;
 }else if(type==='bag'||type==='chest')renderInventory(type);
 else if(type==='shop')renderShop();
 else if(type==='plot')renderPlot(modalState.object);
 else if(type==='home')renderHome();
 else if(type==='quest')renderQuest();
 else if(type==='map')renderWorldMap();
 else if(type==='pets')renderPets();
 else if(type==='pause')renderPause();
 else if(type==='help')renderHelp();
 panel.querySelectorAll('[data-call]').forEach(b=>b.onclick=()=>callbacks[Number(b.dataset.call)]?.fn());
 panel.querySelector('[data-do="close"]')?.addEventListener('click',closeModal);
 panel.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{bagFilter=b.dataset.filter;renderModal();});
 panel.querySelectorAll('[data-slot]').forEach(b=>{
  b.onclick=()=>{chosenSlot=Number(b.dataset.slot);renderModal();};
  b.ondragstart=e=>e.dataTransfer.setData('text/voryki-slot',b.dataset.slot);
  b.ondragover=e=>e.preventDefault();
  b.ondrop=e=>{e.preventDefault();const v=e.dataTransfer.getData('text/voryki-slot');if(v==='')return;const r=execute('move_slot',{from:Number(v),to:Number(b.dataset.slot)},false);if(r.ok){chosenSlot=Number(b.dataset.slot);renderModal();}else feedback(r.message);};
 });
 const importInput=$('importSave');if(importInput)importInput.onchange=importSave;
 if(type==='pets'&&state.quest.friend){const c=$('petPreview');if(c){c.width=140;c.height=140;drawSprite(c.getContext('2d'),'V01','down',0,70,126,.65);}}
}
function inventorySlots(slots,container='inventory'){
 return slots.map((slot,i)=>{
  const visible=!slot||bagFilter==='all'||(bagFilter==='farm'&&['farm','seed'].includes(ITEMS[slot.id].category))||ITEMS[slot.id].category===bagFilter;
  return `<button class="inventory-slot${chosenSlot===i&&container==='inventory'?' active':''}" ${container==='inventory'?`data-slot="${i}"${slot?' draggable="true"':''}`:`data-chest="${i}"`} title="${slot&&visible?escapeHTML(ITEMS[slot.id].name):'Ô trống'}">${slot&&visible?iconSvg(slot.id)+`<span class="slot-count">${slot.locked?'◆ ':''}${slot.quantity}</span><span class="slot-label">${ITEMS[slot.id].name}</span>`:''}</button>`;
 }).join('');
}
function renderInventory(type){
 const isChest=type==='chest',slot=state.inventory[chosenSlot],item=slot?ITEMS[slot.id]:null;panel.classList.toggle('wide',isChest);
 let actions=[];
 if(slot){
  if(item.energy)actions.push(button(`Ăn · +${item.energy} năng lượng`,()=>{const r=execute('eat',{itemId:slot.id},false);renderModal();feedback(r.message);}));
  actions.push(button(slot.locked?'Bỏ khóa':'Khóa vật phẩm',()=>{execute('lock_slot',{index:chosenSlot},false);renderModal();}));
  if(slot.quantity>1)actions.push(button('Tách một nửa',()=>{const to=state.inventory.findIndex(s=>s===null);const r=execute('split_slot',{from:chosenSlot,to,quantity:Math.floor(slot.quantity/2)},false);renderModal();feedback(r.message);}));
  if(isChest)actions.push(button('Cất vào rương',()=>{const r=execute('transfer',{itemId:slot.id,quantity:slot.quantity,to:'chest'},false);renderModal();feedback(r.message);},true,slot.locked));
 }
 actions.push(button('Sắp xếp túi',()=>{execute('sort',{},false);renderModal();}));
 panel.innerHTML=titleMarkup(isChest?'Rương nông trại':'Túi đồ',`${state.inventory.filter(Boolean).length} / 30 ô · ${state.gold} vàng`)+
  `<div class="inventory-toolbar"><span>${isChest?'Cất đồ trước chuyến đi':'Kéo thả để đổi ô hoặc gộp chồng'}</span><nav class="inventory-tabs"><button data-filter="all" class="${bagFilter==='all'?'active':''}">Tất cả</button><button data-filter="resource" class="${bagFilter==='resource'?'active':''}">Tài nguyên</button><button data-filter="farm" class="${bagFilter==='farm'?'active':''}">Nông trại</button><button data-filter="food" class="${bagFilter==='food'?'active':''}">Thức ăn</button></nav></div>
  <div class="inventory-layout"><div><div class="inventory-grid">${inventorySlots(state.inventory)}</div><div class="inventory-tools">${hotItems.slice(1,5).map((id,i)=>`<span>${iconSvg(id)}${hotNames[i+1]}</span>`).join('')}</div></div><div class="inventory-description">${isChest?`<h3>Rương · ${state.chest.filter(Boolean).length} / 30</h3><p class="muted">Nhấp vật phẩm trong rương để lấy một món về túi.</p><div class="inventory-grid">${inventorySlots(state.chest,'chest')}</div>`:`<div class="item-icon">${item?iconSvg(slot.id):''}</div><h3>${item?item.name:'Chọn một vật phẩm'}</h3><p>${item?item.description:'Túi mang theo tài nguyên, hạt giống và thức ăn. Công cụ có ngăn riêng.'}</p>${item?`<p class="muted">Giá bán: ${item.sell} vàng / món<br>Chồng tối đa: ${item.stack} · ${slot.locked?'Đã khóa':'Chưa khóa'}</p>`:''}`}${actionMarkup(actions)}</div></div><div id="panelFeedback" class="panel-feedback" role="status"></div>`;
 panel.querySelectorAll('[data-chest]').forEach(b=>b.onclick=()=>{const s=state.chest[Number(b.dataset.chest)];if(s){const r=execute('transfer',{itemId:s.id,quantity:1,to:'inventory'},false);renderModal();feedback(r.message);}});
}
function renderShop(){
 const buy=modalState.shopTab!=='sell',list=buy?SHOP:Object.keys(ITEMS).filter(id=>countItem(state,id)>0);
 const actions=[button(buy?'Chuyển sang bán':'Chuyển sang mua',()=>{modalState.shopTab=buy?'sell':'buy';renderModal();}),button('Rời cửa hàng',closeModal)];
 panel.innerHTML=titleMarkup('Cửa hàng Greenwake',`${state.gold} vàng · Mở cửa 06:00–20:00`)+`<p class="muted">${buy?'Chọn hạt giống cho nông trại, thức ăn hoặc vật liệu còn thiếu.':'Bán nông sản và nguyên liệu bạn mang theo. Đồ khóa được giữ lại.'}</p><div class="shop-list">${list.length?list.map(id=>{const item=ITEMS[id],qty=countItem(state,id);return `<div class="shop-row"><div class="item-icon">${iconSvg(id)}</div><div class="shop-copy"><strong>${item.name}</strong><small>${buy?item.buy:item.sell} vàng / món · Trong túi ${qty}</small></div><button data-trade="${id}">${buy?'Mua':'Bán'} 1</button><button data-trade-five="${id}">${buy?'Mua':'Bán'} 5</button></div>`;}).join(''):'<p>Túi chưa có đồ để bán.</p>'}</div>${actionMarkup(actions)}<div id="panelFeedback" class="panel-feedback" role="status"></div>`;
 for(const b of panel.querySelectorAll('[data-trade],[data-trade-five]'))b.onclick=()=>{const itemId=b.dataset.trade||b.dataset.tradeFive;const r=execute(buy?'buy':'sell',{itemId,quantity:b.dataset.trade?1:5},false);renderModal();feedback(r.message);};
}
function renderPlot(object){
 const plot=state.plots[object.id],p=cropProgress(state,object.id);let actions=[],text;
 if(!plot.tilled){text='Xới đất để chuẩn bị gieo hạt. Cuốc đất nằm sẵn trong bộ công cụ.';actions.push(button('Xới đất · −3 năng lượng',()=>plotAction('till',object),true));}
 else if(!p){text=object.id==='river_berry'?'Gieo quả mọng ở đây để tạo một nơi an toàn cho V01.':'Đất đã tơi. Chọn loại hạt muốn gieo.';for(const [id,crop]of Object.entries(CROPS)){if(object.id==='river_berry'&&id!=='berry')continue;actions.push(button(`Gieo ${crop.name.toLowerCase()} · ${countItem(state,crop.seed)} hạt`,()=>plotAction('plant',object,{cropId:id}),true,countItem(state,crop.seed)<1));}}
 else if(p.ready){text=`${p.name} đã chín. Thu hoạch được ${CROPS[p.id].yield} sản phẩm.`;actions.push(button('Thu hoạch',()=>plotAction('harvest',object),true));}
 else {text=`${p.name} · ${Math.round(p.ratio*100)}% trưởng thành. Còn ${Math.ceil(p.remaining)} phút được tưới trong game. ${p.watered?'Đã tưới hôm nay.':'Đất đang khô; cần tưới hôm nay.'}`;actions.push(button(p.watered?'Đã tưới hôm nay':'Tưới nước · −2 năng lượng',()=>plotAction('water',object),true,p.watered));}
 actions.push(button('Quay lại',closeModal));
 panel.innerHTML=titleMarkup(object.label)+`<p>${text}</p><p class="muted">Cây lớn theo thời gian trong game, khi đất đủ nước. Ngủ giúp chuyển sang sáng hôm sau; cây còn non cần tưới lại mỗi ngày.</p>${actionMarkup(actions)}<div id="panelFeedback" class="panel-feedback" role="status"></div>`;
}
function plotAction(action,o,payload={}){const r=execute(action,{plotId:o.id,...payload},false);renderModal();feedback(r.message);}
function renderHome(){
 const upgraded=state.upgrades.house===1;
 const actions=[button('Nghỉ đến sáng mai',()=>{const r=execute('sleep',{},false);state.player.x=270;state.player.y=442;cameraSnap();save();closeModal();dialogue('NGƯỜI DẪN TRUYỆN',[r.message,state.quest.returned&&!state.quest.friend?'Bên bờ sông, bụi cỏ khẽ lay động. Có lẽ bóng xanh ấy đã quay lại.':'Một ngày mới bắt đầu. Những luống cây vẫn chờ bạn chăm sóc.']);},true),button(upgraded?'Nhà đã được tu sửa':'Tu sửa nhà · 120 vàng + 12 gỗ + 6 đá',()=>{const r=execute('upgrade_house',{},false);renderModal();feedback(r.message);},false,upgraded),button('Quay lại',closeModal)];
 panel.innerHTML=titleMarkup('Căn nhà nông trại',upgraded?'Nhà đã được tu sửa':'Nơi nghỉ ngơi giữa những chuyến đi')+`<p>Giường ngủ giúp hồi đầy năng lượng và chuyển sang 06:00 sáng. Tiến độ sẽ được lưu sau khi nghỉ.</p><p class="muted">${upgraded?'Bạn đã sửa mái, gia cố tường và biến căn nhà này thành một nơi để trở về.':'Tu sửa căn nhà bằng vật liệu tích góp. Bạn có thể cất đồ trong rương cạnh cổng nông trại.'}</p>${actionMarkup(actions)}<div id="panelFeedback" class="panel-feedback" role="status"></div>`;
}
function renderQuest(){
 const q=state.quest,steps=[['seen','Nhìn thấy V01 bên dòng sông'],['accepted','Hỏi người trông vườn và nhận hạt quả mọng'],['tracks','Quan sát dấu chân nhỏ'],['channelInspected','Kiểm tra máng nước cũ'],['channelFixed','Sửa máng · 6 gỗ và 3 đá'],['bankCleared','Dọn vật cản ở bờ sông'],['berryPlanted','Xới luống ven sông và gieo quả mọng'],['berryWatered','Tưới cây quả mọng'],['returned','Nghỉ qua đêm; cây đủ lớn để V01 quay lại'],['friend','Nhẹ nhàng đưa tay để kết bạn']];let first=true;
 panel.innerHTML=titleMarkup('Nhật ký hành trình','Bạn đồng hành đầu tiên')+`<p>${escapeHTML(getQuestObjective(state))}</p><ol class="quest-steps">${steps.map(([flag,text])=>{const done=q[flag],current=!done&&first;if(current)first=false;return `<li class="${done?'done':current?'current':''}"><b>${done?'✓':current?'◆':'○'}</b>${text}</li>`;}).join('')}</ol><p class="muted">Tiến độ nhiệm vụ được giữ khi bạn rời map hoặc đóng game. V01 tự chọn ở bên bạn sau khi bờ sông được chăm sóc.</p>${actionMarkup([button('Xem vị trí trên bản đồ',()=>openPanel('map')),button('Tiếp tục khám phá',closeModal,true)])}`;
}
function renderWorldMap(){
 panel.classList.add('wide');const world=modalState.world===true;
 const actions=[button(world?'Bản đồ khu nông trại':'Bản đồ các quốc gia',()=>{modalState.world=!world;renderModal();}),button('Quay lại',closeModal,true)];
 panel.innerHTML=titleMarkup(world?'Thế giới Voryki':'Greenwake · Nông trại ven sông',world?'8 vùng đất lớn · Mở khóa theo hành trình':'Một khu nhỏ trong quốc gia khởi đầu')+(world?`<img class="worldmap-image" src="assets/world-map.png" alt="Bản đồ 8 quốc gia Voryki"><p class="muted">Đang mở: Greenwake Vale. Các quốc gia còn lại sẽ được mở theo cốt truyện. Bảy viên đá nguyên thủy và nguồn gốc của chúng vẫn là bí ẩn.</p>`:`<canvas id="mapCanvas" width="768" height="512" aria-label="Bản đồ khu vực"></canvas><p class="muted">◆ Bạn · ● Người dân · ⌂ Nhà · ▣ Nông trại · ~ Máng nước · ★ V01. Nhấp vị trí để di chuyển tới đó.</p>`)+actionMarkup(actions);
 if(!world){const c=$('mapCanvas'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(art,0,0,768,512);g.font='bold 10px Segoe UI';g.textAlign='center';for(const [id,label,color]of[['home','Nhà','#fcde8b'],['villager','Người dân','#ffe4ad'],['channel','Máng nước','#acebf3'],['river_berry','Quả mọng','#edc1e5'],['stone_1','Khai thác','#e0d3ff']]){const o=OBJECTS.find(o=>o.id===id);mapPin(g,o.x/2,o.y/2,label,color);}mapPin(g,state.player.x/2,state.player.y/2,'Bạn','#ffffff');mapPin(g,(state.quest.friend?follower.x:wild.x)/2,(state.quest.friend?follower.y:wild.y)/2,'V01','#7bf0cf');c.onclick=e=>{const r=c.getBoundingClientRect(),point={x:(e.clientX-r.left)/r.width*WORLD.width,y:(e.clientY-r.top)/r.height*WORLD.height};closeModal();walkTo(point);};}
}
function mapPin(g,x,y,label,color){g.fillStyle='#14251bd9';g.fillRect(x-32,y-20,64,13);g.fillStyle=color;g.fillText(label,x,y-10);g.beginPath();g.arc(x,y,4,0,Math.PI*2);g.fill();g.strokeStyle='#162d21';g.lineWidth=2;g.stroke();}
function renderPets(){
 const bonded=state.quest.friend;
 panel.innerHTML=titleMarkup('Đội linh thú',bonded?'1 người bạn đồng hành':'Chưa có linh thú trong đội')+(bonded?`<div class="pet-card"><canvas id="petPreview" class="pet-preview"></canvas><div class="pet-copy"><h3>V01</h3><p>Bậc B · Linh thú bên dòng nước</p><p class="muted">Đã kết bạn. V01 đi theo bạn trên bản đồ.<br>Các bậc A, S và Tối thượng sẽ mở theo hành trình sau này.</p></div></div>`:`<p>V01 đang tự do bên sông. Hãy làm cho bờ sông trở thành nơi an toàn để nó có thể tin bạn.</p>`)+actionMarkup([button('Xem nhiệm vụ kết bạn',()=>openPanel('quest')),button('Quay lại',closeModal,true)]);
}
function renderPause(){
 panel.innerHTML=titleMarkup('Tạm dừng','Thế giới và đồng hồ đang dừng')+`<p>Ngày ${state.day} · ${getSummary(state).time} · ${state.gold} vàng</p><p class="muted">Game tự lưu sau mỗi hành động và khi bạn rời đi. “Tiếp tục” đưa bạn trở lại vị trí đang chơi. Cây không lớn thêm khi game đã đóng.</p>${actionMarkup([button('Chơi tiếp',closeModal,true),button('Lưu tiến độ',()=>save(true)),button('Về trang chủ',()=>{save();closeModal();active=false;showScreen('home');}),button('Hướng dẫn',()=>openPanel('help'))])}<div class="save-tools"><button class="action-btn" id="exportSave">Xuất bản lưu</button><label>Nhập bản lưu<input id="importSave" type="file" accept=".json,application/json"></label></div><p class="mini-note">Bản lưu nằm trên trình duyệt và máy này. Xuất một bản sao nếu muốn chuyển máy.</p>`;
 $('exportSave').onclick=()=>{const blob=new Blob([serializeState(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`voryki-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản lưu Voryki.');};
}
async function importSave(e){const file=e.target.files[0];if(!file)return;if(file.size>250000){toast('Bản lưu quá lớn hoặc không hợp lệ.');return;}const next=deserializeState(await file.text());if(!next){toast('Bản lưu không hợp lệ. Hành trình hiện tại vẫn được giữ.');return;}dialogue('NHẬP BẢN LƯU',`Thay hành trình hiện tại bằng ngày ${next.day}, ${next.gold} vàng trong bản lưu này?`,[button('Giữ hành trình hiện tại',()=>openPanel('pause')),button('Nhập bản lưu',()=>{state=next;repairPosition();followerReset();cameraSnap();closeModal();save();updateHUD();toast('Đã nhập và lưu hành trình.');},true)]);}
function renderHelp(){panel.innerHTML=titleMarkup('Bắt đầu ở Greenwake')+`<div class="help-columns"><div><h3>Di chuyển và tương tác</h3><p>WASD hoặc phím mũi tên để đi. Giữ Shift để chạy. Nhấp lên đất để tự đi tới; nhấp vào vật thể để đến gần và tương tác.</p><p>Nhấn E khi lời nhắc xuất hiện. 1–8 chọn công cụ hoặc hạt giống. Chọn cuốc, hạt hoặc bình tưới rồi E trước luống để thao tác nhanh.</p><p>B mở túi · J nhật ký · M bản đồ · V linh thú · Esc tạm dừng.</p></div><div><h3>Nông trại và sinh tồn</h3><p>Xới đất → gieo hạt → tưới → đợi cây lớn → thu hoạch. Củ cải 4 giờ, lúa mì 6 giờ, quả mọng 3 giờ trong game; mỗi giây chơi khoảng 3 phút trong game.</p><p>Nhặt gỗ, khai thác đá và hái quả làm giảm năng lượng. Ăn thức ăn trong túi hoặc về nhà ngủ để hồi sức.</p><p>Mua bán tại quầy bên nhà. Khởi đầu: 300 vàng, 4 hạt củ cải, 2 hạt lúa mì và 4 công cụ. Các con số này là cân bằng thử nghiệm.</p></div></div>${actionMarkup([button('Xem nhiệm vụ V01',()=>openPanel('quest')),button('Bắt đầu khám phá',closeModal,true)])}`;}

function interact(o=nearest){
 if(!live()||!o)return;
 path=[];autoTarget=null;keys.clear();
 if(o.kind==='v01'){
  const r=execute('meet_v01',{},false);if(state.quest.returned&&!state.quest.friend)dialogue('V01',r.message,[button('Cho nó thêm thời gian',closeModal),button('Đặt một quả mọng',()=>bond('berry'),false,countItem(state,'berry')<1),button('Nhẹ nhàng đưa tay ra',()=>bond('hand'),true)]);
  else dialogue('V01',r.message);return;
 }
 if(o.kind==='villager'){
  const wasAccepted=state.quest.accepted,r=execute('talk_villager',{},false);
  dialogue('NGƯỜI TRÔNG VƯỜN',!wasAccepted&&r.ok?['Bạn mới đến à? Khu nông trại bên sông bỏ trống đã lâu rồi. Bạn có thể nghỉ ở đó.','Dạo này nhánh sông nhỏ chảy yếu hẳn. Có mấy dấu chân nhỏ bên bờ. Bóng xanh ấy không để ai đến gần.',r.message]:r.message,[button('Xem nhật ký',()=>openPanel('quest')),button('Tôi sẽ đi xem thử',closeModal,true)]);return;
 }
 if(o.kind==='shop'){const h=Math.floor(state.minutes%1440/60);if(h<6||h>=20){dialogue('CỬA HÀNG','Quầy đã đóng. Hãy quay lại từ 06:00 đến 20:00; bạn vẫn có thể nghỉ tại căn nhà cạnh nông trại.');return;}openPanel('shop');return;}
 if(o.kind==='home'){openPanel('home');return;}
 if(o.kind==='chest'){bagFilter='all';openPanel('chest');return;}
 if(o.kind==='wood'||o.kind==='stone'||o.kind==='berries'){execute('gather',{nodeId:o.id});return;}
 if(o.kind==='tracks'){const r=execute('inspect_tracks',{},false);dialogue('DẤU VẾT BÊN SÔNG',r.message);return;}
 if(o.kind==='channel'){
  const r=execute('inspect_channel',{},false);
  const choices=state.quest.accepted&&!state.quest.channelFixed?[button('Để sau',closeModal),button('Sửa máng · 6 gỗ + 3 đá',()=>{const r=execute('repair_channel',{},false);if(r.ok)dialogue('NGƯỜI DẪN TRUYỆN',r.message);else feedback(r.message);},true)]:[];
  dialogue('MÁNG NƯỚC CŨ',r.message,choices);return;
 }
 if(o.kind==='bank'){const r=execute('clear_bank',{},false);dialogue('BỜ SÔNG',r.message);return;}
 if(o.kind==='plot'){
  const plot=state.plots[o.id];if(selectedTool===3&&!plot.tilled){execute('till',{plotId:o.id});return;}if(selectedTool===4&&plot.crop){execute('water',{plotId:o.id});return;}if(selectedTool>=5&&plot.tilled&&!plot.crop){execute('plant',{plotId:o.id,cropId:['carrot','wheat','berry'][selectedTool-5]});return;}if(cropProgress(state,o.id)?.ready){execute('harvest',{plotId:o.id});return;}openPanel('plot',{object:o});return;
 }
 if(o.kind==='cave'){dialogue('TÀN TÍCH CỔ',['Tinh thể khẽ rung khi bạn đến gần. Những ký tự trên đá đã bị thời gian xóa mờ.','Một lối đi nằm sâu trong bóng tối. Bạn cần tìm hiểu vùng đất này và có một người bạn đồng hành trước khi đi xa hơn.']);return;}
 if(o.kind==='gate'){dialogue('CON ĐƯỜNG PHÍA BẮC','Con đường dẫn sâu hơn vào Greenwake. Hãy xây dựng nơi ở và kết bạn với V01 trước; hành trình lớn sẽ tiếp tục từ đây.');}
}
function bond(method){const r=execute('befriend_v01',{method},false);if(!r.ok){feedback(r.message);return;}followerReset();dialogue('NGƯỜI DẪN TRUYỆN',['V01 ngửi bàn tay bạn rồi khẽ chạm mõm vào lòng bàn tay. Nó đã tự chọn ở bên bạn.',r.message],[],()=>toast('V01 đang đi cùng bạn. Nhấn V để mở đội linh thú.'));}
function updateHUD(){
 if(!state)return;const s=getSummary(state),[title,...rest]=s.quest.split(' • ');
 $('clockLabel').textContent=`Nông trại ven sông · Ngày ${s.day} · ${s.time} ${s.isNight?'☾':'☀'}`;$('goldLabel').textContent=`◆ ${s.gold} vàng`;$('energyLabel').textContent=`Năng lượng ${s.energy} / 100`;$('energyFill').style.width=`${s.energy}%`;$('questTitle').textContent=title;$('questText').textContent=rest.join(' • ');$('petBadge').hidden=!state.quest.friend;
 const bars=$('hotbar');bars.innerHTML=hotItems.map((id,i)=>`<button class="${selectedTool===i?'selected':''}" data-tool="${i}" title="${i+1} · ${hotNames[i]}" aria-label="${hotNames[i]}"><small>${i+1}</small>${iconSvg(id)}</button>`).join('');bars.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedTool=Number(b.dataset.tool);updateHUD();toast(hotNames[selectedTool]);});
}
function findNearest(){
 const pool=OBJECTS.filter(o=>!(o.kind==='bank'&&state.quest.bankCleared));
 pool.push({id:'V01',kind:'v01',label:state.quest.friend?'V01 · Bạn đồng hành':'V01 · Bóng xanh bên sông',radius:65,...(state.quest.friend?follower:wild)});
 const reachable=pool.filter(o=>dist(o,state.player)<=o.radius).sort((a,b)=>dist(a,state.player)-dist(b,state.player));
 return reachable[0]||null;
}
function repairPosition(){if(!validFoot(state.player.x,state.player.y)){const p=nearbyPoint(state.player.x,state.player.y,112)||WORLD.start;state.player.x=p.x;state.player.y=p.y;}}
function followerReset(){const p=nearbyPoint(state.player.x-48,state.player.y+20)||WORLD.start;follower={...p,facing:state.player.facing};trail=[];}
function cameraSnap(){camera.x=clamp(state.player.x-480,0,WORLD.width-960);camera.y=clamp(state.player.y-290,0,WORLD.height-540);}
async function enterWorld(resume=false){
 if(loading)return;loading=true;showScreen('game');$('mapLoading').hidden=false;
 try{await loadAssets();state=resume?deserializeState(localStorage.getItem(SAVE_KEY)):createState();if(!state){showScreen('home');toast('Bản lưu không hợp lệ. Bạn có thể bắt đầu một hành trình mới.');return;}state.flags.introCompleted=true;state.session.screen='game';repairPosition();followerReset();cameraSnap();active=true;closeModal();path=[];keys.clear();updateHUD();save();canvas.focus({preventScroll:true});
  if(!resume)dialogue('NGƯỜI DẪN TRUYỆN',['Bạn đứng dậy bên dòng sông. Gió mang theo mùi đất mới và tiếng lá xào xạc. Một căn nhà nhỏ nằm phía bên kia con đường.','Bạn bắt đầu một mình. Hãy nhìn quanh, tìm bóng xanh bên sông và hỏi người dân ở quầy cạnh nhà.','WASD hoặc phím mũi tên: di chuyển. E: tương tác. B: túi đồ. J: nhiệm vụ. M: bản đồ. Tiến độ được lưu tự động.']);
 }catch(error){active=false;$('mapLoading').hidden=true;dialogue('MỞ THUNG LŨNG','Chưa tải được tài nguyên bản đồ. Hãy thử mở lại; hành trình của bạn vẫn được giữ.',[button('Về trang chủ',()=>{closeModal();showScreen('home');}),button('Thử lại',()=>{closeModal();enterWorld(resume);},true)]);console.error(error);}finally{loading=false;$('mapLoading').hidden=true;}
}
function walkTo(point,object=null){const goal=nearbyPoint(point.x,point.y,100);if(!goal){toast('Phía đó không có lối đi.');return;}path=findPath(state.player,goal);autoTarget=object;if(!path.length){if(object&&dist(object,state.player)<=object.radius)interact(object);else toast('Hãy chọn một vị trí trên đường hoặc bãi cỏ.');}}
function direction(dx,dy){return Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
function movePlayer(dx,dy,dt){const length=Math.hypot(dx,dy);if(!length)return false;dx/=length;dy/=length;const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?260:180;state.player.facing=direction(dx,dy);const amount=speed*dt,steps=Math.ceil(amount/4);let changed=false;for(let i=0;i<steps;i++){const nx=state.player.x+dx*amount/steps,ny=state.player.y+dy*amount/steps;if(validFoot(nx,state.player.y)){state.player.x=nx;changed=true;}if(validFoot(state.player.x,ny)){state.player.y=ny;changed=true;}}return changed;}
function drawSprite(g,kind,facing,frame,x,y,scale){
 const f=frames?.[kind]?.[facing]?.[frame];if(!f||!atlas)return;g.imageSmoothingEnabled=false;
 g.drawImage(atlas,f.x,f.y,f.w,f.h,Math.round(x-f.w*scale/2),Math.round(y-f.h*scale),Math.round(f.w*scale),Math.round(f.h*scale));
}
function spriteActor(actor,kind,tint=null){const x=actor.x-camera.x,y=actor.y-camera.y;ctx.fillStyle='#223d2845';ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y-2),kind==='human'?15:16,5,0,0,Math.PI*2);ctx.fill();if(tint)ctx.filter=tint;drawSprite(ctx,kind,actor.facing||'down',actor.frame||0,x,y,kind==='human'?.29:.29);ctx.filter='none';}
function iconAt(id,x,y,size){const img=icons[id];if(img)ctx.drawImage(img,Math.round(x-camera.x-size/2),Math.round(y-camera.y-size),size,size);}
function drawPlot(o){
 const plot=state.plots[o.id];if(!plot)return;const x=Math.round(o.x-camera.x),y=Math.round(o.y-camera.y),p=cropProgress(state,o.id);
 if(o.id==='river_berry'&&!state.quest.bankCleared)return;
 ctx.fillStyle=plot.tilled?'#806046':'#986d49';ctx.fillRect(x-18,y-10,36,23);ctx.fillRect(x-15,y-12,30,27);ctx.fillStyle=plot.tilled?'#b38b5d':'#ad8155';ctx.fillRect(x-13,y-10,8,2);ctx.fillRect(x+5,y+9,7,2);ctx.fillStyle=plot.tilled?'#5f4c3c':'#77563d';if(plot.tilled){for(let i=0;i<3;i++)ctx.fillRect(x-15,y-5+i*6,30,2);}else{for(const [dx,dy]of[[-11,-3],[5,3],[-3,8],[11,-6]])ctx.fillRect(x+dx,y+dy,3,2);}
 if(p){if(p.watered){ctx.fillStyle='#3a536042';ctx.fillRect(x-18,y-12,36,25);}if(p.ready)iconAt(p.id,o.x,o.y+3,30);else {const size=p.ratio>.5?16:10;ctx.fillStyle='#315b32';ctx.fillRect(x-2,y-size,4,size);ctx.fillStyle='#65a94b';ctx.fillRect(x-size/2-3,y-size+3,size/2+3,5);ctx.fillRect(x+1,y-size-2,size/2+2,5);ctx.fillStyle='#b0d16d';ctx.fillRect(x-size/2-1,y-size+3,4,2);}}
}
function drawObjects(time){
 for(const o of OBJECTS){
  if(o.kind==='plot'){drawPlot(o);continue;}
  if(['wood','stone','berries'].includes(o.kind)){if(state.resources[o.id].harvestedDay!==state.day)iconAt(o.kind==='berries'?'berry':o.kind,o.x,o.y,34);continue;}
  const x=Math.round(o.x-camera.x),y=Math.round(o.y-camera.y);
  if(o.kind==='tracks'&&!state.quest.tracks){ctx.fillStyle='#66583e';for(const [dx,dy]of[[-5,-6],[3,0],[-4,6]]){ctx.fillRect(x+dx,y+dy,5,4);ctx.fillRect(x+dx-1,y+dy-3,2,2);}}
  if(o.kind==='channel'){ctx.fillStyle='#4c3929';ctx.fillRect(x-24,y-11,46,13);ctx.fillStyle=state.quest.channelFixed?'#71c3ce':'#9b7550';ctx.fillRect(x-22,y-8,42,5);ctx.fillStyle='#80643e';ctx.fillRect(x-20,y-16,5,22);ctx.fillRect(x+16,y-16,5,22);if(!state.quest.channelFixed){iconAt('wood',o.x+3,o.y-7,24);}}
  if(o.kind==='bank'&&!state.quest.bankCleared){iconAt('wood',o.x,o.y,26);iconAt('stone',o.x+17,o.y+7,20);}
  if(o.kind==='chest'){ctx.fillStyle='#453123';ctx.fillRect(x-16,y-23,32,24);ctx.fillStyle='#b28242';ctx.fillRect(x-14,y-21,28,19);ctx.fillStyle='#d5b476';ctx.fillRect(x-14,y-12,28,3);ctx.fillStyle='#efe0a0';ctx.fillRect(x-3,y-13,6,8);}
 }
 const targets=state.quest.friend?[]:questTargets();for(const o of targets){const x=Math.round(o.x-camera.x),y=Math.round(o.y-camera.y-45+Math.sin(time*3)*2);if(x<0||x>960||y<20||y>510)continue;ctx.fillStyle='#162e24dc';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf93';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#ffe4a1';ctx.font='bold 18px Segoe UI';ctx.textAlign='center';ctx.fillText('!',x,y+6);}
}
function questTargets(){const q=state.quest;let ids;if(!q.seen)return[{...wild}];if(!q.accepted)ids=['villager'];else if(!q.tracks||!q.channelInspected)ids=[!q.tracks?'tracks':null,!q.channelInspected?'channel':null];else if(!q.channelFixed)ids=['channel'];else if(!q.bankCleared)ids=['bank'];else if(!q.berryWatered)ids=['river_berry'];else if(!q.returned)ids=['home'];else return[{...wild}];return OBJECTS.filter(o=>ids.includes(o.id));}
function draw(time){
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,540);ctx.drawImage(art,Math.round(camera.x),Math.round(camera.y),960,540,0,0,960,540);
 if(path.length){ctx.fillStyle='#fff0c39c';for(let i=0;i<path.length;i+=3){const p=path[i];ctx.fillRect(Math.round(p.x-camera.x)-2,Math.round(p.y-camera.y)-2,4,4);}}
 drawObjects(time);
 const frame=moving?[0,1,0,2][Math.floor(walkTime*8)%4]:0,creature=state.quest.friend?follower:wild;
 const actors=[{...state.player,kind:'human',frame},{...creature,kind:'V01',frame:state.quest.friend&&moving?frame:[0,1,0,2][Math.floor(time*3)%4]},{x:619,y:429,facing:'down',kind:'human',frame:0,tint:'hue-rotate(125deg)'}].sort((a,b)=>a.y-b.y);
 actors.forEach(a=>spriteActor(a,a.kind,a.tint));
 if(nearest){ctx.strokeStyle='#fff2b48c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(nearest.x-camera.x,nearest.y-camera.y,25,9,0,0,Math.PI*2);ctx.stroke();}
 const hour=state.minutes%1440/60,night=hour>=19||hour<6?0.5:hour>=17?(hour-17)/2*.38:hour<8?(8-hour)/2*.2:0;
 if(night){ctx.fillStyle=`rgba(15,26,65,${night})`;ctx.fillRect(0,0,960,540);for(const [x,y]of[[254,360],[479,360],[611,365],[1192,169]]){const sx=x-camera.x,sy=y-camera.y,g=ctx.createRadialGradient(sx,sy,2,sx,sy,45);g.addColorStop(0,'rgba(255,206,99,.3)');g.addColorStop(1,'rgba(255,206,99,0)');ctx.fillStyle=g;ctx.fillRect(sx-45,sy-45,90,90);}}
}
function loop(now){
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(live()&&art){
  if(!modalState&&!document.hidden){
   advanceTime(state,dt*3);saveTime+=dt;
   let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
   if(dx||dy){path=[];autoTarget=null;}else if(path.length){const next=path[0];if(dist(state.player,next)<6){path.shift();}else{dx=next.x-state.player.x;dy=next.y-state.player.y;}}
   moving=movePlayer(dx,dy,dt);walkTime+=moving?dt:0;
   if(autoTarget&&dist(state.player,autoTarget)<=autoTarget.radius-8){const target=autoTarget;autoTarget=null;path=[];interact(target);}
   else if(autoTarget&&!path.length){autoTarget=null;}
   if(!state.quest.seen&&dist(state.player,wild)<110)execute('see_v01',{},false);
   if(state.quest.friend&&moving){trail.push({x:state.player.x,y:state.player.y,facing:state.player.facing});if(trail.length>22){const p=trail.shift();if(validFoot(p.x,p.y))follower=p;}}
   if(!state.quest.friend){wild.x=997+Math.sin(now/2900)*20;wild.y=563+Math.sin(now/3900)*8;wild.facing=Math.cos(now/2900)>0?'right':'left';}
   if(saveTime>5){save();saveTime=0;}
   const oldId=nearest?.id;nearest=findNearest();const prompt=$('contextPrompt');prompt.hidden=!nearest;if(nearest)prompt.querySelector('span').textContent=nearest.label;
   if(Math.floor(now/500)!==Math.floor((now-dt*1000)/500)||oldId!==nearest?.id)updateHUD();
  }else moving=false;
  camera.x+=((clamp(state.player.x-480,0,WORLD.width-960))-camera.x)*Math.min(1,dt*9);camera.y+=((clamp(state.player.y-290,0,WORLD.height-540))-camera.y)*Math.min(1,dt*9);
  draw(now/1000);
 }
 requestAnimationFrame(loop);
}
window.addEventListener('voryki:newgame',()=>enterWorld());window.addEventListener('voryki:continue',()=>enterWorld(true));window.addEventListener('voryki:screenchange',e=>{keys.clear();path=[];if(e.detail.screen==='cinema'){active=false;state=null;}else if(e.detail.screen==='home'&&active){save();active=false;}});
window.addEventListener('blur',()=>{keys.clear();if(live()&&!modalState)openPanel('pause');});document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&state)save();});window.addEventListener('pagehide',()=>save());
document.addEventListener('keydown',e=>{
 if(!live()||e.defaultPrevented)return;
 if(modalState){if(e.repeat)return;if(e.key==='Escape'){e.preventDefault();closeModal();}else if(e.key==='Tab'){const targets=Array.from(panel.querySelectorAll('button,input')).filter(b=>!b.disabled);const first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}else if(['KeyE','Space','Enter'].includes(e.code)&&modalState.type==='dialogue'){e.preventDefault();nextDialogue();}return;}
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);return;}if(e.repeat)return;
 if(e.code==='KeyE'||e.code==='Space'){e.preventDefault();interact();}else if(e.code==='KeyB'){bagFilter='all';openPanel('bag');}else if(e.code==='KeyJ')openPanel('quest');else if(e.code==='KeyM')openPanel('map');else if(e.code==='KeyV')openPanel('pets');else if(e.key==='Escape')openPanel('pause');else if(e.key==='?')openPanel('help');else if(/^Digit[1-8]$/.test(e.code)){selectedTool=Number(e.code.slice(-1))-1;updateHUD();toast(hotNames[selectedTool]);}
});document.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',e=>{if(!live()||modalState)return;const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)/r.width*960+camera.x,y:(e.clientY-r.top)/r.height*540+camera.y},v={id:'V01',kind:'v01',label:'V01',radius:65,...(state.quest.friend?follower:wild)},objects=[v,...OBJECTS],o=objects.filter(o=>Math.hypot(p.x-o.x,p.y-o.y)<(o.kind==='plot'?25:37)).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(o&&dist(o,state.player)<=o.radius){interact(o);}else walkTo(o||p,o||null);canvas.focus({preventScroll:true});});
$('contextPrompt').onclick=()=>interact();$('pauseButton').onclick=()=>openPanel('pause');$('questButton').onclick=()=>openPanel('quest');$('bagButton').onclick=()=>{bagFilter='all';openPanel('bag');};$('mapButton').onclick=()=>openPanel('map');$('petsButton').onclick=()=>openPanel('pets');$('helpButton').onclick=()=>openPanel('help');
modal.addEventListener('click',e=>{if(e.target===modal&&modalState?.type!=='dialogue')closeModal();});
requestAnimationFrame(loop);
// This interface is available only in an isolated test page; it is absent in normal play.
if(QA)window.__vorykiTest={
 state:()=>JSON.parse(JSON.stringify(state)),screen:()=>window.VorykiShell.currentScreen,
 async start(){await enterWorld(false);closeModal();},close:closeModal,
 go(id){const o=id==='V01'?{id:'V01',kind:'v01',label:'V01',radius:65,...wild}:OBJECTS.find(o=>o.id===id);if(!o)throw Error('Unknown object');const p=nearbyPoint(o.x,o.y,70);if(!p)throw Error('Object unreachable');state.player.x=p.x;state.player.y=p.y;cameraSnap();nearest=o;return p;},
 interact(id){const o=id==='V01'?{id:'V01',kind:'v01',label:'V01',radius:65,...wild}:OBJECTS.find(o=>o.id===id);interact(o);},
 time(minutes){advanceTime(state,minutes);save();updateHUD();},save,draw:()=>draw(performance.now()/1000),position:()=>({...state.player}),object:id=>OBJECTS.find(o=>o.id===id),
};
if(QA){
 const controls=document.createElement('div');controls.className='qa-controls';controls.style.cssText='position:absolute;top:8px;left:40%;z-index:30;background:#172f23;padding:6px;font-size:11px;border:1px solid #afc184;display:flex;gap:5px';
 controls.innerHTML=`<select id="qaTarget" aria-label="Vị trí kiểm thử">${['V01',...OBJECTS.map(o=>o.id)].map(id=>`<option value="${id}">${id}</option>`).join('')}</select><button id="qaGo">Đến vị trí</button><button id="qaTime">+4 giờ</button>`;game.append(controls);
 $('qaGo').onclick=()=>{closeModal();window.__vorykiTest.go($('qaTarget').value);nearest=findNearest();};$('qaTime').onclick=()=>window.__vorykiTest.time(240);
}
