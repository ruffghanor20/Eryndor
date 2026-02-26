export class UI {
  constructor(engine, elements) {
    this.engine = engine;
    this.elements = elements;

    this.imageMap = { 
      scenes: {
        mercado: "./assets/images/scenes/mercado.png",
        floresta: "./assets/images/scenes/floresta.png",
        "floresta-dia": "./assets/images/scenes/floresta-dia.png",
        caverna: "./assets/images/scenes/caverna.png",
        torre: "./assets/images/scenes/torre.png",
        "torre-interna": "./assets/images/scenes/torre-interna.png"
      },
      enemies: {
        goblin: "./assets/images/enemies/goblin.png",
        "espreitador-abissal": "./assets/images/enemies/espreitador-abissal.png",
        "rei-do-eclipse": "./assets/images/enemies/rei-do-eclipse.png"
      }
  };
  
  this.preloadImages();
}

preloadImages() {;
  const allImages = [
    ...Object.values(this.imageMap.scenes),
    ...Object.values(this.imageMap.enemies)
  ];

  allImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

  showMenu(hasSave) {
    this.elements.menuScreen?.classList.remove("hidden");
    this.elements.gameScreen?.classList.add("hidden");

    if (this.elements.continueBtn) {
      this.elements.continueBtn.disabled = !hasSave;
    }

    this.elements.classPicker?.classList.add("hidden");
    this.renderClassOptions();
    this.syncDisplayedPlayerName();
    this.syncCombatPanel(false);
    this.setSceneVisual("");
  }

  showGame() {
    this.elements.menuScreen?.classList.add("hidden");
    this.elements.gameScreen?.classList.remove("hidden");
    this.syncDisplayedPlayerName();
  }

  toggleClassPicker() {
    this.elements.classPicker?.classList.toggle("hidden");
  }

  renderClassOptions() {
    if (!this.elements.classOptions) return;

    this.elements.classOptions.innerHTML = "";
    const chosenName = this.getPlayerChosenName({ allowEmpty: true });

    Object.entries(this.engine.classes).forEach(([classId, clazz]) => {
      const card = document.createElement("div");
      card.className = "class-card";

      card.innerHTML = `
        <div class="class-header">
          <div>
            <strong>${this.escapeHtml(clazz.name)}</strong>
            <div class="small">${this.escapeHtml(clazz.description || "")}</div>
          </div>
          <div class="small">
            HP ${clazz.baseStats.maxHp} |
            FOR ${clazz.baseStats.strength} |
            AGI ${clazz.baseStats.agility} |
            INT ${clazz.baseStats.intellect}
          </div>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const btn = document.createElement("button");
      btn.className = "good";
      btn.textContent = chosenName
        ? `Começar como ${clazz.name} (${chosenName})`
        : `Começar como ${clazz.name}`;

      btn.addEventListener("click", () => {
        this.engine.startNew(classId);
        this.applyPlayerNameToState();
        this.showGame();
        this.render();
        this.notify(`A jornada começa com ${this.getResolvedPlayerName()}.`, "good");
      });

      actions.appendChild(btn);
      card.appendChild(actions);
      this.elements.classOptions.appendChild(card);
    });
  }

  render() {
    this.renderChapter();
    this.renderStats();
    this.renderEquipment();
    this.renderInventory();
    this.renderSkills();
    this.renderLog();

    if (this.engine.state.mode === "combat" && this.engine.getCombat()) {
      this.renderCombat();
    } else {
      const scene = this.engine.getCurrentScene();

      if (scene?.shop) {
        this.renderShop();
      } else {
        this.renderScene();
      }
    }

    this.syncDisplayedPlayerName();
    this.syncHud();
  }

  renderChapter() {
    if (!this.elements.chapterName) return;

    const chapter = this.engine.getCurrentChapter();
    const tier = this.engine.state.worldTier;
    const className = this.engine.state.className || "Sem classe";
    const playerName = this.getResolvedPlayerName();

    this.elements.chapterName.textContent = chapter
      ? `${chapter.title} | ${playerName} | ${className} | World Tier ${tier}`
      : `${playerName} | ${className} | World Tier ${tier}`;
  }

  renderStats() {
    if (!this.elements.stats) return;

    const s = this.engine.state;
    const next = this.engine.xpToNextLevel();
    const mana = s.mana ?? 0;
    const maxMana = s.maxMana ?? s.manaMax ?? mana;
    const playerName = this.getResolvedPlayerName();

    this.elements.stats.innerHTML = `
      <div class="stat-line"><strong>Nome:</strong> ${this.escapeHtml(playerName)}</div>
      <div class="stat-line"><strong>Vida:</strong> ${s.hp}/${s.maxHp}</div>
      <div class="stat-line"><strong>Mana:</strong> ${mana}/${maxMana}</div>
      <div class="stat-line"><strong>Ouro:</strong> ${s.gold}</div>
      <div class="stat-line"><strong>Nível:</strong> ${s.level}</div>
      <div class="stat-line"><strong>XP:</strong> ${s.xp}/${next}</div>
      <div class="stat-line"><strong>Força:</strong> ${s.strength}</div>
      <div class="stat-line"><strong>Agilidade:</strong> ${s.agility}</div>
      <div class="stat-line"><strong>Intelecto:</strong> ${s.intellect}</div>
      <div class="stat-line"><strong>Ataque Total:</strong> ${this.engine.calculateBaseAttack()}</div>
      <div class="stat-line"><strong>Defesa Total:</strong> ${this.engine.getDefenseBonus()}</div>
    `;
  }

  renderEquipment() {
    if (!this.elements.equipment) return;

    const equipment = this.engine.state.equipment || {};
    const weaponId = equipment.weaponId;
    const armorId = equipment.armorId;
    const weapon = weaponId ? this.engine.getItem(weaponId) : null;
    const armor = armorId ? this.engine.getItem(armorId) : null;

    this.elements.equipment.innerHTML = `
      <div class="equip-line">
        <strong>Arma:</strong> ${weapon ? this.escapeHtml(weapon.name) : "Nenhuma"}
        ${weapon ? ` <span class="small">(+${weapon.attackBonus || 0} ataque)</span>` : ""}
      </div>
      <div class="equip-line">
        <strong>Armadura:</strong> ${armor ? this.escapeHtml(armor.name) : "Nenhuma"}
        ${armor ? ` <span class="small">(+${armor.defenseBonus || 0} defesa)</span>` : ""}
      </div>
      <div class="equip-line">
        <strong>Runs concluídas:</strong> ${this.engine.state.totalRuns}
      </div>
    `;
  }

  renderRarity(rarity = "common") {
    const cssRarity = this.sanitizeCssToken(rarity);
    const label = this.escapeHtml(rarity);
    return `<span class="rarity rarity-${cssRarity}">${label}</span>`;
  }

  renderInventory() {
    if (!this.elements.inventory) return;

    this.elements.inventory.innerHTML = "";

    const entries = Object.entries(this.engine.state.inventory || {})
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (!entries.length) {
      this.elements.inventory.innerHTML = `<div class="item-line small">Inventário vazio</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const [itemId, qty] of entries) {
      const item = this.engine.getItem(itemId);
      if (!item) continue;

      const row = document.createElement("div");
      row.className = "item-line";

      row.innerHTML = `
        <div class="item-header">
          <div>
            <strong>${this.escapeHtml(item.name)}</strong> x${qty} ${this.renderRarity(item.rarity)}
            <div class="small">${this.escapeHtml(item.description || "")}</div>
          </div>
          <div class="small">Venda: ${this.engine.getSellValue(itemId)} ouro</div>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      if (item.type === "weapon" || item.type === "armor") {
        const equipBtn = document.createElement("button");
        const equipped = this.engine.isItemEquipped(itemId);

        equipBtn.textContent = equipped ? "Equipado" : "Equipar";
        equipBtn.disabled = equipped;

        equipBtn.addEventListener("click", () => {
          this.engine.equipItem(itemId);
          this.notify(`${item.name} equipado.`, "good");
          this.render();
        });

        actions.appendChild(equipBtn);
      } else if (this.engine.canUseInventoryItemOutsideCombat(itemId)) {
        const useBtn = document.createElement("button");
        useBtn.textContent = "Usar";

        useBtn.addEventListener("click", () => {
          this.engine.useInventoryItem(itemId, false);
          this.notify(`${item.name} usado.`, "good");
          this.render();
        });

        actions.appendChild(useBtn);
      }

      if (this.engine.canSellItem(itemId)) {
        const sellBtn = document.createElement("button");
        sellBtn.className = "alt";
        sellBtn.textContent = "Vender";

        sellBtn.addEventListener("click", () => {
          this.engine.sellItem(itemId);
          this.notify(`${item.name} vendido.`, "warn");
          this.render();
        });

        actions.appendChild(sellBtn);
      }

      if (actions.children.length > 0) {
        row.appendChild(actions);
      }

      fragment.appendChild(row);
    }

    this.elements.inventory.appendChild(fragment);
  }

  renderSkills() {
    if (!this.elements.skills) return;

    const skillIds = this.engine.getClassSkills();

    if (!skillIds.length) {
      this.elements.skills.innerHTML = `<div class="skill-line small">Sem habilidades.</div>`;
      return;
    }

    const combat = this.engine.getCombat();

    this.elements.skills.innerHTML = skillIds.map((skillId) => {
      const skill = this.engine.getSkill(skillId);
      const cd = combat?.skillCooldowns?.[skillId] || 0;
      const status = combat
        ? (cd > 0 ? `Em recarga: ${cd}` : "Pronta")
        : `Recarga: ${skill.cooldown} turno(s)`;

      return `
        <div class="skill-line">
          <strong>${this.escapeHtml(skill.name)}</strong>
          <div class="small">${this.escapeHtml(skill.description || "")}</div>
          <div class="small">${status}</div>
        </div>
      `;
    }).join("");
  }

  renderScene() {
    const scene = this.engine.getCurrentScene();
    if (!scene) return;

    this.syncCombatPanel(false);
    this.renderSceneVisual(scene);

    if (this.elements.sceneTitle) {
      this.elements.sceneTitle.textContent = scene.title;
    }

    if (this.elements.sceneText) {
      this.elements.sceneText.textContent = scene.text;
    }

    if (!this.elements.choices) return;
    this.elements.choices.innerHTML = "";

    (scene.choices || []).forEach((choice, index) => {
      const btn = document.createElement("button");
      const allowed = this.engine.canUseChoice(choice);

      btn.textContent = choice.text;
      btn.disabled = !allowed;

      if (!allowed) {
        btn.title = this.engine.getChoiceLockReason(choice);
        btn.classList.add("locked");
      }

      btn.addEventListener("click", () => {
        this.engine.chooseChoice(index);
        this.render();
      });

      this.elements.choices.appendChild(btn);
    });
  }

  renderShop() {
    const scene = this.engine.getCurrentScene();
    if (!scene) return;

    const items = this.engine.getShopItemsForCurrentScene();

    this.syncCombatPanel(false);
    this.renderSceneVisual(scene);

    if (this.elements.sceneTitle) {
      this.elements.sceneTitle.textContent = scene.title;
    }

    if (this.elements.sceneText) {
      this.elements.sceneText.textContent = `${scene.text} Você pode comprar aqui e vender itens no inventário ao lado.`;
    }

    if (!this.elements.choices) return;
    this.elements.choices.innerHTML = "";

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shop-line";

      row.innerHTML = `
        <div class="shop-header">
          <div>
            <strong>${this.escapeHtml(item.name)}</strong> ${this.renderRarity(item.rarity)}
            <div class="small">${this.escapeHtml(item.description || "")}</div>
          </div>
          <div><strong>${item.price} ouro</strong></div>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "shop-actions";

      const btn = document.createElement("button");
      const canBuy = this.engine.canBuyItem(item.id);

      btn.textContent = "Comprar";
      btn.disabled = !canBuy;

      if (!canBuy) {
        btn.title = this.engine.getBuyLockReason(item.id);
      }

      btn.addEventListener("click", () => {
        this.engine.buyItem(item.id);
        this.notify(`${item.name} comprado.`, "good");
        this.render();
      });

      actions.appendChild(btn);
      row.appendChild(actions);
      this.elements.choices.appendChild(row);
    });

    const backBtn = document.createElement("button");
    backBtn.className = "alt";
    backBtn.textContent = "Voltar";

    backBtn.addEventListener("click", () => {
      this.engine.goToScene(scene.shop.returnScene);
      this.render();
    });

    this.elements.choices.appendChild(backBtn);
  }

  renderCombat() {
    const combat = this.engine.getCombat();
    if (!combat) return;

    this.syncCombatPanel(true, combat);
    this.renderCombatVisual(combat);

    if (this.elements.sceneTitle) {
      this.elements.sceneTitle.textContent = `Combate: ${combat.name}`;
    }

    if (this.elements.sceneText) {
      this.elements.sceneText.innerHTML = `
        <strong>Seu HP:</strong> ${this.engine.state.hp}/${this.engine.state.maxHp}<br>
        <strong>HP do inimigo:</strong> ${combat.enemyHp}/${combat.enemyMaxHp}<br>
        <span class="small">Ataque inimigo: ${combat.attackMin} - ${combat.attackMax}</span>
      `;
    }

    if (!this.elements.choices) return;
    this.elements.choices.innerHTML = "";

    const baseActions = [
      { key: "attack", text: "Atacar", disabled: false },
      { key: "defend", text: "Defender", disabled: false },
      { key: "potion", text: "Usar Poção", disabled: !this.engine.hasItem("pocao") },
      { key: "potion_big", text: "Usar Poção Maior", disabled: !this.engine.hasItem("pocao_maior") },
      { key: "herb", text: "Usar Erva", disabled: !this.engine.hasItem("erva") },
      { key: "flee", text: "Fugir", disabled: !combat.allowFlee }
    ];

    baseActions.forEach((action) => {
      const btn = document.createElement("button");
      btn.textContent = action.text;
      btn.disabled = action.disabled;

      btn.addEventListener("click", () => {
        this.engine.performCombatAction(action.key);
        this.render();
      });

      this.elements.choices.appendChild(btn);
    });

    this.engine.getClassSkills().forEach((skillId) => {
      const skill = this.engine.getSkill(skillId);
      const btn = document.createElement("button");
      const canUse = this.engine.canUseSkill(skillId);
      const cd = combat.skillCooldowns?.[skillId] || 0;

      btn.className = "good";
      btn.textContent = canUse ? skill.name : `${skill.name} (${cd})`;
      btn.disabled = !canUse;

      btn.addEventListener("click", () => {
        this.engine.performCombatAction(`skill:${skillId}`);
        this.render();
      });

      this.elements.choices.appendChild(btn);
    });
  }

  renderLog() {
    if (!this.elements.log) return;

    const logEntries = this.engine.state.log || [];

    if (!logEntries.length) {
      this.elements.log.innerHTML = `<div class="log-line small">Nenhum registro ainda.</div>`;
      return;
    }

    this.elements.log.innerHTML = logEntries
      .map((entry) => `<div class="log-line">${this.escapeHtml(entry)}</div>`)
      .join("");

    this.elements.log.scrollTop = this.elements.log.scrollHeight;
  }

  /* =========================
     Helpers
  ========================= */

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  sanitizeCssToken(value) {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");
  }

  notify(message, type = "good") {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
    }
  }

  getPlayerChosenName({ allowEmpty = false } = {}) {
    const raw = this.elements.playerNameInput?.value || "";
    const normalized = String(raw).trim().replace(/\s+/g, " ").slice(0, 24);

    if (this.elements.playerNameInput) {
      this.elements.playerNameInput.value = normalized;
    }

    return allowEmpty ? normalized : (normalized || "Herói Sem Nome");
  }

  getPlayerNameFromState() {
    const s = this.engine?.state;
    if (!s) return "";

    return (
      s?.player?.name ||
      s?.hero?.name ||
      s?.character?.name ||
      s?.name ||
      ""
    );
  }

  setPlayerNameInState(name) {
    const finalName = String(name || "").trim().replace(/\s+/g, " ").slice(0, 24) || "Herói Sem Nome";
    const s = this.engine?.state;
    if (!s) return;

    if (s.player && typeof s.player === "object") s.player.name = finalName;
    if (s.hero && typeof s.hero === "object") s.hero.name = finalName;
    if (s.character && typeof s.character === "object") s.character.name = finalName;

    if (!s.player && !s.hero && !s.character) {
      s.name = finalName;
    }
  }

  applyPlayerNameToState() {
    const chosen = this.getPlayerChosenName({ allowEmpty: true });
    const current = String(this.getPlayerNameFromState() || "").trim();

    const finalName = chosen || current || "Herói Sem Nome";
    this.setPlayerNameInState(finalName);
    this.syncDisplayedPlayerName(finalName);
  }

  getResolvedPlayerName() {
    return (
      String(this.getPlayerNameFromState() || "").trim() ||
      this.getPlayerChosenName({ allowEmpty: true }) ||
      "Herói Sem Nome"
    );
  }

  getCurrentObjective() {
    const scene = this.engine.getCurrentScene();
    return (
      this.engine.state.objective ||
      scene?.objective ||
      scene?.title ||
      "Seguir em frente"
    );
  }

  getPlayerAvatar() {
    const className = String(this.engine.state.className || "").toLowerCase();

    if (className.includes("guerreiro")) return "🛡️";
    if (className.includes("mago")) return "🔮";
    if (className.includes("arqueiro")) return "🏹";
    if (className.includes("ladino")) return "🗡️";
    return "⚔️";
  }

  syncDisplayedPlayerName(preferredName) {
    const name = String(preferredName || "").trim() || this.getResolvedPlayerName();

    const hudNameEl = document.getElementById("player-name");
    if (hudNameEl) {
      hudNameEl.textContent = name;
    }
  }

  syncHud() {
    const s = this.engine.state;
    const xpMax = this.engine.xpToNextLevel();
    const mana = s.mana ?? 0;
    const manaMax = s.maxMana ?? s.manaMax ?? mana;

    if (typeof window.updateHud === "function") {
      window.updateHud({
        name: this.getResolvedPlayerName(),
        avatar: this.getPlayerAvatar(),
        className: s.className || "Sem classe",
        level: s.level,
        gold: s.gold,
        objective: this.getCurrentObjective(),
        hp: s.hp,
        hpMax: s.maxHp,
        mana,
        manaMax,
        xp: s.xp,
        xpMax
      });
      return;
    }

    this.syncDisplayedPlayerName();

    const playerClassEl = document.getElementById("player-class");
    const playerLevelEl = document.getElementById("player-level");
    const playerGoldEl = document.getElementById("player-gold");
    const objectiveEl = document.getElementById("current-objective");

    if (playerClassEl) playerClassEl.textContent = s.className || "Sem classe";
    if (playerLevelEl) playerLevelEl.textContent = `Nv.${s.level}`;
    if (playerGoldEl) playerGoldEl.textContent = `${s.gold} Ouro`;
    if (objectiveEl) objectiveEl.textContent = this.getCurrentObjective();
  }

  syncCombatPanel(active, combat = null) {
    if (typeof window.setCombatMode === "function") {
      if (!active || !combat) {
        window.setCombatMode(false);
        return;
      }

      window.setCombatMode(true, {
        name: combat.name,
        level: combat.level ?? 1,
        intent: combat.intent || "Preparando ataque",
        hp: combat.enemyHp,
        hpMax: combat.enemyMaxHp
      });
      return;
    }

    const combatPanel = document.getElementById("combat-panel");
    if (!combatPanel) return;

    combatPanel.classList.toggle("hidden", !active);

    if (active && combat && typeof window.updateEnemyHud === "function") {
      window.updateEnemyHud({
        name: combat.name,
        level: combat.level ?? 1,
        intent: combat.intent || "Preparando ataque",
        hp: combat.enemyHp,
        hpMax: combat.enemyMaxHp
      });
    }
  }

  getSceneImageKey(scene) {
    if (!scene) return "";

    if (scene.imageKey) {
      return String(scene.imageKey).trim();
    }

    const id = String(scene.id || this.engine.state.currentScene || "")
      .toLowerCase()
      .replace(/_/g, "-");

    const title = String(scene.title || "").toLowerCase();

    if (scene.shop) return "mercado";
    if (id.includes("floresta-dia") || title.includes("floresta dia")) return "floresta-dia";
    if (id.includes("floresta") || title.includes("floresta")) return "floresta";
    if (id.includes("caverna") || title.includes("caverna")) return "caverna";
    if (id.includes("torre-interna") || title.includes("torre interna")) return "torre-interna";
    if (id.includes("torre") || title.includes("torre")) return "torre";

    return "";
  }

  getCombatImageKey(combat) {
    if (!combat) return "";

    if (combat.imageKey) {
      return String(combat.imageKey).trim();
    }

    const enemyId = String(combat.enemyId || "")
      .toLowerCase()
      .replace(/_/g, "-");

    const name = String(combat.name || "").toLowerCase();

    if (enemyId === "goblin" || name.includes("goblin")) {
      return "goblin";
    }

    if (
      enemyId === "espreitador-abissal" ||
      enemyId === "abyss-stalker" ||
      enemyId.includes("abiss") ||
      name.includes("espreitador") ||
      name.includes("abiss")
    ) {
      return "espreitador-abissal";
    }

    if (
      enemyId === "rei-do-eclipse" ||
      enemyId === "eclipse-king" ||
      enemyId.includes("eclipse") ||
      name.includes("eclipse")
    ) {
      return "rei-do-eclipse";
    }

    return "";
  }

  setSceneVisual(src, alt = "Imagem da cena") {
    const wrap = document.getElementById("scene-visual-wrap");
    const img = document.getElementById("scene-visual");

    if (!wrap || !img) return;

    if (!src) {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
      img.alt = "";
      wrap.classList.add("hidden");
      return;
    }

    img.onload = () => {
      wrap.classList.remove("hidden");
    };

    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
      img.alt = "";
      wrap.classList.add("hidden");
      console.warn("Imagem não encontrada:", src);
    };

    img.src = src;
    img.alt = alt;
  }

  renderSceneVisual(scene) {
    const key = this.getSceneImageKey(scene);
    const src = this.imageMap.scenes[key] || "";
    this.setSceneVisual(src, scene?.title || "Cena");
  }

  renderCombatVisual(combat) {
    const key = this.getCombatImageKey(combat);
    const src = this.imageMap.enemies[key] || "";
    this.setSceneVisual(src, combat?.name || "Inimigo");
  }

  renderSceneVisual(scene) {
  const key = this.getSceneImageKey(scene);
  const src = this.imageMap.scenes[key] || "";
  console.log("SCENE IMAGE =>", {
    sceneId: scene?.id,
    sceneTitle: scene?.title,
    imageKey: scene?.imageKey,
    key,
    src
  });
  this.setSceneVisual(src, scene?.title || "Cena");
}

renderCombatVisual(combat) {
  const key = this.getCombatImageKey(combat);
  const src = this.imageMap.enemies[key] || "";
  console.log("COMBAT IMAGE =>", {
    enemyId: combat?.enemyId,
    enemyName: combat?.name,
    imageKey: combat?.imageKey,
    key,
    src
  });
  this.setSceneVisual(src, combat?.name || "Inimigo");
}
}