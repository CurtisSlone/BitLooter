import * as ex from 'excalibur';
import { MapResources } from '../resources.js';
import { WorldCollisionSystem } from '../Systems/WorldCollisionSystem.js';
import { Player } from '../Actors/Player.js';
import { PlayerData } from '../Actors/PlayerInterfaces.js';
import { GameConstants } from '../GameConstants.js';

export class OverworldScene extends ex.Scene {
    private tilemap!: ex.TileMap;
    private localPlayer!: Player;
    private mapData: any; // Store the loaded Tiled JSON data
    private WorldcollisionSystem!: WorldCollisionSystem;

    // Make collision system accessible to other actors
    public getWorldCollisionSystem(): WorldCollisionSystem {
        return this.WorldcollisionSystem;
    }

    override onInitialize(_engine: ex.Engine): void {
  ;
        
        // Add systems to the scene
        this.WorldcollisionSystem = new WorldCollisionSystem();
        this.world.add(this.WorldcollisionSystem);

        // Create the tilemap from Tiled data
        this.createTilemap();
        
        // Create the local player
        this.createLocalPlayer();

        // Setup camera to follow local player
        this.setupCamera();

       
    }

    private createTilemap(): void {

        if (!MapResources.overworldTilemap.isLoaded()) {
            return;
        }

        // Get the loaded JSON data
        this.mapData = MapResources.overworldTilemap.data;


        // Create tilemap manually using the JSON data
        this.tilemap = new ex.TileMap({
            columns: this.mapData.width,
            rows: this.mapData.height,
            tileWidth: this.mapData.tilewidth,
            tileHeight: this.mapData.tileheight
        });

        // Scale the tilemap to match pixel art style
        // Options: 1 = original size, 2 = double size, 3 = triple size
         // Change this value to adjust map scale
        this.tilemap.scale = ex.vec(GameConstants.SCALE, GameConstants.SCALE);

        // Create a sprite sheet from the tileset
        const tilesetSprite = ex.SpriteSheet.fromImageSource({
            image: MapResources.overworldTileset,
            grid: {
                columns: Math.floor(MapResources.overworldTileset.width / this.mapData.tilewidth),
                rows: Math.floor(MapResources.overworldTileset.height / this.mapData.tileheight),
                spriteWidth: this.mapData.tilewidth,
                spriteHeight: this.mapData.tileheight
            }
        });

        // Process each layer from the Tiled data
        this.mapData.layers?.forEach((layer: any) => {
            if (layer.type === 'tilelayer' && layer.data) {
                console.log(`Processing tile layer: ${layer.name}`);
                
                // Add tiles to the tilemap
                for (let i = 0; i < layer.data.length; i++) {
                    const gid = layer.data[i];
                    if (gid > 0) { // 0 means empty tile
                        const tileIndex = gid - 1; // Tiled uses 1-based indexing
                        const x = i % this.mapData.width;
                        const y = Math.floor(i / this.mapData.width);
                        
                        const sprite = tilesetSprite.getSprite(
                            tileIndex % tilesetSprite.columns,
                            Math.floor(tileIndex / tilesetSprite.columns)
                        );
                        
                        this.tilemap.getTile(x, y)?.addGraphic(sprite);
                    }
                }
            }
        });

        // Add the tilemap to the scene
        this.add(this.tilemap);
        
        // Pass tilemap data to collision system
        this.WorldcollisionSystem.setTilemapData(this.tilemap, this.mapData);
    }

    private createLocalPlayer(): void {
        console.log('Creating local player...');
        
        // Find spawn point from the tilemap
        const spawnPosition = this.findPlayerSpawnPoint();
        
        // Create local player data
        const localPlayerData: PlayerData = {
            id: 'local-player-1',
            name: 'You',
            spriteImageSource: MapResources.playerSpriteSheet,
            isLocalPlayer: true
        };

        // Create the local player
        this.localPlayer = new Player(localPlayerData);
        this.add(this.localPlayer);
        
    }

    private findPlayerSpawnPoint(): ex.Vector {
        // Look for spawn area in object layers
        if (this.mapData?.layers) {
            for (const layer of this.mapData.layers) {
                if (layer.type === 'objectgroup' && layer.name === 'spawn_area') {
                    // Check if there are any objects in the spawn area layer
                    if (layer.objects && layer.objects.length > 0) {
                        console.log('Found spawn_area layer with', layer.objects.length, 'spawn zones');
                        
                        // Get all spawn area objects (rectangles)
                        const spawnZones = layer.objects.filter((obj: any) => 
                            obj.width && obj.height // Make sure it's a rectangle with dimensions
                        );
                        
                        if (spawnZones.length > 0) {
                            // Pick a random spawn zone
                            const randomZone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
                            
                            // Pick a random point within that zone
                            const randomX = randomZone.x + Math.random() * randomZone.width;
                            const randomY = randomZone.y + Math.random() * randomZone.height;
                            
                            console.log('Selected spawn zone:', randomZone.x, randomZone.y, randomZone.width, 'x', randomZone.height);
                            console.log('Random spawn point:', Math.round(randomX), Math.round(randomY));
                            
                            // No scaling needed since GameConstants.SCALE is 1
                            return ex.vec(randomX, randomY);
                        }
                        
                        // Fallback: if no rectangles, look for point objects
                        const pointObjects = layer.objects.filter((obj: any) => !obj.width && !obj.height);
                        if (pointObjects.length > 0) {
                            const randomPoint = pointObjects[Math.floor(Math.random() * pointObjects.length)];
                            console.log('Using random point object spawn:', randomPoint.x, randomPoint.y);
                            return ex.vec(randomPoint.x, randomPoint.y);
                        }
                    }
                }
            }
        }
        
        // Fallback to center of map if no spawn area found
        const centerX = (this.mapData?.width || 32) * (this.mapData?.tilewidth || 16) / 2;
        const centerY = (this.mapData?.height || 32) * (this.mapData?.tileheight || 16) / 2;
        return ex.vec(centerX, centerY);
    }

    private setupCamera(): void {
        // Set camera to follow the local player
        this.camera.strategy.lockToActor(this.localPlayer);
        console.log('Camera set to follow local player');
    }

    // Methods for multiplayer - to be used later
    public addRemotePlayer(playerData: PlayerData): Player {
        const remotePlayer = new Player(playerData);
        this.add(remotePlayer);
        console.log('Remote player added:', playerData.id);
        return remotePlayer;
    }

    public removePlayer(playerId: string): void {
        const player = this.actors.find(actor => actor.name === `player-${playerId}`);
        if (player) {
            this.remove(player);
            console.log('Player removed:', playerId);
        }
    }

    public getPlayer(playerId: string): Player | undefined {
        return this.actors.find(actor => actor.name === `player-${playerId}`) as Player;
    }
}