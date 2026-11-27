const locations = {
  camp: {
    screenId: "camp",
    focusId: "campTitle",
    name: "Obóz podróżnika",
    description: "Ognisko daje chwilę wytchnienia. Stąd możesz wyruszyć na arenę i zmierzyć się z kolejnym przeciwnikiem.",
    exits: { arena: "enterArena" }
  },
  arena: {
    screenId: "arena",
    focusId: "arena",
    exits: { camp: "returnToCamp" }
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
  for (const [id, location] of Object.entries(locations)) {
    $(location.screenId).hidden = id !== state.location;
  }
  $("arenaHud").classList.toggle("hidden", state.location !== "arena");
  renderLocationLinks();
}

function changeLocation(destination) {
  const from = locations[state.location];
  if (!canChangeLocation() || !(from ? Object.hasOwn(from.exits, destination) : destination === "camp")) return;
  const location = locations[destination];
  hideEquipmentTooltip();
  state.location = destination;
  renderLocation();
  window.scrollTo(0, 0);
  $(location.focusId).focus({ preventScroll: true });
}

function initLocations() {
  $("campTitle").textContent = locations.camp.name;
  $("campDescription").textContent = locations.camp.description;
  for (const location of Object.values(locations)) {
    for (const [destination, buttonId] of Object.entries(location.exits)) {
      $(buttonId).onclick = () => changeLocation(destination);
    }
  }
  renderLocation();
}
