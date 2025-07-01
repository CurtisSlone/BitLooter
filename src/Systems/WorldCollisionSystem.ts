import * as ex from 'excalibur';

export class WorldCollisionSystem extends ex.System {
    public systemType = ex.SystemType.Update as const;
    public priority = 95; // Run before movement updates

    private tilemap: ex.TileMap | null = null;
    private collisionLayer: any = null; // Tiled layer data

    public initialize(_world: ex.World, _scene: ex.Scene): void {
        // We'll set the tilemap reference from the scene
    }

    public setTilemapData(tilemap: ex.TileMap, mapData: any): void {
        this.tilemap = tilemap;
        
        // Find the floor_objects layer for collision
        this.collisionLayer = mapData.layers?.find((layer: any) => 
            layer.type === 'tilelayer' && layer.name === 'floor_objects'
        );
    }

    public update(_elapsed: number): void {
        // This system doesn't process entities automatically
        // Instead, it provides collision checking methods for other systems to use
    }

    public checkCollision(worldPosition: ex.Vector): boolean {
        if (!this.tilemap || !this.collisionLayer) {
            return false; // No collision if no tilemap
        }

        // Convert world position to tile coordinates
        const tileX = Math.floor(worldPosition.x / (this.tilemap.tileWidth * this.tilemap.scale.x));
        const tileY = Math.floor(worldPosition.y / (this.tilemap.tileHeight * this.tilemap.scale.y));

        // Check if position is within map bounds
        if (tileX < 0 || tileX >= this.tilemap.columns || 
            tileY < 0 || tileY >= this.tilemap.rows) {
            return true; // Collision with map boundaries
        }

        // Check if there's a collision tile at this position
        const tileIndex = tileY * this.tilemap.columns + tileX;
        const gid = this.collisionLayer.data[tileIndex];

        // GID > 0 means there's a tile (solid object)
        return gid > 0;
    }

    public checkRectangleCollision(bounds: ex.BoundingBox): boolean {
        if (!this.tilemap || !this.collisionLayer) {
            return false;
        }

        // Check all four corners of the rectangle
        const corners = [
            ex.vec(bounds.left, bounds.top),    // Top-left
            ex.vec(bounds.right, bounds.top),   // Top-right
            ex.vec(bounds.left, bounds.bottom), // Bottom-left
            ex.vec(bounds.right, bounds.bottom) // Bottom-right
        ];

        // If any corner collides, the whole rectangle collides
        return corners.some(corner => this.checkCollision(corner));
    }

    public getCollisionAtTile(tileX: number, tileY: number): boolean {
        if (!this.tilemap || !this.collisionLayer) {
            return false;
        }

        // Check bounds
        if (tileX < 0 || tileX >= this.tilemap.columns || 
            tileY < 0 || tileY >= this.tilemap.rows) {
            return true; // Out of bounds = collision
        }

        const tileIndex = tileY * this.tilemap.columns + tileX;
        const gid = this.collisionLayer.data[tileIndex];
        
        return gid > 0;
    }
}