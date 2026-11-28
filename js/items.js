// A catalogue item authored as rare is sold only in its uncommon form.
const baseItems = itemCatalog.filter(item => !item.potion).map(item =>
  item.rarity==="rare"?{...item,rarity:"uncommon"}:item
);
const healthPotion = itemCatalog.find(item => item.potion);
const itemRarityLabels = {common:"Pospolity",uncommon:"Niepospolity",rare:"Rzadki",cons:"Użytkowy"};
function itemRarity(item){
  if(item.potion)return "cons";
  return item.rarity==="rare"||item.rarity==="uncommon"?item.rarity:"common";
}
const slots={left:["Lewa ręka","🤚"],right:["Prawa ręka","✋"],armor:["Zbroja","🛡️"],helmet:["Hełm","⛑️"],amulet:["Amulet","📿"],trinket:["Talizman","💍"]};
const combatStatNames={healOnHit:" HP przy trafieniu",damageReflect:" obrażeń odbitych",armorPenetration:" przebicia pancerza"};
const statNames={hp:" maks. HP",armor:" pancerza",dmg:" obrażeń",speed:" szybkości",crit:"% krytyka",critD:"% kryt. obrażeń",regen:" regeneracji",goldBonus:" złota po zwycięstwie",...combatStatNames};
function describeItemStats(it){
  if(it.potion)return "Przywraca do "+skillAmount(it.heal)+" HP.";
  return joinDescriptions(Object.keys(statNames).filter(key=>it[key]).map(key=>describeStatChange(key,it[key])));
}
function itemDescription(it){
  return it.desc?.trim()||describeItemStats(it);
}
function promote(it){
  if(itemRarity(it)!=="common")return it;
  const up={...it,rarity:"uncommon"};
  for(const k of Object.keys(statNames))if(it[k]!==undefined)up[k]=Number((it[k]*(it[k]<0?1:1.5)).toFixed(2));
  if(it.desc===describeItemStats(it))up.desc=describeItemStats(up);
  return up;
}

function rareFromUncommon(item){
  return {...item,rarity:"rare"};
}
