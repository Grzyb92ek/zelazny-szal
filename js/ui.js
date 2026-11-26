function renderCharacter(){
  $("round").textContent=state.round;
  $("hudGold").textContent=state.gold;
  $("hudLevel").textContent=state.level;
  $("hudScore").textContent=scoreParts().score;
  $("playerName").textContent=state.nickname?"Gracz: "+state.nickname:"";
  $("passiveInfo").textContent=state.passive?state.passive.name+" — "+state.passive.desc:"";
  $("stats").innerHTML=[
    ["🛡️ Pancerz",state.armor],["⚔️ DMG",state.dmg],
    ["⚡ Szybkość",state.speed.toFixed(2)],["🎯 Krytyk",state.crit+"%"],
    ["💥 Kryt. obrażenia",state.critD+"%"],["💚 Regeneracja",state.regen+" HP"]
  ].map(([label,value])=>'<div class="stat"><b>'+label+'</b><br>'+value+'</div>').join("");
  $("xpValue").textContent=state.exp+"/"+xpNeed()+" EXP";
  $("xpBar").style.width=Math.min(100,100*state.exp/xpNeed())+"%";
  renderCharacterHP();
}
function renderCharacterHP(){
  $("characterHP").textContent=state.hp+"/"+state.max;
  $("characterHPBar").style.width=100*state.hp/state.max+"%";
}
function render(){recalc();renderCharacter();
$("consumables").disabled=state.phase!=="main";
$("gear").innerHTML=Object.entries(state.gear).map(([slot,it])=>'<div id="gear-'+slot+'" class="tile '+(it?.rarity==="uncommon"?"uncommon":"")+'"><div class="slot">'+slots[slot][0]+'</div><div class="pic">'+(it?it.icon:slots[slot][1])+'</div>'+(it?'<strong>'+it.name+'</strong><span class="'+(it.rarity==="uncommon"?"green":"small")+'">'+(it.rarity==="uncommon"?"Niepospolity":"Pospolity")+'</span><span>'+(it.two?(slot==="right"?"Zajęta przez broń dwuręczną":it.desc+" · Dwuręczna"):it.desc)+'</span>':'<span class="empty">Puste</span>')+'</div>').join("");
$("cons").innerHTML=state.cons?'<div class="item">🧪 Mikstura lecząca x'+state.cons+' <button class="btn" onclick="usePotion()">Użyj (20 HP)</button></div>':"Brak";
$("shopGold").textContent=state.gold+" zł";
$("shopNotice").textContent="";
$("shop").innerHTML=state.offers.map((it,i)=>{
  const dupe=owned(it),status=slotStatus(it),unaffordable=state.gold<it.cost;
  const buyAction=' onclick="buy('+i+')"';
  return '<div class="tile'+(unaffordable?' tile-unaffordable':'')+'"'+(unaffordable?buyAction:'')+'><strong>'+it.icon+' '+it.name+'</strong><div class="slot">Slot: '+slotLabel(it)+(status?' · '+status:'')+'</div>'+(!it.potion?'<span class="small">Pospolity</span>':'')+'<div>'+it.desc+'</div>'+(dupe&&dupe.rarity!=="uncommon"?'<div class="green">Ulepszenie: '+promote(it).desc+'</div>':'')+'<div class="price '+(unaffordable?'price-unaffordable':'gold')+'">'+it.cost+' zł</div><button class="btn"'+(unaffordable?'':buyAction)+(dupe?.rarity==="uncommon"?' disabled':'')+'>'+(dupe?"Ulepsz":"Kup")+'</button></div>'}).join("")||"Sklep pusty";
$("reroll").disabled=state.rerolled||state.gold<3||state.dead;$("next").disabled=state.phase!=="main";$("nextEnemy").textContent=state.enemy?"Następny przeciwnik: "+state.enemy.icon+" "+state.enemy.name+" · Kategoria "+state.enemy.category:"Walka";$("nextAbility").textContent=state.enemy?.ability||"";
const enemy=state.enemy;
$("nextEnemyStats").innerHTML=enemy?[
  ["❤️ HP",'<span class="hp">'+enemy.hp+'</span>'],
  ["⚔️ DMG",enemy.damage],
  ["🛡️ Pancerz",enemy.armor??0]
].map(([label,value])=>'<div class="stat"><b>'+label+'</b><br>'+value+'</div>').join(""):"";
}
function bars(){renderCharacterHP();let e=state.enemy;$("playerHP").textContent=state.hp+"/"+state.max+" HP";$("playerBar").style.width=100*state.hp/state.max+"%";$("enemyHP").textContent=state.enemyHp+"/"+e.hp+" HP";$("enemyBar").style.width=100*state.enemyHp/e.hp+"%"}
function damageFloat(id,n,crit,heal=false){const target=$(id),f=document.createElement("span");f.className="floatDamage"+(crit?" critical":"")+(heal?" heal":"");f.textContent=(heal?"+":"−")+n;target.appendChild(f);if(!heal){target.classList.remove("hit");void target.offsetWidth;target.classList.add("hit")}setTimeout(()=>{f.remove()},700)}
function addLog(line,heading=false){let p=document.createElement("p");p.textContent=line;if(heading){p.style.color="#e3b36b";p.style.fontWeight="bold"}$("battleText").appendChild(p);$("battleText").scrollTop=$("battleText").scrollHeight}
function report(r){$("report").innerHTML=[["Zadane obrażenia",r.dealt],["Otrzymane obrażenia",r.received],["Trafienia",r.hits],["Trafienia krytyczne",r.crits],["Ataki przeciwnika",r.enemyHits],["Zdobyte złoto",r.reward],["Złoto z sakiewki",r.purse],["Regeneracja HP",r.healed],["Zdobyte EXP",r.exp]].map(x=>"<div>"+x[0]+"<b>"+x[1]+"</b></div>").join("")}