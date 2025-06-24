import * as ex from 'excalibur';
import { GameConfig } from './GameConfig.js';
// import { DebugScene } from './Scenes/DebugScene.js';
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

player.onPreUpdate = (game, _delta) => { 
    if (game.input.keyboard.isHeld(ex.Keys.Left)) {
        player.pos.x -= 5;
    } else if (game.input.keyboard.isHeld(ex.Keys.Right)) {
        player.pos.x += 5;
    } else if (game.input.keyboard.isHeld(ex.Keys.Up)) {
        player.pos.y -= 5;
    } else if (game.input.keyboard.isHeld(ex.Keys.Down)) {
        player.pos.y += 5;
    }
}
game.start();