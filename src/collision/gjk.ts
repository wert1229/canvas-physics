import {Vector} from "../geometry/vector.js";
import {Body} from "../physics/body.js";
import {CollisionDetector, CollisionData, Penetration} from "./collision.js";
import {Epsilon} from "../epsilon.js";

export class Gjk implements CollisionDetector {
    detect(bodyA: Body, bodyB: Body): CollisionData {
        const direction = new Vector(1, 0);

        const simplex: Vector[] = [];
        simplex.push(this.support(bodyA, bodyB, direction));

        direction.apply(simplex[0].negate());

        for (let i = 0; i < 30; i++) {
            const support = this.support(bodyA, bodyB, direction);
            if (support.isNotSameDirection(direction)) {
                return null;
            }
            simplex.push(support);
            if (this.checkSimplex(simplex, direction)) {
                const penetration = this.epa(simplex, bodyA, bodyB);
                return {
                    bodyA: bodyA,
                    bodyB: bodyB,
                    penetration: penetration
                };
            }
        }
        return null;
    }

    private support(bodyA: Body, bodyB: Body, direction: Vector): Vector {
        const f1 = bodyA.furthestPoint(direction);
        const f2 = bodyB.furthestPoint(direction.negate());
        return f1.subtract(f2);
    }

    // private furthestPoint(shape: Vector[], d: Vector): Vector {
    //     let max = Number.NEGATIVE_INFINITY;
    //     let index = 0;
    //
    //     for (let i = 0; i < shape.length; i++) {
    //         const dot = shape[i].dot(d);
    //         if (dot > max) {
    //             max = dot;
    //             index = i;
    //         }
    //     }
    //     return shape[index];
    // }

    private checkSimplex(simplex: Vector[], direction: Vector): boolean {
        if (simplex.length == 2) {
            const a = simplex[1];
            const b = simplex[0];

            const ao = a.negate();
            const ab = b.subtract(a);

            direction.apply(Vector.tripleProduct(ab, ao, ab));
            if (direction.magnitudeSquared() <= Epsilon.E) {
                direction.apply(ab.left());
            }
            return false;
        } else {
            const a = simplex[2];
            const b = simplex[1];
            const c = simplex[0];

            const ao = a.negate();
            const ab = b.subtract(a);
            const ac = c.subtract(a);

            const abPerp = Vector.tripleProduct(ac, ab, ab);
            if (abPerp.dot(ao) > 0.0) {
                simplex.splice(0, 1);
                direction.apply(abPerp);
                return false;
            } else {
                const acPerp = Vector.tripleProduct(ab, ac, ac);
                if (acPerp.dot(ao) > 0.0) {
                    simplex.splice(1, 1);
                    direction.apply(acPerp);
                    return false;
                } else {
                    return true;
                }
            }
        }
    }

    epa(simplex: Vector[], bodyA: Body, bodyB: Body): Penetration {
        let edge;
        let supportDistance;
        for (let i = 0; i < 100; i++) {
            edge = this.closestEdge(simplex);

            let support = this.support(bodyA, bodyB, edge.normal);
            supportDistance = support.dot(edge.normal);

            if (supportDistance - edge.distance < Epsilon.E) {
                return {
                    normal: edge.normal,
                    depth: edge.distance
                };
            }
            simplex.splice(edge.index, 0, support);
        }

        return {
            normal: edge.normal,
            depth: supportDistance
        };
    }

    closestEdge(simplex): { distance: number, normal: Vector, index: number }  {
        let minIndex = 0;
        let minDistance = Number.POSITIVE_INFINITY;
        let minNormal;
        for (let a = 0; a < simplex.length; a++) {
            let b = (a + 1) % simplex.length;
            let ab = simplex[b].subtract(simplex[a]);

            let normal = Vector.tripleProduct(ab, simplex[a], ab).normalize();
            let distance = normal.dot(simplex[a]);

            if (distance < 0) {
                distance *= -1;
                normal.apply(normal.negate());
            }

            if (distance < minDistance) {
                minDistance = distance;
                minNormal = normal;
                minIndex = b;
            }
        }
        return {
            distance: minDistance,
            normal: minNormal,
            index: minIndex
        };
    }
}