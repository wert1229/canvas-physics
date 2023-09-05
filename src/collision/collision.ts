import {Vector} from "../geometry/vector.js";
import {Body} from "../physics/body";

export interface CollisionDetector {
    detect(bodyA: Body, bodyB: Body): CollisionData | null;
}

export interface CollisionData {
    readonly bodyA: Body;
    readonly bodyB: Body;
    readonly penetration: Penetration;
}

export interface Penetration {
    readonly normal: Vector;
    readonly depth: number;
}

export interface ContactPointSolver {
    findContactPoints(bodyA: Body, bodyB: Body, penetration: Penetration): Vector[];
}

export interface Manifold {
    readonly bodyA: Body;
    readonly bodyB: Body;
    readonly penetration: Penetration;
    readonly contactPoints: Vector[];
}