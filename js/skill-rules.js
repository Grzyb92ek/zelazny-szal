const skillRoot = "center";
const characterStatLabels = {hp:"Maks. HP",
  ...(typeof module!=="undefined"&&module.exports?require("./effect-rules.js").effectStats:effectStats)};
const skillNodeIds = (wheel,id) => wheel.links.filter(link=>link.to===id).map(link=>link.from);

function skillPrerequisites(wheel,node,unlocked){
  const links=skillNodeIds(wheel,node.id);
  const reached=id=>id===skillRoot||unlocked.has(id);
  if(!links.length)return false;
  return node.requireMode==="any"?links.some(reached):links.every(reached);
}

const skillNumber=new Intl.NumberFormat("pl-PL",{maximumFractionDigits:6,useGrouping:false});
const skillAmount=value=>skillNumber.format(value);
const skillStatNames={dmg:"obrażenia",healOnHit:"przywracanie zdrowia po trafieniu",
  crit:"szansa na trafienie krytyczne",critD:"obrażenia krytyczne",
  hp:"maksymalne HP",attackDamageBonus:"obrażenia zadawane podczas ataku"};
const skillStatName=key=>skillStatNames[key]??characterStatLabels[key]?.replace(/ \(%\)$/,"").toLocaleLowerCase("pl")??"statystyka";
const skillUnit=key=>["hp","healOnHit","regen"].includes(key)?" HP":
  ["crit","critD","damageReduction","critFloor","attackDamageBonus"].includes(key)?"%":"";
const skillSentence=text=>text.charAt(0).toLocaleUpperCase("pl")+text.slice(1)+".";

function describeSkillEffect(effect){
  const value=skillAmount(effect.value);
  const percent=skillAmount((effect.value-1)*100);
  const threshold=skillAmount(effect.conditionValue)+(effect.conditionUnit==="percent"?"% HP":" HP");
  const comparison=effect.conditionAbove?(effect.conditionStrict?"powyżej ":"od "):
    (effect.conditionStrict?"poniżej ":"przy najwyżej ");
  const condition=effect.conditionTarget?comparison+threshold+(effect.conditionTarget==="opponent"?" przeciwnika":""):"";
  const duration=effect.duration==="battle"?" do końca walki":effect.duration==="turns"?
    " przez "+skillAmount(effect.turns)+" tur":effect.duration==="permanent"?" do końca rozgrywki":"";
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
  const actions={
    heal:(effect.target==="opponent"?"przywracasz przeciwnikowi ":"odzyskujesz ")+value+" HP",
    healPercent:(effect.target==="opponent"?"przywracasz przeciwnikowi ":"odzyskujesz ")+value+"% maks. HP",
    damage:"zadajesz dodatkowe "+value+" obrażeń "+(effect.target==="opponent"?"przeciwnikowi":"sobie"),
    damageFromStat:"zadajesz dodatkowe obrażenia równe "+value+"% wartości „"+skillStatName(effect.stat)+"”",
    extraAttack:"wykonujesz dodatkowy atak",skipAttack:effect.target==="opponent"?"przeciwnik pomija atak":"pomijasz atak",
    reduceArmor:"obniżasz pancerz "+(effect.target==="opponent"?"przeciwnika":"własny")+" o "+value,
    gold:"przyznajesz "+value+" zł "+(effect.target==="opponent"?"przeciwnikowi":"sobie"),
    survive:"pozostajesz przy życiu z 1 HP"+(effect.healPercent?" i odzyskujesz "+skillAmount(effect.healPercent)+"% maks. HP":""),
    scaleAttack:"mnożysz obrażenia ataku przez "+value,scaleHitDamage:"mnożysz obrażenia po uwzględnieniu pancerza przez "+value,
    ignoreArmor:"ignorujesz pancerz",scaleHitHeal:"mnożysz leczenie po trafieniu przez "+value,
    overflowDamage:"zamieniasz nadmiar leczenia w obrażenia z mnożnikiem "+value,
    reflectFromArmor:"odbijasz dodatkowe obrażenia równe "+value+"% pancerza",
    scaleReflect:"mnożysz odbicie obrażeń przez "+value,dodge:"unikasz ataku",
    maxHpGain:"zwiększasz maksymalne HP o "+value+" do końca rozgrywki",
    scaleReward:"mnożysz nagrodę w złocie przez "+value
  };
  const statChange=(effect.value<0?"obniżasz ":"zwiększasz ")+
    (effect.target==="opponent"?"statystykę przeciwnika":"własną statystykę")+" „"+skillStatName(effect.stat)+"” o "+
    skillAmount(Math.abs(effect.value))+skillUnit(effect.stat);
  const action=actions[effect.action]??statChange;
  const trigger=effect.trigger==="whileCondition"?"":effect.trigger==="onDamaged"&&effect.hitOnly?
    "po otrzymaniu trafienia":effectTriggers[effect.trigger]?.toLocaleLowerCase("pl");
  const opening=effect.conditionCrossing?"po spadku "+condition:condition;
  const prefix=[opening,trigger].filter(Boolean).join(", ");
  const heal=effect.action==="stat"&&effect.healPercent?" i odzyskujesz "+skillAmount(effect.healPercent)+"% maks. HP":"";
  const notes=[
    effect.every>1?"Efekt działa co "+skillAmount(effect.every)+". wystąpienie":null,
    effect.chance<100?"Szansa zadziałania to "+skillAmount(effect.chance)+"%":null,
    effect.criticalOnly?"Działa przy trafieniach krytycznych":null,
    effect.nonCriticalOnly?"Działa przy zwykłych trafieniach":null,
    effect.limit?"Efekt działa do "+skillAmount(effect.limit)+" razy na walkę":null,
    effect.runLimit?"Efekt działa do "+skillAmount(effect.runLimit)+" razy na rozgrywkę":null,
    effect.stack?(effect.maxStacks?"Efekt kumuluje się do "+skillAmount(effect.maxStacks)+" razy":"Efekt się kumuluje"):null,
    effect.totalCap?"Łączna zmiana statystyki to najwyżej "+skillAmount(effect.totalCap)+skillUnit(effect.stat):null,
    effect.runCap?"Łączny bonus to najwyżej "+skillAmount(effect.runCap)+" HP":null,
    effect.clearOn?"Premia znika "+effectTriggers[effect.clearOn].toLocaleLowerCase("pl"):null,
    effect.nonLethalOnly?"Nie zapobiega śmierci":null
  ].filter(Boolean);
  return [skillSentence((prefix?prefix+" ":"")+action+heal+duration),...notes.map(skillSentence)].join(" ");
}

function generateSkillDescription(source,effects=[]){
  const stats=Object.entries(source.modifiers??{}).filter(([,value])=>value);
  return [...new Set([
    ...stats.map(([key,value])=>skillSentence(skillStatName(key)+" "+(value>0?"+":"")+skillAmount(value)+skillUnit(key))),
    ...effects.map(describeSkillEffect)
  ])].join(" ");
}

function skillDescription(source,effects){
  return source.description?.trim()||generateSkillDescription(source,effects);
}

if(typeof module!=="undefined"&&module.exports)module.exports={skillRoot,skillNodeIds,skillPrerequisites,characterStatLabels};
