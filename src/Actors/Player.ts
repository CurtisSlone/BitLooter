import * as ex from 'excalibur';

// Import the CollisionSystem class for type checking
import { CollisionSystem } from '../Systems/CollisionSystem.js';

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
    private collisionSystem: CollisionSystem | null = null;
    
    // Collision box configuration
    private readonly COLLISION_SIZE_PERCENTAGE = 0.75; // 75% of player size (12px out of 16px)

    constructor(playerData: PlayerData) {
        // Player scale should match map scale for consistency
        const PLAYER_SCALE = 1; // Match the map scale
        
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

        // Log collision box info
        const fullSize = this.width * this.scale.x;
        const collisionSize = fullSize * this.COLLISION_SIZE_PERCENTAGE;
        console.log('Player visual size:', fullSize + 'x' + fullSize + 'px');
        console.log('Player collision size:', collisionSize + 'x' + collisionSize + 'px (' + (this.COLLISION_SIZE_PERCENTAGE * 100) + '%)');
    }

    override onInitialize(engine: ex.Engine): void {
        this.setupGraphics();
        this.setupDebugLabel();
        
        // Get reference to collision system from the scene
        const scene = engine.currentScene as any;
        if (scene.getCollisionSystem) {
            this.collisionSystem = scene.getCollisionSystem();
            console.log('Player found collision system');
        } else {
            console.warn('Player could not find collision system');
        }
        
        // Only setup input for local player
        if (this.isLocalPlayer) {
            this.setupInput(engine);
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
        const speed = 65; // pixels per second

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

            // Apply movement with collision checking
            if (movement.magnitude > 0) {
                this.moveWithCollision(movement);
            }
        });
    }

    private moveWithCollision(movement: ex.Vector): void {
        if (!this.collisionSystem) {
            // No collision system, move freely
            this.pos = this.pos.add(movement);
            return;
        }

        // Calculate new position
        const newPosition = this.pos.add(movement);
        
        // Create bounding box for collision check
        // Reduce collision area by 10% to make it more forgiving
        const fullWidth = (this.width * this.scale.x);
        const fullHeight = (this.height * this.scale.y);
        
        const collisionWidth = fullWidth * 0.9; // 90% of full size
        const collisionHeight = fullHeight * 0.9; // 90% of full size
        
        const halfWidth = collisionWidth / 2;
        const halfHeight = collisionHeight / 2;
        
        const bounds = new ex.BoundingBox({
            left: newPosition.x - halfWidth,
            right: newPosition.x + halfWidth,
            top: newPosition.y - halfHeight,
            bottom: newPosition.y + halfHeight
        });

        // Check collision at new position
        if (!this.collisionSystem.checkRectangleCollision(bounds)) {
            // No collision, move to new position
            this.pos = newPosition;
        } else {
            // Collision detected, try sliding along walls
            this.trySlideMovement(movement);
        }
    }

    private trySlideMovement(movement: ex.Vector): void {
        if (!this.collisionSystem) return;

        // Use the same reduced collision size for sliding
        const fullWidth = (this.width * this.scale.x);
        const fullHeight = (this.height * this.scale.y);
        
        const collisionWidth = fullWidth * 0.9; // 90% of full size
        const collisionHeight = fullHeight * 0.9; // 90% of full size
        
        const halfWidth = collisionWidth / 2;
        const halfHeight = collisionHeight / 2;

        // Try horizontal movement only
        if (movement.x !== 0) {
            const horizontalPos = this.pos.add(ex.vec(movement.x, 0));
            const horizontalBounds = new ex.BoundingBox({
                left: horizontalPos.x - halfWidth,
                right: horizontalPos.x + halfWidth,
                top: horizontalPos.y - halfHeight,
                bottom: horizontalPos.y + halfHeight
            });

            if (!this.collisionSystem.checkRectangleCollision(horizontalBounds)) {
                this.pos = horizontalPos;
                return;
            }
        }

        // Try vertical movement only
        if (movement.y !== 0) {
            const verticalPos = this.pos.add(ex.vec(0, movement.y));
            const verticalBounds = new ex.BoundingBox({
                left: verticalPos.x - halfWidth,
                right: verticalPos.x + halfWidth,
                top: verticalPos.y - halfHeight,
                bottom: verticalPos.y + halfHeight
            });

            if (!this.collisionSystem.checkRectangleCollision(verticalBounds)) {
                this.pos = verticalPos;
            }
        }
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