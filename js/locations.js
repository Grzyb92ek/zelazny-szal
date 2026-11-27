const locations = {
  menu: {
    screenId: "gameScreen",
    focusId: "menuTitle",
    exits: { arena: "enterAdventure", town: "enterTown" }
  },
  town: {
    screenId: "town",
    focusId: "townTitle",
    exits: { menu: "townToMenu" }
  },
  arena: {
    screenId: "gameScreen",
    focusId: "gameScreen",
    exits: { menu: "arenaToMenu" }
  }
};

function canChangeLocation() {
  return pending === null && !$("questBoard").open &&
    (state.phase === "main" || (state.phase === "result" && state.exp < xpNeed()));
}

function renderLocationLinks() {
  const canNavigate = canChangeLocation();
  $("claimQuestReward").disabled = !canNavigate;
  syncInventoryAccess();
  renderExtraQuests(worldCatalog.quests.slice(1), false);
  for (const [id, location] of Object.entries(locations)) {
    for (const [destination, buttonId] of Object.entries(location.exits)) {
      $(buttonId).classList.toggle("hidden", id !== state.location || !canNavigate || !activeLocation(destination));
    }
  }
}

function renderLocation() {
  const screenId = locations[state.location]?.screenId;
  const onArena = state.location === "arena";
  for (const id of new Set(Object.values(locations).map(location => location.screenId))) {
    $(id).hidden = id !== screenId;
  }
  $("gameScreen").setAttribute("aria-label", activeLocation(onArena ? "arena" : "menu")?.name);
  $("gameHud").classList.toggle("hidden", screenId !== "gameScreen");
  $("menuPanel").hidden = state.location !== "menu";
  $("arenaPanel").hidden = !onArena;
  $(onArena ? "arenaQuestLog" : "menuQuestLog").appendChild($("questLog"));
  const equipment = $("equipmentPanel");
  const parent = $(state.location==="town"?"town":"gameScreen");
  if (equipment.parentNode!==parent) parent.appendChild(equipment);
  renderLocationLinks();
}

function changeLocation(destination) {
  const from = locations[state.location];
  if (!canChangeLocation() || !activeLocation(destination) || !(from ? Object.hasOwn(from.exits, destination) : destination === "menu")) return;
  const location = locations[destination];
  hideEquipmentTooltip();
  closeInventoryMenu();
  cancelInventoryPress();
  state.location = destination;
  renderLocation();
  window.scrollTo(0, 0);
  $(location.focusId).focus({ preventScroll: true });
}

function initLocations() {
  for (const type of ["menu", "town", "arena"]) {
    const definition = activeLocation(type);
    if (!definition) continue;
    const image = $("locationImage-" + type);
    image.hidden = !definition.image;
    if (definition.image) image.src = "assets/" + definition.image;
    $("locationDescription-" + type).textContent = definition.description;
    if (type !== "arena") $("locationTitle-" + type).textContent = (type === "menu" && definition.icon ? definition.icon + " " : "") + definition.name;
    if (type !== "menu") {
      $("locationLabel-" + type).textContent = definition.name;
      $("locationIcon-" + type).textContent = definition.icon;
    }
  }
  for (const location of Object.values(locations)) {
    for (const [destination, buttonId] of Object.entries(location.exits)) {
      $(buttonId).onclick = () => changeLocation(destination);
    }
  }
  renderLocation();
}
