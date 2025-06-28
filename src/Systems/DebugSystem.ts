import * as ex from 'excalibur';

export class DebugSystem extends ex.System {
    public systemType = ex.SystemType.Draw as const;
    public priority = 10;

    private font = new ex.Font({
        size: 14,
        color: ex.Color.White,
        strokeColor: ex.Color.Black
    });

    private engine!: ex.Engine;
    private debugActors: ex.ScreenElement[] = [];

    public initialize(world: ex.World, scene: ex.Scene): void {
        this.engine = scene.engine;
    }

    public update(elapsed: number): void {
        this.renderDebugInfo(elapsed);
    }

    private renderDebugInfo(elapsed: number): void {
        const scene = this.engine.currentScene;
        
        // Collect debug information
        const debugInfo = [
            `FPS: ${Math.round(this.engine.stats.currFrame.fps)}`,
            `Frame Time: ${Math.round(elapsed)}ms`,
            `Entities: ${scene.world.entityManager.entities.length}`,
            `Camera: (${Math.round(scene.camera.pos.x)}, ${Math.round(scene.camera.pos.y)})`,
            `Engine: ${this.engine.drawWidth}x${this.engine.drawHeight}`
        ];
        
        // Create debug UI elements and add them to the scene
        this.createDebugUI(debugInfo, scene);
    }

    private createDebugUI(debugInfo: string[], scene: ex.Scene): void {
        // Remove existing debug UI
        this.debugActors.forEach(actor => {
            if (scene.actors.includes(actor)) {
                scene.remove(actor);
            }
        });
        this.debugActors = [];

        // Create background
        const background = new ex.ScreenElement({
            pos: ex.vec(10, 10),
            anchor: ex.vec(0, 0),
            name: 'debug-bg'
        });

        const bgRect = new ex.Rectangle({
            width: 300,
            height: debugInfo.length * 25 + 20,
            color: new ex.Color(0, 0, 0, 0)
        });

        background.graphics.use(bgRect);
        scene.add(background);
        this.debugActors.push(background);

        // Create individual text actors for each line
        debugInfo.forEach((line, index) => {
            const textActor = new ex.ScreenElement({
                pos: ex.vec(20, 25 + (index * 25)), // 25px spacing between lines
                anchor: ex.vec(0, 0),
                name: `debug-text-${index}`
            });

            const text = new ex.Text({
                text: line,
                font: this.font
            });

            textActor.graphics.use(text);
            scene.add(textActor);
            this.debugActors.push(textActor);
        });
    }
}