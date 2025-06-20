import * as ex from 'excalibur';
import { GameConfig } from './GameConfig.js';
import { DebugScene } from './Scenes/DebugScene.js';
import { DebugPlayer } from './Players/DebugPlayer.js';

const game = new ex.Engine({
    width: GameConfig.width,
    height: GameConfig.height,
    displayMode: GameConfig.displayMode,
    pixelArt: GameConfig.pixelArt,
    backgroundColor: GameConfig.backgroundColor
});
const player = new DebugPlayer();
game.add(player);
game.start();