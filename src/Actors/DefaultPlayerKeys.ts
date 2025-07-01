import * as ex from 'excalibur'
import { KeyMapping } from './Interfaces';


export const DEFAULT_PLAYER_KEYS: KeyMapping = {
    moveLeft: [ex.Keys.Left],
    moveRight: [ex.Keys.Right],
    moveUp: [ex.Keys.Up],
    moveDown: [ex.Keys.Down],
    action1: [ex.Keys.Space],
    action2: [ex.Keys.Enter],
    interact: [ex.Keys.E],
    menu: [ex.Keys.Escape]
};