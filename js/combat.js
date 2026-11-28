const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function animatePlayerStrike(){
  const avatar=$("playerArt");
  avatar.classList.remove("is-attacking");
  void avatar.offsetWidth;
  avatar.classList.add("is-attacking");
}
function attackDamage(raw,armor,penetration,targetHp,hitMultiplier=1,reduction=0){
  const effectiveArmor=Math.max(0,(armor??0)-(penetration??0));
  return limitedDamage(Math.max(1,raw-effectiveArmor)*hitMultiplier,targetHp,reduction);
}
function penetrationLog(value){
  return value>0?" · przebicie "+value:"";
}
function settleHitEffects(r,playerAttacks,critical=false){
  const enemy=state.enemy;
  const attacker=playerAttacks?"player":"enemy";
  const defender=oppositeEffectSide(attacker);
  const art=playerAttacks?"playerArt":"enemyArt";
  const hp=effectHp(attacker);
  let current=hp;
  if(hp>0){
    function heal(amount,label,logZero=false){
      const healed=num(Math.min(amount,effectMaxHp(attacker)-current));
      current=num(current+healed);
      if(healed>0||logZero)addLog(label+": +"+healed+" HP",true);
    }
    if(playerAttacks&&critical&&state.passive?.id==="bloodlust")heal(3,"Żądza krwi",true);
    if(!playerAttacks&&enemy.skill==="lifesteal"&&r.enemyHits%enemy.interval===0)heal(enemy.power,"Wampiryzm",true);
    let healed=num(current-hp);
    setEffectHp(attacker,current);
    const healing={amount:battleStat(attacker,"healOnHit")};
    if(healing.amount>0)emitBattleEffect(attacker,"beforeHitHeal",{healing});
    current=effectHp(attacker);
    const beforeHitHeal=current;
    const available=Math.max(0,effectMaxHp(attacker)-current);
    if(current>0&&healing.amount>0&&available>0)heal(healing.amount,"Przywracanie zdrowia"+(playerAttacks?"":" — "+enemy.name));
    healed=num(healed+current-beforeHitHeal);
    if(healed>0&&current>0){
      setEffectHp(attacker,current);
      damageFloat(art,healed,false,true);
      emitBattleEffect(attacker,"onHeal",{healed});
    }
    const overflow=num(Math.max(0,healing.amount-available));
    if(overflow>0&&effectHp(attacker)>0)emitBattleEffect(attacker,"onHitHealOverflow",{overflow});
  }

  const afterHeal=effectHp(attacker);
  const reflection={amount:battleStat(defender,"damageReflect"),multiplier:1};
  if(afterHeal>0)emitBattleEffect(defender,"beforeReflect",{reflection});
  const reflected=limitedDamage(reflection.amount*reflection.multiplier,effectHp(attacker),battleStat(attacker,"damageReduction"));
  if(reflected>0){
    setEffectHp(attacker,num(effectHp(attacker)-reflected));
    const reportKey=playerAttacks?"received":"dealt";
    r[reportKey]=num(r[reportKey]+reflected);
    const reflector=playerAttacks?" — "+enemy.name:"";
    addLog("Odbicie obrażeń"+reflector+": "+reflected+" obrażeń",true);
    damageFloat(art,reflected,false);
    notifyEffectDamage(attacker,defender,reflected);
  }
}

function effectAttack(side){
  const attack={multiplier:1,hitMultiplier:1,ignoreArmor:false,dodged:false};
  emitBattleEffect(side,"onAttack",{attack});
  if(state.hp>0&&state.enemyHp>0)emitBattleEffect(oppositeEffectSide(side),"beforeIncomingAttack",{attack});
  return attack;
}

function missedAttack(side){
  addLog(effectOwnerName(side)+": unik!",true);
  emitBattleEffect(side,"onDodge");
}

function resolveAttackCritical(side,dodged,random){
  const chance=battleCriticalChance(side);
  const critical=!dodged&&(side==="player"||chance>0)&&random()*100<chance;
  emitBattleEffect(side,"afterAttackRoll",{critical,dodged});
  return critical;
}

function playerStrike(r,random=Math.random){
  if(effectAttackSkipped("player"))return;
  animatePlayerStrike();
  const attack=effectAttack("player");
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  const enemy=state.enemy;
  const dodged=attack.dodged||(enemy.skill==="dodge"&&random()<enemy.power/100);
  const crit=resolveAttackCritical("player",dodged,random);
  if(dodged){
    missedAttack("enemy");
    bars();report(r);
    return;
  }
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  emitBattleEffect("player","beforeAttackDamage",{attack,critical:crit});
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  let damage=battleStat("player","dmg");
  const passive=state.passive?.id;
  if(passive==="berserk"&&state.hp<state.max*.5){damage*=1.2;addLog("Berserk: +20% DMG",true)}
  if(passive==="executioner"&&state.enemyHp<enemy.hp*.25){damage*=1.25;addLog("Egzekutor: +25% DMG",true)}
  damage*=attack.multiplier*(1+battleStat("player","attackDamageBonus")/100);
  if(crit){damage=Math.floor(damage*battleStat("player","critD")/100);r.crits++}
  const armor=attack.ignoreArmor?0:battleStat("enemy","armor"), penetration=battleStat("player","armorPenetration");
  const actual=attackDamage(damage,armor,penetration,state.enemyHp,attack.hitMultiplier,battleStat("enemy","damageReduction"));
  state.enemyHp=num(state.enemyHp-actual);
  r.dealt=num(r.dealt+actual);
  r.hits++;
  addLog(selectedClass().name+": "+actual+" obrażeń"+(crit?" (KRYTYK)":"")+(armor?" · pancerz "+armor:"")+penetrationLog(penetration));
  damageFloat("enemyArt",actual,crit);
  notifyEffectDamage("enemy","player",actual,crit,false,true);
  emitBattleEffect("player","onHit",{damage:actual,critical:crit});
  if(crit)emitBattleEffect("player","onCrit",{damage:actual,critical:true});
  settleHitEffects(r,true,crit);
  checkEffectKill("enemy","player");
  bars();report(r);
}

function applyEnemyHit(r,damage,critical=false,landed=damage>0){
  if(!landed)return;
  const enemy=state.enemy;
  state.hp=num(state.hp-damage);
  r.received=num(r.received+damage);
  r.enemyHits++;
  addLog(enemy.name+": "+damage+" obrażeń"+(critical?" (KRYTYK)":"")+penetrationLog(battleStat("enemy","armorPenetration")));
  damageFloat("playerArt",damage,critical);
  notifyEffectDamage("player","enemy",damage,critical,false,true);
  emitBattleEffect("enemy","onHit",{damage,critical});
  if(critical)emitBattleEffect("enemy","onCrit",{damage,critical:true});
  settleHitEffects(r,false,critical);
  checkEffectKill("player","enemy");
  bars();report(r);
}

function enemyStrike(r,random=Math.random){
  if(effectAttackSkipped("enemy"))return;
  const attack=effectAttack("enemy");
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  r.enemyAttempts=(r.enemyAttempts??0)+1;
  const crit=resolveAttackCritical("enemy",attack.dodged,random);
  if(attack.dodged){missedAttack("player");bars();report(r);return}
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  const enemy=state.enemy;
  emitBattleEffect("enemy","beforeAttackDamage",{attack,critical:crit});
  if(state.hp<=0||state.enemyHp<=0){bars();report(r);return}
  let raw=battleStat("enemy","dmg");
  if(enemy.skill==="charge"&&r.enemyAttempts===1){
    raw*=enemy.power;
    addLog(enemy.name+": SZARŻA ×"+enemy.power+"!",true);
  }
  raw*=attack.multiplier*(1+battleStat("enemy","attackDamageBonus")/100);
  if(crit)raw=Math.floor(raw*battleStat("enemy","critD")/100);
  applyEnemyHit(r,attackDamage(raw,attack.ignoreArmor?0:battleStat("player","armor"),
    battleStat("enemy","armorPenetration"),state.hp,attack.hitMultiplier,battleStat("player","damageReduction")),crit,true);
}
function bonusAttack(e,random=Math.random){return e.skill==="extra"&&random()<e.power/100}
function battleReport(){return {dealt:0,received:0,crits:0,hits:0,enemyHits:0,reward:0,purse:0,healed:0,exp:0}}
function attackBudget(carry,speed){const total=carry+Math.round(speed*100);return {attacks:Math.floor(total/100),carry:total%100}}
async function fight(){
  if(state.location!=="arena"||state.phase!=="main"||pending!==null||!state.enemy)return;
  state.phase="combat";
  renderLocationLinks();
  const token=++battleToken;
  const active=()=>token===battleToken&&state.phase==="combat";
  const alive=()=>state.enemyHp>0&&state.hp>0;
  $("main").classList.add("hidden");
  syncSkillControls();
  hideEquipmentTooltip();
  cancelInventoryPress();
  $("combat").classList.remove("hidden");
  for(const id of ["continue","retry","finalScore"])$(id).classList.add("hidden");
  $("battleText").replaceChildren();
  $("outcome").textContent="WALKA TRWA";
  const enemy=state.enemy,r=battleReport();
  let turn=0,attackCarry=0,enemyCarry=0;
  $("battleTitle").textContent="Runda "+state.round+" – "+enemy.name+" · Kategoria "+enemy.category;
  $("playerArt").classList.remove("is-attacking","hit");
  renderEnemySprite(enemy.art,enemy.image);
  $("enemyName").textContent=enemy.name;
  $("enemyAbility").textContent=[enemy.ability,sourceEffectDescription("enemy",enemy.id)].filter(Boolean).join(" ");
  $("battleSubclass").textContent=selectedSubclass()?.name??"";
  window.scrollTo(0,0);
  try{
    beginBattleEffects(r);
    bars();report(r);
    await wait(300);
    await runEffectAttacks(r,active);
    while(active()&&alive()){
      turn++;
      $("outcome").textContent="WALKA TRWA · TURA "+turn;
      addLog("Tura "+turn,true);
      startEffectTurn("player");
      await runEffectAttacks(r,active);
      if(!active())return;
      const budget=attackBudget(attackCarry,Math.max(.25,battleStat("player","speed")));
      attackCarry=budget.carry;
      if(budget.attacks===0&&alive())addLog(selectedClass().name+": przygotowuje kolejny atak ("+attackCarry+"/100)");
      for(let a=0;a<budget.attacks&&alive();a++){
        if(!active())return;
        playerStrike(r);
        await wait(300);
        if(!active())return;
        await runEffectAttacks(r,active);
      }
      if(!active())return;
      endEffectTurn("player");
      await runEffectAttacks(r,active);
      if(!active())return;
      if(alive()){
        startEffectTurn("enemy");
        await runEffectAttacks(r,active);
        if(!active())return;
        const enemyBudget=attackBudget(enemyCarry,Math.max(.25,battleStat("enemy","speed")));
        enemyCarry=enemyBudget.carry;
        for(let a=0;a<enemyBudget.attacks&&alive();a++){
          enemyStrike(r);
          await wait(300);
          if(!active())return;
          await runEffectAttacks(r,active);
          if(!active())return;
          if(a===0&&alive()&&bonusAttack(enemy)){
            addLog(enemy.name+": dodatkowy atak!",true);
            secondaryEffectAttack(()=>enemyStrike(r));
            await wait(300);
            if(!active())return;
            await runEffectAttacks(r,active);
          }
        }
        if(!active())return;
        endEffectTurn("enemy");
        await runEffectAttacks(r,active);
      }
      bars();report(r);
    }
    if(!active())return;
    await wait(350);
    if(!active())return;
    state.dead=state.hp<=0;
    battleVictoryEffects(!state.dead);
    if(!state.dead){
      state.wins++;
      r.purse=purseReward();
      if(r.purse)addLog("Sakiewka: +"+r.purse+" złota",true);
      r.healed=num(Math.min(battleStat("player","regen"),state.max-state.hp));
      state.hp=num(state.hp+r.healed);
      addLog("Regeneracja: +"+r.healed+" HP",true);
      if(r.healed>0){
        damageFloat("playerArt",r.healed,false,true);
        emitBattleEffect("player","onHeal",{healed:r.healed});
      }
      r.exp=xpReward()+(enemy.xpBonus??0);
      state.exp+=r.exp;
    }
    const effectGold=battleEndEffects();
    const reward=state.dead?effectGold:Math.floor(num((enemy.gold+r.purse+effectGold)*battleEffects.rewardScale));
    state.gold+=reward-effectGold;
    r.reward=reward;
    battleEffects=null;
    if(!state.dead)awardSkillLevels();
    state.phase=state.dead?"dead":"result";
    renderLocationLinks();
    renderCharacter();
    bars();report(r);
    $("outcome").textContent=state.dead?"KONIEC GRY":"ZWYCIĘSTWO";
    addLog(state.dead?selectedClass().name+" poległ.":"Zwycięstwo! +"+r.reward+" złota, +"+r.exp+" EXP",true);
    if(state.dead)finishScore();
    $("continue").classList.toggle("hidden",state.dead);
    $("retry").classList.toggle("hidden",!state.dead);
  }finally{
    if(token===battleToken)battleEffects=null;
  }
}
