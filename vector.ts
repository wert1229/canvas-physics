export class Vector {
    private x;
    private y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    negate(): Vector {
        return new Vector(-this.x, -this.y);
    }

    subtract(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    perpendicular(): Vector {
        return new Vector(this.y, -this.x);
    }

    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    apply(other: Vector): void {
        this.x = other.x;
        this.y = other.y;
    }

    sameDirection(other: Vector): boolean {
        return this.dot(other) > 0;
    }
}