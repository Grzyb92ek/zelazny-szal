const baseItems=[
{name:"Żelazny topór",image:"iron_axe.png",icon:"🪓",slot:"weapon",cost:8,desc:"+5 obrażeń",dmg:5},
{name:"Berserkerski sztylet",image:"dagger.png",icon:"🗡️",slot:"weapon",cost:10,desc:"+2 obrażeń, +0.5 szybkości",dmg:2,speed:.5},
{name:"Dwuręczny młot",image:"two_handed_hammer.png",icon:"🔨",slot:"weapon",cost:12,desc:"+9 obrażeń, -0.2 szybkości",dmg:9,speed:-.2,two:true},
{name:"Kolczuga",image:"chainmail.png",icon:"🛡️",slot:"armor",cost:10,desc:"+4 pancerza",armor:4},
{name:"Skórzana zbroja",image:"leather_armor.png",icon:"🥋",slot:"armor",cost:8,desc:"+2 pancerza, +8 HP",armor:2,hp:8},
{name:"Hełm z rogami",image:"horned_helmet.png",icon:"⛑️",slot:"helmet",cost:8,desc:"+2 pancerza, +5% krytyka",armor:2,crit:5},
{name:"Amulet szału",image:"amulet.png",icon:"📿",slot:"amulet",cost:10,desc:"+4 obrażeń",dmg:4},
{name:"Amulet krwi",image:"blood_amulet.png",icon:"🩸",slot:"amulet",cost:8,desc:"+12 maks. HP",hp:12},
{name:"Amulet regeneracji",image:"regeneration_amulet.png",icon:"💚",slot:"amulet",cost:10,desc:"+6 regeneracji",regen:6},
{name:"Runiczny pierścień",image:"runic_ring.png",icon:"💍",slot:"trinket",cost:12,desc:"+5% krytyka, +25% kryt. obrażeń",crit:5,critD:25},
{name:"Kamień szybkości",image:"speed_stone.png",icon:"💎",slot:"trinket",cost:10,desc:"+0.6 szybkości ataku",speed:.6},
{name:"Szczęśliwa kość",image:"lucky_bone.png",icon:"🦴",slot:"trinket",cost:8,desc:"+8% krytyka",crit:8},
{name:"Tarcza",image:"shield.png",icon:"🛡️",slot:"weapon",cost:9,desc:"+3 pancerza",armor:3,shield:true},
{name:"Katana",image:"katana.png",icon:"⚔️",slot:"weapon",cost:12,desc:"+3 DMG, +0.3 szybkości, +4% krytyka",dmg:3,speed:.3,crit:4,two:true},
{name:"Pancerz druida",image:"druid_armor.png",icon:"🌿",slot:"armor",cost:12,desc:"+12 maks. HP, +4 regeneracji",hp:12,regen:4},
{name:"Bone Helmet",image:"bone_helmet.png",icon:"💀",slot:"helmet",cost:10,desc:"+2 pancerza, +2 DMG",armor:2,dmg:2},
{name:"Amulet Croma",image:"crom_amulet.png",icon:"📿",slot:"amulet",cost:8,desc:"+10% krytyka, -4 DMG",crit:10,dmg:-4},
{name:"Sakiewka",image:"coin_purse.png",icon:"💰",slot:"trinket",cost:12,desc:"+3 złota po zwycięstwie",goldBonus:3}];
const healthPotion={name:"Mikstura lecząca",icon:"🧪",image:"health_potion.png",slot:"cons",cost:8,desc:"Przywraca do 20 HP",potion:true};
const slots={left:["Lewa ręka","🤚"],right:["Prawa ręka","✋"],armor:["Zbroja","🛡️"],helmet:["Hełm","⛑️"],amulet:["Amulet","📿"],trinket:["Talizman","💍"]};
const statNames={hp:" maks. HP",armor:" pancerza",dmg:" obrażeń",speed:" szybkości",crit:"% krytyka",critD:"% kryt. obrażeń",regen:" regeneracji",goldBonus:" złota po zwycięstwie"};
function promote(it){let up={...it,rarity:"uncommon"};for(const k of Object.keys(statNames))if(it[k]!==undefined)up[k]=num(it[k]*(it[k]<0?1:1.5));up.desc=Object.keys(statNames).filter(k=>up[k]!==undefined).map(k=>(up[k]>=0?"+":"")+up[k]+statNames[k]).join(", ");return up}