function activeLocation(type) {
  return worldCatalog.locations.find(location => location.type === type && location.enabled);
}

const enemies = [1, 2, 3].map(category => worldCatalog.enemies.filter(enemy =>
  enemy.category === category && enemy.locationId === activeLocation("arena")?.id
));

function enemyAbilityText(enemy) {
  switch (enemy.skill) {
    case "lifesteal": return "Odzyskuje " + skillAmount(enemy.power) + " HP co " + skillAmount(enemy.interval) + ". trafienie.";
    case "dodge": return skillAmount(enemy.power) + "% szansy na unik.";
    case "extra": return skillAmount(enemy.power) + "% szansy na dodatkowy atak.";
    case "pierce": return "Ignoruje " + skillAmount(enemyArmorPenetration(enemy)) + " punktów pancerza.";
    case "charge": return enemy.power===2?"Pierwszy atak zadaje podwójne obrażenia.":"Obrażenia pierwszego ataku są mnożone przez " + skillAmount(enemy.power) + ".";
    case "thick": return "Gruba skóra zapewnia " + skillAmount(enemy.armor) + " punktów pancerza.";
    default: return "";
  }
}

function enemyArmorPenetration(enemy) {
  return enemy.armorPenetration ?? (enemy.skill === "pierce" ? enemy.power ?? 0 : 0);
}

function scaleEnemy(enemy, round) {
  const offset = round - 1;
  return {
    ...enemy,
    hp: Math.floor(enemy.hp * (1 + offset * .22)),
    damage: Math.ceil(enemy.damage * (1 + offset * .10)),
    gold: enemy.gold + Math.floor(offset * .5),
    ability: enemyAbilityText(enemy)
  };
}

function enemySetup() {
  const pool = enemies[(state.round - 1) % 3];
  state.enemy = pool.length ? scaleEnemy(pool[Math.floor(Math.random() * pool.length)], state.round) : null;
  state.enemyHp = state.enemy?.hp ?? 0;
}
