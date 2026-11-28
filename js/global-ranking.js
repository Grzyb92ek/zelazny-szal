// Public project URL only. Keep the server credentials in Supabase.
const globalRankingProjectUrl = "https://adwcphvqyvemyiluixcg.supabase.co";
const globalRankingOutboxPrefix = "iron-fury.global-score.v1.";
const globalRankingOutbox = new Map();
let globalRankingSending;
let globalRankingView = 0;

async function requestGlobalRanking(method, entry) {
  if (!globalRankingProjectUrl) throw new Error("Ranking endpoint unavailable");
  const response = await fetch(globalRankingProjectUrl + "/functions/v1/global-ranking", {
    method,
    headers: entry ? {"Content-Type": "application/json"} : undefined,
    body: entry ? JSON.stringify(entry) : undefined,
    credentials: "omit",
    signal: AbortSignal.timeout(6000)
  });
  return response;
}

function pendingGlobalScores() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(globalRankingOutboxPrefix)) continue;
      let entry;
      try {
        entry = JSON.parse(localStorage.getItem(key));
      } catch {
        continue;
      }
      if (entry?.run_id && key === globalRankingOutboxPrefix + entry.run_id) {
        globalRankingOutbox.set(entry.run_id, entry);
      }
    }
  } catch {
    // Keep the in-memory queue if storage is disabled.
  }
  return globalRankingOutbox.values().next().value;
}

function queueGlobalScore(entry) {
  if (!globalRankingProjectUrl) return;
  try {
    const result = {
      run_id: crypto.randomUUID(),
      nickname: entry.name,
      character_class: entry.classId??"barbarian",
      ...(entry.subclassId?{character_subclass:entry.subclassId}:{}),
      round: entry.round,
      level: entry.level,
      wins: entry.wins,
      uncommon: entry.uncommon,
      score: entry.score,
      game_version: $("gameVersion").dataset.version,
      ended_at: new Date().toISOString()
    };
    globalRankingOutbox.set(result.run_id, result);
    try {
      localStorage.setItem(globalRankingOutboxPrefix + result.run_id, JSON.stringify(result));
    } catch {
      // Sending can still succeed in this session.
    }
    void flushGlobalScores();
  } catch {
    // The personal result has already been saved.
  }
}

function flushGlobalScores() {
  if (!globalRankingSending) {
    globalRankingSending = sendPendingGlobalScores().finally(() => {globalRankingSending = null});
  }
  return globalRankingSending;
}

async function sendPendingGlobalScores() {
  try {
    let entry;
    while ((entry = pendingGlobalScores())) {
      const response = await requestGlobalRanking("POST", entry);
      if (!response.ok && response.status !== 400) break;
      try {
        localStorage.removeItem(globalRankingOutboxPrefix + entry.run_id);
      } catch {
        // The endpoint deduplicates retries after a response or storage failure.
        globalRankingOutbox.delete(entry.run_id);
        break;
      }
      globalRankingOutbox.delete(entry.run_id);
    }
  } catch {
    // Retry on the next connection, game launch or ranking visit.
  }
}

function selectRankingView(global) {
  const view = ++globalRankingView;
  $("rankingPersonalTab").setAttribute("aria-pressed", String(!global));
  $("rankingGlobalTab").setAttribute("aria-pressed", String(global));
  $("rankingPersonalPanel").hidden = global;
  $("rankingGlobalPanel").hidden = !global;
  if (global) void loadGlobalRanking(view);
}

async function loadGlobalRanking(view) {
  const status = $("globalRankingStatus");
  const body = $("globalRankingRows");
  body.replaceChildren();
  $("globalRankingTable").hidden = true;
  status.textContent = "Wczytywanie rankingu globalnego…";
  try {
    void flushGlobalScores();
    const response = await requestGlobalRanking("GET");
    if (!response.ok) throw new Error("Ranking load failed");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid ranking response");
    if (view !== globalRankingView) return;
    for (const [index, row] of rows.slice(0, 100).entries()) {
      const tr = document.createElement("tr");
      const endedAt = new Date(row.ended_at);
      const date = Number.isNaN(endedAt.getTime()) ? "" : endedAt.toLocaleString("pl-PL");
      for (const value of [index + 1, row.nickname, rankingProfileName(row.character_class,row.character_subclass), row.level, row.round, row.wins, row.score, date, row.game_version]) {
        const td = document.createElement("td");
        td.textContent = String(value);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    $("globalRankingTable").hidden = !rows.length;
    status.textContent = rows.length ? "" : "Brak wyników w rankingu globalnym.";
  } catch {
    if (view === globalRankingView) status.textContent = "Ranking globalny jest niedostępny.";
  }
}

$("rankingPersonalTab").onclick = () => selectRankingView(false);
$("rankingGlobalTab").onclick = () => selectRankingView(true);
window.addEventListener?.("online", flushGlobalScores);
void flushGlobalScores();
