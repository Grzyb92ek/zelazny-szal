const effectSides = ["player","enemy"];
const oppositeEffectSide = side => side==="player"?"enemy":"player";
const maxEffectEvents = 128;
const maxEffectAttacks = 8;
let battleEffects = null;
const effectGearIds = new WeakMap();
let effectGearSequence = 0;

function effectGearKey(item){
  if(!effectGearIds.has(item))effectGearIds.set(item,++effectGearSequence);
  return "gear:"+effectGearIds.get(item);
}

function sourceEffectInstances(kind,sourceId,rarity,sourceKey,origin){
  return effectInstances(configuredSourceEffects(kind,sourceId,rarity),kind,sourceId,sourceKey,origin);
}

function configuredSourceEffects(kind,sourceId,rarity){
  return [...attachedEffects(effectCatalog,kind,sourceId,rarity),...advancedEffectsFor(modifierCatalog,kind,sourceId,rarity)];
}

function effectInstances(effects,kind,sourceId,sourceKey,origin){
  return effects.map(effect=>({
    effect,key:sourceKey+":"+effect.id,origin,
    stackKey:kind+":"+sourceId+":"+(sourceKey.startsWith("gear:")?sourceKey+":":"")+effect.id
  }));
}

function definedEffectInstances(source,kind){
  if(!source)return [];
  const wheelId=kind==="skill"?currentSkillWheel()?.id:undefined;
  const qualifiedId=wheelId?wheelId+"/"+source.id:source.id;
  const named=(source.effects??[]).map(id=>effectCatalog.effects.find(row=>row.id===id)).filter(Boolean);
  const effects=[...named,...advancedEffectsFor(modifierCatalog,kind,source.id,undefined,wheelId)];
  return effectInstances(effects,kind,qualifiedId,kind+":"+qualifiedId,(kind==="subclass"?"Podklasa: ":"Umiejętność: ")+source.name);
}

function playerEquipmentEffects(){
  const profile=selectedClass();
  const subclass=selectedSubclass();
  return [
    ...sourceEffectInstances("class",profile.id,undefined,"class","Klasa: "+profile.name),
    ...definedEffectInstances(subclass,"subclass"),
    ...unlockedSkills().flatMap(node=>definedEffectInstances(node,"skill")),
    ...(state.passive?sourceEffectInstances("passive",state.passive.id,undefined,"passive","Pasywka: "+state.passive.name):[]),
    ...equipped().flatMap(item=>sourceEffectInstances("item",item.id,itemRarity(item),effectGearKey(item),"Przedmiot: "+item.name))
  ];
}

function beginBattleEffects(report){
  const player = [
    ...playerEquipmentEffects(),
    ...state.preparedEffects.flatMap(({id},index)=>sourceEffectInstances("item",id,"cons","use:"+index)
      .filter(instance=>instance.effect.trigger!=="onUse"))
  ];
  state.preparedEffects=[];
  const enemy=sourceEffectInstances("enemy",state.enemy.id,undefined,"enemy");
  battleEffects=createEffectContext({player,enemy},report);
  for(const side of effectSides)emitBattleEffect(side,"onBattleStart");
}

function createEffectContext(instances,report,mode="battle"){
  return {
    instances,report,mode,counters:new Map(),layers:[],queue:[],path:[],processing:false,
    turns:{player:0,enemy:0},side:null,endingTurn:false,ended:false,
    skips:{player:0,enemy:0},extra:[],extraCount:{player:0,enemy:0},secondaryAttack:false,
    kills:new Set(),extraGold:0,rewardScale:1,playerWon:false,enemyHpGains:new Map(),conditionalActive:new Set()
  };
}

function useConsumableEffects(item){
  const instances=sourceEffectInstances("item",item.id,"cons","use");
  if(!instances.length)return;
  if(instances.some(instance=>instance.effect.trigger!=="onUse"))state.preparedEffects.push({id:item.id});
  battleEffects=createEffectContext({player:instances,enemy:[]},null,"use");
  try{emitBattleEffect("player","onUse")}
  finally{battleEffects=null}
}

function effectHp(side){return side==="player"?state.hp:state.enemyHp}
function effectMaxHp(side){return side==="player"?state.max:state.enemy?.hp??0}
function setEffectHp(side,hp){if(side==="player")state.hp=hp;else state.enemyHp=hp}
function effectOwnerName(side){return side==="player"?selectedClass().name:state.enemy.name}

function activeEffectLayers(side){
  return [
    ...(side==="player"?state.permanentEffects:[]),
    ...(battleEffects?.layers.filter(layer=>layer.side===side)??[])
  ];
}

const effectRunKey=(side,instance)=>side+":"+instance.stackKey;
const effectRunUses=(side,instance)=>state.effectRunUses.get(effectRunKey(side,instance))??0;

function battleStat(side,key){
  const entity=side==="player"?state:state.enemy;
  const base=side==="enemy"&&key==="armorPenetration"?enemyArmorPenetration(entity):
    (side==="enemy"&&key==="dmg"?entity.damage:entity[key])??(key==="critD"?150:key==="speed"?1:0);
  let modifier=activeEffectLayers(side).reduce((sum,layer)=>sum+(layer.stat===key?layer.value:0),0);
  const context=battleEffects;
  if(context?.mode==="battle"&&!context.ended){
    for(const {effect,key:instanceKey} of context.instances[side]){
      if(effect.action!=="conditionalStat"||effect.stat!==key)continue;
      const id=side+":"+instanceKey;
      if(effectHp(side)>0&&effectConditionPasses(effect,side)){
        modifier+=effect.value;
        if(!context.conditionalActive.has(id))addLog(effectOwnerName(side)+" · "+effect.name,true);
        context.conditionalActive.add(id);
      }else context.conditionalActive.delete(id);
    }
  }
  return modifier?Math.max(0,num(base+modifier)):base;
}

function battleCriticalChance(side){
  return Math.min(100,Math.max(battleStat(side,"crit"),battleStat(side,"critFloor")));
}

function limitedDamage(amount,hp,reduction=0){
  return num(Math.min(hp,Math.max(0,amount)*(1-Math.min(100,reduction)/100)));
}

function effectConditionPasses(effect,owner,details={}){
  if(!effect.conditionTarget)return true;
  const target=effect.conditionTarget==="self"?owner:oppositeEffectSide(owner);
  const hp=effectHp(target),max=effectMaxHp(target);
  const measure=points=>effect.conditionUnit==="percent"?(max?100*points/max:0):points;
  const passes=value=>effect.conditionAbove?(effect.conditionStrict?value>effect.conditionValue:value>=effect.conditionValue):
    (effect.conditionStrict?value<effect.conditionValue:value<=effect.conditionValue);
  if(!passes(measure(effect.conditionCrossing?details.currentHp:hp)))return false;
  return !effect.conditionCrossing||(Number.isFinite(details.previousHp)&&!passes(measure(details.previousHp)));
}

function queueEffectEvent(side,trigger,details){
  const context=battleEffects;
  if(!context||context.queue.length>=maxEffectEvents)return;
  context.queue.push({side,trigger,details,path:context.path});
}

function emitBattleEffect(side,trigger,details={}){
  queueEffectEvent(side,trigger,details);
  drainBattleEffects();
}

function drainBattleEffects(){
  const context=battleEffects;
  if(!context||context.processing)return;
  context.processing=true;
  try{
    for(let count=0;context.queue.length&&count<maxEffectEvents;count++){
      const {side,trigger,details,path}=context.queue.shift();
      context.path=path;
      if(trigger==="checkKill"){
        if(effectHp(side)<=0&&!context.kills.has(side)){
          context.kills.add(side);
          if(details.source!==side)queueEffectEvent(details.source,"onKill",{target:side});
        }
        continue;
      }
      if(effectClearEvents.includes(trigger)){
        context.layers=context.layers.filter(layer=>layer.side!==side||layer.clearOn!==trigger);
      }
      for(const instance of context.instances[side]){
        const {effect,key}=instance;
        if(effect.trigger!==trigger)continue;
        if((effect.criticalOnly&&!details.critical)||(effect.nonCriticalOnly&&details.critical)||
            (effect.hitOnly&&!details.hit)||(effect.nonLethalOnly&&details.lethal)||
            (trigger==="onDamaged"&&details.damage===0&&!effect.hitOnly))continue;
        const instanceId=side+":"+key;
        if(path.includes(instanceId))continue;
        const counters=context.counters.get(instanceId)??{events:0,uses:0};
        context.counters.set(instanceId,counters);
        counters.events++;
        if(counters.events%(effect.every??1)!==0||(effect.limit&&counters.uses>=effect.limit)||
            (effect.runLimit&&effectRunUses(side,instance)>=effect.runLimit)||
            !effectConditionPasses(effect,side,details))continue;
        if(effect.action==="extraAttack"&&context.secondaryAttack)continue;
        if(effect.action==="survive"&&(!details.lethal||effectHp(side)>0))continue;
        if((context.ended||context.mode==="use")&&combatOnlyAction(effect))continue;
        if(effectHp(side)<=0&&!["survive","gold","reflectFromArmor","scaleReflect"].includes(effect.action))continue;
        const chance=effect.chance??100;
        if(chance<=0||(chance<100&&Math.random()*100>=chance))continue;
        context.path=[...path,instanceId];
        if(applyBattleEffect(instance,side,details)){
          counters.uses++;
          if(effect.runLimit)state.effectRunUses.set(effectRunKey(side,instance),effectRunUses(side,instance)+1);
          if(context.mode==="battle")addLog(effectOwnerName(side)+" · "+effect.name,true);
        }
        context.path=path;
      }
    }
  }finally{
    context.queue.length=0;
    context.path=[];
    context.processing=false;
  }
}

function notifyEffectDamage(target,source,damage,critical=false,checkKill=true,hit=false){
  if((damage<=0&&!hit)||!battleEffects)return;
  const hp=effectHp(target);
  queueEffectEvent(target,"onDamaged",{damage,critical,hit,lethal:hp<=0,currentHp:hp,previousHp:num(hp+damage)});
  if(checkKill)queueEffectEvent(target,"checkKill",{source});
  drainBattleEffects();
}

function checkEffectKill(target,source){
  if(battleEffects&&effectHp(target)<=0)emitBattleEffect(target,"checkKill",{source});
}

function dealEffectDamage(target,owner,amount){
  const hp=effectHp(target);
  const damage=limitedDamage(amount,hp,battleStat(target,"damageReduction"));
  if(damage<=0)return false;
  setEffectHp(target,num(hp-damage));
  const report=battleEffects.report,key=target==="player"?"received":"dealt";
  report[key]=num(report[key]+damage);
  damageFloat(target==="player"?"playerArt":"enemyArt",damage,false);
  notifyEffectDamage(target,owner,damage);
  return true;
}

function healEffectTarget(target,amount){
  const hp=effectHp(target);
  if(hp<=0)return false;
  const healed=num(Math.min(amount,effectMaxHp(target)-hp));
  if(healed<=0)return false;
  setEffectHp(target,num(hp+healed));
  if(battleEffects.mode==="battle")damageFloat(target==="player"?"playerArt":"enemyArt",healed,false,true);
  emitBattleEffect(target,"onHeal",{healed});
  return true;
}

function applyBattleEffect(instance,owner,details={}){
  const {effect}=instance,context=battleEffects;
  const target=effect.target==="self"?owner:oppositeEffectSide(owner);
  const hp=effectHp(target);
  switch(effect.action){
    case "damage":return dealEffectDamage(target,owner,effect.value);
    case "damageFromStat":return dealEffectDamage(target,owner,battleStat(owner,effect.stat)*effect.value/100);
    case "overflowDamage":return dealEffectDamage(target,owner,(details.overflow??0)*effect.value);
    case "heal":return healEffectTarget(target,effect.value);
    case "healPercent":return healEffectTarget(target,effectMaxHp(target)*effect.value/100);
    case "stat":
    case "reduceArmor":{
      if(hp<=0)return false;
      const stat=effect.action==="reduceArmor"?"armor":effect.stat;
      let value=effect.action==="reduceArmor"?
        -(effect.stack?Math.min(effect.value,battleStat(target,"armor")):effect.value):effect.value;
      if(!value)return false;
      const permanent=target==="player"&&effect.duration==="permanent";
      const layers=permanent?state.permanentEffects:context.layers;
      const key=permanent&&effect.totalCap&&!effect.id.startsWith("advanced:")?"cap:"+effect.id:owner+":"+(permanent?instance.stackKey:instance.key);
      const matches=layers.filter(layer=>layer.key===key&&layer.side===target);
      if(effect.totalCap){
        const gained=matches.reduce((sum,layer)=>sum+Math.abs(layer.value),0);
        value=num(Math.sign(value)*Math.min(Math.abs(value),Math.max(0,effect.totalCap-gained)));
        if(!value)return false;
      }
      const capacity=effect.stack?effect.maxStacks:1;
      if(capacity&&matches.length>=capacity)layers.splice(layers.indexOf(matches[0]),1);
      if(!capacity&&effect.duration!=="turns"&&matches.length){
        matches[0].value=num(matches[0].value+value);
        matches[0].count=(matches[0].count??1)+1;
        return true;
      }
      const until=effect.duration==="turns"?context.turns[target]+effect.turns-
        (context.side===target&&!context.endingTurn?1:0):Infinity;
      layers.push({side:target,key,stat,value,until,name:effect.name,permanent,clearOn:effect.clearOn,
        origin:instance.origin,effect});
      if(effect.healPercent>0)healEffectTarget(target,effectMaxHp(target)*effect.healPercent/100);
      return true;
    }
    case "extraAttack":
      if(effectHp(owner)<=0||effectHp(oppositeEffectSide(owner))<=0||context.extraCount[owner]>=maxEffectAttacks)return false;
      context.extraCount[owner]++;
      context.extra.push(owner);
      return true;
    case "skipAttack":
      if(hp<=0||context.skips[target]>=maxEffectAttacks)return false;
      context.skips[target]++;
      return true;
    case "gold":
      if(target==="player"){state.gold+=effect.value;context.extraGold+=effect.value}
      else state.enemy.gold+=effect.value;
      return true;
    case "survive":
      setEffectHp(target,1);
      if(effect.healPercent>0)healEffectTarget(target,effectMaxHp(target)*effect.healPercent/100);
      return true;
    case "scaleAttack":
      if(!details.attack)return false;
      details.attack.multiplier*=effect.value;
      return true;
    case "scaleHitDamage":
      if(!details.attack)return false;
      details.attack.hitMultiplier*=effect.value;
      return true;
    case "ignoreArmor":
      if(!details.attack||details.attack.ignoreArmor)return false;
      details.attack.ignoreArmor=true;
      return true;
    case "dodge":
      if(!details.attack||details.attack.dodged)return false;
      details.attack.dodged=true;
      return true;
    case "scaleHitHeal":
      if(!details.healing||details.healing.amount<=0)return false;
      details.healing.amount*=effect.value;
      return true;
    case "reflectFromArmor":{
      const amount=battleStat(owner,"armor")*effect.value/100;
      if(!details.reflection||amount<=0)return false;
      details.reflection.amount+=amount;
      return true;
    }
    case "scaleReflect":
      if(!details.reflection)return false;
      details.reflection.multiplier*=effect.value;
      return true;
    case "maxHpGain":{
      if(hp<=0)return false;
      const same=target==="player"?state.effectRunTotals:context.enemyHpGains;
      const capKey=effect.id.startsWith("advanced:")?effectRunKey(owner,instance):effect.id;
      const prior=same.get(capKey)??0;
      const gain=num(Math.min(effect.value,(effect.runCap??Infinity)-prior));
      if(gain<=0)return false;
      same.set(capKey,num(prior+gain));
      if(target==="player"){
        state.permanentHpBonus=num(state.permanentHpBonus+gain);
        state.max=num(state.max+gain);
        state.permanentHpSources.set(capKey,{effect,origin:instance.origin});
      }else state.enemy.hp=num(state.enemy.hp+gain);
      return true;
    }
    case "scaleReward":
      if(target!=="player"||!context.playerWon)return false;
      context.rewardScale*=effect.value;
      return true;
    default:return false;
  }
}

function effectAttackSkipped(side){
  if(!battleEffects?.skips[side])return false;
  battleEffects.skips[side]--;
  addLog(effectOwnerName(side)+" pomija atak.",true);
  return true;
}

function startEffectTurn(side){
  if(!battleEffects)return;
  battleEffects.side=side;
  battleEffects.endingTurn=false;
  battleEffects.turns[side]++;
  emitBattleEffect(side,"onTurnStart");
}

function endEffectTurn(side){
  if(!battleEffects)return;
  battleEffects.endingTurn=true;
  emitBattleEffect(side,"onTurnEnd");
  const turn=battleEffects.turns[side];
  battleEffects.layers=battleEffects.layers.filter(layer=>layer.side!==side||layer.until>turn);
  battleEffects.side=null;
}

async function runEffectAttacks(report,active){
  const context=battleEffects;
  if(!context)return;
  while(context.extra.length&&active()&&state.hp>0&&state.enemyHp>0){
    const side=context.extra.shift();
    context.extraCount[side]--;
    addLog(effectOwnerName(side)+": dodatkowy atak z efektu.",true);
    secondaryEffectAttack(()=>{
      if(side==="player")playerStrike(report);
      else enemyStrike(report);
    });
    await wait(300);
  }
}

function secondaryEffectAttack(strike){
  const context=battleEffects;
  if(!context)return strike();
  const prior=context.secondaryAttack;
  context.secondaryAttack=true;
  try{return strike()}finally{context.secondaryAttack=prior}
}

function battleVictoryEffects(won){
  if(!battleEffects)return;
  battleEffects.ended=true;
  battleEffects.playerWon=won;
  if(won)emitBattleEffect("player","onVictory");
  else if(state.enemyHp>0)emitBattleEffect("enemy","onVictory");
}

function battleEndEffects(){
  if(!battleEffects)return 0;
  for(const side of effectSides)emitBattleEffect(side,"onBattleEnd");
  return battleEffects.extraGold;
}

function sourceEffectDescription(kind,id,rarity){
  return configuredSourceEffects(kind,id,rarity).map(effectDisplayText).join(" ");
}

function effectLayerSummary(side){
  const counts=new Map();
  for(const layer of activeEffectLayers(side)){
    const label=layer.name+(layer.permanent?" (permanentny)":"");
    counts.set(label,(counts.get(label)??0)+(layer.count??1));
  }
  return [...counts].map(([name,count])=>name+(count>1?" ×"+count:"")).join(" · ");
}
