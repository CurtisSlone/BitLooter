import * as ex from 'excalibur';

export class CollisionSystem extends ex.System {
    public systemType = ex.SystemType.Update as const;
    public priority = 95; // Run before movement updates

    private tilemap: ex.TileMap | null = null;
    private collisionLayer: any = null; // Tiled layer data

    public initialize(_world: ex.World, _scene: ex.Scene): void {
        // We'll set the tilemap reference from the scene
    }

    public setTilemapData(tilemap: ex.TileMap, mapData: any): void {
        this.tilemap = tilemap;
        
        console.log('Setting tilemap data. Map layers:');
        mapData.layers?.forEach((layer: any) => {
            console.log(`- Layer: ${layer.name}, Type: ${layer.type}, Has data: ${!!layer.data}`);
        });
        
        // Find the floor_objects layer for collision
        this.collisionLayer = mapData.layers?.find((layer: any) => 
            layer.type === 'tilelayer' && layer.name === 'floor_objects'
        );

        if (this.collisionLayer) {
            console.log('Collision layer found:', this.collisionLayer.name);
            console.log('Collision layer data length:', this.collisionLayer.data?.length);
            console.log('Sample collision data:', this.collisionLayer.data?.slice(0, 10));
            
            // Check if there's ANY collision data at all
            const nonZeroTiles = this.collisionLayer.data?.filter((gid: number) => gid > 0);
            console.log('🔍 Total non-zero collision tiles:', nonZeroTiles?.length);
            if (nonZeroTiles?.length > 0) {
                console.log('First few collision tile GIDs:', nonZeroTiles.slice(0, 5));
            } else {
                console.warn('NO collision tiles found in floor_objects layer!');
            }
        } else {
            console.warn('No floor_objects collision layer found');
            console.log('Available tile layers:', mapData.layers?.filter((l: any) => l.type === 'tilelayer').map((l: any) => l.name));
        }
    }

    public update(_elapsed: number): void {
        // This system doesn't process entities automatically
        // Instead, it provides collision checking methods for other systems to use
    }

    public checkCollision(worldPosition: ex.Vector): boolean {
        if (!this.tilemap || !this.collisionLayer) {
            console.log('No tilemap or collision layer available');
            return false; // No collision if no tilemap
        }

        // Convert world position to tile coordinates
        const tileX = Math.floor(worldPosition.x / (this.tilemap.tileWidth * this.tilemap.scale.x));
        const tileY = Math.floor(worldPosition.y / (this.tilemap.tileHeight * this.tilemap.scale.y));

        console.log(`Checking collision at world pos (${worldPosition.x}, ${worldPosition.y}) -> tile (${tileX}, ${tileY})`);

        // Check if position is within map bounds
        if (tileX < 0 || tileX >= this.tilemap.columns || 
            tileY < 0 || tileY >= this.tilemap.rows) {
            console.log('Position outside map bounds - collision');
            return true; // Collision with map boundaries
        }

        // Check if there's a collision tile at this position
        const tileIndex = tileY * this.tilemap.columns + tileX;
        const gid = this.collisionLayer.data[tileIndex];

        console.log(`Tile at (${tileX}, ${tileY}) has GID: ${gid}`);

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