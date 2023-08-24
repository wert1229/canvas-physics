import {Vector} from "./vector.js";

export class Transform {
    readonly x: number;
    readonly y: number;
    readonly sin: number;
    readonly cos: number;

    constructor(position: Vector, radians: number) {
        this.x = position.x;
        this.y = position.y;
        this.sin = Math.sin(radians);
        this.cos = Math.cos(radians);
    }

    static zero(): Transform {
        return new Transform(Vector.zero(), 0);
    }
}