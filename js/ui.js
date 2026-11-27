function itemIcon(item){
  return item.image ? '<img class="item-icon" src="assets/items/'+esc(item.image)+'" width="48" height="48" alt="">' : esc(item.icon);
}

function itemRarityBadge(item){
  const rarity=itemRarity(item);
  return '<span class="small rarity-label--'+rarity+'">'+itemRarityLabels[rarity]+'</span>';
}

function rareEffectDetails(item){
  const rarity=itemRarity(item), effects=configuredSourceEffects("item",item.id,rarity);
  const descriptions=effects.map(effect=>{
    const extra=effectDisplayDescription(effect);
    return '<div class="small item-effect"><b>'+esc(effect.name)+'</b>'+(extra?' — '+esc(extra):'')+'</div>';
  });
  if(rarity==="rare"&&item.rareEffectDescription&&!effects.some(effect=>effect.id===item.rareEffectId)){
    descriptions.push('<div class="small rare-effect">Efekt specjalny (nieaktywny): '+esc(item.rareEffectDescription)+'</div>');
  }
  return descriptions.join("");
}

function renderCharacter(){
  const profile=selectedClass();
  $("characterTitle").textContent=$("playerClassName").textContent=profile.name;
  classImage("characterPortrait",profile.image);
  classImage("playerArt",profile.image);
  $("round").textContent=state.round;
  $("hudGold").textContent=state.gold;
  $("hudLevel").textContent=state.level;
  $("hudScore").textContent=scoreParts().score;
  $("playerName").textContent=state.nickname?"Gracz: "+state.nickname:"";
  $("subclassTitle").textContent=selectedSubclass()?.name??"";
  renderCharacterEffects();
  syncSkillControls();
  $("stats").innerHTML=[
    ["🛡️ Pancerz",battleStat("player","armor")],["⚔️ DMG",battleStat("player","dmg")],
    ["⚡ Szybkość",Math.max(.25,battleStat("player","speed")).toFixed(2)],["🎯 Krytyk",battleCriticalChance("player")+"%"],
    ["💥 Kryt. obrażenia",battleStat("player","critD")+"%"],["💚 Regeneracja",battleStat("player","regen")+" HP"],
    ["💚 Przywracanie zdrowia",battleStat("player","healOnHit")+" HP / trafienie"],
    ["🛡️ Odbicie obrażeń",battleStat("player","damageReflect")+" / otrzymane trafienie"],
    ["⚔️ Przebicie pancerza",battleStat("player","armorPenetration")]
  ].map(([label,value])=>'<div class="stat"><b>'+label+'</b><br>'+value+'</div>').join("");
  $("xpValue").textContent=state.exp+"/"+xpNeed()+" EXP";
  $("xpBar").style.width=Math.min(100,100*state.exp/xpNeed())+"%";
  renderCharacterHP();
  renderQuests();
}
function renderCharacterHP(){
  $("characterHP").textContent=state.hp+"/"+state.max;
  $("characterHPBar").style.width=100*state.hp/state.max+"%";
}
function render(){recalc();renderCharacter();
$("gear").innerHTML=Object.entries(state.gear).map(([slot,item])=>{
  const twoHandedRight=item?.two&&slot==="right";
  const details=item?'<strong>'+esc(item.name)+'</strong>'+itemRarityBadge(item)+'<span>'+
    (twoHandedRight?"Zajęta przez broń dwuręczną":esc(itemDescription(item))+(item.two?" · Dwuręczna":""))+'</span>'+
    (twoHandedRight?"":rareEffectDetails(item)+'<button type="button" class="btn gear-remove" onclick="unequipItem(\''+slot+'\')">Zdejmij</button>'):
    '<span class="empty">Puste</span>';
  return '<div id="gear-'+slot+'" class="tile '+(item?itemRarity(item):"")+'"><div class="slot">'+slots[slot][0]+'</div>'+
    '<div class="pic">'+(item?itemIcon(item):slots[slot][1])+'</div>'+details+'</div>';
}).join("");
renderBackpack();
$("shopGold").textContent=state.gold+" zł";
$("shopNotice").textContent="";
hideEquipmentTooltip();
$("shop").innerHTML=state.offers.map((item,i)=>{
  const price=shopPrice(item),duplicate=shopUpgrade(item),status=slotStatus(item),unaffordable=state.gold<price;
  const unavailable=itemRarity(item)==="rare"||Boolean(owned(item,"rare"));
  const buyAction=' onclick="buy('+i+')"';
  return '<div class="tile '+itemRarity(item)+(unaffordable?' tile-unaffordable':'')+'"'+(unaffordable&&!unavailable?buyAction:'')+
    ' data-offer="'+i+'"><strong>'+itemIcon(item)+' '+esc(item.name)+'</strong><div class="slot">Slot: '+slotLabel(item)+
    (status?' · '+status:'')+'</div>'+(!item.potion?itemRarityBadge(item):'')+'<div>'+esc(itemDescription(item))+'</div>'+
    (duplicate?'<div class="green">Ulepszenie: '+esc(promote(duplicate).desc)+'</div>':'')+
    '<div class="price '+(unaffordable?'price-unaffordable':'gold')+'">'+price+' zł</div><button class="btn"'+
    (unaffordable?'':buyAction)+(unavailable?' disabled':'')+'>'+(duplicate?"Ulepsz":"Kup")+'</button></div>';
}).join("")||"Sklep pusty";
syncShopReroll();
$("next").disabled=state.phase!=="main"||!state.enemy;$("nextEnemy").textContent=state.enemy?"Następny przeciwnik: "+state.enemy.icon+" "+state.enemy.name+" · Kategoria "+state.enemy.category:"Walka";$("nextAbility").textContent=state.enemy?.ability||"";
const enemy=state.enemy;
const enemyEffects=enemy?sourceEffectDescription("enemy",enemy.id):"";
$("nextSpecialEffects").textContent=enemyEffects;
$("nextSpecialEffects").hidden=!enemyEffects;
$("nextEnemyStats").innerHTML=enemy?[
  ["❤️ HP",'<span class="hp">'+enemy.hp+'</span>'],
  ["⚔️ DMG",enemy.damage],
  ["🛡️ Pancerz",enemy.armor??0],
  ["💚 Przywracanie zdrowia",(enemy.healOnHit??0)+" HP / trafienie"],
  ["🛡️ Odbicie obrażeń",(enemy.damageReflect??0)+" / otrzymane trafienie"],
  ["⚔️ Przebicie pancerza",enemyArmorPenetration(enemy)]
].map(([label,value])=>'<div class="stat"><b>'+label+'</b><br>'+value+'</div>').join(""):"";
}
function bars(){
  renderCharacterHP();
  if(battleEffects)renderCharacterEffects();
  const enemy=state.enemy;
  $("playerHP").textContent=state.hp+"/"+state.max+" HP";
  $("playerBar").style.width=100*state.hp/state.max+"%";
  $("enemyHP").textContent=state.enemyHp+"/"+enemy.hp+" HP";
  $("enemyBar").style.width=100*state.enemyHp/enemy.hp+"%";
  for(const side of effectSides){
    const armor=battleStat(side,"armor"), damage=battleStat(side,"dmg");
    $(side+"Damage").textContent="DMG "+damage+(side==="player"||armor?" · Pancerz "+armor:"");
    const summary=effectLayerSummary(side);
    $(side+"Effects").textContent=summary;
    $(side+"Effects").hidden=!summary;
  }
}
function damageFloat(id,n,crit,heal=false){const target=$(id),f=document.createElement("span");f.className="floatDamage"+(crit?" critical":"")+(heal?" heal":"");f.textContent=(heal?"+":"−")+n+(crit?" Crit":"");target.appendChild(f);if(!heal){target.classList.remove("hit");void target.offsetWidth;target.classList.add("hit")}setTimeout(()=>{f.remove()},700)}
function addLog(line,heading=false){let p=document.createElement("p");p.textContent=line;if(heading){p.style.color="#e3b36b";p.style.fontWeight="bold"}$("battleText").appendChild(p);$("battleText").scrollTop=$("battleText").scrollHeight}
function report(r){$("report").innerHTML=[["Zadane obrażenia",r.dealt],["Otrzymane obrażenia",r.received],["Trafienia",r.hits],["Trafienia krytyczne",r.crits],["Ataki przeciwnika",r.enemyHits],["Zdobyte złoto",r.reward],["Złoto z sakiewki",r.purse],["Regeneracja HP",r.healed],["Zdobyte EXP",r.exp]].map(x=>"<div>"+x[0]+"<b>"+x[1]+"</b></div>").join("")}
let equipmentTooltipTimer;
let equipmentTooltipCard;

function hideEquipmentTooltip(){
  clearTimeout(equipmentTooltipTimer);
  equipmentTooltipCard?.removeAttribute("aria-describedby");
  equipmentTooltipCard=null;
  $("equipmentTooltip").classList.add("hidden");
}

function equipmentForOffer(offer){
  if(!offer||offer.potion)return [];
  if(offer.slot!=="weapon"){
    const item=state.gear[offer.slot];
    return item?[[slots[offer.slot][0],item]]:[];
  }
  const {left,right}=state.gear;
  if(left?.two||right?.two)return [["Obie ręce",left?.two?left:right]];
  return [["Lewa ręka",left],["Prawa ręka",right]].filter(([,item])=>item);
}

function positionEquipmentTooltip(){
  if(!equipmentTooltipCard)return;
  const tooltip=$("equipmentTooltip");
  const card=equipmentTooltipCard.getBoundingClientRect();
  const {width,height}=tooltip.getBoundingClientRect();
  const gap=8;
  const {clientWidth,clientHeight}=document.documentElement;
  let left=card.right+gap, top=card.top;
  if(left+width>clientWidth-gap){
    left=card.left-width-gap;
    if(left<gap){
      left=card.left;
      top=card.bottom+gap;
      if(top+height>clientHeight-gap)top=card.top-height-gap;
    }
  }
  tooltip.style.left=Math.max(gap,Math.min(left,clientWidth-width-gap))+"px";
  tooltip.style.top=Math.max(gap,Math.min(top,clientHeight-height-gap))+"px";
}

function bindItemTooltip(container,selector,title,readItems,enabled){
  $(container).onpointerover=event=>{
    if(event.pointerType==="touch")return;
    const card=event.target.closest(selector);
    if(!card||card.contains(event.relatedTarget))return;
    hideEquipmentTooltip();
    const items=readItems(card);
    if(!items.length)return;
    equipmentTooltipTimer=setTimeout(()=>{
      if(!enabled()||!card.isConnected)return;
      const tooltip=$("equipmentTooltip");
      tooltip.innerHTML='<h3>'+title+'</h3>'+items.map(([slot,item])=>{
        return '<div class="equipment-tooltip-item '+itemRarity(item)+'"><div class="slot">'+slot+'</div>'+
          '<strong>'+itemIcon(item)+' '+esc(item.name)+'</strong>'+
          '<div>'+itemRarityBadge(item)+'</div>'+
          '<div>'+esc(itemDescription(item))+'</div>'+rareEffectDetails(item)+'</div>';
      }).join("");
      equipmentTooltipCard=card;
      card.setAttribute("aria-describedby","equipmentTooltip");
      tooltip.classList.remove("hidden");
      positionEquipmentTooltip();
    },200);
  };
  $(container).onpointerout=event=>{
    const card=event.target.closest(selector);
    if(card&&!card.contains(event.relatedTarget))hideEquipmentTooltip();
  };
}

bindItemTooltip("shop","[data-offer]","Aktualnie wyposażony",
  card=>equipmentForOffer(state.offers[card.dataset.offer]),()=>state.phase==="main");
bindItemTooltip("backpack","[data-backpack-slot]","Plecak",card=>{
  const entry=state.backpack[card.dataset.backpackSlot];
  return entry?[[slotLabel(entry.item),entry.item]]:[];
},()=>Boolean(state.location)&&$("inventoryMenu").hidden);
window.onscroll=positionEquipmentTooltip;
window.onresize=positionEquipmentTooltip;
