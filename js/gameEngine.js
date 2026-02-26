export class GameEngine {
  constructor(data) {
    this.meta = data.meta;
    this.classes = data.classes;
    this.skills = data.skills;
    this.items = data.items;
    this.enemies = data.enemies;
    this.chapters = data.chapters;
    this.scenes = data.scenes;
    this.state = this.createBaseState();
  }

  static async create(configUrl, chapterUrls) {
    const [configResponse, ...chapterResponses] = await Promise.all([
      fetch(configUrl),
      ...chapterUrls.map(url => fetch(url))
    ]);

    if (!configResponse.ok) {
      throw new Error("Falha ao carregar config.json");
    }

    const failedChapter = chapterResponses.find(response => !response.ok);
    if (failedChapter) {
      throw new Error("Falha ao carregar arquivos de capítulo");
    }

    const config = await configResponse.json();
    const chapterData = await Promise.all(chapterResponses.map(r => r.json()));

    const merged = {
      ...config,
      chapters: chapterData.map(ch => ch.chapter),
      scenes: chapterData.reduce((acc, ch) => ({ ...acc, ...ch.scenes }), {})
    };

    return new GameEngine(merged);
  }

  createBaseState() {
    return {
      classId: null,
      className: null,
      currentScene: "intro",
      checkpointScene: "intro",
      hp: 10,
      maxHp: 10,
      gold: 0,
      strength: 1,
      agility: 1,
      intellect: 1,
      level: 1,
      xp: 0,
      inventory: {},
      equipment: {
        weaponId: null,
        armorId: null
      },
      flags: {},
      visitedScenes: {},
      shopPurchases: {},
      worldTier: 1,
      totalRuns: 0,
      mode: "scene",
      combat: null,
      log: ["Você está prestes a começar sua aventura."]
    };
  }

  startNew(classId) {
    const clazz = this.classes[classId];
    if (!clazz) {
      throw new Error("Classe inválida");
    }

    const base = clazz.baseStats;
    this.state = {
      ...this.createBaseState(),
      classId,
      className: clazz.name,
      currentScene: "intro",
      checkpointScene: "intro",
      hp: base.maxHp,
      maxHp: base.maxHp,
      gold: base.gold,
      strength: base.strength,
      agility: base.agility,
      intellect: base.intellect,
      inventory: { ...(clazz.startingItems || {}) },
      log: [`Você iniciou como ${clazz.name}.`]
    };

    this.ensureSceneEntered("intro");
  }

  resetAll() {
    const classId = this.state.classId || "warrior";
    this.startNew(classId);
    this.addLog("Reinício total executado.");
  }

  exportState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  importState(rawState) {
    const base = this.createBaseState();

    this.state = {
      ...base,
      ...rawState,
      inventory: { ...base.inventory, ...(rawState?.inventory || {}) },
      equipment: { ...base.equipment, ...(rawState?.equipment || {}) },
      flags: { ...base.flags, ...(rawState?.flags || {}) },
      visitedScenes: { ...base.visitedScenes, ...(rawState?.visitedScenes || {}) },
      shopPurchases: { ...base.shopPurchases, ...(rawState?.shopPurchases || {}) },
      log: Array.isArray(rawState?.log) && rawState.log.length ? rawState.log : [...base.log]
    };

    if (!this.state.classId || !this.classes[this.state.classId]) {
      this.state.classId = "warrior";
      this.state.className = this.classes.warrior.name;
    } else {
      this.state.className = this.classes[this.state.classId].name;
    }

    if (!this.scenes[this.state.currentScene]) {
      this.state.currentScene = "intro";
    }

    if (!this.scenes[this.state.checkpointScene]) {
      this.state.checkpointScene = "intro";
    }

    this.state.hp = Math.max(0, Math.min(this.state.hp, this.state.maxHp));
    this.state.gold = Math.max(0, this.state.gold);
    this.state.level = Math.max(1, this.state.level);
    this.state.worldTier = Math.max(1, this.state.worldTier);

    this.ensureSceneEntered(this.state.currentScene);
  }

  getCurrentClass() {
    return this.classes[this.state.classId] || null;
  }

  getClassSkills() {
    const clazz = this.getCurrentClass();
    return clazz?.skills || [];
  }

  getScene(sceneId = this.state.currentScene) {
    return this.scenes[sceneId] || null;
  }

  getCurrentScene() {
    return this.getScene();
  }

  getCurrentChapter() {
    const scene = this.getCurrentScene();
    if (!scene?.chapter) return null;
    return this.chapters.find(ch => ch.id === scene.chapter) || null;
  }

  getChapterIndex(chapterId) {
    const idx = this.chapters.findIndex(ch => ch.id === chapterId);
    return idx >= 0 ? idx + 1 : 1;
  }

  getItem(itemId) {
    return this.items[itemId] || null;
  }

  getSkill(skillId) {
    return this.skills[skillId] || null;
  }

  getItemName(itemId) {
    return this.getItem(itemId)?.name || itemId;
  }

  getEquippedWeapon() {
    return this.state.equipment.weaponId ? this.getItem(this.state.equipment.weaponId) : null;
  }

  getEquippedArmor() {
    return this.state.equipment.armorId ? this.getItem(this.state.equipment.armorId) : null;
  }

  getAttackBonus() {
    return this.getEquippedWeapon()?.attackBonus || 0;
  }

  getDefenseBonus() {
    return this.getEquippedArmor()?.defenseBonus || 0;
  }

  xpToNextLevel(level = this.state.level) {
    return 10 + (level - 1) * 8;
  }

  getCritChance(extra = 0) {
    const base = 0.08 + this.state.agility * 0.03 + extra;
    return Math.min(0.45, base);
  }

  getDodgeChance(extra = 0) {
    const base = 0.04 + this.state.agility * 0.025 + extra;
    return Math.min(0.4, base);
  }

  ensureSceneEntered(sceneId) {
    const scene = this.getScene(sceneId);
    if (!scene) return;

    if (scene.checkpoint) {
      this.state.checkpointScene = sceneId;
    }

    if (!this.state.visitedScenes[sceneId]) {
      this.state.visitedScenes[sceneId] = true;

      if (scene.onEnter?.effects) {
        this.applyEffects(scene.onEnter.effects);
      }

      if (scene.onEnter?.text) {
        this.addLog(scene.onEnter.text);
      }
    }
  }

  goToScene(sceneId) {
    if (!this.scenes[sceneId]) {
      this.addLog("Cena inválida.");
      return;
    }

    this.state.currentScene = sceneId;
    this.state.mode = "scene";
    this.state.combat = null;
    this.ensureSceneEntered(sceneId);
  }

  canUseChoice(choice) {
    const req = choice.requires;
    if (!req) return true;

    if (typeof req.minGold === "number" && this.state.gold < req.minGold) {
      return false;
    }

    if (typeof req.minLevel === "number" && this.state.level < req.minLevel) {
      return false;
    }

    if (req.item && !this.hasItem(req.item, req.itemQty || 1)) {
      return false;
    }

    if (req.flag && !this.state.flags[req.flag]) {
      return false;
    }

    if (req.flagFalse && this.state.flags[req.flagFalse]) {
      return false;
    }

    return true;
  }

  getChoiceLockReason(choice) {
    const req = choice.requires;
    if (!req) return "";

    if (typeof req.minGold === "number" && this.state.gold < req.minGold) {
      return `Requer ${req.minGold} de ouro.`;
    }

    if (typeof req.minLevel === "number" && this.state.level < req.minLevel) {
      return `Requer nível ${req.minLevel}.`;
    }

    if (req.item && !this.hasItem(req.item, req.itemQty || 1)) {
      return `Requer item: ${this.getItemName(req.item)}.`;
    }

    if (req.flag && !this.state.flags[req.flag]) {
      return "Ainda não foi liberado.";
    }

    if (req.flagFalse && this.state.flags[req.flagFalse]) {
      return "Esta ação não está mais disponível.";
    }

    return "Condição não atendida.";
  }

  chooseChoice(index) {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const choice = scene.choices?.[index];
    if (!choice || !this.canUseChoice(choice)) {
      return;
    }

    if (choice.resultText) {
      this.addLog(choice.resultText);
    }

    if (choice.effects) {
      this.applyEffects(choice.effects);
    }

    if (this.state.hp <= 0) {
      this.handleDeath();
      return;
    }

    if (choice.advanceCycle) {
      this.advanceCycle();
      return;
    }

    if (choice.restartRun) {
      this.restartRun();
      return;
    }

    if (choice.combat) {
      this.startCombat(choice.combat);
      return;
    }

    if (choice.next) {
      this.goToScene(choice.next);
    }
  }

  startCombat(combatConfig) {
    const enemyTemplate = this.enemies?.[combatConfig.enemyId];
    if (!enemyTemplate) {
      this.addLog("Inimigo inválido.");
      return;
    }

    const chapterIndex = this.getChapterIndex(this.getCurrentScene()?.chapter);
    const hpScale = 1 + (this.state.worldTier - 1) * 0.2 + (chapterIndex - 1) * 0.12;
    const atkScale = 1 + (this.state.worldTier - 1) * 0.14 + (chapterIndex - 1) * 0.08;

    const skillCooldowns = {};
    this.getClassSkills().forEach(skillId => {
      skillCooldowns[skillId] = 0;
    });

    this.state.mode = "combat";
    this.state.combat = {
      enemyId: combatConfig.enemyId,
      name: enemyTemplate.name,
      enemyHp: Math.max(1, Math.round(enemyTemplate.hp * hpScale)),
      enemyMaxHp: Math.max(1, Math.round(enemyTemplate.hp * hpScale)),
      attackMin: Math.max(1, Math.round(enemyTemplate.attackMin * atkScale)),
      attackMax: Math.max(1, Math.round(enemyTemplate.attackMax * atkScale)),
      reward: enemyTemplate.reward || null,
      rewardText: enemyTemplate.rewardText || "",
      victoryNext: combatConfig.victoryNext || "intro",
      allowFlee: enemyTemplate.allowFlee !== false,
      skillCooldowns,
      buffs: {
        shield: false,
        evasionBoost: false,
        ward: false
      }
    };

    this.addLog(`Um ${enemyTemplate.name} surge no seu caminho. (Tier ${this.state.worldTier})`);
  }

  getCombat() {
    return this.state.combat;
  }

  tickCooldowns() {
    const combat = this.state.combat;
    if (!combat) return;

    Object.keys(combat.skillCooldowns).forEach(skillId => {
      combat.skillCooldowns[skillId] = Math.max(0, combat.skillCooldowns[skillId] - 1);
    });
  }

  setSkillCooldown(skillId) {
    const combat = this.state.combat;
    const skill = this.getSkill(skillId);
    if (!combat || !skill) return;
    combat.skillCooldowns[skillId] = skill.cooldown;
  }

  canUseSkill(skillId) {
    const combat = this.state.combat;
    if (!combat) return false;
    if (!(skillId in combat.skillCooldowns)) return false;
    return combat.skillCooldowns[skillId] <= 0;
  }

  performCombatAction(action) {
    if (this.state.mode !== "combat" || !this.state.combat) return;

    switch (action) {
      case "attack":
        this.playerAttack();
        break;
      case "defend":
        this.playerDefend();
        break;
      case "potion":
        this.useInventoryItem("pocao", true);
        break;
      case "potion_big":
        this.useInventoryItem("pocao_maior", true);
        break;
      case "herb":
        this.useInventoryItem("erva", true);
        break;
      case "flee":
        this.tryFlee();
        break;
      default:
        if (action.startsWith("skill:")) {
          const skillId = action.split(":")[1];
          this.useSkill(skillId);
        }
        break;
    }
  }

  calculateBaseAttack() {
    return this.state.strength + (this.state.level - 1) + this.getAttackBonus();
  }

  playerAttack() {
    const combat = this.state.combat;
    if (!combat) return;

    const base = this.calculateBaseAttack();
    let damage = this.randomInt(base, base + 2);
    const crit = Math.random() < this.getCritChance();

    if (crit) {
      damage = Math.round(damage * 1.5);
      this.addLog("Acerto crítico! O universo aprovou sua violência.");
    }

    this.applyDamageToEnemy(damage);
  }

  playerDefend() {
    this.addLog("Você assume postura defensiva.");
    this.enemyTurn(true);
  }

  useSkill(skillId) {
    const combat = this.state.combat;
    const skill = this.getSkill(skillId);
    if (!combat || !skill || !this.canUseSkill(skillId)) return;

    if (skill.type === "attack") {
      const base = this.calculateBaseAttack();
      let damage = Math.max(1, Math.round(this.randomInt(base, base + 2) * skill.multiplier));
      const crit = Math.random() < this.getCritChance(skill.critBonus || 0);

      if (crit) {
        damage = Math.round(damage * 1.5);
        this.addLog(`${skill.name}: crítico! Isso deixou uma impressão emocional no alvo.`);
      } else {
        this.addLog(`${skill.name} atingiu o inimigo.`);
      }

      this.setSkillCooldown(skillId);
      this.applyDamageToEnemy(damage);
      return;
    }

    if (skill.type === "spell") {
      const spellBase = this.state.intellect + this.state.level + 1;
      const damage = Math.max(1, Math.round(this.randomInt(spellBase, spellBase + 2) * skill.multiplier));
      this.addLog(`${skill.name} atravessa o ar com um brilho decididamente caro.`);
      this.setSkillCooldown(skillId);
      this.applyDamageToEnemy(damage);
      return;
    }

    if (skill.type === "buff") {
      if (skill.effect === "shield") {
        combat.buffs.shield = true;
        this.addLog(`${skill.name} prepara sua defesa para o próximo impacto.`);
      }

      if (skill.effect === "evasion") {
        combat.buffs.evasionBoost = true;
        this.addLog(`${skill.name} torna seu próximo movimento muito mais escorregadio.`);
      }

      if (skill.effect === "ward") {
        combat.buffs.ward = true;
        this.state.hp = Math.min(this.state.maxHp, this.state.hp + 1);
        this.addLog(`${skill.name} envolve você com energia e recupera 1 HP.`);
      }

      this.setSkillCooldown(skillId);
      this.enemyTurn(false);
    }
  }

  applyDamageToEnemy(damage) {
    const combat = this.state.combat;
    if (!combat) return;

    combat.enemyHp = Math.max(0, combat.enemyHp - damage);
    this.addLog(`Você causou ${damage} de dano em ${combat.name}.`);

    if (combat.enemyHp <= 0) {
      this.finishCombat(true);
      return;
    }

    this.enemyTurn(false);
  }

  tryFlee() {
    const combat = this.state.combat;
    if (!combat) return;

    if (!combat.allowFlee) {
      this.addLog("Não há espaço para fugir. O chefão infelizmente leu o contrato.");
      return;
    }

    const chance = 0.45 + (this.state.agility * 0.04);
    const success = Math.random() < Math.min(0.85, chance);

    if (success) {
      this.addLog("Você conseguiu fugir.");
      this.goToScene(this.state.checkpointScene || "intro");
      return;
    }

    this.addLog("Você falhou ao fugir.");
    this.enemyTurn(false);
  }

  enemyTurn(defending) {
    const combat = this.state.combat;
    if (!combat) return;

    this.tickCooldowns();

    let dodgeBonus = 0;
    if (combat.buffs.evasionBoost) {
      dodgeBonus += 0.25;
    }

    if (Math.random() < this.getDodgeChance(dodgeBonus)) {
      this.addLog("Você esquivou do ataque inimigo.");
      combat.buffs.evasionBoost = false;
      combat.buffs.shield = false;
      combat.buffs.ward = false;
      return;
    }

    let damage = this.randomInt(combat.attackMin, combat.attackMax);
    damage -= this.getDefenseBonus();

    if (defending) {
      damage -= 2;
    }

    if (combat.buffs.shield) {
      damage -= 3;
    }

    if (combat.buffs.ward) {
      damage = Math.floor(damage / 2);
    }

    damage = Math.max(0, damage);
    this.state.hp = Math.max(0, this.state.hp - damage);
    this.addLog(`${combat.name} causou ${damage} de dano.`);

    combat.buffs.evasionBoost = false;
    combat.buffs.shield = false;
    combat.buffs.ward = false;

    if (this.state.hp <= 0) {
      this.handleDeath();
    }
  }

  finishCombat(victory) {
    const combat = this.state.combat;
    if (!combat) return;

    if (victory) {
      this.addLog(`Você derrotou ${combat.name}.`);

      if (combat.reward) {
        const scaledReward = { ...combat.reward };

        if (typeof scaledReward.gold === "number") {
          scaledReward.gold = Math.round(scaledReward.gold * (1 + (this.state.worldTier - 1) * 0.1));
        }

        if (typeof scaledReward.xp === "number") {
          scaledReward.xp = Math.round(scaledReward.xp * (1 + (this.state.worldTier - 1) * 0.08));
        }

        this.applyEffects(scaledReward);
      }

      if (combat.rewardText) {
        this.addLog(combat.rewardText);
      }

      this.goToScene(combat.victoryNext);
      return;
    }

    this.handleDeath();
  }

  handleDeath() {
    this.state.mode = "scene";
    this.state.combat = null;

    if (this.hasItem("amuleto_salvaguarda")) {
      this.removeItem("amuleto_salvaguarda", 1);
      this.addLog("O Amuleto da Salvaguarda foi consumido. Ouro e inventário foram preservados.");
    } else {
      this.state.gold = 0;

      for (const itemId of Object.keys(this.state.inventory)) {
        const item = this.getItem(itemId);
        const isEquipped = this.isItemEquipped(itemId);

        if (!item) continue;
        if (item.type === "key") continue;
        if (isEquipped) continue;

        delete this.state.inventory[itemId];
      }

      this.addLog("Você caiu. Sem amuleto, perdeu ouro e itens não equipados." );
    }

    this.state.hp = this.state.maxHp;
    const respawnScene = this.state.checkpointScene || "intro";
    this.state.currentScene = respawnScene;
    this.ensureSceneEntered(respawnScene);
    this.addLog("Você retornou ao último checkpoint.");
  }

  applyEffects(effects) {
    if (!effects) return;

    if (typeof effects.maxHp === "number") {
      this.state.maxHp = Math.max(1, this.state.maxHp + effects.maxHp);
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + Math.max(0, effects.maxHp));
    }

    if (typeof effects.hp === "number") {
      this.state.hp = Math.max(0, Math.min(this.state.maxHp, this.state.hp + effects.hp));
    }

    if (typeof effects.gold === "number") {
      this.state.gold = Math.max(0, this.state.gold + effects.gold);
    }

    if (typeof effects.strength === "number") {
      this.state.strength = Math.max(1, this.state.strength + effects.strength);
    }

    if (typeof effects.agility === "number") {
      this.state.agility = Math.max(1, this.state.agility + effects.agility);
    }

    if (typeof effects.intellect === "number") {
      this.state.intellect = Math.max(1, this.state.intellect + effects.intellect);
    }

    if (typeof effects.xp === "number") {
      this.gainXp(effects.xp);
    }

    if (effects.addItem) {
      for (const [itemId, qty] of Object.entries(effects.addItem)) {
        this.addItem(itemId, qty);
      }
    }

    if (effects.removeItem) {
      for (const [itemId, qty] of Object.entries(effects.removeItem)) {
        this.removeItem(itemId, qty);
      }
    }

    if (effects.setFlag) {
      for (const [flag, value] of Object.entries(effects.setFlag)) {
        this.state.flags[flag] = value;
      }
    }
  }

  gainXp(amount) {
    this.state.xp += amount;
    this.addLog(`Você ganhou ${amount} XP.`);

    while (this.state.xp >= this.xpToNextLevel()) {
      const needed = this.xpToNextLevel();
      this.state.xp -= needed;
      this.state.level += 1;
      this.state.strength += 1;
      this.state.maxHp += 2;
      this.state.hp = this.state.maxHp;
      this.addLog(`Você subiu para o nível ${this.state.level}! +1 Força, +2 HP máximo.`);
    }
  }

  addItem(itemId, qty = 1) {
    this.state.inventory[itemId] = (this.state.inventory[itemId] || 0) + qty;
  }

  removeItem(itemId, qty = 1) {
    const current = this.state.inventory[itemId] || 0;
    const next = Math.max(0, current - qty);

    if (next <= 0) {
      delete this.state.inventory[itemId];
      if (this.state.equipment.weaponId === itemId) this.state.equipment.weaponId = null;
      if (this.state.equipment.armorId === itemId) this.state.equipment.armorId = null;
      return;
    }

    this.state.inventory[itemId] = next;
  }

  hasItem(itemId, qty = 1) {
    return (this.state.inventory[itemId] || 0) >= qty;
  }

  isItemEquipped(itemId) {
    return this.state.equipment.weaponId === itemId || this.state.equipment.armorId === itemId;
  }

  equipItem(itemId) {
    const item = this.getItem(itemId);
    if (!item || !this.hasItem(itemId)) return;

    if (item.type === "weapon") {
      this.state.equipment.weaponId = itemId;
      this.addLog(`${item.name} equipada.`);
      return;
    }

    if (item.type === "armor") {
      this.state.equipment.armorId = itemId;
      this.addLog(`${item.name} equipada.`);
    }
  }

  canUseInventoryItemOutsideCombat(itemId) {
    const item = this.getItem(itemId);
    if (!item) return false;
    if (!this.hasItem(itemId)) return false;
    return !!item.usableOutsideCombat && this.state.mode !== "combat";
  }

  useInventoryItem(itemId, fromCombat = false) {
    const item = this.getItem(itemId);
    if (!item || !this.hasItem(itemId)) return;

    if (item.type === "weapon" || item.type === "armor") {
      this.equipItem(itemId);
      return;
    }

    const allowed = fromCombat ? item.usableInCombat : item.usableOutsideCombat;
    if (!allowed) return;

    if (item.useEffects) {
      this.applyEffects(item.useEffects);
    }

    if (item.consumedOnUse !== false) {
      this.removeItem(itemId, 1);
    }

    this.addLog(`Você usou ${item.name}.`);

    if (fromCombat && this.state.combat?.enemyHp > 0) {
      this.enemyTurn(false);
    }
  }

  getShopItemsForCurrentScene() {
    const scene = this.getCurrentScene();
    if (!scene?.shop?.items) return [];

    return scene.shop.items
      .map(itemId => ({ id: itemId, ...this.getItem(itemId) }))
      .filter(item => !!item.id);
  }

  canBuyItem(itemId) {
    const item = this.getItem(itemId);
    if (!item || !item.shop) return false;

    if (typeof item.price === "number" && this.state.gold < item.price) {
      return false;
    }

    if (typeof item.minLevel === "number" && this.state.level < item.minLevel) {
      return false;
    }

    if ((item.type === "weapon" || item.type === "armor") && this.hasItem(itemId)) {
      return false;
    }

    const purchases = this.state.shopPurchases[itemId] || 0;
    if (typeof item.maxPurchases === "number" && purchases >= item.maxPurchases) {
      return false;
    }

    return true;
  }

  getBuyLockReason(itemId) {
    const item = this.getItem(itemId);
    if (!item) return "Item inválido.";

    if (typeof item.price === "number" && this.state.gold < item.price) {
      return `Custa ${item.price} ouro.`;
    }

    if (typeof item.minLevel === "number" && this.state.level < item.minLevel) {
      return `Requer nível ${item.minLevel}.`;
    }

    if ((item.type === "weapon" || item.type === "armor") && this.hasItem(itemId)) {
      return "Você já possui este equipamento.";
    }

    const purchases = this.state.shopPurchases[itemId] || 0;
    if (typeof item.maxPurchases === "number" && purchases >= item.maxPurchases) {
      return "Limite de compra atingido.";
    }

    return "";
  }

  buyItem(itemId) {
    if (!this.canBuyItem(itemId)) return;

    const item = this.getItem(itemId);
    this.state.gold -= item.price;
    this.addItem(itemId, 1);
    this.state.shopPurchases[itemId] = (this.state.shopPurchases[itemId] || 0) + 1;
    this.addLog(`Você comprou ${item.name}.`);

    if ((item.type === "weapon" || item.type === "armor") && !this.isItemEquipped(itemId)) {
      this.equipItem(itemId);
    }
  }

  canSellItem(itemId) {
    const item = this.getItem(itemId);
    if (!item || !this.hasItem(itemId)) return false;
    if (!item.sellable) return false;
    if (item.type === "key") return false;
    if (this.isItemEquipped(itemId) && (this.state.inventory[itemId] || 0) <= 1) return false;
    return true;
  }

  getSellValue(itemId) {
    const item = this.getItem(itemId);
    if (!item?.price) return 0;
    return Math.max(1, Math.floor(item.price * 0.5));
  }

  sellItem(itemId) {
    if (!this.canSellItem(itemId)) return;
    const item = this.getItem(itemId);
    const value = this.getSellValue(itemId);
    this.removeItem(itemId, 1);
    this.state.gold += value;
    this.addLog(`Você vendeu ${item.name} por ${value} ouro.`);
  }

  restartRun() {
    const old = this.state;

    this.state = {
      ...this.createBaseState(),
      classId: old.classId,
      className: old.className,
      hp: old.maxHp,
      maxHp: old.maxHp,
      gold: old.gold,
      strength: old.strength,
      agility: old.agility,
      intellect: old.intellect,
      level: old.level,
      xp: old.xp,
      inventory: { ...old.inventory },
      equipment: { ...old.equipment },
      shopPurchases: { ...old.shopPurchases },
      worldTier: old.worldTier,
      totalRuns: old.totalRuns,
      log: []
    };

    this.ensureSceneEntered("intro");
    this.addLog("Nova tentativa iniciada mantendo seu progresso.");
  }

  advanceCycle() {
    const old = this.state;

    this.state = {
      ...this.createBaseState(),
      classId: old.classId,
      className: old.className,
      hp: old.maxHp,
      maxHp: old.maxHp,
      gold: old.gold,
      strength: old.strength,
      agility: old.agility,
      intellect: old.intellect,
      level: old.level,
      xp: old.xp,
      inventory: { ...old.inventory },
      equipment: { ...old.equipment },
      shopPurchases: { ...old.shopPurchases },
      worldTier: old.worldTier + 1,
      totalRuns: old.totalRuns + 1,
      log: []
    };

    this.ensureSceneEntered("intro");
    this.addLog(`Novo ciclo iniciado. World Tier ${this.state.worldTier}: os inimigos ficaram mais fortes.`);
  }

  addLog(message) {
    this.state.log.unshift(message);
    this.state.log = this.state.log.slice(0, 18);
  }

  randomInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }
}
