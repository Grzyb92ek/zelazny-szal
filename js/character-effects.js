function renderCharacterEffects(){
  const target=$("characterEffects");
  target.replaceChildren();
  const rows=new Map();
  const describe=effectDisplayDescription;
  function row(name,description,origin,current){
    const id=JSON.stringify([name,description,origin]);
    if(!rows.has(id))rows.set(id,{name,description,origin,current:new Set()});
    if(current)rows.get(id).current.add(current);
  }
  function renderRow({name,description,origin,current}){
    const entry=document.createElement("div"),title=document.createElement("strong"),text=document.createElement("div");
    title.textContent=name;
    entry.appendChild(title);
    if(description||current.size){
      text.textContent=[description,...current].filter(Boolean).join(" ");
      entry.appendChild(text);
    }
    if(origin){
      const source=document.createElement("small");
      source.className="effect-source";
      source.textContent=origin.endsWith(": "+name)?origin.slice(0,origin.indexOf(":")):origin;
      entry.appendChild(source);
    }
    target.appendChild(entry);
  }
  function modifiers(source,kind){
    for(const [stat,value] of Object.entries(source?.modifiers??{})){
      if(value)row(characterStatLabels[stat],describeStatChange(stat,value),kind+": "+source.name);
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
    const current=layers.map(layer=>describeStatChange(layer.stat,layer.value));
    if(usedLimit&&!layers.length)current.push("Limit wykorzystany.");
    row(effect.name,describe(effect),origin,current.length?"Obecnie: "+current.join(" "):"");
  }
  for(const layer of state.permanentEffects){
    row(layer.name,layer.effect&&describe(layer.effect),layer.origin??"Bonus rozgrywki",
      "Obecnie: "+describeStatChange(layer.stat,layer.value));
  }
  for(const [id,{effect,origin}] of state.permanentHpSources){
    row(effect.name,describe(effect),origin??"Bonus rozgrywki","Obecnie: "+describeStatChange("hp",state.effectRunTotals.get(id)));
  }
  for(const entry of rows.values())renderRow(entry);
  if(!rows.size)target.textContent="Brak dodatkowych efektów.";
}
