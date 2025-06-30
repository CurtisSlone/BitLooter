import * as ex from 'excalibur';
import { Resources } from '../resources.js';
import { DebugSystem } from '../Systems/DebugSystem.js';
import { CollisionSystem } from '../Systems/CollisionSystem.js';
import { Player, PlayerData } from '../Actors/Player.js';

export class OverworldScene extends ex.Scene {
    private tilemap!: ex.TileMap;
    private localPlayer!: Player;
    private mapData: any; // Store the loaded Tiled JSON data
    private collisionSystem!: CollisionSystem;

    // Make collision system accessible to other actors
    public getCollisionSystem(): CollisionSystem {
        return this.collisionSystem;
    }

    override onInitialize(_engine: ex.Engine): void {
        console.log('Initializing Overworld Scene...');
        
        // Add systems to the scene
        this.world.add(new DebugSystem());
        this.collisionSystem = new CollisionSystem();
        this.world.add(this.collisionSystem);

        // Create the tilemap from Tiled data
        this.createTilemap();
        
        // Create the local player
        this.createLocalPlayer();

        // Setup camera to follow local player
        this.setupCamera();

        console.log('Overworld Scene initialized successfully');
    }

    private createTilemap(): void {
        console.log('Creating tilemap from Tiled...');
        
        if (!Resources.overworldTilemap.isLoaded()) {
            console.error('Tiled map not loaded yet!');
            return;
        }

        // Get the loaded JSON data
        this.mapData = Resources.overworldTilemap.data;
        console.log('Map data loaded:', this.mapData);
        console.log('Map dimensions:', this.mapData.width, 'x', this.mapData.height);
        console.log('Tile size:', this.mapData.tilewidth, 'x', this.mapData.tileheight);

        // Create tilemap manually using the JSON data
        this.tilemap = new ex.TileMap({
            columns: this.mapData.width,
            rows: this.mapData.height,
            tileWidth: this.mapData.tilewidth,
            tileHeight: this.mapData.tileheight
        });

        // Scale the tilemap to match pixel art style
        // Options: 1 = original size, 2 = double size, 3 = triple size
        const MAP_SCALE = 2; // Change this value to adjust map scale
        this.tilemap.scale = ex.vec(MAP_SCALE, MAP_SCALE);

        console.log(`Map scaled to ${MAP_SCALE}x`);
        console.log(`Final map size: ${this.mapData.width * this.mapData.tilewidth * MAP_SCALE} x ${this.mapData.height * this.mapData.tileheight * MAP_SCALE} pixels`);

        // Create a sprite sheet from the tileset
        const tilesetSprite = ex.SpriteSheet.fromImageSource({
            image: Resources.overworldTileset,
            grid: {
                columns: Math.floor(Resources.overworldTileset.width / this.mapData.tilewidth),
                rows: Math.floor(Resources.overworldTileset.height / this.mapData.tileheight),
                spriteWidth: this.mapData.tilewidth,
                spriteHeight: this.mapData.tileheight
            }
        });

        console.log('Tileset sprite sheet created with', tilesetSprite.columns, 'x', tilesetSprite.rows, 'tiles');

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
                        
                        const tile = this.tilemap.getTile(x, y);
                        if (tile) {
                            tile.addGraphic(sprite);
                            
                            // Add red outline to collision objects (floor_objects layer)
                            if (layer.name === 'floor_objects') {
                                const redOutline = new ex.Rectangle({
                                    width: this.mapData.tilewidth,
                                    height: this.mapData.tileheight,
                                    color: ex.Color.Transparent,
                                    strokeColor: ex.Color.Red,
                                    lineWidth: 2
                                });
                                tile.addGraphic(redOutline);
                            }
                        }
                    }
                }
            }
        });

        // Add the tilemap to the scene
        this.add(this.tilemap);
        
        // Pass tilemap data to collision system
        this.collisionSystem.setTilemapData(this.tilemap, this.mapData);
        
        console.log('Tilemap created and added to scene');
        console.log('Map size:', this.tilemap.columns, 'x', this.tilemap.rows);
        console.log('Tilemap scale:', this.tilemap.scale);
    }

    private createLocalPlayer(): void {
        console.log('Creating local player...');
        
        // Find spawn point from the tilemap
        const spawnPosition = this.findPlayerSpawnPoint();
        
        // Create local player data
        const localPlayerData: PlayerData = {
            id: 'local-player-1',
            name: 'You',
            color: ex.Color.Blue,
            position: spawnPosition,
            isLocalPlayer: true
        };

        // Create the local player
        this.localPlayer = new Player(localPlayerData);
        this.add(this.localPlayer);
        
        console.log('Local player created at:', spawnPosition);
    }

    private findPlayerSpawnPoint(): ex.Vector {
        // Look for spawn point in object layers
        if (this.mapData?.layers) {
            for (const layer of this.mapData.layers) {
                if (layer.type === 'objectgroup' && layer.name === 'spawn_area') {
                    for (const obj of layer.objects || []) {
                        if (obj.name === 'player_spawn') {
                            console.log('Found player spawn in tilemap:', obj.x, obj.y);
                            // Scale the spawn position to match map scale
                            return ex.vec(obj.x * 2, obj.y * 2); // Multiply by MAP_SCALE
                        }
                    }
                }
            }
        }
        
        // Fallback to center of map if no spawn point found
        console.log('Using fallback spawn position');
        const centerX = (this.mapData?.width || 32) * (this.mapData?.tilewidth || 16);
        const centerY = (this.mapData?.height || 32) * (this.mapData?.tileheight || 16);
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