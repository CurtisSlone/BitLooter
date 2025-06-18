import * as ex from 'excalibur';

export const GameConfig = {
    width: 800,
    height: 600,
    displayMode: ex.DisplayMode.FitScreen,
    pixelArt: true,
    backgroundColor: ex.Color.fromHex('#CCFFCC'),
} as const;