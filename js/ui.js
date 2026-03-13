export class UI {
  constructor(engine, elements) {}

  // =========================
  // Boot / estado visual
  // =========================
  init() {}
  cacheElements() {}
  bindStaticUI() {}

  // =========================
  // Helpers
  // =========================
  escapeHtml(text) {}
  notify(message, type = "info") {}
  clearPanel(panel) {}
  setText(el, text) {}
  show(el) {}
  hide(el) {}

  // =========================
  // Assets visuais
  // =========================
  getSceneImage(scene) {}
  getEnemyImage(enemy) {}
  getFallbackImage(kind) {}
  renderSceneVisual(scene) {}
  renderCombatVisual(enemy) {}

  // =========================
  // Menu
  // =========================
  showMenu() {}
  showGame() {}
  renderClassPicker() {}
  syncDisplayedPlayerName() {}

  // =========================
  // Render principal
  // =========================
  render() {}
  renderCurrentMode() {}

  // =========================
  // HUD / painéis laterais
  // =========================
  syncHud() {}
  renderStats() {}
  renderInventory() {}
  renderEquipment() {}
  renderSkillsSummary() {}
  renderChapter() {}
  renderObjective() {}
  renderLog() {}

  // =========================
  // Cena narrativa
  // =========================
  renderScene() {}
  renderSceneHeader(scene) {}
  renderSceneText(scene) {}
  renderSceneChoices(scene) {}

  // =========================
  // Combate
  // =========================
  renderCombat() {}
  renderCombatHeader(combatState) {}
  renderCombatStats(combatState) {}
  renderCombatActions(combatState) {}
  renderCombatLog(combatState) {}

  // =========================
  // Loja / inventário contextual
  // =========================
  renderShop(shopState) {}
  renderShopItems(shopState) {}

  // =========================
  // Ganchos de expansão
  // =========================
  renderWorldMap() {}
  renderQuestJournal() {}
  renderSkillTree() {}
}
