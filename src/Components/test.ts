// ========================================
// EXCALIBUR'S ACTUAL SYSTEM API
// ========================================

import * as ex from 'excalibur';
import { GameConstants } from '../GameConstants.js';

// ========================================
// COMPONENTS (Data Only)
// ========================================

export class PlayerComponent extends ex.Component {
    public playerId: string;
    public playerName: string;
    public isLocalPlayer: boolean;
    public spriteImageSource: ex.ImageSource;

    constructor(playerId: string, playerName: string, isLocalPlayer: boolean, spriteImageSource: ex.ImageSource) {
        super();
        this.playerId = playerId;
        this.playerName = playerName;
        this.isLocalPlayer = isLocalPlayer;
        this.spriteImageSource = spriteImageSource;
    }
}

export class InputComponent extends ex.Component {
    public movementVector: ex.Vector = ex.vec(0, 0);
    public isLocalPlayer: boolean;
    public keyMapping: KeyMapping;
    public actionInputs: Map<string, boolean> = new Map();
    public previousActionInputs: Map<string, boolean> = new Map();
    
    constructor(keyMapping: KeyMapping, isLocalPlayer: boolean = true) {
        super();
        this.keyMapping = keyMapping;
        this.isLocalPlayer = isLocalPlayer;
    }
}

export class MovementComponent extends ex.Component {
    public currentDirection: string = 'down';
    public isMoving: boolean = false;
    public speed: number = 100;
    public velocity: ex.Vector = ex.vec(0, 0);
    
    constructor(speed: number = 100) {
        super();
        this.speed = speed;
    }
}

export class AnimationComponent extends ex.Component {
    public animations: { [key: string]: ex.Animation } = {};
    public currentDirection: string = 'down';
    public isMoving: boolean = false;
    public spriteImageSource: ex.ImageSource;
    public isInitialized: boolean = false;

    constructor(spriteImageSource: ex.ImageSource) {
        super();
        this.spriteImageSource = spriteImageSource;
    }
}

export class CollisionComponent extends ex.Component {
    public worldCollisionSystem: any = null;
    public readonly COLLISION_SIZE_PERCENTAGE: number = 0.75;
    
    constructor(collisionSizePercentage: number = 0.75) {
        super();
        this.COLLISION_SIZE_PERCENTAGE = collisionSizePercentage;
    }
}

// ========================================
// EXCALIBUR SYSTEMS (Actual API)
// ========================================

export class InputSystem extends ex.System {
    public systemtype = ex.SystemType.Update;
    private engine: ex.Engine | null = null;

    public initialize(scene: ex.Scene, engine: ex.Engine): void {
        this.engine = engine;
    }

    public update(scene: ex.Scene, delta: number): void {
        if (!this.engine) return;

        // In Excalibur, you manually query for entities with specific components
        const entitiesWithInput = scene.world.query([InputComponent]);
        
        entitiesWithInput.entities.forEach(entity => {
            const inputComponent = entity.get(InputComponent);
            if (!inputComponent || !inputComponent.isLocalPlayer) return;

            this.processKeyboardInput(inputComponent);
        });
    }

    private processKeyboardInput(inputComponent: InputComponent): void {
        if (!this.engine) return;

        // Store previous frame's inputs
        inputComponent.actionInputs.forEach((value, key) => {
            inputComponent.previousActionInputs.set(key, value);
        });

        // Your original input logic
        let moveX = 0;
        let moveY = 0;
        
        const leftHeld = this.isAnyKeyHeld(inputComponent.keyMapping.moveLeft);
        const rightHeld = this.isAnyKeyHeld(inputComponent.keyMapping.moveRight);
        const upHeld = this.isAnyKeyHeld(inputComponent.keyMapping.moveUp);
        const downHeld = this.isAnyKeyHeld(inputComponent.keyMapping.moveDown);

        if (leftHeld) moveX = -1;
        if (rightHeld) moveX = 1;
        if (upHeld) moveY = -1;
        if (downHeld) moveY = 1;

        inputComponent.movementVector = ex.vec(moveX, moveY);

        // Handle action inputs
        Object.keys(inputComponent.keyMapping).forEach(action => {
            if (!['moveLeft', 'moveRight', 'moveUp', 'moveDown'].includes(action)) {
                const isPressed = this.isAnyKeyHeld(inputComponent.keyMapping[action]);
                inputComponent.actionInputs.set(action, isPressed);
            }
        });
    }

    private isAnyKeyHeld(keys: ex.Keys[]): boolean {
        if (!this.engine || !keys) return false;
        return keys.some(key => this.engine!.input.keyboard.isHeld(key));
    }
}

export class MovementSystem extends ex.System {
    public systemtype = ex.SystemType.Update;

    public update(scene: ex.Scene, delta: number): void {
        // Query for entities that have ALL required components
        const movableEntities = scene.world.query([ex.TransformComponent, MovementComponent, InputComponent]);
        
        movableEntities.entities.forEach(entity => {
            const transform = entity.get(ex.TransformComponent);
            const movement = entity.get(MovementComponent);
            const input = entity.get(InputComponent);

            if (!transform || !movement || !input) return;

            const inputVector = input.movementVector;
            
            if (inputVector.magnitude > 0) {
                // Your original movement logic
                const isDiagonal = (inputVector.x !== 0 && inputVector.y !== 0);
                const actualSpeed = isDiagonal ? movement.speed * 0.43 : movement.speed;
                
                movement.velocity = ex.vec(
                    inputVector.x * actualSpeed * (delta / 1000),
                    inputVector.y * actualSpeed * (delta / 1000)
                );
                
                // Direction logic
                let newDirection = movement.currentDirection;
                if (Math.abs(inputVector.y) > 0) {
                    newDirection = inputVector.y < 0 ? 'up' : 'down';
                } else if (Math.abs(inputVector.x) > 0) {
                    newDirection = inputVector.x < 0 ? 'left' : 'right';
                }
                
                movement.currentDirection = newDirection;
                movement.isMoving = true;
            } else {
                movement.velocity = ex.vec(0, 0);
                movement.isMoving = false;
            }
        });
    }
}

export class CollisionSystem extends ex.System {
    public systemtype = ex.SystemType.Update;

    public update(scene: ex.Scene, delta: number): void {
        // Query for entities with collision capabilities
        const collidableEntities = scene.world.query([ex.TransformComponent, MovementComponent, CollisionComponent]);
        
        collidableEntities.entities.forEach(entity => {
            const transform = entity.get(ex.TransformComponent);
            const movement = entity.get(MovementComponent);
            const collision = entity.get(CollisionComponent);

            if (!transform || !movement || !collision || movement.velocity.magnitude === 0) return;

            this.moveWithCollision(entity, transform, movement, collision);
        });
    }

    private moveWithCollision(entity: ex.Entity, transform: ex.TransformComponent, movement: MovementComponent, collision: CollisionComponent): void {
        if (!collision.worldCollisionSystem) {
            transform.pos = transform.pos.add(movement.velocity);
            return;
        }

        // Your original collision logic
        const originalPosition = transform.pos.clone();
        const newPosition = transform.pos.add(movement.velocity);
        
        const actor = entity as any;
        const fullWidth = (actor.width * actor.scale.x);
        const fullHeight = (actor.height * actor.scale.y);
        
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

        if (!collision.worldCollisionSystem.checkRectangleCollision(bounds)) {
            transform.pos = newPosition;
        } else {
            this.trySlideMovement(entity, transform, movement, collision);
        }

        // Update movement state based on actual position change
        if (transform.pos.distance(originalPosition) < 0.1) {
            movement.isMoving = false;
        } else {
            movement.isMoving = true;
        }
    }

    private trySlideMovement(entity: ex.Entity, transform: ex.TransformComponent, movement: MovementComponent, collision: CollisionComponent): void {
        if (!collision.worldCollisionSystem) return;

        const actor = entity as any;
        const fullWidth = (actor.width * actor.scale.x);
        const fullHeight = (actor.height * actor.scale.y);
        
        const collisionWidth = fullWidth * 0.9;
        const collisionHeight = fullHeight * 0.9;
        
        const halfWidth = collisionWidth / 2;
        const halfHeight = collisionHeight / 2;

        // Try horizontal movement only
        if (movement.velocity.x !== 0) {
            const horizontalPos = transform.pos.add(ex.vec(movement.velocity.x, 0));
            const horizontalBounds = new ex.BoundingBox({
                left: horizontalPos.x - halfWidth,
                right: horizontalPos.x + halfWidth,
                top: horizontalPos.y - halfHeight,
                bottom: horizontalPos.y + halfHeight
            });

            if (!collision.worldCollisionSystem.checkRectangleCollision(horizontalBounds)) {
                transform.pos = horizontalPos;
                return;
            }
        }

        // Try vertical movement only
        if (movement.velocity.y !== 0) {
            const verticalPos = transform.pos.add(ex.vec(0, movement.velocity.y));
            const verticalBounds = new ex.BoundingBox({
                left: verticalPos.x - halfWidth,
                right: verticalPos.x + halfWidth,
                top: verticalPos.y - halfHeight,
                bottom: verticalPos.y + halfHeight
            });

            if (!collision.worldCollisionSystem.checkRectangleCollision(verticalBounds)) {
                transform.pos = verticalPos;
            }
        }
    }
}

export class AnimationSystem extends ex.System {
    public systemtype = ex.SystemType.Update;

    public update(scene: ex.Scene, delta: number): void {
        // Query for entities with animation capabilities
        const animatedEntities = scene.world.query([AnimationComponent, MovementComponent]);
        
        animatedEntities.entities.forEach(entity => {
            const animation = entity.get(AnimationComponent);
            const movement = entity.get(MovementComponent);

            if (!animation || !movement) return;

            // Setup animations if not done yet
            if (!animation.isInitialized) {
                this.setupAnimations(animation, entity);
                animation.isInitialized = true;
            }

            // Update animation based on movement state
            if (movement.currentDirection !== animation.currentDirection || 
                movement.isMoving !== animation.isMoving) {
                
                animation.currentDirection = movement.currentDirection;
                animation.isMoving = movement.isMoving;
                this.updateAnimation(animation, entity);
            }
        });
    }

    private setupAnimations(animation: AnimationComponent, entity: ex.Entity): void {
        // Your original setupGraphics logic
        const spriteSheet = ex.SpriteSheet.fromImageSource({
            image: animation.spriteImageSource,
            grid: {
                rows: 4,
                columns: 5,
                spriteHeight: 32,
                spriteWidth: 32
            }
        });

        animation.animations = {
            'idle-down': ex.Animation.fromSpriteSheet(spriteSheet, [0], 100),
            'idle-left': ex.Animation.fromSpriteSheet(spriteSheet, [10], 100),
            'idle-right': ex.Animation.fromSpriteSheet(spriteSheet, [15], 100),
            'idle-up': ex.Animation.fromSpriteSheet(spriteSheet, [5], 100),
            'walk-down': ex.Animation.fromSpriteSheet(spriteSheet, [0, 1], 150, ex.AnimationStrategy.PingPong),
            'walk-left': ex.Animation.fromSpriteSheet(spriteSheet, [10, 11], 150, ex.AnimationStrategy.PingPong),
            'walk-right': ex.Animation.fromSpriteSheet(spriteSheet, [15, 16], 150, ex.AnimationStrategy.PingPong),
            'walk-up': ex.Animation.fromSpriteSheet(spriteSheet, [5, 6], 150, ex.AnimationStrategy.PingPong)
        };

        const actor = entity as any;
        if (actor.graphics) {
            Object.keys(animation.animations).forEach(key => {
                actor.graphics.add(key, animation.animations[key]);
            });
            actor.graphics.use('idle-down');
        }
    }

    private updateAnimation(animation: AnimationComponent, entity: ex.Entity): void {
        const prefix = animation.isMoving ? 'walk' : 'idle';
        const animationKey = `${prefix}-${animation.currentDirection}`;
        
        const actor = entity as any;
        if (actor.graphics && animation.animations[animationKey]) {
            actor.graphics.use(animationKey);
        }
    }
}

// ========================================
// ECS PLAYER ENTITY
// ========================================

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

export const DEFAULT_PLAYER_KEYS: KeyMapping = {
    moveLeft: [ex.Keys.Left, ex.Keys.A],
    moveRight: [ex.Keys.Right, ex.Keys.D],
    moveUp: [ex.Keys.Up, ex.Keys.W],
    moveDown: [ex.Keys.Down, ex.Keys.S],
    action1: [ex.Keys.Space],
    action2: [ex.Keys.Enter],
    interact: [ex.Keys.E],
    menu: [ex.Keys.Escape]
};

export class ECSPlayer extends ex.Actor {
    constructor(playerData: PlayerData, keyMapping: KeyMapping = DEFAULT_PLAYER_KEYS) {
        super({
            pos: playerData.position,
            width: 16,
            height: 16,
            anchor: ex.vec(0.5, 0.5),
            scale: ex.vec(GameConstants.SCALE, GameConstants.SCALE),
            name: `player-${playerData.id}`
        });

        // Add components (data extracted from your original Player)
        this.addComponent(new PlayerComponent(
            playerData.id, 
            playerData.name, 
            playerData.isLocalPlayer, 
            playerData.spriteImageSource
        ));
        
        this.addComponent(new InputComponent(keyMapping, playerData.isLocalPlayer));
        this.addComponent(new MovementComponent(100));
        this.addComponent(new AnimationComponent(playerData.spriteImageSource));
        this.addComponent(new CollisionComponent(0.75));

        this.setupDebugLabel(playerData.name);
    }

    private setupDebugLabel(playerName: string): void {
        const nameText = new ex.Text({
            text: playerName,
            font: new ex.Font({
                size: 8,
                color: ex.Color.White,
                strokeColor: ex.Color.Black
            })
        });

        const nameLabel = new ex.Actor({
            pos: ex.vec(0, -25),
            anchor: ex.vec(0.5, 0.5)
        });

        nameLabel.graphics.use(nameText);
        this.addChild(nameLabel);
    }

    // Your original multiplayer methods stay
    public updatePosition(newPosition: ex.Vector): void {
        if (!this.get(PlayerComponent)?.isLocalPlayer) {
            this.pos = newPosition;
        }
    }

    public getPlayerData(): PlayerData {
        const playerComp = this.get(PlayerComponent)!;
        return {
            id: playerComp.playerId,
            name: playerComp.playerName,
            spriteImageSource: playerComp.spriteImageSource,
            position: this.pos,
            isLocalPlayer: playerComp.isLocalPlayer
        };
    }
}

// ========================================
// SCENE SETUP WITH PROPER EXCALIBUR API
// ========================================

export class GameScene extends ex.Scene {
    private inputSystem!: InputSystem;
    private movementSystem!: MovementSystem;
    private collisionSystem!: CollisionSystem;
    private animationSystem!: AnimationSystem;

    public onInitialize(engine: ex.Engine): void {
        // Create systems
        this.inputSystem = new InputSystem();
        this.movementSystem = new MovementSystem();
        this.collisionSystem = new CollisionSystem();
        this.animationSystem = new AnimationSystem();

        // Initialize systems that need engine reference
        this.inputSystem.initialize(this, engine);

        // Add systems to the world
        this.world.add(this.inputSystem);
        this.world.add(this.movementSystem);
        this.world.add(this.collisionSystem);
        this.world.add(this.animationSystem);

        this.setupEntities();
        this.connectWorldCollisionSystem();
    }

    private setupEntities(): void {
        // Create player with ECS components
        const playerData: PlayerData = {
            id: '1',
            name: 'Player 1',
            spriteImageSource: Resources.Player1Sprite,
            position: ex.vec(100, 100),
            isLocalPlayer: true
        };
        
        const player = new ECSPlayer(playerData, DEFAULT_PLAYER_KEYS);
        this.add(player);
    }

    private connectWorldCollisionSystem(): void {
        // Connect your existing WorldCollisionSystem
        const worldCollisionSystem = (this as any).getWorldCollisionSystem?.();
        
        if (worldCollisionSystem) {
            // Update all collision components
            const collidableEntities = this.world.query([CollisionComponent]);
            collidableEntities.entities.forEach(entity => {
                const collisionComponent = entity.get(CollisionComponent);
                if (collisionComponent) {
                    collisionComponent.worldCollisionSystem = worldCollisionSystem;
                }
            });
            console.log('World collision system connected to ECS');
        }
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

export function createPlayer(scene: ex.Scene, playerData: PlayerData, keyMapping?: KeyMapping): ECSPlayer {
    const player = new ECSPlayer(playerData, keyMapping);
    scene.add(player);
    return player;
}

// Usage comparison:
/*
// BEFORE:
const playerData = { ... };
const player = new Player(playerData);
scene.add(player);

// AFTER:
const playerData = { ... };
const player = createPlayer(scene, playerData, CUSTOM_KEY_MAPPING);
// Systems automatically handle input, movement, collision, animation!
*/