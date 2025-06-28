import * as ex from 'excalibur';

export interface PlayerData {
    id: string;
    name: string;
    color: ex.Color;
    position: ex.Vector;
    isLocalPlayer: boolean;
}

export class Player extends ex.Actor {
    public readonly playerId: string;
    public readonly playerName: string;
    public readonly isLocalPlayer: boolean;
    private playerColor: ex.Color;

    constructor(playerData: PlayerData) {
        // Player scale should match map scale for consistency
        const PLAYER_SCALE = 2; // Should match MAP_SCALE in OverworldScene
        
        super({
            pos: playerData.position,
            width: 16, // Base tile size
            height: 16, // Base tile size
            anchor: ex.vec(0.5, 0.5),
            scale: ex.vec(PLAYER_SCALE, PLAYER_SCALE),
            name: `player-${playerData.id}`
        });

        this.playerId = playerData.id;
        this.playerName = playerData.name;
        this.isLocalPlayer = playerData.isLocalPlayer;
        this.playerColor = playerData.color;
    }

    override onInitialize(_engine: ex.Engine): void {
        this.setupGraphics();
        this.setupDebugLabel();
        
        // Only setup input for local player
        if (this.isLocalPlayer) {
            this.setupInput(_engine);
        }
    }

    private setupGraphics(): void {
        // Create a simple colored rectangle for now
        // This will be replaced with actual sprite later
        const playerRect = new ex.Rectangle({
            width: 16,
            height: 16,
            color: this.playerColor
        });

        // Add a white border to distinguish players
        const border = new ex.Rectangle({
            width: 18,
            height: 18,
            color: ex.Color.White,
            strokeColor: ex.Color.Black,
            lineWidth: 1
        });

        // Create graphics group with border and player color
        const playerGraphics = new ex.GraphicsGroup({
            members: [
                {
                    graphic: border,
                    offset: ex.vec(0, 0)
                },
                {
                    graphic: playerRect,
                    offset: ex.vec(0, 0)
                }
            ]
        });

        this.graphics.use(playerGraphics);
    }

    private setupDebugLabel(): void {
        // Add player name above the player
        const nameText = new ex.Text({
            text: this.playerName,
            font: new ex.Font({
                size: 8,
                color: ex.Color.White,
                strokeColor: ex.Color.Black
            })
        });

        const nameLabel = new ex.Actor({
            pos: ex.vec(0, -25), // Above the player
            anchor: ex.vec(0.5, 0.5)
        });

        nameLabel.graphics.use(nameText);
        this.addChild(nameLabel);
    }

    private setupInput(engine: ex.Engine): void {
        // Simple keyboard input for local player only
        // No movement component - direct position manipulation
        const speed = 100; // pixels per second

        engine.input.keyboard.on('hold', (evt) => {
            const delta = engine.clock.elapsed() / 1000; // Convert to seconds
            let movement = ex.vec(0, 0);

            if (evt.key.includes(ex.Keys.Left) || evt.key.includes(ex.Keys.A)) {
                movement.x = -speed * delta;
            }
            if (evt.key.includes(ex.Keys.Right) || evt.key.includes(ex.Keys.D)) {
                movement.x = speed * delta;
            }
            if (evt.key.includes(ex.Keys.Up) || evt.key.includes(ex.Keys.W)) {
                movement.y = -speed * delta;
            }
            if (evt.key.includes(ex.Keys.Down) || evt.key.includes(ex.Keys.S)) {
                movement.y = speed * delta;
            }

            // Apply movement
            if (movement.magnitude > 0) {
                this.pos = this.pos.add(movement);
                
                // For multiplayer: This is where you'd send position updates
                // this.sendPositionUpdate(this.pos);
            }
        });
    }

    // Methods for multiplayer synchronization
    public updatePosition(newPosition: ex.Vector): void {
        // For remote players: update position from network data
        if (!this.isLocalPlayer) {
            this.pos = newPosition;
        }
    }

    public getPlayerData(): PlayerData {
        return {
            id: this.playerId,
            name: this.playerName,
            color: this.playerColor,
            position: this.pos,
            isLocalPlayer: this.isLocalPlayer
        };
    }

    // For future networking
    public sendPositionUpdate(position: ex.Vector): void {
        // TODO: Send position update to server
        console.log(`Player ${this.playerId} moved to:`, position);
    }

    public changeColor(newColor: ex.Color): void {
        this.playerColor = newColor;
        this.setupGraphics(); // Rebuild graphics with new color
    }
}