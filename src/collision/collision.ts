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

}

export interface Manifold {
    readonly contactPoints: Vector[];
    readonly penetration: Penetration;
}