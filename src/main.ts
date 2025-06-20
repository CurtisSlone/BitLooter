import * as ex from 'excalibur';
import { GameConfig } from './GameConfig.js';
import { DebugScene } from './Scenes/DebugScene.js';

const game = new ex.Engine({
    width: GameConfig.width,
    height: GameConfig.height,
    displayMode: GameConfig.displayMode,
    pixelArt: GameConfig.pixelArt,
    backgroundColor: GameConfig.backgroundColor,
    scenes: { DebugScene: DebugScene }
});


game.start().then(() => {
    game.goToScene('DebugScene');
    console.log('Game started and DebugScene loaded');
});