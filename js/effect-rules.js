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

const skillNumber=new Intl.NumberFormat("pl-PL",{maximumFractionDigits:6,useGrouping:false});
const skillAmount=value=>skillNumber.format(value);
const skillStatNames={dmg:"obrażenia",healOnHit:"przywracanie zdrowia po trafieniu",
  crit:"szansa na trafienie krytyczne",critD:"obrażenia krytyczne",
  hp:"maksymalne HP",attackDamageBonus:"obrażenia zadawane podczas ataku",regen:"leczenie po zwycięstwie",
  goldBonus:"złoto po zwycięstwie",damageReflect:"odbicie obrażeń"};
const skillStatName=key=>skillStatNames[key]??effectStats[key]?.replace(/ \(%\)$/,"").toLocaleLowerCase("pl")??"statystyka";
const skillUnit=key=>["hp","healOnHit","regen"].includes(key)?" HP":
  ["crit","critD","damageReduction","critFloor","attackDamageBonus"].includes(key)?"%":"";
const skillSentence=text=>text.charAt(0).toLocaleUpperCase("pl")+text.slice(1)+".";

function describeStatChange(key,value){
  if(key==="regen")return "Regeneracja "+skillAmount(value);
  return skillSentence(skillStatName(key)+" "+(value>0?"+":"")+skillAmount(value)+skillUnit(key));
}

function joinDescriptions(parts){
  return parts.map((part,index)=>index<parts.length-1&&!/[.!?]$/.test(part)?part+".":part).join(" ");
}

const effectPlayerTriggers={
  onHit:"po trafieniu",onCrit:"przy trafieniu krytycznym",onDamaged:"po otrzymaniu obrażeń",
  onKill:"po pokonaniu przeciwnika",onBattleStart:"na początku walki",onVictory:"po zwycięstwie",
  onAttack:"przy ataku",onDodge:"po uniku",onHeal:"po odzyskaniu zdrowia",
  onTurnStart:"na początku własnej tury",onTurnEnd:"na końcu własnej tury",
  onBattleEnd:"po walce",onUse:"po użyciu przedmiotu",beforeIncomingAttack:"gdy przeciwnik atakuje",
  beforeAttackDamage:"przy trafieniu",beforeHitHeal:"po trafieniu",onHitHealOverflow:"",
  beforeReflect:"",afterAttackRoll:"po próbie ataku",whileCondition:""
};
const effectStatObject={
  dmg:"obrażenia",armor:"pancerz",speed:"szybkość ataku",crit:"szansę na trafienie krytyczne",
  critD:"obrażenia krytyczne",critFloor:"minimalną szansę na trafienie krytyczne",
  damageReflect:"odbicie obrażeń",damageReduction:"redukcję otrzymywanych obrażeń",goldBonus:"złoto po zwycięstwie",
  healOnHit:"leczenie po trafieniu",regen:"leczenie po zwycięstwie",armorPenetration:"przebicie pancerza",
  attackDamageBonus:"obrażenia zadawane podczas ataku"
};
const effectNoun=(value,one,few,many)=>value===1?one:Number.isInteger(value)&&value%10>=2&&value%10<=4&&
  (value%100<12||value%100>14)?few:many;

function generateEffectDescription(effect){
  const value=skillAmount(effect.value);
  const percent=skillAmount((effect.value-1)*100);
  const threshold=skillAmount(effect.conditionValue)+(effect.conditionUnit==="percent"?"% HP":" HP");
  const comparison=effect.conditionAbove?(effect.conditionStrict?"powyżej ":"od "):
    (effect.conditionStrict?"poniżej ":"przy najwyżej ");
  const condition=effect.conditionTarget?comparison+threshold+(effect.conditionTarget==="opponent"?" przeciwnika":""):"";
  const turnWord=effectNoun(effect.turns,"turę","tury","tur");
  const duration=effect.duration==="battle"?" do końca walki":effect.duration==="turns"?
    " przez "+skillAmount(effect.turns)+" "+turnWord:effect.duration==="permanent"?" do końca rozgrywki":"";
  const basic=!effect.every&&!effect.limit&&!effect.runLimit&&(effect.chance??100)===100&&
    !effect.criticalOnly&&!effect.nonCriticalOnly&&!effect.clearOn;
  if(basic&&!effect.nonLethalOnly&&effect.conditionTarget&&effect.conditionStrict&&!effect.conditionAbove){
    if(effect.action==="heal"&&effect.trigger==="onCrit"&&effect.target==="self"&&effect.conditionTarget==="self")
      return skillSentence(condition+" trafienia krytyczne przywracają dodatkowe "+value+" HP");
    if(effect.action==="scaleAttack"&&effect.trigger==="onAttack"&&effect.value>=1&&!effect.stack){
      if(effect.conditionTarget==="opponent")return "Zadajesz "+percent+"% więcej obrażeń przeciwnikom posiadającym mniej niż "+threshold+".";
      return skillSentence(condition+" zadawane obrażenia zwiększają się o "+percent+"%");
    }
    if(effect.action==="conditionalStat"&&effect.stat==="speed"&&effect.value>=0)
      return skillSentence(condition+" szybkość ataku zwiększa się o "+value);
  }
  if(basic&&effect.action==="stat"&&effect.stat==="dmg"&&effect.trigger==="onDamaged"&&effect.hitOnly&&
      effect.target==="self"&&effect.stack&&effect.maxStacks===0&&!condition&&!effect.healPercent&&!effect.nonLethalOnly&&effect.value>0){
    const cap=effect.totalCap?" Maksymalnie +"+skillAmount(effect.totalCap)+" obrażeń.":"";
    return "Każde otrzymane trafienie zwiększa obrażenia o "+value+duration+"."+cap;
  }
  if(effect.action==="stat"&&effect.stat==="attackDamageBonus"&&effect.trigger==="onDamaged"&&effect.healPercent&&
      effect.target==="self"&&effect.conditionCrossing&&effect.conditionStrict&&!effect.conditionAbove&&effect.nonLethalOnly&&
      effect.limit===1&&!effect.runLimit&&!effect.stack&&!effect.every&&(effect.chance??100)===100&&
      !effect.criticalOnly&&!effect.nonCriticalOnly&&!effect.hitOnly&&!effect.clearOn&&effect.value>0){
    return "Raz na walkę, po spadku poniżej "+threshold+", odzyskujesz "+skillAmount(effect.healPercent)+
      "% maksymalnego HP i zadajesz "+value+"% więcej obrażeń"+duration+". Nie zapobiega śmierci.";
  }
  const repeated=effect.every>1;
  const ordinal=["","","drugie","trzecie","czwarte","piąte","szóste","siódme","ósme","dziewiąte","dziesiąte"][effect.every]??
    (skillAmount(effect.every)+".");
  const hit=effect.criticalOnly?"trafienie krytyczne":effect.nonCriticalOnly?"zwykłe trafienie":"trafienie";
  const regularHit=effect.trigger==="onHit"||effect.trigger==="beforeAttackDamage"||effect.trigger==="onCrit";
  const receivedHit=effect.trigger==="onDamaged"&&effect.hitOnly;
  const hitName=effect.trigger==="onCrit"?"trafienie krytyczne":receivedHit?"otrzymane "+hit:hit;
  const perHit=(repeated?"co "+ordinal:"każde")+" "+hitName;
  const simple=!effect.conditionTarget&&!effect.limit&&!effect.runLimit&&!effect.criticalOnly&&!effect.nonCriticalOnly&&
    !effect.nonLethalOnly&&!effect.clearOn&&(effect.chance??100)===100;
  const chance=skillAmount(effect.chance);
  if(simple&&receivedHit&&effect.target==="self"&&effect.action==="healPercent"){
    if(repeated)return skillSentence(perHit+" przywraca "+value+"% maksymalnego HP");
    return "Przywraca "+value+"% maks. HP po otrzymaniu trafienia.";
  }
  if(simple&&effect.action==="skipAttack"&&effect.trigger==="onHit"&&effect.target==="opponent")
    return skillSentence(perHit+" ogłusza przeciwnika, powodując pominięcie jego następnego ataku");
  if(simple&&effect.action==="reduceArmor"&&effect.trigger==="onHit"&&effect.target==="opponent"&&
      effect.stack&&!effect.maxStacks)
    return skillSentence(perHit+" zmniejsza pancerz przeciwnika o "+value+duration);
  if(simple&&effect.action==="maxHpGain"&&effect.trigger==="onVictory"&&!repeated&&effect.target==="self")
    return "Każde zwycięstwo zwiększa maksymalne HP o "+value+"."+(
      effect.runCap?" Maksymalnie +"+skillAmount(effect.runCap)+" HP na rozgrywkę.":" Premia zostaje do końca rozgrywki.");
  if(effect.action==="dodge"&&effect.trigger==="beforeIncomingAttack"&&!effect.conditionTarget&&!effect.limit&&!effect.runLimit&&!repeated)
    return (effect.chance??100)===100?"Unika ataku.":chance+"% szansy na unik.";
  if(effect.action==="extraAttack"&&(receivedHit||effect.trigger==="onHit")&&effect.chance<100&&
      !effect.conditionTarget&&!effect.limit&&!effect.runLimit&&!repeated&&!effect.criticalOnly&&!effect.nonCriticalOnly&&!effect.nonLethalOnly)
    return chance+"% szansy na "+(receivedHit?"kontratak po otrzymaniu trafienia.":"dodatkowy atak po trafieniu.");
  if(effect.action==="scaleReward"&&effect.trigger==="onVictory"&&effect.value===2&&effect.chance<100&&
      effect.target==="self"&&!effect.conditionTarget&&!effect.limit&&!effect.runLimit&&!repeated)
    return chance+"% szansy na podwojenie złota zdobytego za zwycięstwo.";
  if(basic&&effect.action==="scaleHitHeal"&&effect.value===2&&condition)
    return skillSentence(condition+" przywracanie zdrowia po trafieniu jest podwojone");
  if(basic&&effect.action==="scaleReflect"&&effect.value===2&&condition)
    return skillSentence(condition+" odbijasz dwa razy więcej obrażeń");
  if(simple&&effect.action==="extraAttack"&&effect.trigger==="onAttack"&&repeated)
    return "Co "+(["","","drugi","trzeci","czwarty","piąty","szósty","siódmy","ósmy","dziewiąty","dziesiąty"][effect.every]??
      (skillAmount(effect.every)+"."))+" atak wykonujesz dodatkowy atak.";
  if(effect.action==="stat"&&effect.trigger==="onDodge"&&effect.stat==="critFloor"&&effect.value===100&&
      effect.clearOn==="afterAttackRoll"&&effect.target==="self"&&!effect.conditionTarget&&!effect.limit&&!effect.runLimit&&
      !repeated&&(effect.chance??100)===100&&effect.duration==="battle")
    return "Po uniku następny atak, jeśli trafi, zada obrażenia krytyczne.";
  if(effect.action==="ignoreArmor"&&effect.criticalOnly&&!effect.conditionTarget&&!repeated&&!effect.limit&&
      !effect.runLimit&&(effect.chance??100)===100)
    return "Przy trafieniu krytycznym ignoruje pancerz przeciwnika.";
  if(effect.trigger==="onAttack"&&!condition&&effect.action==="scaleAttack"&&effect.value===2&&effect.limit===1&&
      !effect.runLimit&&!repeated&&(effect.chance??100)===100)
    return "Pierwszy atak w walce zadaje podwójne obrażenia.";
  const actions={
    heal:(effect.target==="opponent"?"przywracasz przeciwnikowi ":"odzyskujesz ")+value+" HP",
    healPercent:(effect.target==="opponent"?"przywracasz przeciwnikowi ":"odzyskujesz ")+value+"% maks. HP",
    damage:"zadajesz "+(effect.target==="opponent"?"przeciwnikowi ":"sobie ")+"dodatkowe obrażenia ("+value+"), które omijają pancerz",
    damageFromStat:"zadajesz dodatkowe obrażenia omijające pancerz, równe "+value+"% "+
      (effect.stat==="armorPenetration"?"twojego przebicia pancerza":"wartości statystyki „"+skillStatName(effect.stat)+"”"),
    extraAttack:"wykonujesz dodatkowy atak",skipAttack:effect.target==="opponent"?"przeciwnik pomija atak":"pomijasz atak",
    reduceArmor:"obniżasz pancerz "+(effect.target==="opponent"?"przeciwnika":"własny")+" o "+value,
    gold:"przyznajesz "+value+" zł "+(effect.target==="opponent"?"przeciwnikowi":"sobie"),
    survive:"pozostajesz przy życiu z 1 HP"+(effect.healPercent?", a potem odzyskujesz "+skillAmount(effect.healPercent)+"% maks. HP":""),
    scaleAttack:"mnożysz obrażenia ataku przez "+value,scaleHitDamage:"mnożysz obrażenia po uwzględnieniu pancerza przez "+value,
    ignoreArmor:"ignorujesz pancerz",scaleHitHeal:"mnożysz leczenie po trafieniu przez "+value,
    overflowDamage:"zamieniasz nadmiar leczenia po trafieniu w obrażenia omijające pancerz"+(effect.value===1?" w stosunku 1 do 1":" z mnożnikiem "+value),
    reflectFromArmor:"odbijasz dodatkowe obrażenia równe "+value+"% twojego pancerza",
    scaleReflect:"mnożysz odbicie obrażeń przez "+value,dodge:"unikasz ataku",
    maxHpGain:"zwiększasz maksymalne HP o "+value+" do końca rozgrywki",
    scaleReward:"mnożysz nagrodę w złocie przez "+value
  };
  const unit=value=>["crit","critD","critFloor","damageReduction","attackDamageBonus"].includes(effect.stat)?
    " "+effectNoun(value,"punkt procentowy","punkty procentowe","punktów procentowych"):skillUnit(effect.stat);
  const statChange=(effect.value<0?"zmniejsza":"zwiększa")+" "+(effectStatObject[effect.stat]??"statystykę")+
    (effect.target==="opponent"?" przeciwnika":"")+" o "+skillAmount(Math.abs(effect.value))+unit(Math.abs(effect.value));
  const action=actions[effect.action]??statChange;
  const trigger=effect.conditionCrossing?"":effect.action==="survive"?(effect.hitOnly?"po śmiertelnym trafieniu":"po otrzymaniu śmiertelnych obrażeń"):
    receivedHit?"po otrzymaniu "+(effect.criticalOnly?"trafienia krytycznego":
    effect.nonCriticalOnly?"zwykłego trafienia":"trafienia"):regularHit&&(effect.criticalOnly||effect.nonCriticalOnly)?
    "przy "+(effect.criticalOnly?"trafieniu krytycznym":"zwykłym trafieniu"):effectPlayerTriggers[effect.trigger];
  const opening=effect.conditionCrossing?"po spadku "+condition:condition;
  const prefix=[opening,trigger].filter(Boolean).join(", ");
  const heal=effect.action==="stat"&&effect.healPercent?" i odzyskujesz "+skillAmount(effect.healPercent)+"% maks. HP":"";
  const notes=[
    effect.chance<100?"Szansa zadziałania to "+skillAmount(effect.chance)+"%":null,
    effect.criticalOnly&&!regularHit&&!receivedHit?"Działa tylko przy trafieniach krytycznych":null,
    effect.nonCriticalOnly&&!regularHit&&!receivedHit?"Działa tylko przy zwykłych trafieniach":null,
    effect.limit===1?"Działa raz na walkę":effect.limit?"Działa do "+skillAmount(effect.limit)+" razy na walkę":null,
    effect.runLimit===1?"Działa raz na rozgrywkę":effect.runLimit?"Działa do "+skillAmount(effect.runLimit)+" razy na rozgrywkę":null,
    effect.stack?(effect.maxStacks?"Efekt kumuluje się do "+skillAmount(effect.maxStacks)+" razy":
      !(regularHit||receivedHit)&&!effect.totalCap?"Premie się sumują":null):null,
    effect.totalCap?(effect.value<0?"Łączny spadek to najwyżej ":"Łącznie najwyżej +")+skillAmount(effect.totalCap)+unit(effect.totalCap):null,
    effect.runCap?"Łączny bonus to najwyżej "+skillAmount(effect.runCap)+" HP":null,
    effect.clearOn?"Premia znika "+effectPlayerTriggers[effect.clearOn]:null,
    effect.nonLethalOnly?"Nie zapobiega śmierci":null
  ].filter(Boolean);
  const lead=(regularHit||receivedHit)&&(repeated||effect.stack)&&!opening?perHit:prefix;
  const verb=lead===perHit&&actions[effect.action]?effect.action==="scaleHitDamage"?
    (effect.value>=1?"zadaje "+percent+"% więcej":"zadaje "+skillAmount((1-effect.value)*100)+"% mniej")+" obrażeń po uwzględnieniu pancerza":
    effect.action==="healPercent"?"przywraca "+(effect.target==="opponent"?"przeciwnikowi ":"")+value+"% maksymalnego HP":
    effect.action==="heal"?"przywraca "+(effect.target==="opponent"?"przeciwnikowi ":"")+value+" HP":null:null;
  const phrase=verb||(actions[effect.action]===undefined&&lead!==perHit?statChange.replace(/^zwiększa /,"zwiększasz ").replace(/^zmniejsza /,"zmniejszasz "):action);
  const start=lead===perHit&&actions[effect.action]&&!verb?prefix:lead;
  if(repeated&&start!==perHit)notes.unshift("Działa co "+skillAmount(effect.every)+". raz");
  return [skillSentence((start?start+" ":"")+phrase+heal+duration),...notes.map(skillSentence)].join(" ");
}

const advancedEffectSummary=generateEffectDescription;

function advancedEffectsFor(rows,kind,sourceId,rarity,wheelId){
  return rows.filter(row=>row.kind===kind&&row.sourceId===sourceId&&row.wheelId===wheelId&&
    (row.rarity===undefined||row.rarity==="any"||row.rarity===rarity)).map(({effect})=>({
      ...effect,id:"advanced:"+effect.id,
      name:effect.name?.trim()||advancedEffectSummary(effect),
      description:effect.description?.trim()||(effect.name?.trim()?advancedEffectSummary(effect):"")
    }));
}

function effectDisplayText(effect){
  return [effect.name,effectDisplayDescription(effect)].filter(Boolean).join(". ");
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
