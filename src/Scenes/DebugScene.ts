import * as ex from 'excalibur';
import { DebugPlayer } from '../Players/DebugPlayer';
import { Map } from '../Maps/Map';

export class DebugScene extends ex.Scene {
    player: DebugPlayer = new DebugPlayer();
    map: Map = new Map();

    override onInitialize(engine: ex.Engine): void {
        this.add(this.player);
        this.add(this.map);
        
    }

}   