import { Vector } from "./vector.js";
import { Shape } from "./shape.js";

export class GJK {

    static intersect(shape1: Shape, shape2: Shape): boolean {
        const vectors1 = shape1.getVectors();
        const vectors2 = shape2.getVectors();

        const direction = new Vector(1, 0);

        const simplex: Vector[] = [];
        simplex.push(this.support(vectors1, vectors2, direction));

        if (simplex[0].isNotSameDirection(direction)) {
            return false;
        }

        direction.apply(direction.negate());

        for (let i = 0; i < 30; i++) {
            simplex.push(this.support(vectors1, vectors2, direction));
            if (simplex[simplex.length - 1].isNotSameDirection(direction)) {
                return false;
            } else {
                if (this.checkSimplex(simplex, direction)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static support(shape1: Vector[], shape2: Vector[], direction: Vector): Vector {
        const f1 = this.furthestPoint(shape1, direction);
        const f2 = this.furthestPoint(shape2, direction.negate());
        return f1.subtract(f2);
    }

    private static furthestPoint(shape: Vector[], d: Vector): Vector {
        let max = Number.MIN_VALUE;
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
                direction.apply(direction.negate());
            }
            return false;
        } else if (simplex.length == 3) {
            const a = simplex[2];
            const b = simplex[1];
            const c = simplex[0];

            const ao = a.negate();
            const ab = b.subtract(a);
            const ac = c.subtract(a);

            const acPerp = Vector.tripleProduct(ab, ac, ac);
            const acLocation = acPerp.dot(ao);

            if (acLocation >= 0.0) {
                simplex.splice(1, 1);
                direction.apply(acPerp);
            } else {
                const abPerp = Vector.tripleProduct(ac, ab, ab);
                const abLocation = abPerp.dot(ao);

                if (abLocation < 0.0) {
                    return true;
                } else {
                    simplex.splice(0, 1);
                    direction.apply(abPerp);
                }
            }
        } else {
            return false;
        }
    }
}