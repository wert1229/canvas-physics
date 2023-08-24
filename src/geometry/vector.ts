import {Epsilon} from "../epsilon.js";
import {Transform} from "./transform";

export class Vector {
    constructor(public x: number, public y: number) {}

    static zero(): Vector {
        return new Vector(0, 0);
    }

    static tripleProduct(a: Vector, b: Vector, c: Vector): Vector {
        const dot = a.x * b.y - b.x * a.y;
        return new Vector(-c.y * dot, c.x * dot)
    }

    static distance(a: Vector, b: Vector): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    negate(): Vector {
        return new Vector(-this.x, -this.y);
    }

    add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    subtract(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    multiply(scalar: number): Vector {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magnitudeSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    cross(other: Vector): number {
        return this.x * other.y - this.y * other.x;
    }

    apply(other: Vector): void {
        this.x = other.x;
        this.y = other.y;
    }

    isNotSameDirection(other: Vector): boolean {
        return this.dot(other) <= 0.0;
    }

    left(): Vector {
        return new Vector(this.y, -this.x);
    }

    normalize(): Vector {
        const magnitude = this.magnitude();
        if (magnitude <= Epsilon.E) {
            return this.clone();
        }
        const invMagnitude = 1.0 / magnitude;
        return new Vector(this.x * invMagnitude, this.y * invMagnitude);
    }

    transform(transform: Transform) {
        return new Vector(
            transform.cos * this.x - transform.sin * this.y + transform.x,
            transform.sin * this.x + transform.cos * this.y + transform.y
        );
    }
}