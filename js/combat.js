const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function animatePlayerStrike(){
  const avatar=$("playerArt");
  avatar.classList.remove("is-attacking");
  void avatar.offsetWidth;
  avatar.classList.add("is-attacking");
}
function attackDamage(raw,armor,penetration,targetHp){
  const effectiveArmor=Math.max(0,(armor??0)-(penetration??0));
  return num(Math.min(targetHp,Math.max(1,raw-effectiveArmor)));
}
function penetrationLog(value){
  return value>0?" · przebicie "+value:"";
}
function settleHitEffects(r,playerAttacks,critical=false){
  const enemy=state.enemy;
  const attacker=playerAttacks?state:enemy;
  const defender=playerAttacks?enemy:state;
  const attackerName=playerAttacks?"":(" — "+enemy.name);
  const attackerArt=playerAttacks?"playerArt":"enemyArt";
  const maxHp=playerAttacks?state.max:enemy.hp;
  let hp=playerAttacks?state.hp:state.enemyHp;
  let totalHealed=0;
  function heal(amount,label,logZero=false){
    const healed=num(Math.min(amount,maxHp-hp));
    hp=num(hp+healed);
    totalHealed=num(totalHealed+healed);
    if(healed>0||logZero)addLog(label+": +"+healed+" HP",true);
  }

  if(playerAttacks&&critical&&state.passive?.id==="bloodlust")heal(3,"Żądza krwi",true);
  if(!playerAttacks&&enemy.skill==="lifesteal"&&r.enemyHits%enemy.interval===0)heal(enemy.power,"Wampiryzm",true);
  if(attacker.healOnHit>0&&hp<maxHp)heal(attacker.healOnHit,"Przywracanie zdrowia"+attackerName);
  if(totalHealed>0)damageFloat(attackerArt,totalHealed,false,true);

  const reflected=num(Math.min(defender.damageReflect??0,hp));
  if(reflected>0){
    hp=num(hp-reflected);
    const reportKey=playerAttacks?"received":"dealt";
    r[reportKey]=num(r[reportKey]+reflected);
    const reflector=playerAttacks?" — "+enemy.name:"";
    addLog("Odbicie obrażeń"+reflector+": "+reflected+" obrażeń",true);
    damageFloat(attackerArt,reflected,false);
  }

  if(playerAttacks)state.hp=hp;
  else state.enemyHp=hp;
}
function playerStrike(r,random=Math.random){animatePlayerStrike();let e=state.enemy;if(e.skill==="dodge"&&random()<e.power/100){addLog(e.name+": unik!",true);return}let damage=state.dmg;let p=state.passive?.id;if(p==="berserk"&&state.hp<state.max*.5){damage*=1.2;addLog("Berserk: +20% DMG",true)}if(p==="executioner"&&state.enemyHp<e.hp*.25){damage*=1.25;addLog("Egzekutor: +25% DMG",true)}let crit=random()*100<state.crit;if(crit){damage=Math.floor(damage*state.critD/100);r.crits++}let actual=attackDamage(damage,e.armor,state.armorPenetration,state.enemyHp);state.enemyHp=num(state.enemyHp-actual);r.dealt=num(r.dealt+actual);r.hits++;addLog(selectedClass().name+": "+actual+" obrażeń"+(crit?" (KRYTYK)":"")+(e.armor?" · pancerz "+e.armor:"")+penetrationLog(state.armorPenetration));damageFloat("enemyArt",actual,crit);
  settleHitEffects(r,true,crit);
  bars();report(r)
}
function applyEnemyHit(r,damage,critical=false){
  if(damage<=0)return;
  const e=state.enemy;
  state.hp=num(state.hp-damage);
  r.received=num(r.received+damage);
  r.enemyHits++;
  addLog(e.name+": "+damage+" obrażeń"+(critical?" (KRYTYK)":"")+penetrationLog(enemyArmorPenetration(e)));
  damageFloat("playerArt",damage,critical);
  settleHitEffects(r,false);
  bars();
  report(r);
}
function enemyStrike(r){
  const e=state.enemy;
  let raw=e.damage;
  if(e.skill==="charge"&&r.enemyHits===0){
    raw*=e.power;
    addLog(e.name+": SZARŻA ×"+e.power+"!",true);
  }
  applyEnemyHit(r,attackDamage(raw,state.armor,enemyArmorPenetration(e),state.hp));
}
function bonusAttack(e,random=Math.random){return e.skill==="extra"&&random()<e.power/100}
function battleReport(){return {dealt:0,received:0,crits:0,hits:0,enemyHits:0,reward:0,purse:0,healed:0,exp:0}}
function attackBudget(carry,speed){const total=carry+Math.round(speed*100);return {attacks:Math.floor(total/100),carry:total%100}}
async function fight(){if(state.location!=="arena"||state.phase!=="main"||pending!==null||!state.enemy)return;state.phase="combat";renderLocationLinks();const token=++battleToken;const active=()=>token===battleToken&&state.phase==="combat";$("main").classList.add("hidden");$("consumables").disabled=true;$("combat").classList.remove("hidden");$("continue").classList.add("hidden");$("retry").classList.add("hidden");$("finalScore").classList.add("hidden");$("battleText").replaceChildren();$("outcome").textContent="WALKA TRWA";let e=state.enemy;let r=battleReport(),turn=0,attackCarry=0;$("battleTitle").textContent="Runda "+state.round+" – "+e.name+" · Kategoria "+e.category;$("playerArt").classList.remove("is-attacking","hit");renderEnemySprite(e.art,e.image);$("enemyName").textContent=e.name;$("playerDamage").textContent="DMG "+state.dmg+" · Pancerz "+state.armor;$("enemyDamage").textContent="DMG "+e.damage+(e.armor?" · Pancerz "+e.armor:"");$("enemyAbility").textContent=e.ability;$("battlePassive").textContent=state.passive?.name||"";bars();report(r);window.scrollTo(0,0);await wait(300);
while(active()&&state.enemyHp>0&&state.hp>0){turn++;$("outcome").textContent="WALKA TRWA · TURA "+turn;addLog("Tura "+turn,true);let budget=attackBudget(attackCarry,state.speed),attacks=budget.attacks;attackCarry=budget.carry;if(attacks===0)addLog(selectedClass().name+": przygotowuje kolejny atak ("+attackCarry+"/100)");for(let a=0;a<attacks;a++){if(!active())return;playerStrike(r);await wait(300);if(!active())return;if(state.enemyHp<=0||state.hp<=0)break}
if(state.enemyHp>0&&state.hp>0){enemyStrike(r);await wait(300);if(!active())return;if(state.hp>0&&state.enemyHp>0&&bonusAttack(e)){addLog(e.name+": dodatkowy atak!",true);enemyStrike(r);await wait(300);if(!active())return}}}
if(!active())return;await wait(350);if(!active())return;state.dead=state.hp<=0;r.reward=state.dead?0:e.gold;if(!state.dead){state.wins++;r.purse=purseReward();r.reward+=r.purse;if(r.purse)addLog("Sakiewka: +"+r.purse+" złota",true)}state.gold+=r.reward;if(!state.dead){r.healed=num(Math.min(state.regen,state.max-state.hp));state.hp=num(state.hp+r.healed);addLog("Regeneracja: +"+r.healed+" HP",true);if(r.healed>0)damageFloat("playerArt",r.healed,false,true);bars();r.exp=xpReward()+(e.xpBonus??0);state.exp+=r.exp}state.phase=state.dead?"dead":"result";renderLocationLinks();renderCharacter();$("outcome").textContent=state.dead?"KONIEC GRY":"ZWYCIĘSTWO";report(r);addLog(state.dead?selectedClass().name+" poległ.":"Zwycięstwo! +"+r.reward+" złota, +"+r.exp+" EXP",true);if(state.dead)finishScore();if(!state.dead&&state.exp>=xpNeed()){addLog("Awans! Wybierz rozwinięcie.",true);await wait(500);if(token===battleToken&&state.phase==="result")openLevel()}else{$("continue").classList.toggle("hidden",state.dead);$("retry").classList.toggle("hidden",!state.dead)}}