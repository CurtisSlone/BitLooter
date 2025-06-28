import * as ex from 'excalibur';
import { Resources } from '../resources.js';
import { DebugSystem } from '../Systems/DebugSystem.js';
import { Player, PlayerData } from '../Actors/Player.js';

export class OverworldScene extends ex.Scene {
    private background!: ex.Actor;
    private localPlayer!: Player;

    override onInitialize(_engine: ex.Engine): void {
        console.log('Initializing Overworld Scene...');
        
        // Add debug system to show info
        this.world.add(new DebugSystem());

        // Create the background/map
        this.createBackground();
        
        // Create the local player
        this.createLocalPlayer();

        // Setup camera to follow local player
        this.setupCamera();

        console.log('Overworld Scene initialized successfully');
    }

    private createBackground(): void {
        console.log('Creating background...');
        console.log('Image loaded?', Resources.overworldMap.isLoaded());
        console.log('Image data:', Resources.overworldMap.data);
        
        // Create background actor (using Actor for simplicity)
        this.background = new ex.Actor({
            pos: ex.vec(0, 0),
            anchor: ex.vec(0, 0), // Top-left anchor
            scale: ex.vec(2, 2) // 2x scale for pixel art
        });

        // Check if the image is loaded before creating sprite
        if (Resources.overworldMap.isLoaded()) {
            const backgroundSprite = Resources.overworldMap.toSprite();
            console.log('Sprite created:', backgroundSprite);
            this.background.graphics.use(backgroundSprite);
        } else {
            console.error('Image not loaded yet!');
            // Create a temporary colored rectangle as fallback
            this.background.graphics.use(new ex.Rectangle({
                width: 400,
                height: 300,
                color: ex.Color.Green
            }));
        }

        // Add to scene
        this.add(this.background);
        console.log('Background added to scene');
    }

    private createLocalPlayer(): void {
        console.log('Creating local player...');
        
        // Create local player data
        const localPlayerData: PlayerData = {
            id: 'local-player-1',
            name: 'You',
            color: ex.Color.Blue,
            position: ex.vec(400, 300), // Center of screen
            isLocalPlayer: true
        };

        // Create the local player
        this.localPlayer = new Player(localPlayerData);
        this.add(this.localPlayer);
        
        console.log('Local player created:', this.localPlayer.playerId);
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