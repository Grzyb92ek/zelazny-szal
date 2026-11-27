const $=id=>document.getElementById(id);
function fresh(){const profile=classById();return {...classBase(profile),classId:profile.id,subclassId:null,unlockedSkills:new Set(),skillPoints:skillCatalog.settings.startingPoints,max:profile.hp,gold:profile.gold,goldCarry:0,round:1,level:1,exp:0,passive:null,enemyHp:0,enemy:null,gear:{left:null,right:null,armor:null,helmet:null,amulet:null,trinket:null},backpack:createBackpack(),permanentEffects:[],preparedEffects:[],permanentHpBonus:0,effectRunTotals:new Map(),effectRunUses:new Map(),permanentHpSources:new Map(),offers:[],rerollsUsed:0,dead:false,location:null,questStates:Object.create(null),phase:"name",nickname:"",wins:0,scoreSaved:false}}
let state=fresh(),battleToken=0,pending=null,noticeTimer=null;
function num(x){return Number(x.toFixed(2))}
function equipped(){return [...new Set(Object.values(state.gear).filter(Boolean))]}
function inventoryMatches(id,rarity){
  return [...equipped(),...state.backpack.flatMap(entry=>entry?[entry.item]:[])].filter(item=>
    !item.potion&&item.id===id&&(!rarity||itemRarity(item)===rarity)
  );
}
function owned(it,rarity){return it.potion?undefined:inventoryMatches(it.id,rarity)[0]}
function recalc(){
  const stats=classBase(selectedClass());
  const sources=[selectedSubclass()?.modifiers,...unlockedSkills().map(node=>node.modifiers),...equipped()];
  for(const key of Object.keys(stats)){
    const sum=num(sources.reduce((total,source)=>total+(source?.[key]??0),stats[key]));
    if(key==="hp")state.max=Math.max(1,num(sum+state.permanentHpBonus));
    else state[key]=key==="speed"?Math.max(.25,sum):sum;
  }
  state.hp=num(Math.min(state.hp,state.max));
}
