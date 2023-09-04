import {Vector} from "./vector.js";

export class Aabb {
    constructor(readonly min: Vector, readonly max: Vector) {}
}