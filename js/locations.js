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
  for (const [id, location] of Object.entries(locations)) {
    for (const buttonId of Object.values(location.exits)) {
      $(buttonId).classList.toggle("hidden", id !== state.location || !canNavigate);
    }
  }
}

function renderLocation() {
  const screenId = locations[state.location]?.screenId;
  const onArena = state.location === "arena";
  for (const id of new Set(Object.values(locations).map(location => location.screenId))) {
    $(id).hidden = id !== screenId;
  }
  $("gameScreen").setAttribute("aria-label", onArena ? "Przygoda" : "Menu główne");
  $("gameHud").classList.toggle("hidden", screenId !== "gameScreen");
  $("menuPanel").hidden = state.location !== "menu";
  $("arenaPanel").hidden = !onArena;
  $(onArena ? "arenaQuestLog" : "menuQuestLog").appendChild($("questLog"));
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
