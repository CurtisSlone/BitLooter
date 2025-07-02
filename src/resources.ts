import * as ex from 'excalibur';

export const MapResources = {
    // Tiled map files
    overworldTilemap: new ex.Resource('./maps/overworld.json', 'json'),
    
    // Tileset image
    overworldTileset: new ex.ImageSource('./maps/tilesets/Overworld_Tileset.png'),
    
    // Player sprite sheet
    playerSpriteSheet: new ex.ImageSource('./sprites/link-blue-sheet.png')
} as const;


export const SpriteResources = {
    
}

// Add loading event listeners for debugging
MapResources.overworldTilemap.load().then(() => {
    console.log('Tiled map JSON loaded successfully');
    console.log('Map data:', MapResources.overworldTilemap.data);
}).catch((error: any) => {
    console.error('Failed to load Tiled map:', error);
});

MapResources.overworldTileset.load().then(() => {
    console.log('Tileset loaded successfully');
    console.log('Tileset dimensions:', MapResources.overworldTileset.width, 'x', MapResources.overworldTileset.height);
}).catch((error: any) => {
    console.error('Failed to load tileset:', error);
});

