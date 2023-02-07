import { Vector } from "./vector.js";
import { Shape } from "./shape.js";

export class GJK {

    static intersect(shape1: Shape, shape2: Shape): Vector {
        const vectors1 = shape1.getVectors();
        const vectors2 = shape2.getVectors();

        const direction = new Vector(1, 0);

        const simplex: Vector[] = [];
        simplex.push(this.support(vectors1, vectors2, direction));

        direction.apply(simplex[0].negate());

        for (let i = 0; i < 30; i++) {
            const support = this.support(vectors1, vectors2, direction);
            if (support.isNotSameDirection(direction)) {
                return null;
            }
            simplex.push(support);
            if (this.checkSimplex(simplex, direction)) {
                return this.epa(simplex, shape1, shape2);
            }
        }
        return null;
    }

    private static support(shape1: Vector[], shape2: Vector[], direction: Vector): Vector {
        const f1 = this.furthestPoint(shape1, direction);
        const f2 = this.furthestPoint(shape2, direction.negate());
        return f1.subtract(f2);
    }

    private static furthestPoint(shape: Vector[], d: Vector): Vector {
        let max = Number.NEGATIVE_INFINITY;
        let index = 0;

        for (let i = 0; i < shape.length; i++) {
            const dot = shape[i].dot(d);
            if (dot > max) {
                max = dot;
                index = i;
            }
        }
        return shape[index];
    }

    private static checkSimplex(simplex: Vector[], direction: Vector): boolean {
        if (simplex.length == 2) {
            const a = simplex[1];
            const b = simplex[0];

            const ao = a.negate();
            const ab = b.subtract(a);

            direction.apply(Vector.tripleProduct(ab, ao, ab));
            if (direction.magnitudeSquared() <= 0.0001) {
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

    static epa(simplex: Vector[], shape1: Shape, shape2: Shape): Vector {
        let edge;
        let supportDistance;
        for (let i = 0; i < 100; i++) {
            edge = this.closestEdge(simplex);

            let support = this.support(shape1.getVectors(), shape2.getVectors(), edge.normal);
            supportDistance = support.dot(edge.normal);

            if (supportDistance - edge.distance < 0.0000001) {
                return new Vector(edge.normal.x * edge.distance, edge.normal.y * edge.distance);
            }
            simplex.splice(edge.index, 0, support);
        }

        return new Vector(edge.normal.x * supportDistance, edge.normal.y * supportDistance);
    }

    static closestEdge(simplex): { distance: number, normal: Vector, index: number }  {
        let minIndex = 0;
        let minDistance = Number.POSITIVE_INFINITY;
        let minNormal;
        for (let a = 0; a < simplex.length; a++) {
            let b = (a + 1) % simplex.length;
            let ab = simplex[b].subtract(simplex[a]);

            let normal = Vector.tripleProduct(ab, simplex[a], ab).norm();
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