const locations = {
  menu: {
    screenId: "gameScreen",
    focusId: "menuTitle",
    exits: { map: "openWorldMap" }
  },
  map: {
    screenId: "worldMap",
    focusId: "worldMapTitle",
    exits: { arena: "enterArena", menu: "mapToMenu" }
  },
  arena: {
    screenId: "gameScreen",
    focusId: "gameScreen",
    exits: { menu: "arenaToMenu", map: "arenaToMap" }
  }
};

function canChangeLocation() {
  return pending === null &&
    (state.phase === "main" || (state.phase === "result" && state.exp < xpNeed()));
}

function renderLocationLinks() {
  for (const [id, location] of Object.entries(locations)) {
    for (const buttonId of Object.values(location.exits)) {
      $(buttonId).classList.toggle("hidden", id !== state.location || !canChangeLocation());
    }
  }
}

function renderLocation() {
  const screenId = locations[state.location]?.screenId;
  const onArena = state.location === "arena";
  $("worldMap").hidden = screenId !== "worldMap";
  $("gameScreen").hidden = screenId !== "gameScreen";
  $("gameScreen").setAttribute("aria-label", onArena ? "Arena" : "Menu główne");
  $("gameHud").classList.toggle("hidden", screenId !== "gameScreen");
  $("menuPanel").hidden = state.location !== "menu";
  $("arenaPanel").hidden = !onArena;
  $("consumables").disabled = !onArena || state.phase !== "main";
  renderLocationLinks();
}

function changeLocation(destination) {
  const from = locations[state.location];
  if (!canChangeLocation() || !(from ? Object.hasOwn(from.exits, destination) : destination === "menu")) return;
  const location = locations[destination];
  hideEquipmentTooltip();
  state.location = destination;
  renderLocation();
  window.scrollTo(0, 0);
  $(location.focusId).focus({ preventScroll: true });
}

function initLocations() {
  for (const location of Object.values(locations)) {
    for (const [destination, buttonId] of Object.entries(location.exits)) {
      $(buttonId).onclick = () => changeLocation(destination);
    }
  }
  renderLocation();
}
