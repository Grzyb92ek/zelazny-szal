const baseBackpackCapacity = 4;
const backpackFullMessage = "Brak miejsca w plecaku";
const hands = ["left","right"];

function createBackpack(capacity = baseBackpackCapacity) {
  return Array(capacity).fill(null);
}

function canManageInventory() {
  return Boolean(state.location) && canChangeLocation();
}

function canUsePotion() {
  return canManageInventory() && state.phase === "main" && state.location === "arena" && state.hp < state.max;
}

function emptyEquipmentSlot(item) {
  if (item.potion) return undefined;
  if (item.slot !== "weapon") return state.gear[item.slot] ? undefined : item.slot;
  if (item.two) return !state.gear.left && !state.gear.right ? "left" : undefined;
  return hands.find(hand => !state.gear[hand]);
}

function backpackDestination(item) {
  const stack = item.potion ? state.backpack.findIndex(entry => entry?.item.potion && entry.item.id === item.id) : -1;
  return stack >= 0 ? stack : state.backpack.indexOf(null);
}

function storeInBackpack(item,index) {
  if (index < 0) return false;
  state.backpack[index] = {item,count:(state.backpack[index]?.count ?? 0)+1};
  return true;
}

function replaceInventoryItem(item,replacement) {
  const slots = Object.keys(state.gear).filter(slot => state.gear[slot]===item);
  for (const slot of slots) state.gear[slot] = replacement;
  if (!slots.length) {
    const index = state.backpack.findIndex(entry => entry?.item===item);
    if (index>=0) state.backpack[index] = replacement ? {...state.backpack[index],item:replacement} : null;
  }
  return slots;
}

function mergeUncommonItems(id) {
  if (!canManageInventory()) return;
  // Equipment comes first, with two-handed weapons represented once.
  const [keep,consume] = inventoryMatches(id,"uncommon");
  if (!consume) return;
  const upgraded = rareFromUncommon(keep);
  const slots = replaceInventoryItem(keep,upgraded);
  replaceInventoryItem(consume,null);
  return {upgraded,slots};
}

function removeBackpackUnit(index,entry) {
  state.backpack[index] = entry.count>1 ? {...entry,count:entry.count-1} : null;
}

function salePrice(item) {
  const base = itemCatalog.find(candidate => candidate.id===item.id);
  return Math.floor((base?.cost ?? item.cost)*shopCatalog.sellMultiplier);
}

function sellBackpackItem(index,entry) {
  if (!canManageInventory() || !entry || state.backpack[index]!==entry) return;
  const gold = salePrice(entry.item);
  removeBackpackUnit(index,entry);
  state.gold += gold;
  render();
  $("backpackNotice").textContent = "Sprzedano za "+gold+" zł";
}

function useBackpackItem(index,entry) {
  if (!canUsePotion() || !entry?.item.potion || state.backpack[index]!==entry) return;
  removeBackpackUnit(index,entry);
  state.hp = num(Math.min(state.max,state.hp+entry.item.heal));
  useConsumableEffects(entry.item);
  render();
}

function setEquipment(item,slot) {
  state.gear[slot] = item;
  if (item.two) state.gear.right = item;
}

function equipBackpackItem(index,entry,hand) {
  if (!canManageInventory() || !entry || state.backpack[index]!==entry) return;
  const {item} = entry;
  if (item.potion) return useBackpackItem(index,entry);
  let slot = item.slot;
  if (item.slot==="weapon") {
    slot = item.two ? "left" : hand ?? emptyEquipmentSlot(item);
    if (slot===undefined) return openHandChoice(index,entry);
    if (!hands.includes(slot)) return;
  }

  const affected = item.two || (hands.includes(slot) && state.gear[slot]?.two) ? hands : [slot];
  const displaced = [...new Set(affected.map(key=>state.gear[key]).filter(Boolean))];
  // Reserve the vacated source slot first, then any other free slots.
  const free = [index,...state.backpack.flatMap((other,i)=>other===null?[i]:[])];
  if (displaced.length>free.length) {
    $("backpackNotice").textContent = backpackFullMessage;
    return;
  }
  state.backpack[index] = null;
  for (const key of affected) state.gear[key] = null;
  displaced.forEach((old,i)=>storeInBackpack(old,free[i]));
  setEquipment(item,slot);
  render();
}

function unequipItem(slot) {
  if (!canManageInventory() || !Object.hasOwn(state.gear,slot)) return;
  const item = state.gear[slot];
  if (!item) return;
  if (!storeInBackpack(item,backpackDestination(item))) {
    $("backpackNotice").textContent = backpackFullMessage;
    return;
  }
  for (const key of item.two?hands:[slot]) state.gear[key] = null;
  render();
}

function openHandChoice(index,entry) {
  pending = {index,entry};
  $("handTitle").textContent = entry.item.icon+" "+entry.item.name;
  $("handHint").textContent = state.gear.left?.two
    ? "Broń dwuręczna trafi do plecaka. Wybierz rękę."
    : "Wybierz przedmiot, który trafi do plecaka.";
  $("handChoices").innerHTML = hands.map(hand=>'<button class="btn" onclick="chooseHand(\''+hand+'\')">'+slots[hand][0]+'<br>'+esc(state.gear[hand]?.name||"Puste")+'</button>').join("");
  $("handSelect").classList.remove("hidden");
  renderLocationLinks();
}

function closeHand() {
  pending = null;
  $("handSelect").classList.add("hidden");
  renderLocationLinks();
}

function chooseHand(hand) {
  if (!pending || !hands.includes(hand)) return;
  const {index,entry} = pending;
  closeHand();
  equipBackpackItem(index,entry,hand);
}

function syncInventoryAccess() {
  $("inventoryControls").disabled = !canManageInventory();
  if (!canManageInventory()) closeInventoryMenu();
}

function renderBackpack() {
  closeInventoryMenu();
  cancelInventoryPress();
  $("backpackNotice").textContent = "";
  $("backpack").innerHTML = state.backpack.map((entry,i)=>{
    if (!entry) return '<div class="tile backpack-empty" data-backpack-slot="'+i+'"><span class="small">Puste</span></div>';
    const {item,count} = entry;
    return '<button type="button" class="tile backpack-item '+itemRarity(item)+'" data-backpack-slot="'+i+'">'+
      itemIcon(item)+'<strong>'+esc(item.name)+(count>1?' ×'+count:'')+'</strong>'+
      itemRarityBadge(item)+'</button>';
  }).join("");
  syncInventoryAccess();
}

let inventoryMenuSelection, inventoryPress, inventoryPressTimer, suppressInventoryClick;

function closeInventoryMenu() {
  inventoryMenuSelection = undefined;
  $("inventoryMenu").hidden = true;
}

function cancelInventoryPress() {
  clearTimeout(inventoryPressTimer);
  inventoryPress = undefined;
}

function openInventoryMenu(card,x,y,focus = false) {
  if (!canManageInventory()) return;
  const index = Number(card.dataset.backpackSlot);
  const entry = state.backpack[index];
  if (!entry) return;
  hideEquipmentTooltip();
  inventoryMenuSelection = {index,entry,card};
  const menu = $("inventoryMenu");
  menu.classList.toggle("rare",itemRarity(entry.item)==="rare");
  menu.classList.toggle("uncommon",itemRarity(entry.item)==="uncommon");
  const description = itemDescription(entry.item);
  $("inventoryMenuItem").innerHTML = '<strong>'+esc(entry.item.name)+'</strong>'+itemRarityBadge(entry.item)+
    (description?'<div class="small">'+esc(description)+'</div>':"")+rareEffectDetails(entry.item);
  const action = $("inventoryUse");
  action.textContent = entry.item.potion ? "Użyj" : "Ubierz";
  action.disabled = entry.item.potion && !canUsePotion();
  $("inventorySell").textContent = "Sprzedaj ("+salePrice(entry.item)+" zł)";
  menu.hidden = false;
  const {width,height} = menu.getBoundingClientRect();
  const {clientWidth,clientHeight} = document.documentElement;
  menu.style.left = Math.max(4,Math.min(x,clientWidth-width-4))+"px";
  menu.style.top = Math.max(4,Math.min(y,clientHeight-height-4))+"px";
  if (focus) (action.disabled?$("inventorySell"):action).focus();
}

function initInventory() {
  const grid = $("backpack");
  const cardFor = event => event.target.closest("[data-backpack-slot]");
  grid.onclick = event => {
    const card = cardFor(event);
    if (!card) return;
    if (suppressInventoryClick===card) {suppressInventoryClick=undefined;return}
    const index = Number(card.dataset.backpackSlot);
    closeInventoryMenu();
    equipBackpackItem(index,state.backpack[index]);
  };
  grid.oncontextmenu = event => {
    const card = cardFor(event);
    if (!card) return;
    event.preventDefault();
    const touch = inventoryPress?.card===card || event.pointerType==="touch";
    cancelInventoryPress();
    if (touch) suppressInventoryClick = card;
    openInventoryMenu(card,event.clientX,event.clientY);
  };
  grid.onkeydown = event => {
    const card = cardFor(event);
    if (!card || (event.key!=="ContextMenu" && !(event.shiftKey && event.key==="F10"))) return;
    event.preventDefault();
    const {left,bottom} = card.getBoundingClientRect();
    openInventoryMenu(card,left,bottom,true);
  };
  grid.onpointerdown = event => {
    cancelInventoryPress();
    suppressInventoryClick = undefined;
    const card = cardFor(event);
    if (event.pointerType!=="touch" || !card || !canManageInventory() || !state.backpack[card.dataset.backpackSlot]) return;
    const press = {card,id:event.pointerId,x:event.clientX,y:event.clientY};
    inventoryPress = press;
    inventoryPressTimer = setTimeout(()=>{
      if (inventoryPress!==press || !card.isConnected || !canManageInventory()) return;
      suppressInventoryClick = card;
      openInventoryMenu(card,press.x,press.y);
    },500);
  };
  grid.onpointermove = event => {
    const press = inventoryPress;
    if (press?.id===event.pointerId && Math.hypot(event.clientX-press.x,event.clientY-press.y)>10) cancelInventoryPress();
  };
  grid.onpointerup = grid.onpointercancel = grid.onpointerleave = cancelInventoryPress;
  document.addEventListener?.("pointerdown",event=>{
    if (!$("inventoryMenu").contains(event.target)) closeInventoryMenu();
  });
  document.addEventListener?.("keydown",event=>{
    if (event.key==="Escape" && inventoryMenuSelection) {
      const {card} = inventoryMenuSelection;
      closeInventoryMenu();
      card.focus();
    }
  });
  window.addEventListener?.("scroll",closeInventoryMenu);
  window.addEventListener?.("resize",closeInventoryMenu);
  $("inventoryUse").onclick = ()=>{
    const selection = inventoryMenuSelection;
    closeInventoryMenu();
    if (selection) equipBackpackItem(selection.index,selection.entry);
  };
  $("inventorySell").onclick = ()=>{
    const selection = inventoryMenuSelection;
    closeInventoryMenu();
    if (selection) sellBackpackItem(selection.index,selection.entry);
  };
}
