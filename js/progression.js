function xpNeed(){return 50*(state.level+1)}
function xpReward(){return 50+5*Math.floor(state.level/5)}

function awardSkillLevels(){
  const previous=state.level;
  while(state.exp>=xpNeed()){
    state.exp-=xpNeed();
    state.level++;
    state.skillPoints+=skillCatalog.settings.pointsPerLevel;
  }
  if(state.level===previous)return;
  const gained=(state.level-previous)*skillCatalog.settings.pointsPerLevel;
  addLog("Awans na poziom "+state.level+" · +"+gained+" pkt umiejętności",true);
  for(const quest of worldCatalog.quests){
    if(quest.level>previous&&questComplete(quest))addLog("Quest ukończony · "+quest.name,true);
  }
}