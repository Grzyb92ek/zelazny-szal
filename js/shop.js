function rollShop(){let pool=baseItems.filter(it=>owned(it)?.rarity!=="uncommon").sort(()=>Math.random()-.5);state.offers=pool.slice(0,4);if(Math.random()<.4)state.offers.push({...healthPotion})}
function slotLabel(it){return it.slot==="weapon"?(it.two?"Dwie ręce":"Jedna ręka"):it.potion?"Przedmiot użytkowy":slots[it.slot][0]}
function slotStatus(it){if(it.potion)return "";let dupe=owned(it);if(dupe&&dupe.rarity!=="uncommon")return '<span class="slot-status upgrade-label">UPGRADE</span>';let occupied=it.slot==="weapon"?(it.two?Boolean(state.gear.left||state.gear.right):Boolean(state.gear.left&&state.gear.right)):Boolean(state.gear[it.slot]);return occupied?'<span class="slot-status occupied">ZAJĘTE</span>':'<span class="slot-status free">PUSTE</span>'}
function notifyUpgrade(it,keys){let n=$("upgradeNotice");n.innerHTML="<b>✨ ULEPSZONO PRZEDMIOT!</b><p>"+esc(it.icon)+" "+esc(it.name)+" · Niepospolity</p>"+esc(it.desc);n.classList.add("hidden");void n.offsetWidth;n.classList.remove("hidden");for(const k of keys)$("gear-"+k).classList.add("upgradeGlow");clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.classList.add("hidden"),1600)}
function buy(i){
  if(state.location!=="arena"||state.phase!=="main"||pending!==null)return;
  const item=state.offers[i];
  if(!item)return;
  if(state.gold<item.cost){$("shopNotice").textContent="Brak Złota";return}

  const duplicate=owned(item);
  let upgrade;
  if(duplicate){
    if(duplicate.rarity==="uncommon")return;
    upgrade=upgradeOwnedItem(duplicate);
  }else{
    const slot=emptyEquipmentSlot(item);
    if(slot!==undefined)setEquipment(item,slot);
    else if(!storeInBackpack(item,backpackDestination(item))){
      $("shopNotice").textContent=backpackFullMessage;
      return;
    }
  }
  state.gold-=item.cost;
  state.offers.splice(i,1);
  render();
  if(upgrade)notifyUpgrade(upgrade.upgraded,upgrade.slots);
}
function reroll(){if(state.phase!=="main"||pending!==null||state.rerolled||state.gold<3)return;state.gold-=3;state.rerolled=true;rollShop();render()}
function purseReward(){if(!state.goldBonus)return 0;let total=num(state.goldBonus+state.goldCarry),paid=Math.floor(total);state.goldCarry=num(total-paid);return paid}
