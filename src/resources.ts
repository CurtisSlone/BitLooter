import * as ex from 'excalibur';

export const Resources = {
    overworldMap: new ex.ImageSource('./maps/outdoor.png')
} as const;

export const loader = new ex.Loader([
    Resources.overworldMap
]);