function questState(quest) {
  return state.questStates[quest.id] ?? "available";
}

function questPosted(quest) {
  return quest.enabled && quest.locationId === activeLocation("town")?.id && questState(quest) === "available";
}

function questComplete(quest) {
  return questState(quest) === "accepted" && state.level >= quest.level;
}

function questReward(quest) {
  return "Nagroda: " + quest.gold + " złota";
}

function questDetails(quest) {
  const requirement = quest.name === "Zdobądź " + quest.level + ". poziom" ? "" : "Osiągnij poziom " + quest.level + ".";
  return [quest.description, requirement].filter(Boolean).join(" ");
}

function questStatus(quest) {
  return questState(quest) === "claimed" ? "Nagroda odebrana" : questComplete(quest) ? "Quest ukończony" : "W trakcie";
}

function acceptQuest(quest) {
  const board = $("questBoard");
  if (!quest || state.location !== "town" || !board.open || !questPosted(quest)) return;
  state.questStates[quest.id] = "accepted";
  board.close();
  renderQuests();
}

function claimQuest(quest) {
  if (!quest || (state.location !== "menu" && state.location !== "arena") || !canChangeLocation() || !questComplete(quest)) return;
  state.questStates[quest.id] = "claimed";
  state.gold += quest.gold;
  render();
}

function renderExtraQuests(quests, board) {
  const container = $(board ? "extraPostedQuests" : "extraLoggedQuests");
  container.replaceChildren();
  for (const quest of quests) {
    if (board ? !questPosted(quest) : questState(quest) === "available") continue;
    const entry = document.createElement("div");
    entry.className = "item";
    function add(tag, text) {
      const element = document.createElement(tag);
      element.textContent = text;
      entry.appendChild(element);
      return element;
    }
    add("strong", quest.name);
    const details = questDetails(quest);
    if (details) add("div", details);
    add("div", questReward(quest));
    if (!board) add("div", questStatus(quest));
    if (board || questComplete(quest)) {
      const button = add("button", board ? "Przyjmij zadanie" : "Odbierz nagrody");
      button.className = "btn";
      button.disabled = !board && !canChangeLocation();
      button.onclick = () => board ? acceptQuest(quest) : claimQuest(quest);
    }
    container.appendChild(entry);
  }
}

function renderQuests() {
  const quests = worldCatalog.quests;
  const [first, ...others] = quests;
  $("postedQuest").hidden = !first || !questPosted(first);
  $("emptyQuestBoard").hidden = quests.some(questPosted);
  $("questEntry").hidden = !first || questState(first) === "available";
  $("emptyQuestLog").hidden = quests.some(quest => questState(quest) !== "available");
  $("claimQuestReward").hidden = !first || !questComplete(first);
  if (first) $("questStatus").textContent = questStatus(first);
  renderExtraQuests(others, true);
  renderExtraQuests(others, false);
}

function initQuests() {
  const first = worldCatalog.quests[0];
  if (first) {
    $("postedQuestTitle").textContent = $("loggedQuestTitle").textContent = first.name;
    $("postedQuestDescription").textContent = $("loggedQuestDescription").textContent = questDetails(first);
    $("postedQuestReward").textContent = $("loggedQuestReward").textContent = questReward(first);
  }
  const board = $("questBoard");
  $("openQuestBoard").onclick = () => {
    if (state.location === "town" && !board.open) board.showModal();
  };
  $("acceptQuest").onclick = () => acceptQuest(first);
  $("claimQuestReward").onclick = () => claimQuest(first);
}
