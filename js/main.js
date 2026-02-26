import { GameEngine } from "./gameEngine.js";
import { saveToStorage, loadFromStorage, hasSave, clearStorage } from "./storage.js";
import { UI } from "./ui.js";
import { SceneMusic } from "./scene-music-helper.js";

const elements = {
  chapterName: document.getElementById("chapter-name"),
  menuScreen: document.getElementById("menu-screen"),
  gameScreen: document.getElementById("game-screen"),
  newGameBtn: document.getElementById("new-game-btn"),
  continueBtn: document.getElementById("continue-btn"),
  classPicker: document.getElementById("class-picker"),
  classOptions: document.getElementById("class-options"),
  playerNameInput: document.getElementById("player-name-input"),
  stats: document.getElementById("stats"),
  equipment: document.getElementById("equipment"),
  inventory: document.getElementById("inventory"),
  skills: document.getElementById("skills"),
  sceneTitle: document.getElementById("scene-title"),
  sceneText: document.getElementById("scene-text"),
  choices: document.getElementById("choices"),
  log: document.getElementById("log"),
  saveBtn: document.getElementById("save-btn"),
  loadBtn: document.getElementById("load-btn"),
  menuBtn: document.getElementById("menu-btn"),
  restartBtn: document.getElementById("restart-btn")
};

let engine;
let ui;
let music;

boot();

async function boot() {
  try {
    engine = await GameEngine.create(
      "./data/config.json",
      [
        "./data/chapters/chapter1.json",
        "./data/chapters/chapter2.json",
        "./data/chapters/chapter3.json",
        "./data/chapters/chapter4.json"
      ]
    );

    ui = new UI(engine, elements);
    music = new SceneMusic("./assets/audio");

    attachMusicHooks();
    bindUI();
    bindPlayerNameInput();
    preloadNameFromSave();

    ui.showMenu(hasSave());
  } catch (error) {
    console.error(error);
    elements.menuScreen.classList.add("hidden");
    elements.gameScreen.classList.remove("hidden");
    elements.sceneTitle.textContent = "Erro ao iniciar o jogo";
    elements.sceneText.textContent = "Não foi possível carregar os arquivos JSON. Rode em um servidor local.";
  }
}

function bindUI() {
  elements.newGameBtn?.addEventListener("click", () => {
    normalizeNameInput();
    ui.toggleClassPicker();
  });

  elements.continueBtn?.addEventListener("click", () => {
    const savedState = loadFromStorage();
    if (!savedState) {
      ui.showMenu(false);
      return;
    }

    engine.importState(savedState);
    engine.addLog("Save carregado.");

    syncNameInputFromState(savedState);
    ui.showGame();
    ui.render();
  });

  elements.saveBtn?.addEventListener("click", () => {
    applyChosenNameToEngine({ force: false });
    saveToStorage(engine.exportState());
    engine.addLog("Jogo salvo com sucesso.");
    ui.render();
  });

  elements.loadBtn?.addEventListener("click", () => {
    const savedState = loadFromStorage();
    if (!savedState) {
      engine.addLog("Nenhum save encontrado.");
      ui.render();
      return;
    }

    engine.importState(savedState);
    engine.addLog("Jogo carregado.");

    syncNameInputFromState(savedState);
    ui.render();
  });

  elements.menuBtn?.addEventListener("click", () => {
    syncNameInputFromState();
    ui.showMenu(hasSave());
  });

  elements.restartBtn?.addEventListener("click", () => {
    clearStorage();
    engine.resetAll();

    // reaplica o nome digitado (ou padrão) após reset
    applyChosenNameToEngine({ force: true });

    ui.showGame();
    ui.render();
  });

  // Quando o jogador escolhe uma classe, esse clique costuma acontecer
  // dentro de #class-options. Após a seleção, aplicamos o nome ao estado.
  elements.classOptions?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    requestAnimationFrame(() => {
      const changed = applyChosenNameToEngine({ force: true });
      if (changed) {
        ui.render();
      } else {
        syncDisplayedPlayerName();
      }
    });
  });
}

function bindPlayerNameInput() {
  if (!elements.playerNameInput) return;

  elements.playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      elements.newGameBtn?.click();
    }
  });

  elements.playerNameInput.addEventListener("blur", () => {
    normalizeNameInput();
  });
}

function attachMusicHooks() {
  const originalRender = ui.render.bind(ui);
  ui.render = () => {
    originalRender();
    syncDisplayedPlayerName();
    syncMusic();
  };

  const originalShowMenu = ui.showMenu.bind(ui);
  ui.showMenu = (showContinue) => {
    originalShowMenu(showContinue);
    syncNameInputFromState();

    if (music) {
      music.play("menu", { loop: true, volume: 0.32 });
    }
  };
}

function syncMusic() {
  if (!music || !engine) return;

  if (!elements.menuScreen.classList.contains("hidden")) {
    music.play("menu", { loop: true, volume: 0.32 });
    return;
  }

  if (engine.state.mode === "combat" && engine.getCombat()) {
    const combat = engine.getCombat();
    const bossIds = new Set(["tower_knight", "mirror_priest", "void_colossus", "eclipse_king"]);
    const key = bossIds.has(combat.enemyId) ? "combat_boss" : "combat_normal";
    music.play(key, { loop: true, volume: 0.40 });
    return;
  }

  const sceneId = engine.state.currentScene;

  if (
    sceneId === "ending_power" ||
    sceneId === "ending_scholar" ||
    sceneId === "ending_ascendant"
  ) {
    music.play("victory", { loop: false, volume: 0.42 });
    return;
  }

  music.play(sceneId, { loop: true, volume: 0.36 });
}

/* =========================
   Nome do personagem
========================= */

function normalizePlayerName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function normalizeNameInput() {
  if (!elements.playerNameInput) return "";
  const normalized = normalizePlayerName(elements.playerNameInput.value);
  elements.playerNameInput.value = normalized;
  return normalized;
}

function getPlayerChosenName({ allowEmpty = false } = {}) {
  const normalized = normalizeNameInput();
  if (allowEmpty) return normalized;
  return normalized || "Herói Sem Nome";
}

function readPlayerNameFromState(state = engine?.state) {
  if (!state || typeof state !== "object") return "";

  const candidate =
    state?.player?.name ??
    state?.hero?.name ??
    state?.character?.name ??
    state?.name ??
    "";

  return normalizePlayerName(candidate);
}

function writePlayerNameToState(state, name) {
  if (!state || typeof state !== "object") return false;

  const finalName = normalizePlayerName(name) || "Herói Sem Nome";
  let wrote = false;

  if (state.player && typeof state.player === "object") {
    state.player.name = finalName;
    wrote = true;
  }

  if (state.hero && typeof state.hero === "object") {
    state.hero.name = finalName;
    wrote = true;
  }

  if (state.character && typeof state.character === "object") {
    state.character.name = finalName;
    wrote = true;
  }

  // fallback genérico, caso não exista player/hero/character
  if (!wrote) {
    state.name = finalName;
    wrote = true;
  }

  return wrote;
}

function applyChosenNameToEngine({ force = false } = {}) {
  if (!engine?.state) return false;

  const typedName = getPlayerChosenName({ allowEmpty: true });
  const currentName = readPlayerNameFromState(engine.state);

  // se não digitou nada e não é forçado, não sobrescreve o nome atual
  if (!typedName && !force) {
    syncDisplayedPlayerName();
    return false;
  }

  const nextName = typedName || currentName || "Herói Sem Nome";

  if (currentName === nextName) {
    syncDisplayedPlayerName(nextName);
    return false;
  }

  const changed = writePlayerNameToState(engine.state, nextName);
  syncDisplayedPlayerName(nextName);
  return changed;
}

function syncNameInputFromState(state = engine?.state) {
  if (!elements.playerNameInput) return;

  const stateName = readPlayerNameFromState(state);
  if (stateName) {
    elements.playerNameInput.value = stateName;
  }
}

function preloadNameFromSave() {
  if (!hasSave()) return;

  const savedState = loadFromStorage();
  if (!savedState) return;

  syncNameInputFromState(savedState);
}

function syncDisplayedPlayerName(preferredName) {
  const resolvedName =
    normalizePlayerName(preferredName) ||
    readPlayerNameFromState(engine?.state) ||
    normalizePlayerName(elements.playerNameInput?.value) ||
    "Herói Sem Nome";

  const hudNameEl = document.getElementById("player-name");
  if (hudNameEl) {
    hudNameEl.textContent = resolvedName;
  }

  // Se você estiver usando a HUD V2 com updateHud global
  if (typeof window.updateHud === "function") {
    try {
      window.updateHud({ name: resolvedName });
    } catch (error) {
      console.warn("Falha ao atualizar HUD global:", error);
    }
  }
}