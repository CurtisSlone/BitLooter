import * as ex from 'excalibur';
import { GameConfig } from '../GameConfig.js';
import { MapConfig } from './MapConfig.js';

export class Map extends ex.Actor {
   constructor() {
        super({
             pos: ex.vec(0, 0),
             width: GameConfig.width,
             height: GameConfig.height,
             scale: MapConfig.mapScale,
             anchor: MapConfig.mapAnchor
        });
     }
}