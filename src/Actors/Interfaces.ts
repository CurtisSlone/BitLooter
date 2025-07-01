export interface PlayerData {
    id: string;
    name: string;
    spriteImageSource: ex.ImageSource;
    position: ex.Vector;
    isLocalPlayer: boolean;
}

export interface KeyMapping {
    moveLeft: ex.Keys[];
    moveRight: ex.Keys[];
    moveUp: ex.Keys[];
    moveDown: ex.Keys[];
    [actionName: string]: ex.Keys[];
}