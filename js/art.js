// Each frame is one cell of the 3-column, 2-row enemy sprite sheet.
const enemySpritePositions = {
  bat: "0 0",
  goblin: "50% 0",
  monkey: "100% 0",
  peasant: "0 100%",
  boar: "50% 100%",
  bull: "100% 100%"
};

function renderEnemySprite(art) {
  const sprite = document.createElement("span");
  sprite.className = "enemy-sprite";
  sprite.setAttribute("aria-hidden", "true");
  sprite.style.backgroundPosition = enemySpritePositions[art];
  const avatar = $("enemyArt");
  avatar.classList.remove("hit");
  avatar.replaceChildren(sprite);
}
