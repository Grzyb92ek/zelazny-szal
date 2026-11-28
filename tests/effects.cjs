const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(match=>fs.readFileSync(path.join(root,match[1]),"utf8"));
const nodes=new Map();
function element(){
  return {
    value:"",textContent:"",innerHTML:"",style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},appendChild(child){this.textContent+=child.textContent},replaceChildren(){this.textContent=""},focus(){},remove(){}
  };
}
const doc={
  createElement:element,
  getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)}
};

const test=new Function("document","window","setTimeout","clearTimeout","localStorage","assert",scripts.join("\n")+`
return (async()=>{
const logs=[];
addLog=line=>logs.push(line);
const expectedDescriptions={
  "laska-croma":"Przy trafieniu krytycznym ignoruje pancerz przeciwnika.",
  "zywe-korzenie":"Co piąte otrzymane trafienie przywraca 5% maksymalnego HP.",
  "kontratak":"15% szansy na kontratak po otrzymaniu trafienia.",
  "rozlupanie":"Każde trafienie zmniejsza pancerz przeciwnika o 1 do końca walki.",
  "ogluszenie":"Co trzecie trafienie ogłusza przeciwnika, powodując pominięcie jego następnego ataku.",
  "chciwosc":"20% szansy na podwojenie złota zdobytego za zwycięstwo.",
  "moc-umarlych":"Każde zwycięstwo zwiększa maksymalne HP o 3. Maksymalnie +30 HP na rozgrywkę.",
  "przebudzenie-run":"Każde trafienie krytyczne zwiększa obrażenia krytyczne o 5 punktów procentowych do końca walki."
};
for(const effect of effectCatalog.effects){
  const text=generateEffectDescription(effect);
  assert.ok(text&&text.endsWith("."),effect.id);
  assert.doesNotMatch(text,/NaN|undefined|cel:|Oczekuje| · /,effect.id);
  if(expectedDescriptions[effect.id])assert.equal(text,expectedDescriptions[effect.id]);
}
const rootsDefinition=effectCatalog.effects.find(effect=>effect.id==="zywe-korzenie");
assert.equal(generateEffectDescription({...rootsDefinition,every:3,value:7.5}),
  "Co trzecie otrzymane trafienie przywraca 7,5% maksymalnego HP.");
const configured=(id,trigger,action,fields={})=>({id,name:id,trigger,action,target:"self",...fields});
const source=effect=>({effect,key:effect.id,stackKey:effect.id});
function reset(player=[],enemy=[]){
  state=fresh();
  Object.assign(state,{location:"arena",phase:"combat",hp:50,enemyHp:40,
    enemy:{id:"test",name:"Cel",hp:100,damage:1,category:1,art:"bat",gold:0,armor:3,skill:"none"}});
  logs.length=0;
  const report=battleReport();
  battleEffects=createEffectContext({player:player.map(source),enemy:enemy.map(source)},report);
  return report;
}
const gold=(trigger,side)=>configured(trigger+side,trigger,"gold",{value:1});
const cleaver="item-5fc6a397-6fc9-429b-b39c-52b6818968e8";
function rareGear(gear){
  const pieces=new Map();
  for(const [slot,id] of Object.entries(gear)){
    if(!pieces.has(id)){
      const item=baseItems.find(row=>row.id===id);
      assert.ok(item,id);
      pieces.set(id,rareFromUncommon(promote(item)));
    }
    state.gear[slot]=pieces.get(id);
  }
}
function rareBattle(gear,player={},enemy={}){
  const r=reset();
  rareGear(gear);
  Object.assign(state,{hp:100,max:100,dmg:10,armor:0,crit:0,critD:150,speed:1,healOnHit:0,damageReflect:0},player);
  Object.assign(state.enemy,{hp:100,damage:10,armor:0},enemy);
  state.enemyHp=state.enemy.hp;
  beginBattleEffects(r);
  return r;
}
const hit=(r,times=1)=>{for(let i=0;i<times;i++)playerStrike(r,()=>0)};
async function checkRareEffects(){
  const rng=Math.random;
  try{
    assert.equal(effectCatalog.effects.length,38);
    assert.equal(effectCatalog.assignments.length,32);
    assert.deepEqual(new Set(effectCatalog.assignments.map(row=>row.sourceId)),new Set(baseItems.map(item=>item.id)));
    for(const assignment of effectCatalog.assignments){
      assert.equal(assignment.rarity,"rare");
      const source=baseItems.find(item=>item.id===assignment.sourceId);
      assert.ok(source?.name);
      assert.equal(attachedEffects(effectCatalog,"item",source.id,"common").length,0);
      assert.equal(attachedEffects(effectCatalog,"item",source.id,"uncommon").length,0);
      assert.equal(attachedEffects(effectCatalog,"item",source.id,"rare")[0].id,assignment.effectId);
    }
    // Rozłupanie, Szał bojowy, Ogłuszenie.
    let r=rareBattle({left:"iron-axe"},{dmg:5},{armor:2});
    hit(r,4);
    assert.equal(r.dealt,17);
    assert.equal(battleStat("enemy","armor"),0);
    state.enemy.armor++;
    assert.equal(battleStat("enemy","armor"),1,"hits at zero do not accumulate armor debt");
    beginBattleEffects(battleReport());
    assert.equal(battleStat("enemy","armor"),3);
    const axe=state.gear.left;
    state.gear.left=null;
    state.backpack[0]={item:axe,count:1};
    beginBattleEffects(r=battleReport());hit(r);
    assert.equal(battleStat("enemy","armor"),3,"rare in backpack has no effect");
    r=rareBattle({left:"dagger"},{dmg:1,crit:100});
    hit(r,25);
    assert.equal(battleStat("player","speed"),3.5);
    r=rareBattle({left:"two-handed-hammer",right:"two-handed-hammer"},{dmg:1},{skill:"dodge",power:100});
    hit(r);state.enemy.skill="none";hit(r,2);
    assert.equal(battleEffects.skips.enemy,0);
    hit(r);enemyStrike(r);enemyStrike(r);
    assert.equal(r.enemyHits,1,"only one attack is stunned and a miss does not count");
    // Podwójne cięcie, Krwawa uczta, Kontratak.
    Math.random=()=>.2;
    r=rareBattle({left:"katana",right:"katana"},{crit:100,healOnHit:2,hp:40});
    hit(r);assert.equal(battleEffects.extra.length,0);
    Math.random=()=>.19;
    hit(r);await runEffectAttacks(r,()=>true);
    assert.equal(r.hits,3);assert.equal(r.crits,3);assert.equal(state.hp,46);
    r=rareBattle({left:cleaver},{healOnHit:8,hp:49});
    hit(r);assert.equal(state.hp,65);
    state.hp=50;hit(r);assert.equal(state.hp,58,"strict threshold");
    r=rareBattle({left:"shield"});
    Math.random=()=>.15;enemyStrike(r);assert.equal(battleEffects.extra.length,0);
    Math.random=()=>.14;enemyStrike(r);await runEffectAttacks(r,()=>true);
    assert.equal(r.hits,1);
    dealEffectDamage("player","enemy",2);assert.equal(battleEffects.extra.length,0);
    secondaryEffectAttack(()=>enemyStrike(r));assert.equal(battleEffects.extra.length,0);
    // Żelazne ciernie, Instynkt przetrwania, Żywe korzenie.
    r=rareBattle({armor:"chainmail"},{armor:5,damageReflect:1});
    enemyStrike(r);assert.equal(state.enemyHp,96.5);
    state.armor=2;enemyStrike(r);assert.equal(state.enemyHp,94.5);
    Math.random=()=>.1;
    r=rareBattle({armor:"leather-armor"});enemyStrike(r);assert.equal(state.hp,90);
    Math.random=()=>.09;
    enemyStrike(r);assert.equal(state.hp,90);assert.equal(r.enemyHits,1);
    r=rareBattle({armor:"druid-armor"},{},{damage:2});
    dealEffectDamage("player","enemy",1);
    for(let i=0;i<4;i++)enemyStrike(r);
    assert.equal(state.hp,91);
    enemyStrike(r);assert.equal(state.hp,94);
    // Brutalna szarża i Moc umarłych.
    r=rareBattle({helmet:"horned-helmet"});
    hit(r,2);assert.equal(r.dealt,30);
    r=rareBattle({helmet:"horned-helmet"},{},{skill:"dodge",power:100});
    hit(r);state.enemy.skill="none";hit(r);assert.equal(r.dealt,10,"miss spends the first attack");
    rareBattle({helmet:"bone-helmet"});
    const helmet=state.gear.helmet;
    const firstMax=state.max;
    battleVictoryEffects(false);assert.equal(state.max,firstMax);
    for(let i=0;i<12;i++){
      if(i===2){
        state.gear.helmet=null;recalc();
        assert.equal(state.max,selectedClass().hp+6);
        beginBattleEffects(battleReport());battleVictoryEffects(true);
        assert.equal(state.permanentHpBonus,6);
        state.gear.helmet={...helmet};
      }
      beginBattleEffects(battleReport());battleVictoryEffects(true);
    }
    assert.equal(state.permanentHpBonus,30);
    state.gear.helmet=null;recalc();assert.equal(state.max,selectedClass().hp+30);
    // Niepowstrzymana furia, Krwawa ofiara, Drugie życie i Łaska Croma.
    r=rareBattle({amulet:"amulet"},{hp:30});
    hit(r);state.hp=29;hit(r);assert.equal(r.dealt,23);
    r=rareBattle({amulet:"blood-amulet"},{hp:98,healOnHit:6},{armor:9});
    hit(r);assert.equal(state.hp,100);assert.equal(r.dealt,5);assert.equal(r.hits,1);
    hit(r);assert.equal(r.dealt,12);
    r=rareBattle({left:cleaver,amulet:"blood-amulet"},{max:20,hp:9,healOnHit:8},{armor:9});
    hit(r);assert.equal(state.hp,20);assert.equal(r.dealt,6,"overflow uses doubled hit healing");
    r=rareBattle({amulet:"regeneration-amulet"},{hp:35});
    enemyStrike(r);assert.equal(state.hp,25);
    enemyStrike(r);assert.equal(state.hp,35);
    enemyStrike(r);enemyStrike(r);assert.equal(state.hp,15,"one activation per battle");
    r=rareBattle({amulet:"regeneration-amulet"},{hp:4});
    enemyStrike(r);assert.equal(state.hp,0);
    r=rareBattle({amulet:"crom-amulet",trinket:"runic-ring",helmet:"horned-helmet"},{crit:100},{armor:10});
    hit(r);assert.equal(r.dealt,30);
    assert.equal(battleStat("player","critD"),155,"rune stacks after damage");
    hit(r);assert.equal(r.dealt,45);
    assert.equal(battleStat("player","critD"),160);
    state.crit=0;hit(r);assert.equal(r.dealt,46,"ordinary hit still uses armor");
    // Przyspieszenie, Oszukać śmierć i Chciwość.
    Math.random=()=>0;
    r=rareBattle({left:"katana",right:"katana",trinket:"speed-stone"},{dmg:1},{skill:"dodge",power:100});
    hit(r,4);assert.equal(battleEffects.extra.length,0);
    hit(r);assert.equal(battleEffects.extra.length,1,"miss still counts as an attack");
    state.enemy.skill="none";await runEffectAttacks(r,()=>true);
    assert.equal(r.hits,1);assert.equal(battleEffects.extra.length,0);
    hit(r,3);
    assert.equal(battleEffects.extra.length,3);
    r=rareBattle({trinket:"lucky-bone",amulet:"regeneration-amulet"},{hp:4},{damage:99});
    enemyStrike(r);assert.equal(state.hp,26,"lethal hit only triggers Lucky Bone");
    enemyStrike(r);assert.equal(state.hp,0);
    assert.ok(battleEffects.kills.has("player"));
    r=rareBattle({trinket:"lucky-bone"},{hp:4},{damage:99});
    enemyStrike(r);assert.equal(state.hp,26,"new fight restores the survival charge");
    r=rareBattle({trinket:"lucky-bone"},{hp:4});
    dealEffectDamage("player","enemy",4);
    assert.equal(state.hp,0,"direct damage is not a lethal hit");
    for(const [roll,payout] of [[.19,26],[.2,13]]){
      r=rareBattle({trinket:"coin-purse"},{goldBonus:3},{hp:1,gold:10});
      Math.random=()=>roll;
      state.phase="main";
      const balance=state.gold;
      await fight();
      assert.equal(state.gold-balance,payout);
      assert.equal(state.phase,"result");
    }
    r=rareBattle({left:"katana",right:"katana"},{dmg:12},{hp:15});
    Math.random=()=>0;
    hit(r);assert.equal(battleEffects.extra.length,1);
    hit(r);await runEffectAttacks(r,()=>true);
    assert.equal(r.hits,2,"queued attack stops when its target dies");
    assert.equal(state.enemyHp,0);
    console.log("PASS: 19 rare effects, rarity and equipment gates, stacking, triggers and combat interactions");
  }finally{Math.random=rng}
}
await checkRareEffects();

function checkAdditionalRareEffects(){
  const itemId=image=>baseItems.find(item=>item.image===image+".png").id;
  const gear=(...entries)=>Object.fromEntries(entries.map(([slot,image])=>[slot,itemId(image)]));
  const incoming=(r,count)=>{for(let i=0;i<count;i++)enemyStrike(r)};
  // Krucha nieśmiertelność counts received hits only and resets next fight.
  let r=rareBattle(gear(["amulet","fang_necklace"]),{},{damage:2});
  dealEffectDamage("player","enemy",1);
  incoming(r,2);assert.equal(battleStat("player","armor"),0);
  incoming(r,4);assert.equal(battleStat("player","armor"),2);
  beginBattleEffects(battleReport());assert.equal(battleStat("player","armor"),0);
  // Kościane odłamki uses a real enemy critical from a configured effect.
  const critSource=configured("test-enemy-critical","onBattleStart","stat",{stat:"crit",value:100,duration:"battle"});
  effectCatalog.effects.push(critSource);
  effectCatalog.assignments.push({kind:"enemy",sourceId:"test",effectId:critSource.id});
  try{
    r=rareBattle(gear(["armor","bone_armor"]),{},{armor:50});
    enemyStrike(r,()=>.99);
    assert.equal(r.received,15);
    assert.equal(r.dealt,8);
    assert.equal(r.hits,0);
    assert.equal(state.enemyHp,92);
  }finally{effectCatalog.effects.pop();effectCatalog.assignments.pop()}
  r=rareBattle(gear(["armor","bone_armor"]),{},{armor:50});
  incoming(r,1);assert.equal(r.dealt,0);
  // Korona cierpienia doubles all reflection, including Żelazne ciernie.
  r=rareBattle({...gear(["helmet","crown"]),armor:"chainmail"},{hp:51,armor:4,damageReflect:3},{damage:5});
  incoming(r,1);assert.equal(state.hp,50);assert.equal(r.dealt,5);
  incoming(r,1);assert.equal(r.dealt,15);
  // Zwierzęca wytrzymałość mitigates hits after armor and direct damage.
  r=rareBattle(gear(["armor","fur_cloak"]),{armor:2},{damage:12});
  for(let turn=0;turn<3;turn++){
    startEffectTurn("player");
    incoming(r,1);
    endEffectTurn("player");
  }
  assert.equal(r.received,24);
  incoming(r,1);assert.equal(r.received,34);
  beginBattleEffects(r=battleReport());
  dealEffectDamage("player","enemy",10);
  assert.equal(r.received,8);
  // Zasadzka charges once and is spent even if the target dodges.
  r=rareBattle({...gear(["helmet","hood"]),armor:"leather-armor"});
  const priorRandom=Math.random;
  try{
    Math.random=()=>0;
    incoming(r,2);assert.equal(r.enemyHits,0);
    assert.equal(battleCriticalChance("player"),100);
    assert.match(effectLayerSummary("player"),/^Zasadzka$/);
    playerStrike(r,()=>.99);assert.equal(r.crits,1);
    assert.equal(battleCriticalChance("player"),0);
    incoming(r,1);
    state.enemy.skill="dodge";state.enemy.power=100;
    playerStrike(r,()=>.99);assert.equal(r.hits,1);
    assert.equal(battleCriticalChance("player"),0);
  }finally{Math.random=priorRandom}
  // Miażdżenie caps and resets; Rozrywające kolce applies to the same hit.
  r=rareBattle(gear(["left","spiked_mace"],["right","spiked_mace"]),{dmg:1,crit:100});
  hit(r,8);assert.equal(battleStat("enemy","dmg"),5);
  beginBattleEffects(battleReport());assert.equal(battleStat("enemy","dmg"),10);
  r=rareBattle(gear(["armor","plate_armor"]),{damageReflect:2},{hp:1000,damage:1});
  incoming(r,1);assert.equal(r.dealt,3);
  dealEffectDamage("player","enemy",1);assert.equal(battleStat("player","damageReflect"),3);
  incoming(r,12);assert.equal(battleStat("player","damageReflect"),12);
  beginBattleEffects(battleReport());assert.equal(battleStat("player","damageReflect"),2);
  // Precyzyjny ostrzał resets its own bonus on a critical. Hood can guarantee it.
  r=rareBattle(gear(["left","bow"],["right","bow"],["helmet","hood"]),{crit:10});
  playerStrike(r,()=>.99);playerStrike(r,()=>.99);
  assert.equal(battleCriticalChance("player"),20);
  emitBattleEffect("player","onDodge");
  playerStrike(r,()=>.99);assert.equal(r.crits,1);
  assert.equal(battleCriticalChance("player"),10);
  // Mistrz ostrza counts hits despite intervening misses and applies after armor.
  r=rareBattle(gear(["left","sword"]),{},{armor:4});
  hit(r,2);state.enemy.skill="dodge";state.enemy.power=100;
  hit(r);assert.equal(r.dealt,12);
  state.enemy.skill="none";hit(r);assert.equal(r.dealt,21);
  hit(r);assert.equal(r.dealt,27);
  beginBattleEffects(r=battleReport());hit(r);assert.equal(r.dealt,6);
  // Stalowa determinacja requires crossing the threshold without a lethal hit.
  r=rareBattle(gear(["helmet","helmet"]),{hp:60});
  incoming(r,1);assert.equal(battleStat("player","armor"),0);
  incoming(r,1);assert.equal(battleStat("player","armor"),5);
  state.hp=55;incoming(r,2);
  assert.equal([...battleEffects.counters.values()].find(row=>row.uses)?.uses,1);
  r=rareBattle({...gear(["helmet","helmet"]),trinket:"lucky-bone"},{hp:60},{damage:80});
  incoming(r,1);assert.equal(state.hp,26);assert.equal(battleStat("player","armor"),0);
  // Żniwiarz dusz is capped per run even when an equivalent trinket is re-equipped.
  r=rareBattle(gear(["trinket","skull_pendant"]));
  const pendant=state.gear.trinket;
  for(let i=0;i<12;i++){
    beginBattleEffects(r);battleVictoryEffects(true);
    state.gear.trinket={...pendant};
  }
  battleEffects=null;state.gear.trinket=null;recalc();
  assert.equal(battleStat("player","dmg"),state.dmg+10);
  renderCharacter();assert.ok($("characterEffects").textContent.includes("Obrażenia +10."));
  // Lekkość ruchu works with a granted dodge from a compatible class.
  const dodgeSource=configured("test-class-dodge","beforeIncomingAttack","dodge");
  effectCatalog.effects.push(dodgeSource);
  effectCatalog.assignments.push({kind:"class",sourceId:selectedClass().id,effectId:dodgeSource.id});
  try{
    r=rareBattle(gear(["armor","torn_tunic"]));
    incoming(r,4);assert.equal(battleStat("player","speed"),1.8);
    incoming(r,3);assert.equal(r.enemyHits,0);
    assert.equal(battleStat("player","speed"),2);
    beginBattleEffects(r);assert.equal(battleStat("player","speed"),1);
  }finally{effectCatalog.effects.pop();effectCatalog.assignments.pop()}
  // Przeszywające uderzenie bypasses armor without creating hits or reflection.
  r=rareBattle(gear(["left","spear"],["right","spear"]),{armorPenetration:3},{armor:50,damageReflect:2});
  hit(r);assert.equal(r.dealt,4);assert.equal(r.hits,1);assert.equal(r.received,2);
  assert.match(rareEffectDetails(state.gear.left),/Przeszywające uderzenie/);
  state.enemyHp=4;hit(r);assert.equal(state.enemyHp,0);
  assert.ok(battleEffects.kills.has("enemy"));
  console.log("PASS: 13 additional rare effects, caps, resets, turn duration and interactions");
}
checkAdditionalRareEffects();
function checkBerserkSkills(){
  const r=reset();
  state.subclassId="berserk";
  state.skillPoints=8;
  state.phase="main";
  const wheel=currentSkillWheel();
  assert.equal(wheel.rings.length,2);
  assert.equal(wheel.nodes.length,8);
  const descriptions=[
    "Przywracanie zdrowia po trafieniu +2 HP.",
    "Poniżej 50% HP trafienia krytyczne przywracają dodatkowe 5 HP.",
    "Poniżej 50% HP zadawane obrażenia zwiększają się o 20%.",
    "Poniżej 25% HP szybkość ataku zwiększa się o 0,5.",
    "Obrażenia +3. Przebicie pancerza +2.",
    "Zadajesz 25% więcej obrażeń przeciwnikom posiadającym mniej niż 25% HP.",
    "Każde otrzymane trafienie zwiększa obrażenia o 1 do końca walki. Maksymalnie +10 obrażeń.",
    "Raz na walkę, po spadku poniżej 20% HP, odzyskujesz 15% maksymalnego HP i zadajesz 20% więcej obrażeń do końca walki. Nie zapobiega śmierci."
  ];
  assert.deepEqual(wheel.nodes.map(node=>skillDescription(node,definedEffectInstances(node,"skill").map(row=>row.effect))),descriptions);
  assert.equal(skillDescription({...wheel.nodes[0],description:"Własny opis."},[]),"Własny opis.");
  assert.ok(!unlockSkill("krwawy-trans"));
  for(const node of wheel.nodes)assert.ok(unlockSkill(node.id),node.id);
  assert.equal(state.skillPoints,0);
  assert.ok(!unlockSkill("zadza-krwi"));
  assert.equal(state.healOnHit,2);
  assert.equal(state.dmg,selectedClass().dmg+3);
  assert.equal(state.armorPenetration,2);
  const expected=state.dmg;recalc();assert.equal(state.dmg,expected);
  const cloak=baseItems.find(item=>item.id==="chainmail");
  state.gear.armor=rareFromUncommon(promote(cloak));
  Object.assign(state,{hp:50,max:100,dmg:20,crit:100,critD:100,speed:1,armor:0});
  Object.assign(state.enemy,{hp:1000,damage:2,armor:0});
  state.enemyHp=1000;
  state.phase="combat";
  beginBattleEffects(r);
  playerStrike(r,()=>0);
  assert.equal(r.dealt,20);assert.equal(state.hp,52,"50% does not trigger bonus; ordinary hit healing still works");
  state.hp=49;
  playerStrike(r,()=>0);
  assert.equal(r.dealt,44);assert.equal(state.hp,56,"rage and critical heal stack with on-hit healing");
  state.hp=25;assert.equal(battleStat("player","speed"),1);
  state.hp=24;assert.equal(battleStat("player","speed"),1.5);
  assert.equal(attackBudget(50,battleStat("player","speed")).attacks,2);
  state.hp=70;assert.equal(battleStat("player","speed"),1);
  state.enemyHp=250;state.crit=0;
  let before=r.dealt;playerStrike(r,()=>.99);assert.equal(r.dealt-before,20);
  state.enemyHp=249;before=r.dealt;playerStrike(r,()=>.99);assert.equal(r.dealt-before,25);
  state.enemy.skill="dodge";state.enemy.power=100;state.hp=60;
  playerStrike(r,()=>0);assert.equal(state.hp,60);
  state.enemy.skill="none";state.enemyHp=800;state.hp=50;
  for(let i=0;i<12;i++)enemyStrike(r);
  assert.equal(battleStat("player","dmg"),30);
  state.hp=22;enemyStrike(r);assert.equal(state.hp,20);
  enemyStrike(r);assert.equal(state.hp,33);
  assert.equal(battleStat("player","attackDamageBonus"),20);
  state.hp=60;state.enemyHp=800;before=r.dealt;playerStrike(r,()=>.99);
  assert.equal(r.dealt-before,36,"last rage remains after recovery");
  state.hp=21;enemyStrike(r);assert.equal(state.hp,19,"last rage activates once");
  beginBattleEffects(r);
  assert.equal(battleStat("player","attackDamageBonus"),0);
  assert.equal(battleStat("player","dmg"),20);
  state.hp=1;enemyStrike(r);
  assert.equal(state.hp,0);assert.equal(battleStat("player","attackDamageBonus"),0);
  assert.ok(logs.some(line=>line.includes("Ostatni szał")));
  state.gear.left=rareFromUncommon(promote(baseItems.find(item=>item.id===cleaver)));
  state.hp=30;state.crit=100;
  beginBattleEffects(r);
  playerStrike(r,()=>0);
  assert.equal(state.hp,39,"Krwawa uczta doubles the on-hit modifier while the separate critical heal remains +5");
  console.log("PASS: all 8 Berserk skills, thresholds, stacking, reset and unlock requirements");
}
checkBerserkSkills();

function checkAdvancedModifiers(){
  const incoming={trigger:"onDamaged",action:"healPercent",target:"self",hitOnly:true};
  const axe={kind:"item",sourceId:"iron-axe",rarity:"rare",effect:{...incoming,id:"axe-heal",value:1,runLimit:2}};
  const classRule={kind:"class",sourceId:"barbarian",effect:{...incoming,id:"class-heal",value:2}};
  const enemy={kind:"enemy",sourceId:"test",effect:{...incoming,id:"enemy-heal",value:3}};
  const skill={kind:"skill",sourceId:"zadza-krwi",wheelId:"berserk",effect:{...incoming,id:"skill-heal",value:4}};
  const roots=effectCatalog.effects.find(row=>row.id==="zywe-korzenie");
  const named=JSON.stringify(roots);
  assert.equal(modifierCatalog.length,0,"the shipped catalog leaves all existing sources untouched");
  modifierCatalog.push(axe,classRule,enemy,skill,{...skill,wheelId:"other",effect:{...skill.effect,id:"other-wheel",value:99}});
  try{
    let r=rareBattle({left:"iron-axe",armor:"druid-armor"},{hp:70},{hp:100,damage:15});
    state.subclassId="berserk";state.unlockedSkills.add("zadza-krwi");
    beginBattleEffects(r);
    for(const expected of [62,54,45,36,32]){enemyStrike(r);assert.equal(state.hp,expected)}
    assert.equal(JSON.stringify(roots),named,"named fifth-hit effect stays independent");
    assert.match(rareEffectDetails(state.gear.left),/Rozłupanie/);
    assert.match(rareEffectDetails(state.gear.left),/1%/);
    assert.ok(!rareEffectDetails(baseItems.find(row=>row.id==="iron-axe")).includes("1%"));
    assert.match(sourceEffectDescription("enemy","test"),/3%/);
    assert.match(sourceEffectDescription("class","barbarian"),/2%/);
    state.enemyHp=40;state.dmg=10;
    playerStrike(r,()=>.99);assert.equal(state.enemyHp,33,"enemy owns a separate configured value");
    beginBattleEffects(r);
    state.hp=70;enemyStrike(r);assert.equal(state.hp,61,"run limit survives a new battle");
    state.backpack[0]={item:state.gear.left,count:1};state.gear.left=null;
    beginBattleEffects(r);
    assert.ok(!battleEffects.instances.player.some(row=>row.effect.id==="advanced:axe-heal"));
    assert.match(logs.join(" "),/Żywe korzenie/);
    modifierCatalog.length=0;
    const perCopy={...axe,effect:{...incoming,id:"axe-once",value:1,limit:1}};
    modifierCatalog.push(perCopy);
    r=rareBattle({left:"iron-axe"},{hp:75},{damage:10});
    state.gear.right={...state.gear.left};
    beginBattleEffects(r);
    enemyStrike(r);assert.equal(state.hp,67,"two instances each get their own use");
    enemyStrike(r);assert.equal(state.hp,57,"neither can proc twice per fight");
    modifierCatalog.length=0;
    modifierCatalog.push({kind:"item",sourceId:healthPotion.id,
      effect:{id:"potion-now",trigger:"onUse",action:"heal",target:"self",value:4,runLimit:1}});
    reset();
    useConsumableEffects(healthPotion);assert.equal(state.hp,54);
    useConsumableEffects(healthPotion);assert.equal(state.hp,54,"on-use limits persist across uses");
  }finally{modifierCatalog.length=0}
  console.log("PASS: independent advanced modifiers, equipped rarity, named coexistence, skills, enemies and activation limits");
}
checkAdvancedModifiers();
for(const trigger of Object.keys(effectTriggers).filter(trigger=>trigger!=="onUse")){
  reset([gold(trigger,"p")],[gold(trigger,"e")]);
  const balance=state.gold;
  emitBattleEffect("player",trigger);
  emitBattleEffect("enemy",trigger);
  assert.equal(state.gold,balance+1,trigger+" player");
  assert.equal(state.enemy.gold,1,trigger+" enemy");
}

for(const side of effectSides){
  function setup(effect){return reset(side==="player"?[effect]:[],side==="enemy"?[effect]:[])}
  const target=oppositeEffectSide(side);
  let effect=configured("damage","onAttack","damage",{target:"opponent",value:3});
  let report=setup(effect),before=effectHp(target);
  emitBattleEffect(side,"onAttack");
  assert.equal(effectHp(target),before-3);
  assert.equal(report[target==="player"?"received":"dealt"],3);
  assert.equal(report.hits+report.enemyHits,0,"direct effect is not a hit");

  effect=configured("flat","onHit","heal",{value:4});
  setup(effect);before=effectHp(side);emitBattleEffect(side,"onHit");
  assert.equal(effectHp(side),before+4);
  effect=configured("percent","onHit","healPercent",{value:50});
  setup(effect);setEffectHp(side,effectMaxHp(side)-2);emitBattleEffect(side,"onHit");
  assert.equal(effectHp(side),effectMaxHp(side),"percent healing respects cap");

  effect=configured("armor","onAttack","reduceArmor",{target:"opponent",value:100,duration:"battle"});
  setup(effect);emitBattleEffect(side,"onAttack");
  assert.equal(battleStat(target,"armor"),0);
  effect=configured("stat","onHit","stat",{stat:"dmg",value:3,duration:"turns",turns:2,stack:true,maxStacks:2});
  setup(effect);
  const initial=battleStat(side,"dmg");
  startEffectTurn(side);
  emitBattleEffect(side,"onHit");emitBattleEffect(side,"onHit");emitBattleEffect(side,"onHit");
  assert.equal(battleStat(side,"dmg"),initial+6,"stack cap and refresh");
  assert.match(effectLayerSummary(side),/×2/);
  endEffectTurn(side);
  assert.equal(battleStat(side,"dmg"),initial+6);
  startEffectTurn(side);endEffectTurn(side);
  assert.equal(battleStat(side,"dmg"),initial,"turn layers expire");

  effect=configured("skip","onAttack","skipAttack",{target:"opponent"});
  setup(effect);emitBattleEffect(side,"onAttack");
  assert.ok(effectAttackSkipped(target));assert.ok(!effectAttackSkipped(target),"skip lasts one attack");

  effect=configured("extra","onAttack","extraAttack");
  setup(effect);
  for(let i=0;i<50;i++)emitBattleEffect(side,"onAttack");
  assert.equal(battleEffects.extra.length,maxEffectAttacks);
  assert.ok(battleEffects.extra.every(owner=>owner===side));

  effect=configured("survive","onDamaged","survive",{limit:1});
  setup(effect);
  const old=effectHp(side);
  notifyEffectDamage(side,target,1);
  assert.equal(effectHp(side),old,"protection does not consume on a nonlethal hit");
  setEffectHp(side,0);notifyEffectDamage(side,target,old);
  assert.equal(effectHp(side),1);
  assert.ok(!battleEffects.kills.has(side));
  setEffectHp(side,0);notifyEffectDamage(side,target,1);
  assert.ok(battleEffects.kills.has(side),"second lethal damage exceeds limit");
}

const periodic=configured("periodic","onHit","heal",{value:5,every:2,limit:1,conditionTarget:"self",conditionUnit:"percent",conditionAbove:false,conditionValue:50});
reset([periodic]);
const hp=state.hp;
for(let i=0;i<4;i++)emitBattleEffect("player","onHit");
assert.equal(state.hp,hp+5,"every N events and limit");
reset([periodic]);
state.hp=state.max;emitBattleEffect("player","onHit");emitBattleEffect("player","onHit");
assert.equal(battleEffects.counters.get("player:periodic").uses,0,"condition and effective healing");
reset([configured("never","onHit","gold",{chance:0,value:2})]);const funds=state.gold;
emitBattleEffect("player","onHit");assert.equal(state.gold,funds,"zero chance");

const recoil=configured("retaliate","onDamaged","damage",{target:"opponent",value:2});
const chain=reset([recoil],[recoil]);
notifyEffectDamage("player","enemy",1);
assert.equal(chain.received,2);assert.equal(chain.dealt,2);
assert.equal(battleEffects.queue.length,0,"reciprocal damage stops within a cascade");

const perSource=configured("per-item","onHit","gold",{value:1,limit:1});
reset();
battleEffects.instances.player=[{effect:perSource,key:"left",stackKey:"left"},{effect:perSource,key:"right",stackKey:"right"}];
const startingGold=state.gold;
emitBattleEffect("player","onHit");emitBattleEffect("player","onHit");
assert.equal(state.gold,startingGold+2,"limits are independent per physical source");

const axe=baseItems.find(item=>item.id==="iron-axe");
const amulet=baseItems.find(item=>item.id==="amulet");
effectCatalog.effects.push(perSource);
effectCatalog.assignments.push(
  {kind:"item",sourceId:axe.id,effectId:perSource.id,rarity:"rare"},
  {kind:"item",sourceId:amulet.id,effectId:perSource.id,rarity:"any"}
);
reset();
state.gear.left=axe;state.gear.amulet=amulet;
state.backpack[0]={item:rareFromUncommon(promote(axe)),count:1};
beginBattleEffects(battleReport());
const beforeRarity=state.gold;
emitBattleEffect("player","onHit");
assert.equal(state.gold,beforeRarity+1,"equipped common and stored rare do not match a rare-only effect");
state.gear.left=state.backpack[0].item;state.backpack[0]=null;
beginBattleEffects(battleReport());
const beforeEquipped=state.gold;
emitBattleEffect("player","onHit");emitBattleEffect("player","onHit");
assert.equal(state.gold,beforeEquipped+2,"two equipped sources have independent counters in a new fight");
effectCatalog.effects.length=0;effectCatalog.assignments.length=0;

const onUse=configured("drink","onUse","gold",{value:2});
const ready=configured("ready","onBattleStart","stat",{stat:"dmg",value:3,duration:"battle"});
const permanent=configured("lasting","onUse","stat",{stat:"armor",value:1,duration:"permanent"});
effectCatalog.effects.push(onUse,ready,permanent);
effectCatalog.assignments.push(...[onUse,ready,permanent].map(effect=>({kind:"item",sourceId:healthPotion.id,effectId:effect.id})));
reset();
battleEffects=null;state.phase="main";
state.backpack[0]={item:healthPotion,count:2};
const cash=state.gold;
assert.equal(state.preparedEffects.length,0);
useBackpackItem(0,state.backpack[0]);
assert.equal(state.gold,cash+2);
assert.equal(state.preparedEffects.length,1);
assert.equal(battleStat("player","armor"),state.armor+1);
beginBattleEffects(battleReport());
assert.equal(battleStat("player","dmg"),state.dmg+3);
assert.equal(state.preparedEffects.length,0);
battleEffects=null;
beginBattleEffects(battleReport());
assert.equal(battleStat("player","dmg"),state.dmg);
assert.equal(battleStat("player","armor"),state.armor+1,"permanent layer survives combat");

const flowTriggers=["onBattleStart","onTurnStart","onTurnEnd","onAttack","onHit","onCrit","onDamaged","onKill","onVictory","onHeal","onBattleEnd"];
effectCatalog.effects.length=0;
effectCatalog.assignments.length=0;
for(const trigger of flowTriggers){
  const effect=gold(trigger,"flow");
  effectCatalog.effects.push(effect);
  effectCatalog.assignments.push({kind:trigger==="onDamaged"?"enemy":"class",sourceId:trigger==="onDamaged"?"test":selectedClass().id,effectId:effect.id});
}
reset();
state.phase="main";state.crit=100;state.enemyHp=1;
await fight();
assert.equal(state.phase,"result");
for(const trigger of flowTriggers)assert.ok(logs.some(line=>line.includes(trigger+"flow")),trigger+" fires in the real fight");
assert.equal(battleEffects,null,"fight clears the context");

const dodge=gold("onDodge","flow");
effectCatalog.effects.push(dodge);
effectCatalog.assignments.push({kind:"enemy",sourceId:"test",effectId:dodge.id});
reset();state.enemy.skill="dodge";state.enemy.power=100;beginBattleEffects(battleReport());
playerStrike(battleEffects.report,()=>0);
assert.ok(logs.some(line=>line.includes("onDodgeflow")));
assert.equal(battleEffects.report.hits,0);
battleEffects=null;
console.log("PASS: all effect triggers and actions, both sides, limits, conditions, duration, safety, consumption and combat flow");
})();
`);
test(doc,{scrollTo(){}},callback=>{queueMicrotask(callback);return 0},()=>{},
  {getItem(){return null},setItem(){}},assert).catch(error=>{console.error(error);process.exitCode=1});
