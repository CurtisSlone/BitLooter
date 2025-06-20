import * as ex from 'excalibur';
import { PlayerConfig } from '../Players/PlayerConfig';
export class DebugPlayer extends ex.Actor {
    constructor() {
        super({
            pos: ex.vec(100, 100),
            width: PlayerConfig.width,
            height: PlayerConfig.height,
            color: ex.Color.Red,
            anchor: PlayerConfig.anchor
        });
    }
}