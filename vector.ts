export class Vector {
    private _x;
    private _y;

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    static tripleProduct(a: Vector, b: Vector, c: Vector): Vector {
        const dot = a._x * b._y - b._x * a._y;
        return new Vector(-c._y * dot, c._x * dot)
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    clone(): Vector {
        return new Vector(this._x, this._y);
    }

    negate(): Vector {
        return new Vector(-this._x, -this._y);
    }

    subtract(other: Vector): Vector {
        return new Vector(this._x - other._x, this._y - other._y);
    }

    magnitudeSquared(): number {
        return this._x * this._x + this._y * this._y;
    }

    dot(other: Vector): number {
        return this._x * other._x + this._y * other._y;
    }

    apply(other: Vector): void {
        this._x = other._x;
        this._y = other._y;
    }

    isNotSameDirection(other: Vector): boolean {
        return this.dot(other) <= 0.0;
    }
}