// Simple scene music helper for the RPG V4
// Put the .wav files in ./assets/audio/ and import this helper in your app.

export class SceneMusic {
  constructor(basePath = "./assets/audio") {
    this.basePath = basePath;
    this.audio = null;
    this.currentKey = null;
    this.map = {
      menu: "01_title_theme.wav",
      market_square: "02_market_square.wav",
      shop_blacksmith: "02_market_square.wav",
      shop_alchemist: "02_market_square.wav",
      shop_supplies: "02_market_square.wav",
      intro: "02_market_square.wav",
      forest_edge: "03_forest_edge.wav",
      river: "03_forest_edge.wav",
      cave_entrance: "04_cave_tension.wav",
      ruins_gate: "04_cave_tension.wav",
      inner_shrine: "07_shrine_mystery.wav",
      tower_path: "10_tower_vigil.wav",
      tower_hall: "10_tower_vigil.wav",
      tower_core: "06_boss_battle.wav",
      ending_scholar: "08_victory_fanfare.wav",
      flooded_approach: "10_tower_vigil.wav",
      smuggler_camp: "02_market_square.wav",
      flooded_hall: "04_cave_tension.wav",
      sunken_sanctum: "07_shrine_mystery.wav",
      abyssal_vault: "07_shrine_mystery.wav",
      eclipse_bridge: "10_tower_vigil.wav",
      eclipse_enclave: "02_market_square.wav",
      eclipse_gate: "06_boss_battle.wav",
      eclipse_throne: "06_boss_battle.wav",
      ending_ascendant: "08_victory_fanfare.wav",
      combat_normal: "05_battle_skirmish.wav",
      combat_boss: "06_boss_battle.wav",
      victory: "08_victory_fanfare.wav",
      defeat: "09_defeat_fall.wav"
    };
  }

  async play(key, { loop = true, volume = 0.45, fadeMs = 250 } = {}) {
    const file = this.map[key] || this.map.menu;
    if (!file) return;
    if (this.currentKey === key && this.audio) return;

    const next = new Audio(`${this.basePath}/${file}`);
    next.loop = loop;
    next.volume = 0;

    try {
      await next.play();
    } catch (err) {
      console.warn("Audio blocked until user interaction:", err);
      return;
    }

    const prev = this.audio;
    this.audio = next;
    this.currentKey = key;

    const steps = Math.max(1, Math.floor(fadeMs / 25));
    let i = 0;

    const fade = setInterval(() => {
      i += 1;
      next.volume = Math.min(volume, (i / steps) * volume);

      if (prev) {
        prev.volume = Math.max(0, volume - (i / steps) * volume);
      }

      if (i >= steps) {
        clearInterval(fade);
        next.volume = volume;
        if (prev) {
          prev.pause();
          prev.currentTime = 0;
        }
      }
    }, 25);
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio = null;
    this.currentKey = null;
  }
}

// Example:
// const music = new SceneMusic("./assets/audio");
// document.addEventListener("click", () => music.play("menu"), { once: true });
