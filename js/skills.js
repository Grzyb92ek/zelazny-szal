function currentSkillWheel(){
  const wheelId=selectedSubclass()?.wheelId;
  return skillCatalog.wheels.find(wheel=>wheel.id===wheelId);
}

function unlockedSkills(){
  return currentSkillWheel()?.nodes.filter(node=>state.unlockedSkills.has(node.id))??[];
}

function canSpendSkillPoints(){
  return Boolean(currentSkillWheel())&&!state.dead&&pending===null&&
    (state.phase==="main"||(state.phase==="result"&&state.exp<xpNeed()));
}

function skillNodeState(wheel,node){
  if(state.unlockedSkills.has(node.id))return "unlocked";
  return canSpendSkillPoints()&&state.skillPoints>=node.cost&&state.level>=node.level&&
    skillPrerequisites(wheel,node,state.unlockedSkills)?"available":"locked";
}

function unlockSkill(id){
  const wheel=currentSkillWheel();
  const node=wheel?.nodes.find(entry=>entry.id===id);
  if(!node||skillNodeState(wheel,node)!=="available")return false;
  const oldMax=state.max;
  state.skillPoints-=node.cost;
  state.unlockedSkills.add(id);
  recalc();
  state.hp=num(Math.min(state.max,state.hp+Math.max(0,state.max-oldMax)));
  renderCharacter();
  if(state.phase==="result")bars();
  renderSkillDialog(id);
  return true;
}

function syncSkillControls(){
  $("skillPoints").textContent=state.skillPoints+" pkt";
  $("openSkills").disabled=!canSpendSkillPoints();
  $("skillControls").hidden=!selectedSubclass()?.wheelId;
}

function renderSkillDialog(focusId){
  const wheel=currentSkillWheel();
  const profile=selectedSubclass();
  if(!wheel||!$("skillDialog").open)return;
  $("skillDialogPoints").textContent="Dostępne punkty: "+state.skillPoints;
  $("skillEmpty").hidden=wheel.nodes.length>0;
  drawSkillWheel($("skillWheel"),wheel,profile,{
    image:relative=>"assets/"+relative,
    nodeState:node=>skillNodeState(wheel,node),
    description:node=>skillDescription(node,definedEffectInstances(node,"skill").map(({effect})=>effect)),
    choose:node=>unlockSkill(node.id)
  });
  if(focusId)$("skillWheel").querySelector('[data-node="'+focusId+'"]')?.focus();
}

function initSkills(){
  $("openSkills").onclick=()=>{
    if(!canSpendSkillPoints())return;
    $("skillDialog").showModal();
    renderSkillDialog();
  };
}
