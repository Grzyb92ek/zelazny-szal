// Katalog świata współdzielony przez grę i Game Designer Studio.
const worldCatalog = {
  "enemies": [
    {
      "id": "bat",
      "name": "Nietoperz",
      "icon": "🦇",
      "art": "bat",
      "image": "",
      "category": 1,
      "hp": 30,
      "damage": 5,
      "armor": 0,
      "gold": 5,
      "xpBonus": 0,
      "skill": "lifesteal",
      "power": 10,
      "interval": 4,
      "locationId": "arena"
    },
    {
      "id": "goblin",
      "name": "Henio",
      "icon": "👺",
      "art": "goblin",
      "image": "",
      "category": 1,
      "hp": 30,
      "damage": 5,
      "armor": 0,
      "gold": 5,
      "xpBonus": 0,
      "skill": "dodge",
      "power": 10,
      "locationId": "arena"
    },
    {
      "id": "monkey",
      "name": "Małpa",
      "icon": "🐒",
      "art": "monkey",
      "image": "",
      "category": 2,
      "hp": 45,
      "damage": 7,
      "armor": 0,
      "gold": 7,
      "xpBonus": 0,
      "skill": "extra",
      "power": 15,
      "locationId": "arena"
    },
    {
      "id": "peasant",
      "name": "Wieśniak",
      "icon": "👨‍🌾",
      "art": "peasant",
      "image": "",
      "category": 2,
      "hp": 45,
      "damage": 7,
      "armor": 0,
      "gold": 7,
      "xpBonus": 0,
      "skill": "pierce",
      "armorPenetration": 2,
      "locationId": "arena"
    },
    {
      "id": "boar",
      "name": "Dzik",
      "icon": "🐗",
      "art": "boar",
      "image": "",
      "category": 3,
      "hp": 60,
      "damage": 9,
      "armor": 0,
      "gold": 10,
      "xpBonus": 0,
      "skill": "charge",
      "power": 2,
      "locationId": "arena"
    },
    {
      "id": "bull",
      "name": "BYK",
      "icon": "🐂",
      "art": "bull",
      "image": "",
      "category": 3,
      "hp": 60,
      "damage": 9,
      "armor": 3,
      "gold": 10,
      "xpBonus": 0,
      "skill": "thick",
      "locationId": "arena"
    }
  ],
  "classes": [
    {
      "id": "barbarian",
      "name": "Barbarzyńca",
      "description": "Mocny wojownik walczący wręcz. Wysokie obrażenia i prosty styl gry.",
      "image": "",
      "hp": 120,
      "armor": 0,
      "dmg": 10,
      "speed": 1,
      "crit": 5,
      "critD": 150,
      "regen": 6,
      "goldBonus": 0,
      "gold": 20,
      "passives": [
        "executioner",
        "bloodlust",
        "berserk"
      ]
    }
  ],
  "quests": [
    {
      "id": "reach-level-three",
      "name": "Zdobądź 3. poziom",
      "description": "",
      "level": 3,
      "gold": 10,
      "enabled": true,
      "locationId": "town"
    }
  ],
  "locations": [
    {
      "id": "menu",
      "name": "Menu główne",
      "description": "",
      "icon": "",
      "image": "",
      "type": "menu",
      "enabled": true
    },
    {
      "id": "town",
      "name": "Miasto",
      "description": "",
      "icon": "🏘️",
      "image": "",
      "type": "town",
      "enabled": true
    },
    {
      "id": "arena",
      "name": "Przygoda",
      "description": "",
      "icon": "⚔️",
      "image": "",
      "type": "arena",
      "enabled": true
    }
  ]
};
