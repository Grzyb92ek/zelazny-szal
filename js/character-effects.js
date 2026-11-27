function renderCharacterEffects(){
  const target=$("characterEffects");
  target.replaceChildren();
  let count=0;
  const describe=effectDisplayDescription;
  function row(name,description,origin,status){
    const entry=document.createElement("div"),title=document.createElement("strong"),text=document.createElement("div");
    title.textContent=name;
    text.textContent=[origin,description,status].filter(Boolean).join(" · ");
    entry.appendChild(title);
    entry.appendChild(text);
    target.appendChild(entry);
    count++;
  }
  function modifiers(source,kind){
    for(const [stat,value] of Object.entries(source?.modifiers??{})){
      if(value)row(characterStatLabels[stat],"Stała zmiana statystyki",kind+": "+source.name,(value>0?"+":"")+value);
    }
  }
  modifiers(selectedSubclass(),"Podklasa");
  for(const node of unlockedSkills())modifiers(node,"Umiejętność");
  const instances=playerEquipmentEffects();
  for(const instance of instances){
    const {effect,key,origin}=instance;
    const counter=battleEffects?.counters.get("player:"+key);
    const layers=battleEffects?.layers.filter(layer=>layer.key==="player:"+key)??[];
    const usedLimit=(effect.limit&&counter?.uses>=effect.limit)||(effect.runLimit&&effectRunUses("player",instance)>=effect.runLimit);
    const conditional=effect.conditionTarget||effect.criticalOnly||effect.nonCriticalOnly||effect.hitOnly||
      (effect.every??1)>1||(effect.chance??100)<100||Boolean(effect.clearOn)||effect.trigger!=="onBattleStart";
    const meetsHP=!effect.conditionTarget||(!effect.conditionCrossing&&
      (effect.conditionTarget==="self"||state.enemy)&&effectConditionPasses(effect,"player"));
    const active=layers.length>0||(meetsHP&&!usedLimit&&(!conditional||effect.action==="conditionalStat"||
      (effect.action==="scaleAttack"&&effect.conditionTarget)||
      (effect.trigger==="beforeReflect"&&effect.conditionTarget)||(counter?.uses>0&&!effect.clearOn&&!(effect.every>1))));
    const value=layers.length?" · "+layers.map(layer=>(layer.value>0?"+":"")+layer.value+" "+characterStatLabels[layer.stat]+
      ((layer.count??1)>1?" (×"+layer.count+")":"")).join(", "):"";
    row(effect.name,describe(effect),origin,(usedLimit&&!layers.length?"Wykorzystano limit":active?"Aktywny":"Oczekuje")+value);
  }
  for(const layer of state.permanentEffects){
    row(layer.name,layer.effect&&describe(layer.effect),layer.origin??"Bonus rozgrywki",
      (layer.value>0?"+":"")+layer.value+" "+characterStatLabels[layer.stat]);
  }
  for(const [id,{effect,origin}] of state.permanentHpSources){
    row(effect.name,describe(effect),origin??"Bonus rozgrywki","+"+state.effectRunTotals.get(id)+" maks. HP");
  }
  if(!count)target.textContent="Brak dodatkowych efektów.";
}
