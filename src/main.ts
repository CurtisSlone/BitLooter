import * as ex from 'excalibur';
import { GameConfig } from './GameConfig';
import { loader } from './resources';
import { OverworldScene } from './Scenes/OverworldScene';

class BitlooterGame extends ex.Engine {
    constructor() {
        super({
            width: GameConfig.width,
            height: GameConfig.height,
            displayMode: GameConfig.displayMode,
            pixelArt: GameConfig.pixelArt,
            backgroundColor: GameConfig.backgroundColor
        });
    }

    public async initialize(): Promise<void> {
        console.log('Starting Bitlooter Game...');
        
        // Create and add the overworld scene
        const overworldScene = new OverworldScene();
        this.add('overworld', overworldScene);

        // Start the game with resource loading
        await this.start(loader);
        
        // Go to the overworld scene
        this.goToScene('overworld');
        
        console.log('Game started successfully!');
    }
}

// Create and start the game
const game = new BitlooterGame();
game.initialize().catch(error => {
    console.error('Failed to start game:', error);
});