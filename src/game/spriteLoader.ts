/**
 * SpriteLoader preloads all game sprites and provides cached HTMLImageElement references
 */

export interface GameSprites {
  tileSnowRock: HTMLImageElement;
  tileSnowDirt: HTMLImageElement;
  tileGrassDirt: HTMLImageElement;
  kodoFront: HTMLImageElement;
  kodoFrontSmile: HTMLImageElement;
  kodoJump: HTMLImageElement;
  kodoSide: HTMLImageElement;
  kodoSleep: HTMLImageElement;
  enemyImp: HTMLImageElement;
  enemyGhost: HTMLImageElement;
  hazardMine: HTMLImageElement;
  crateWood: HTMLImageElement;
  finishFlag: HTMLImageElement;
  switchGreen: HTMLImageElement;
  switchBlue: HTMLImageElement;
  switchRed: HTMLImageElement;
  switchYellow: HTMLImageElement;
  gateIron: HTMLImageElement;
  gateRed: HTMLImageElement;
  gateYellow: HTMLImageElement;
  gateBlue: HTMLImageElement;
  goldStar: HTMLImageElement;
  snowman: HTMLImageElement;
  treePine: HTMLImageElement;
}

const spriteUrls: Record<keyof GameSprites, string> = {
  tileSnowRock: '/extracted/tile_snow_rock.png',
  tileSnowDirt: '/extracted/tile_snow_dirt.png',
  tileGrassDirt: '/extracted/tile_grass_dirt.png',
  kodoFront: '/extracted/kodo_front.png',
  kodoFrontSmile: '/extracted/kodo_front_smile.png',
  kodoJump: '/extracted/kodo_jump.png',
  kodoSide: '/extracted/kodo_side.png',
  kodoSleep: '/extracted/kodo_sleep.png',
  enemyImp: '/extracted/enemy_imp.png',
  enemyGhost: '/extracted/enemy_ghost.png',
  hazardMine: '/extracted/hazard_mine.png',
  crateWood: '/extracted/crate_wood.png',
  finishFlag: '/extracted/finish_flag.png',
  switchGreen: '/extracted/switch_green.png',
  switchBlue: '/extracted/switch_blue.png',
  switchRed: '/extracted/switch_red.png',
  switchYellow: '/extracted/switch_yellow.png',
  gateIron: '/extracted/gate_iron.png',
  gateRed: '/extracted/gate_red.png',
  gateYellow: '/extracted/gate_yellow.png',
  gateBlue: '/extracted/gate_blue.png',
  goldStar: '/extracted/gold_star.png',
  snowman: '/extracted/snowman.png',
  treePine: '/extracted/tree_pine.png',
};

let cachedSprites: GameSprites | null = null;
let loadPromise: Promise<GameSprites> | null = null;

export function loadGameSprites(): Promise<GameSprites> {
  if (cachedSprites) return Promise.resolve(cachedSprites);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const loaded: Partial<GameSprites> = {};
    const keys = Object.keys(spriteUrls) as (keyof GameSprites)[];
    let count = 0;

    keys.forEach((key) => {
      const img = new Image();
      img.src = spriteUrls[key];
      img.onload = () => {
        count++;
        loaded[key] = img;
        if (count === keys.length) {
          cachedSprites = loaded as GameSprites;
          resolve(cachedSprites);
        }
      };
      img.onerror = () => {
        // Fallback placeholder so it never blocks
        count++;
        loaded[key] = img;
        if (count === keys.length) {
          cachedSprites = loaded as GameSprites;
          resolve(cachedSprites);
        }
      };
    });
  });

  return loadPromise;
}
