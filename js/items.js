const baseItems = itemCatalog.filter(item => !item.potion);
const healthPotion = itemCatalog.find(item => item.potion);
const slots={left:["Lewa ręka","🤚"],right:["Prawa ręka","✋"],armor:["Zbroja","🛡️"],helmet:["Hełm","⛑️"],amulet:["Amulet","📿"],trinket:["Talizman","💍"]};
const combatStatNames={healOnHit:" HP przy trafieniu",damageReflect:" obrażeń odbitych",armorPenetration:" przebicia pancerza"};
const statNames={hp:" maks. HP",armor:" pancerza",dmg:" obrażeń",speed:" szybkości",crit:"% krytyka",critD:"% kryt. obrażeń",regen:" regeneracji",goldBonus:" złota po zwycięstwie",...combatStatNames};
function formatItemStat(key,value){
  return (value>=0?"+":"")+value+statNames[key];
}
function describeItemStats(it){
  if(it.potion)return "Przywraca do "+it.heal+" HP";
  return Object.keys(statNames).filter(k=>it[k]!==undefined).map(k=>formatItemStat(k,it[k])).join(", ");
}
function itemDescription(it){
  if(it.potion)return it.desc;
  const details=(it.desc?it.desc.split(", "):[]).filter(part=>!/^\+\d+(?:\.\d+)?(?:e[+-]?\d+)? (?:HP przy trafieniu|obrażeń odbitych|przebicia pancerza)$/.test(part));
  for(const key of Object.keys(combatStatNames))if(it[key]>0)details.push(formatItemStat(key,it[key]));
  return details.join(", ");
}
function promote(it){
  const up={...it,rarity:"uncommon"};
  for(const k of Object.keys(statNames))if(it[k]!==undefined)up[k]=Number((it[k]*(it[k]<0?1:1.5)).toFixed(2));
  up.desc=describeItemStats(up);
  return up;
}
