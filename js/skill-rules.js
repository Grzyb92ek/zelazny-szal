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

function generateSkillDescription(source,effects=[]){
  const stats=Object.entries(source.modifiers??{}).filter(([,value])=>value);
  return joinDescriptions([...new Set([
    ...stats.map(([key,value])=>describeStatChange(key,value)),
    ...effects.map(effect=>effect.description?.trim()||generateEffectDescription(effect))
  ])]);
}

function skillDescription(source,effects){
  return source.description?.trim()||generateSkillDescription(source,effects);
}

if(typeof module!=="undefined"&&module.exports)module.exports={skillRoot,skillNodeIds,skillPrerequisites,characterStatLabels};
