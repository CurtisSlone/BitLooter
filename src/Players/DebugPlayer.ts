import * as ex from 'excalibur';

export class DebugPlayer extends ex.Actor {
    constructor() {
        super({
            pos: ex.vec(100, 100),
            width: 50,
            height: 50,
            color: ex.Color.Red,
            anchor: ex.vec(0.5, 0.5)
        });
    }

    
}