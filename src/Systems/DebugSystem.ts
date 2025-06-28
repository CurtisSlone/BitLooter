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

    public initialize(_world: ex.World, scene: ex.Scene): void {
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
        const existingDebug = scene.actors.find(a => a.name === 'debug-ui');
        if (existingDebug) {
            scene.remove(existingDebug);
        }

        // Create a screen element for debug info
        const debugActor = new ex.ScreenElement({
            pos: ex.vec(10, 10),
            anchor: ex.vec(0, 0),
            name: 'debug-ui'
        });

        // Create background rectangle
        const bgWidth = 300;
        const bgHeight = debugInfo.length * 18 + 10;
        const background = new ex.Rectangle({
            width: bgWidth,
            height: bgHeight,
            color: new ex.Color(0, 0, 0, 0.7)
        });

        debugActor.graphics.use(background);

        // Create text for each debug line
        const textGroup = new ex.GraphicsGroup({
            members: debugInfo.map((line, index) => ({
                graphic: new ex.Text({
                    text: line,
                    font: this.font
                }),
                pos: ex.vec(5, 15 + (index * 18)),
                offset: ex.vec(0, 0)
            }))
        });

        debugActor.graphics.use(textGroup);
        scene.add(debugActor);
    }
}