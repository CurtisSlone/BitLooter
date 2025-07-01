import * as ex from 'excalibur';

export const Resources = {
    // Tiled map files
    overworldTilemap: new ex.Resource('./maps/overworld.json', 'json'),
    
    // Tileset image
    overworldTileset: new ex.ImageSource('./maps/tilesets/Overworld_Tileset.png'),
    
    // Player sprite sheet
    playerSpriteSheet: new ex.ImageSource('./sprites/link-blue-sheet.png')
} as const;

export const loader = new ex.Loader([
    Resources.overworldTilemap,
    Resources.overworldTileset
]);

// Add loading event listeners for debugging
Resources.overworldTilemap.load().then(() => {
    console.log('Tiled map JSON loaded successfully');
    console.log('Map data:', Resources.overworldTilemap.data);
}).catch((error: any) => {
    console.error('Failed to load Tiled map:', error);
});

Resources.overworldTileset.load().then(() => {
    console.log('Tileset loaded successfully');
    console.log('Tileset dimensions:', Resources.overworldTileset.width, 'x', Resources.overworldTileset.height);
}).catch((error: any) => {
    console.error('Failed to load tileset:', error);
});

Resources.playerSpriteSheet.load().then(()=>{
    console.log('Player Spritesheet loaded');
}).catch((err: any)=>{
    console.log("Failed to load player Sprite Sheet");
});