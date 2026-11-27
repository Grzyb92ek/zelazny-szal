const levelQuest = { title: "Zdobądź 3. poziom", level: 3, gold: 10 };

function renderQuests() {
  const available = state.levelQuest === "available";
  const complete = state.levelQuest === "accepted" && state.level >= levelQuest.level;
  $("postedQuest").hidden = !available;
  $("emptyQuestBoard").hidden = available;
  $("questEntry").hidden = available;
  $("emptyQuestLog").hidden = !available;
  $("claimQuestReward").hidden = !complete;
  $("questStatus").textContent = state.levelQuest === "claimed" ? "Nagroda odebrana" :
    complete ? "Quest ukończony" : "W trakcie";
  $("questCompletionNotice").hidden = !(complete && state.phase === "level" && state.level === levelQuest.level);
}

function initQuests() {
  $("postedQuestTitle").textContent = $("loggedQuestTitle").textContent = levelQuest.title;
  $("postedQuestReward").textContent = $("loggedQuestReward").textContent = "Nagroda: " + levelQuest.gold + " złota";
  const board = $("questBoard");
  $("openQuestBoard").onclick = () => {
    if (state.location === "town" && !board.open) board.showModal();
  };
  $("acceptQuest").onclick = () => {
    if (state.location !== "town" || !board.open || state.levelQuest !== "available") return;
    state.levelQuest = "accepted";
    board.close();
    renderQuests();
  };
  $("claimQuestReward").onclick = () => {
    if (state.location !== "menu" && state.location !== "arena") return;
    if (!canChangeLocation() || state.levelQuest !== "accepted" || state.level < levelQuest.level) return;
    state.levelQuest = "claimed";
    state.gold += levelQuest.gold;
    render();
  };
}
