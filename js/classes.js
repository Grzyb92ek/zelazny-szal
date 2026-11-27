const passives=[{id:"berserk",name:"🩸 Berserk",desc:"+20% DMG poniżej 50% własnego HP"},{id:"executioner",name:"💀 Egzekutor",desc:"+25% DMG przeciw wrogom poniżej 25% HP"},{id:"bloodlust",name:"❤️ Żądza krwi",desc:"Trafienie krytyczne przywraca 3 HP"}];
function classById(id) {
  return worldCatalog.classes.find(profile => profile.id === id) ?? worldCatalog.classes[0];
}

function selectedClass() {
  return classById(state.classId);
}

function classBase(profile) {
  return Object.fromEntries(Object.keys(characterStatLabels).map(key=>[key,profile[key]??0]));
}

function classImage(id, image) {
  $(id).style.setProperty?.("--class-image", image ? 'url("assets/' + image + '")' : "");
  $(id).classList.toggle("has-class-image", Boolean(image));
}

function renderClassPicker() {
  const profile = classById($("classChoice").value);
  $("classChoice").value = profile.id;
  $("classPicker").hidden = worldCatalog.classes.length < 2;
  $("classChoiceName").textContent = profile.name;
  $("classDescription").textContent = [profile.description,sourceEffectDescription("class",profile.id)].filter(Boolean).join(" · ");
  $("startGame").textContent = profile.id === "barbarian" && profile.name === "Barbarzyńca" ? "Wybierz barbarzyńcę" : "Wybierz " + profile.name;
  classImage("classChoiceArt", profile.image);
}

function initClasses() {
  $("classChoice").innerHTML = worldCatalog.classes.map(profile => '<option value="' + esc(profile.id) + '">' + esc(profile.name) + '</option>').join("");
  $("classChoice").onchange = renderClassPicker;
  renderClassPicker();
}

function startGame() {
  if (state.phase !== "select") return;
  const profile = classById($("classChoice").value);
  Object.assign(state, classBase(profile), {classId:profile.id, max:profile.hp, gold:profile.gold, phase:"subclass"});
  $("classSelect").classList.add("hidden");
  showSubclasses(profile);
}
