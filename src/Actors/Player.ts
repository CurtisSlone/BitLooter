import * as ex from 'excalibur';
import { Resources } from '../resources.js';
import {GameConstants} from '../GameConstants.js';

// Import the CollisionSystem class for type checking
import { WorldCollisionSystem } from '../Systems/WorldCollisionSystem.js';

export interface PlayerData {
    id: string;
    name: string;
    spriteImageSource: ex.ImageSource;
    position: ex.Vector;
    isLocalPlayer: boolean;
}

export class Player extends ex.Actor {
    public readonly playerId: string;
    public readonly playerName: string;
    public readonly isLocalPlayer: boolean;
    private spriteImageSource: ex.ImageSource;
    private worldCollisionSystem: WorldCollisionSystem | null = null;
    
    // Animation properties
    private animations: { [key: string]: ex.Animation } = {};
    private currentDirection: string = 'down';
    private isMoving: boolean = false;
    
    // Collision box configuration
    private readonly COLLISION_SIZE_PERCENTAGE = 0.75; // 75% of player size (12px out of 16px)

    constructor(playerData: PlayerData) {
   
        super({
            pos: playerData.position,
            width: 16, // Base tile size
            height: 16, // Base tile size
            anchor: ex.vec(0.5, 0.5),
            scale: ex.vec(GameConstants.SCALE, GameConstants.SCALE),
            name: `player-${playerData.id}`
        });

        this.playerId = playerData.id;
        this.playerName = playerData.name;
        this.isLocalPlayer = playerData.isLocalPlayer;
        this.spriteImageSource = playerData.spriteImageSource;
        
    }

    override onInitialize(engine: ex.Engine): void {
        this.setupGraphics();
        this.setupDebugLabel();
        
        // Get reference to collision system from the scene
        const scene = engine.currentScene as any;
        if (scene.getWorldCollisionSystem) {
            this.worldCollisionSystem = scene.getWorldCollisionSystem();
            console.log('Player found collision system');
        } else {
            console.warn('Player could not find collision system');
        }
        
        // Only setup input for local player
        if (this.isLocalPlayer) {
            this.setupInput(engine);
        }
    }

    // Add this to your Player.ts setupGraphics() method

private setupGraphics(): void {
    const spriteSheet = ex.SpriteSheet.fromImageSource({
        image: this.spriteImageSource,
        grid: {
            rows: 4,
            columns: 5,
            spriteHeight: 32,
            spriteWidth: 32
        }
    });

    // Create animations for each direction
    this.animations = {
        // Idle animations (first frame of each direction)
        'idle-down': ex.Animation.fromSpriteSheet(spriteSheet, [0], 100),
        'idle-left': ex.Animation.fromSpriteSheet(spriteSheet, [10], 100),
        'idle-right': ex.Animation.fromSpriteSheet(spriteSheet, [15], 100),
        'idle-up': ex.Animation.fromSpriteSheet(spriteSheet, [5], 100),
        
        // Walking animations
        'walk-down': ex.Animation.fromSpriteSheet(spriteSheet, [0, 1], 150, ex.AnimationStrategy.PingPong),
        'walk-left': ex.Animation.fromSpriteSheet(spriteSheet, [10, 11], 150, ex.AnimationStrategy.PingPong),
        'walk-right': ex.Animation.fromSpriteSheet(spriteSheet, [15, 16], 150, ex.AnimationStrategy.PingPong),
        'walk-up': ex.Animation.fromSpriteSheet(spriteSheet, [5, 6], 150, ex.AnimationStrategy.PingPong)
    };

    // Add all animations to graphics
    Object.keys(this.animations).forEach(key => {
        this.graphics.add(key, this.animations[key]);
    });

    // Start with idle down animation (now it exists!)
    this.graphics.use('idle-down');
}

// Replace your setupInput method with this fixed version:

private setupInput(engine: ex.Engine): void {
    const speed = 100;

    engine.input.keyboard.on('hold', (evt) => {
        const delta = engine.clock.elapsed() / 1000;
        let movement = ex.vec(0, 0);

        // Check what keys are currently being held (not just the event key)
        const leftHeld = engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A);
        const rightHeld = engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D);
        const upHeld = engine.input.keyboard.isHeld(ex.Keys.Up) || engine.input.keyboard.isHeld(ex.Keys.W);
        const downHeld = engine.input.keyboard.isHeld(ex.Keys.Down) || engine.input.keyboard.isHeld(ex.Keys.S);

        // Calculate movement direction
        let moveX = 0;
        let moveY = 0;
        
        if (leftHeld) moveX = -1;
        if (rightHeld) moveX = 1;
        if (upHeld) moveY = -1;
        if (downHeld) moveY = 1;

        // Create movement vector
        if (moveX !== 0 || moveY !== 0) {
            // Check if moving diagonally (both X and Y movement)
            const isDiagonal = (moveX !== 0 && moveY !== 0);
            
            // Apply speed damping for diagonal movement
            const actualSpeed = isDiagonal ? speed * 0.43 : speed; // 0.707 ≈ 1/√2
            
            // Calculate movement with appropriate speed
            movement = ex.vec(moveX * actualSpeed * delta, moveY * actualSpeed * delta);
            
            // Determine animation direction (vertical takes priority for diagonals)
            let newDirection = this.currentDirection;
            if (Math.abs(moveY) > 0) {
                newDirection = moveY < 0 ? 'up' : 'down';
            } else if (Math.abs(moveX) > 0) {
                newDirection = moveX < 0 ? 'left' : 'right';
            }
            
            // Update direction if it changed
            if (newDirection !== this.currentDirection) {
                this.currentDirection = newDirection;
            }
            
            this.setMoving(true);
            this.moveWithCollision(movement);
        }
    });

    // Handle key release to stop animation
    engine.input.keyboard.on('release', (evt) => {
        // Check if any movement keys are still held
        const stillMoving = 
            engine.input.keyboard.isHeld(ex.Keys.Left) ||
            engine.input.keyboard.isHeld(ex.Keys.Right) ||
            engine.input.keyboard.isHeld(ex.Keys.Up) ||
            engine.input.keyboard.isHeld(ex.Keys.Down) ||
            engine.input.keyboard.isHeld(ex.Keys.A) ||
            engine.input.keyboard.isHeld(ex.Keys.W) ||
            engine.input.keyboard.isHeld(ex.Keys.S) ||
            engine.input.keyboard.isHeld(ex.Keys.D);

        if (!stillMoving) {
            this.setMoving(false);
        } else {
            // If still moving, recalculate direction based on remaining held keys
            let movement = ex.vec(0, 0);
            
            if (engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A)) {
                movement.x = -1;
            }
            if (engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D)) {
                movement.x = 1;
            }
            if (engine.input.keyboard.isHeld(ex.Keys.Up) || engine.input.keyboard.isHeld(ex.Keys.W)) {
                movement.y = -1;
            }
            if (engine.input.keyboard.isHeld(ex.Keys.Down) || engine.input.keyboard.isHeld(ex.Keys.S)) {
                movement.y = 1;
            }

            // Update direction based on remaining keys
            if (Math.abs(movement.y) > Math.abs(movement.x)) {
                this.currentDirection = movement.y < 0 ? 'up' : 'down';
            } else if (Math.abs(movement.x) > 0) {
                this.currentDirection = movement.x < 0 ? 'left' : 'right';
            }
            
            this.updateAnimation();
        }
    });
}

// Add this new method to handle animation state changes

private setMoving(moving: boolean): void {
    if (this.isMoving !== moving) {
        this.isMoving = moving;
        this.updateAnimation();
    }
}

private updateAnimation(): void {
    const prefix = this.isMoving ? 'walk' : 'idle';
    const animationKey = `${prefix}-${this.currentDirection}`;
    
    if (this.animations[animationKey]) {
        this.graphics.use(animationKey);
    }
}

// Update your moveWithCollision method to handle animation when movement is blocked

private moveWithCollision(movement: ex.Vector): void {
    if (!this.worldCollisionSystem) {
        this.pos = this.pos.add(movement);
        return;
    }

    const originalPosition = this.pos.clone();
    const newPosition = this.pos.add(movement);
    
    const fullWidth = (this.width * this.scale.x);
    const fullHeight = (this.height * this.scale.y);
    
    const collisionWidth = fullWidth * 0.9;
    const collisionHeight = fullHeight * 0.9;
    
    const halfWidth = collisionWidth / 2;
    const halfHeight = collisionHeight / 2;
    
    const bounds = new ex.BoundingBox({
        left: newPosition.x - halfWidth,
        right: newPosition.x + halfWidth,
        top: newPosition.y - halfHeight,
        bottom: newPosition.y + halfHeight
    });

    if (!this.worldCollisionSystem.checkRectangleCollision(bounds)) {
        this.pos = newPosition;
    } else {
        this.trySlideMovement(movement);
    }

    // If position didn't change (blocked by collision), stop walking animation
    if (this.pos.distance(originalPosition) < 0.1) {
        this.setMoving(false);
    } else {
        this.setMoving(true);
    }
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

    



    private trySlideMovement(movement: ex.Vector): void {
        if (!this.worldCollisionSystem) return;

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

            if (!this.worldCollisionSystem.checkRectangleCollision(horizontalBounds)) {
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

            if (!this.worldCollisionSystem.checkRectangleCollision(verticalBounds)) {
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
            // color: this.playerColor,
            spriteImageSource: this.spriteImageSource,
            position: this.pos,
            isLocalPlayer: this.isLocalPlayer
        };
    }

    // For future networking
    public sendPositionUpdate(position: ex.Vector): void {
        // TODO: Send position update to server
        console.log(`Player ${this.playerId} moved to:`, position);
    }
}