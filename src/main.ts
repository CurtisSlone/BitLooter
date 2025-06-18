import * as ex from 'excalibur';
import { GameConfig } from './GameConfig.js';

const game = new ex.Engine({
    width: GameConfig.width,
    height: GameConfig.height,
    displayMode: GameConfig.displayMode,
    pixelArt: GameConfig.pixelArt,
    backgroundColor: GameConfig.backgroundColor,

});


game.start();