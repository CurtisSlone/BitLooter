import * as ex from 'excalibur';

export const GameConstants = {
    SCALE: 2,
    SCALE_2x: new ex.Vector(2, 2),
    ANCHOR_CENTER: new ex.Vector(0.5, 0.5),
    ANCHOR_TOP_LEFT: new ex.Vector(0, 0)
} as const;