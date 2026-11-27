function selectedSubclass(){
  return skillCatalog.subclasses.find(profile=>profile.id===state.subclassId);
}

function subclassesFor(classId){
  return skillCatalog.subclasses.filter(profile=>profile.classId===classId&&profile.enabled);
}

function chooseSubclass(profile){
  if(state.phase!=="subclass")return;
  const available=subclassesFor(state.classId);
  if(profile?!available.includes(profile):available.length>0)return;
  state.subclassId=profile?.id??null;
  state.skillPoints=skillCatalog.settings.startingPoints;
  recalc();
  state.hp=state.max;
  state.phase="main";
  $("subclassSelect").classList.add("hidden");
  rollShop();enemySetup();render();changeLocation("menu");
}

function showSubclasses(profile){
  const choices=subclassesFor(profile.id);
  if(!choices.length){chooseSubclass(null);return}
  $("subclassIntro").textContent=profile.name+" · wybór na całą rozgrywkę";
  const list=$("subclassChoices");
  list.replaceChildren();
  for(const entry of choices){
    const button=document.createElement("button");
    button.className="upgrade subclass-choice";
    button.type="button";
    if(entry.image){
      const image=document.createElement("img");
      Object.assign(image,{src:"assets/"+entry.image,alt:""});
      button.appendChild(image);
    }
    const name=document.createElement("b");
    name.textContent=entry.name;
    const description=document.createElement("span");
    description.textContent=skillDescription(entry,definedEffectInstances(entry,"subclass").map(({effect})=>effect));
    button.appendChild(name);
    button.appendChild(description);
    button.onclick=()=>chooseSubclass(entry);
    list.appendChild(button);
  }
  $("subclassSelect").classList.remove("hidden");
  list.firstElementChild?.focus();
}
