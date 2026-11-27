const effectTriggers = {
  onHit:"Po trafieniu",onCrit:"Po trafieniu krytycznym",onDamaged:"Po otrzymaniu obrażeń",
  onKill:"Po zabiciu",onBattleStart:"Na początku walki",onVictory:"Po zwycięstwie",
  onAttack:"Przy ataku",onDodge:"Po uniku",onHeal:"Po skutecznym leczeniu",
  onTurnStart:"Na początku własnej tury",onTurnEnd:"Na końcu własnej tury",
  onBattleEnd:"Po zakończeniu walki",onUse:"Po użyciu przedmiotu użytkowego",
  beforeIncomingAttack:"Przy nadchodzącym ataku",beforeAttackDamage:"Przed obliczeniem obrażeń ataku",
  beforeHitHeal:"Przed leczeniem przy trafieniu",onHitHealOverflow:"Po przekroczeniu limitu leczenia przy trafieniu",
  beforeReflect:"Przed odbiciem obrażeń",afterAttackRoll:"Po rozstrzygnięciu uniku i krytyka",
  whileCondition:"Dopóki spełniony jest warunek"
};
const effectActions = {
  damage:"Dodatkowe obrażenia",heal:"Leczenie HP",healPercent:"Leczenie (% maks. HP)",
  stat:"Zmiana statystyki",extraAttack:"Dodatkowy atak",skipAttack:"Pominięcie ataku",
  reduceArmor:"Zmniejszenie pancerza",gold:"Dodatkowe złoto",survive:"Ochrona przed śmiercią",
  scaleAttack:"Mnożnik obrażeń ataku",ignoreArmor:"Zignorowanie pancerza",
  scaleHitHeal:"Mnożnik leczenia przy trafieniu",overflowDamage:"Obrażenia z nadmiaru leczenia",
  reflectFromArmor:"Odbicie z aktualnego pancerza (%)",dodge:"Unik nadchodzącego ataku",
  maxHpGain:"Permanentny wzrost maks. HP",scaleReward:"Mnożnik całej nagrody w złocie",
  scaleReflect:"Mnożnik odbicia obrażeń",scaleHitDamage:"Mnożnik obrażeń trafienia po pancerzu",
  damageFromStat:"Dodatkowe obrażenia z aktualnej statystyki",conditionalStat:"Warunkowa zmiana statystyki"
};
const effectActionTriggers = {
  scaleAttack:["onAttack","beforeAttackDamage"],ignoreArmor:["beforeAttackDamage"],
  scaleHitHeal:["beforeHitHeal"],overflowDamage:["onHitHealOverflow"],reflectFromArmor:["beforeReflect"],
  dodge:["beforeIncomingAttack"],scaleReward:["onVictory","onBattleEnd"],
  scaleReflect:["beforeReflect"],scaleHitDamage:["beforeAttackDamage"],conditionalStat:["whileCondition"]
};
const ownEffectAction = action => ["survive","extraAttack","scaleAttack","ignoreArmor","scaleHitHeal","reflectFromArmor","dodge","scaleReflect","scaleHitDamage","conditionalStat"].includes(action);
const effectStats = {
  dmg:"DMG",armor:"Pancerz",healOnHit:"Przywracanie zdrowia",
  damageReflect:"Odbicie obrażeń",armorPenetration:"Przebicie pancerza",
  speed:"Szybkość ataku",crit:"Szansa na krytyk",critD:"Obrażenia krytyczne",
  regen:"Regeneracja",goldBonus:"Złoto po zwycięstwie",
  damageReduction:"Redukcja otrzymywanych obrażeń (%)",critFloor:"Minimalna szansa na krytyk (%)",
  attackDamageBonus:"Premia do obrażeń ataku (%)"
};
const playerOnlyEffectStats = ["regen","goldBonus"];
const effectClearEvents = ["onCrit","afterAttackRoll"];
const effectCriticalEvents = ["onHit","onDamaged","beforeAttackDamage"];
const effectUsesStat = action => ["stat","damageFromStat","conditionalStat"].includes(action);
const effectChangesStat = action => ["stat","conditionalStat"].includes(action);
const effectCanHeal = effect => effect.action==="survive"||(effect.action==="stat"&&effect.trigger==="onDamaged"&&effect.target==="self");
const effectDurations = {turns:"Przez określoną liczbę tur",battle:"Do końca walki",permanent:"Permanentnie"};
const timedEffect = action => action==="stat"||action==="reduceArmor";
const effectHasValue = action => !["extraAttack","skipAttack","survive","ignoreArmor","dodge"].includes(action);
const multiplierEffect = action => ["scaleAttack","scaleHitHeal","overflowDamage","scaleReward","scaleReflect","scaleHitDamage"].includes(action);
const percentEffect = action => ["healPercent","reflectFromArmor","damageFromStat"].includes(action);
const combatOnlyAction = effect => ["damage","extraAttack","skipAttack","survive","scaleAttack","ignoreArmor","scaleHitHeal","overflowDamage","reflectFromArmor","dodge","scaleReflect","scaleHitDamage","damageFromStat"].includes(effect.action) ||
  (timedEffect(effect.action)&&effect.duration!=="permanent");

function effectCombinationIssue(effect){
  if(effect.trigger==="whileCondition"&&effect.action!=="conditionalStat")return "Stały warunek wymaga warunkowej zmiany statystyki.";
  if(effect.action==="conditionalStat"&&effect.target!=="self")return "Warunkowa premia dotyczy właściciela.";
  if(effect.action==="survive"&&(effect.trigger!=="onDamaged"||effect.target!=="self"))
    return "Ochrona przed śmiercią wymaga zdarzenia otrzymania obrażeń i celu Właściciel.";
  if(effect.action==="survive"&&effect.nonLethalOnly)return "Ochrona przed śmiercią wymaga śmiertelnych obrażeń.";
  if(effect.action==="extraAttack"&&effect.target!=="self")return "Dodatkowy atak wykonuje właściciel.";
  if(ownEffectAction(effect.action)&&effect.target!=="self")return "Ta akcja dotyczy właściciela efektu.";
  if(effect.action==="overflowDamage"&&effect.target!=="opponent")return "Nadmiar leczenia zadaje obrażenia przeciwnikowi.";
  if(effect.criticalOnly&&effect.nonCriticalOnly)return "Wybierz trafienia krytyczne lub zwykłe.";
  if(effect.clearOn&&(!effectClearEvents.includes(effect.clearOn)||effect.action!=="stat"||effect.duration==="permanent"))
    return "Zdarzenie resetuje wyłącznie tymczasową zmianę statystyki.";
  if(effect.totalCap!==undefined&&(effect.action!=="stat"||!effect.stack||effect.maxStacks!==0||effect.duration==="turns"))
    return "Limit wartości wymaga kumulowanej zmiany statystyki bez limitu warstw.";
  if(effectActionTriggers[effect.action]&&!effectActionTriggers[effect.action].includes(effect.trigger))return "Akcja wymaga innego zdarzenia.";
  if(effect.conditionCrossing&&(effect.trigger!=="onDamaged"||effect.conditionTarget!=="self"||effect.conditionAbove))
    return "Przekroczenie progu w dół wymaga zdarzenia otrzymania obrażeń i warunku HP właściciela.";
  if(["onVictory","onBattleEnd"].includes(effect.trigger)&&combatOnlyAction(effect))
    return "Po zakończeniu walki ta akcja jest niedostępna.";
  if(effect.trigger==="onUse"&&(effect.target!=="self"||effect.conditionTarget==="opponent"||
      !["heal","healPercent","gold","stat","reduceArmor","maxHpGain"].includes(effect.action)||combatOnlyAction(effect)))
    return "Po użyciu przedmiotu poza walką dostępne są akcje własne: leczenie, złoto i permanentne statystyki.";
  if(effect.trigger==="onUse"&&((effect.every??1)!==1||effect.limit))return "Zdarzenie użycia nie korzysta z liczników walki.";
  return "";
}

function effectSourceIssue(effect,kind,potion,skill){
  if(effect.trigger==="onUse"&&!(kind==="item"&&potion))return "Zdarzenie użycia dotyczy tylko przedmiotów użytkowych.";
  if(effect.action==="scaleReward"&&(kind==="enemy"?effect.target!=="opponent"||effect.trigger!=="onBattleEnd":effect.target!=="self"))
    return "Mnożnik dotyczy nagrody gracza. Przeciwnik może zmodyfikować ją efektem końca walki skierowanym na przeciwnika.";
  if(effectUsesStat(effect.action)&&playerOnlyEffectStats.includes(effect.stat)&&
      (kind==="enemy"?!effectChangesStat(effect.action)||effect.target==="self":effectChangesStat(effect.action)&&effect.target==="opponent"))
    return "Wybrana statystyka jest obsługiwana tylko przez postać gracza.";
  return "";
}

function generateEffectDescription(effect){
  const target=effect.target==="self"?"właściciel":"przeciwnik";
  const value=effectHasValue(effect.action)?(multiplierEffect(effect.action)?" ×":" ")+(effect.value??0)+(percentEffect(effect.action)?"%":""):"";
  const stat=effectUsesStat(effect.action)?" "+(effectStats[effect.stat]??""):"";
  const duration=timedEffect(effect.action)?" · "+(effect.duration==="turns"?effect.turns+" tur":effectDurations[effect.duration]??""):"";
  const stack=timedEffect(effect.action)&&effect.stack?(effect.maxStacks?" · do "+effect.maxStacks+" kumulacji":" · kumuluje się"):"";
  const condition=effect.conditionTarget?" · HP "+(effect.conditionTarget==="self"?"właściciela":"przeciwnika")+" "+
    (effect.conditionAbove?(effect.conditionStrict?">":"≥"):(effect.conditionStrict?"<":"≤"))+" "+
    effect.conditionValue+(effect.conditionUnit==="percent"?"%":"")+(effect.conditionCrossing?" po przekroczeniu progu":""):"";
  const frequency=(effect.chance??100)<100?" · szansa "+effect.chance+"%":"";
  const interval=(effect.every??1)>1?" · co "+effect.every+" zdarzenia":"";
  const limit=effect.limit?" · do "+effect.limit+" aktywacji na walkę":"";
  const extra=(effect.criticalOnly?" · tylko krytyk":"")+(effect.nonCriticalOnly?" · tylko zwykłe trafienia":"")+
    (effect.hitOnly?" · tylko trafienia":"")+(effect.clearOn?" · reset: "+effectTriggers[effect.clearOn].toLowerCase():"")+
    (effect.totalCap?" · łączny limit "+effect.totalCap+(effect.duration==="permanent"?" na rozgrywkę":" na walkę"):"")+
    (effect.nonLethalOnly?" · tylko nieśmiertelne obrażenia":"")+(effect.healPercent?" · leczy "+effect.healPercent+"% maks. HP":"")+
    (effect.runLimit?" · do "+effect.runLimit+" aktywacji na rozgrywkę":"")+
    (effect.runCap?" · do "+effect.runCap+" HP na rozgrywkę":"");
  return (effectTriggers[effect.trigger]??"Zdarzenie")+" — "+(effectActions[effect.action]??"Akcja")+stat+value+
    " · cel: "+target+duration+stack+condition+frequency+interval+limit+extra+".";
}

function advancedEffectSummary(effect){
  if(effect.action==="healPercent"&&effect.trigger==="onDamaged"&&effect.hitOnly&&effect.target==="self"&&
      (effect.every??1)===1&&(effect.chance??100)===100&&!effect.conditionTarget&&!effect.limit&&!effect.runLimit&&
      !effect.criticalOnly&&!effect.nonCriticalOnly&&!effect.nonLethalOnly){
    return "Przywraca "+effect.value+"% maks. HP po otrzymaniu trafienia.";
  }
  return generateEffectDescription(effect);
}

function advancedEffectsFor(rows,kind,sourceId,rarity,wheelId){
  return rows.filter(row=>row.kind===kind&&row.sourceId===sourceId&&row.wheelId===wheelId&&
    (row.rarity===undefined||row.rarity==="any"||row.rarity===rarity)).map(({effect})=>({
      ...effect,id:"advanced:"+effect.id,
      name:effect.name?.trim()||advancedEffectSummary(effect),
      description:effect.description?.trim()||(effect.name?.trim()?advancedEffectSummary(effect):"")
    }));
}

function effectDisplayText(effect){
  return [effect.name,effectDisplayDescription(effect)].filter(Boolean).join(" — ");
}

function effectDisplayDescription(effect){
  return effect.description||(!effect.id.startsWith("advanced:")?generateEffectDescription(effect):"");
}

function attachedEffects(catalog,kind,sourceId,rarity){
  return catalog.assignments.flatMap(assignment=>{
    if(assignment.kind!==kind||assignment.sourceId!==sourceId||
        (assignment.rarity&&assignment.rarity!=="any"&&assignment.rarity!==rarity))return [];
    const effect=catalog.effects.find(definition=>definition.id===assignment.effectId);
    return effect?[effect]:[];
  });
}

if(typeof module!=="undefined" && module.exports)module.exports={
  effectTriggers,effectActions,effectStats,effectDurations,timedEffect,effectHasValue,
  combatOnlyAction,effectCombinationIssue,effectSourceIssue,generateEffectDescription,attachedEffects,
  ownEffectAction,multiplierEffect,percentEffect,effectUsesStat,effectCanHeal,effectClearEvents,effectCriticalEvents
};
