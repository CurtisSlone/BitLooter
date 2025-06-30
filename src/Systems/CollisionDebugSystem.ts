// import * as ex from 'excalibur';
// import { CollisionSystem } from './CollisionSystem.js';

// export class CollisionDebugSystem extends ex.System {
//     public systemType = ex.SystemType.Update as const;
//     public priority = 5;

//     private collisionSystem: CollisionSystem | null = null;
//     private debugActors: ex.Actor[] = [];
//     private showDebug = true;
//     private scene: ex.Scene | null = null;

//     public setCollisionSystem(collisionSystem: CollisionSystem): void {
//         this.collisionSystem = collisionSystem;
//         console.log('🔧 CollisionDebugSystem connected to CollisionSystem');
//     }

//     public setScene(scene: ex.Scene): void {
//         this.scene = scene;
//     }

//     public update(_elapsed: number): void {
//         if (!this.showDebug || !this.collisionSystem || !this.scene) return;

//         // Clear old debug actors
//         this.clearDebugActors(this.scene);

//         // Get tilemap data
//         const tilemap = (this.collisionSystem as any).tilemap;
//         const collisionLayer = (this.collisionSystem as any).collisionLayer;
        
//         if (!tilemap || !collisionLayer) {
//             console.warn('No tilemap or collision layer for debug');
//             return;
//         }

//         // Find visible area around camera
//         const camera = this.scene.camera;
//         const tileSize = tilemap.tileWidth * tilemap.scale.x; // 16 * 2 = 32
        
//         // Calculate tile range around camera (smaller range for performance)
//         const tilesAroundCamera = 10;
//         const centerTileX = Math.floor(camera.pos.x / tileSize);
//         const centerTileY = Math.floor(camera.pos.y / tileSize);
        
//         const startTileX = Math.max(0, centerTileX - tilesAroundCamera);
//         const endTileX = Math.min(tilemap.columns - 1, centerTileX + tilesAroundCamera);
//         const startTileY = Math.max(0, centerTileY - tilesAroundCamera);
//         const endTileY = Math.min(tilemap.rows - 1, centerTileY + tilesAroundCamera);

//         console.log(`🔍 Checking collision tiles from (${startTileX},${startTileY}) to (${endTileX},${endTileY})`);

//         // Check each tile in the visible area
//         let collisionTilesFound = 0;
//         for (let tileY = startTileY; tileY <= endTileY; tileY++) {
//             for (let tileX = startTileX; tileX <= endTileX; tileX++) {
//                 // Check if this tile has collision
//                 const tileIndex = tileY * tilemap.columns + tileX;
//                 const gid = collisionLayer.data[tileIndex];
                
//                 if (gid > 0) {
//                     collisionTilesFound++;
//                     // Create a debug visual for this collision tile
//                     this.createCollisionDebugTile(this.scene, tileX, tileY, tileSize, gid);
//                 }
//             }
//         }

//         console.log(`🎯 Found ${collisionTilesFound} collision tiles in visible area`);

//         // Add player debug info
//         this.createPlayerDebug(this.scene);
//     }

//     private createCollisionDebugTile(scene: ex.Scene, tileX: number, tileY: number, tileSize: number, gid: number): void {
//         const worldX = tileX * tileSize;
//         const worldY = tileY * tileSize;

//         // Create a red semi-transparent overlay
//         const debugTile = new ex.Actor({
//             pos: ex.vec(worldX + tileSize/2, worldY + tileSize/2), // Center the actor
//             width: tileSize,
//             height: tileSize,
//             anchor: ex.vec(0.5, 0.5)
//         });

//         // Create red rectangle graphic
//         const redOverlay = new ex.Rectangle({
//             width: tileSize,
//             height: tileSize,
//             color: new ex.Color(255, 0, 0, 0.5), // Semi-transparent red
//             strokeColor: ex.Color.Red,
//             lineWidth: 2
//         });

//         debugTile.graphics.use(redOverlay);
        
//         // Add text showing tile coordinates and GID
//         const coordText = new ex.Text({
//             text: `(${tileX},${tileY})\nGID:${gid}`,
//             font: new ex.Font({
//                 size: 8,
//                 color: ex.Color.White
//             })
//         });

//         const textActor = new ex.Actor({
//             pos: ex.vec(2, -tileSize/2 + 10),
//             anchor: ex.vec(0, 0)
//         });
//         textActor.graphics.use(coordText);
//         debugTile.addChild(textActor);

//         scene.add(debugTile);
//         this.debugActors.push(debugTile);
//     }

//     private createPlayerDebug(scene: ex.Scene): void {
//         // Find the player
//         const player = scene.actors.find(actor => actor.name?.includes('player-'));
//         if (!player) return;

//         // Create player bounds debug
//         const playerBounds = new ex.Actor({
//             pos: player.pos,
//             width: player.width * player.scale.x,
//             height: player.height * player.scale.y,
//             anchor: ex.vec(0.5, 0.5)
//         });

//         const boundsRect = new ex.Rectangle({
//             width: player.width * player.scale.x,
//             height: player.height * player.scale.y,
//             color: ex.Color.Transparent,
//             strokeColor: ex.Color.Green,
//             lineWidth: 3
//         });

//         playerBounds.graphics.use(boundsRect);
//         scene.add(playerBounds);
//         this.debugActors.push(playerBounds);

//         // Add debug text about player
//         const tileX = Math.floor(player.pos.x / 32);
//         const tileY = Math.floor(player.pos.y / 32);
        
//         let collisionStatus = 'Unknown';
//         if (this.collisionSystem) {
//             collisionStatus = this.collisionSystem.checkCollision(player.pos) ? 'COLLISION' : 'Clear';
//         }

//         console.log(`👤 Player at tile (${tileX}, ${tileY}), world pos (${Math.round(player.pos.x)}, ${Math.round(player.pos.y)}), collision: ${collisionStatus}`);
//     }

//     private clearDebugActors(scene: ex.Scene): void {
//         this.debugActors.forEach(actor => {
//             if (scene.actors.includes(actor)) {
//                 scene.remove(actor);
//             }
//         });
//         this.debugActors = [];
//     }
// }