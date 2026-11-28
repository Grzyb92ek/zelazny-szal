function shopWeight(item){
  const settings=shopCatalog.items.find(row=>row.id===item.id);
  return settings?.enabled===false?0:settings?.weight??1;
}

function rollShop(random=Math.random){
  const pool=baseItems.filter(item=>!owned(item,"rare")&&shopWeight(item)>0);
  const potionChance=healthPotion?Math.min(100,shopCatalog.consumableChance*shopWeight(healthPotion)):0;
  const potion=potionChance>0&&random()*100<potionChance;
  state.offers=[];
  while(pool.length&&state.offers.length<shopCatalog.offerCount){
    let pick=random()*pool.reduce((sum,item)=>sum+shopWeight(item),0);
    const index=pool.findIndex(item=>(pick-=shopWeight(item))<0);
    state.offers.push(pool.splice(index<0?pool.length-1:index,1)[0]);
  }
  if(potion)state.offers.push({...healthPotion});
}

const shopPrice=item=>Math.round(item.cost*shopCatalog.buyMultiplier);
const remainingRerolls=()=>Math.max(0,shopCatalog.rerolls-state.rerollsUsed);
const canReroll=()=>state.location==="arena"&&state.phase==="main"&&pending===null&&
  remainingRerolls()>0&&state.gold>=shopCatalog.rerollCost;
function syncShopReroll(){
  const button=$("reroll");
  button.disabled=!canReroll();
  button.textContent="Przelosuj ("+remainingRerolls()+"/"+shopCatalog.rerolls+")";
  button.title="Koszt przelosowania: "+shopCatalog.rerollCost+" zł";
}
function slotLabel(it){return it.slot==="weapon"?(it.two?"Dwie ręce":"Jedna ręka"):it.potion?"Przedmiot użytkowy":slots[it.slot][0]}
function shopUpgrade(item){return itemRarity(item)==="common"?owned(item,"common"):undefined}
function slotStatus(it){if(it.potion)return "";if(shopUpgrade(it))return '<span class="slot-status upgrade-label">UPGRADE</span>';return emptyEquipmentSlot(it)===undefined?'<span class="slot-status occupied">ZAJĘTE</span>':'<span class="slot-status free">PUSTE</span>'}
function shopOwnershipLabels(item){
  const matches=entry=>entry?.id===item.id;
  const gear=equipped().some(matches)?'<span class="slot-status shop-equipped">UŻYWANY</span>':"";
  const backpack=state.backpack.some(entry=>matches(entry?.item))?'<span class="slot-status shop-stored">W PLECAKU</span>':"";
  return [gear,backpack].filter(Boolean);
}
function notifyUpgrade(it,keys){
  const n=$("upgradeNotice"),rare=itemRarity(it)==="rare";
  n.classList.toggle("rare",rare);
  n.innerHTML="<b>✨ "+(rare?"POŁĄCZONO PRZEDMIOTY!":"ULEPSZONO PRZEDMIOT!")+"</b><p>"+
    esc(it.icon)+" "+esc(it.name)+" · "+itemRarityBadge(it)+"</p>"+esc(itemDescription(it))+rareEffectDetails(it);
  n.classList.add("hidden");void n.offsetWidth;n.classList.remove("hidden");
  for(const k of keys)$("gear-"+k).classList.add("upgradeGlow");
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.classList.add("hidden"),1600);
}
function buy(i){
  if(state.location!=="arena"||state.phase!=="main"||pending!==null)return;
  const item=state.offers[i];
  if(!item||itemRarity(item)==="rare"||owned(item,"rare"))return;
  const price=shopPrice(item);
  if(state.gold<price){$("shopNotice").textContent="Brak Złota";return}

  const duplicate=shopUpgrade(item);
  let upgrade;
  if(duplicate){
    const upgraded=promote(duplicate);
    upgrade={upgraded,slots:replaceInventoryItem(duplicate,upgraded)};
  }else{
    const acquired={...item};
    const slot=emptyEquipmentSlot(item);
    if(slot!==undefined)setEquipment(acquired,slot);
    else if(!storeInBackpack(acquired,backpackDestination(item))){
      $("shopNotice").textContent=backpackFullMessage;
      return;
    }
  }
  state.gold-=price;
  state.offers.splice(i,1);
  upgrade=mergeUncommonItems(item.id)??upgrade;
  render();
  if(upgrade)notifyUpgrade(upgrade.upgraded,upgrade.slots);
}
function reroll(){
  if(!canReroll())return;
  state.gold-=shopCatalog.rerollCost;
  state.rerollsUsed++;
  rollShop();render();
}
function purseReward(){const bonus=battleStat("player","goldBonus");if(!bonus)return 0;let total=num(bonus+state.goldCarry),paid=Math.floor(total);state.goldCarry=num(total-paid);return paid}
