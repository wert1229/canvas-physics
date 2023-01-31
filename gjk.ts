import { Vector } from "./vector";
import { Shape } from "./shape";

export class GJK {

    static intersect(shape1: Shape, shape2: Shape): boolean {
        const vectors1 = shape1.getVectors();
        const vectors2 = shape2.getVectors();

        let direction = new Vector(1, 0);

        const simplex: Vector[] = [];
        simplex.push(this.support(vectors1, vectors2, direction));

        direction = simplex[0].negate();

        while (true) {
            simplex.push(this.support(vectors1, vectors2, direction));
            if (simplex[simplex.length - 1].dot(direction) <= 0) {
                return false;
            }

            if (this.checkSimplex(simplex, direction)) {
                return true;
            }
        }
    }

    static support(shape1: Vector[], shape2: Vector[], d: Vector): Vector {
        const f1 = this.furthestPoint(shape1, d);
        const f2 = this.furthestPoint(shape2, d.negate());
        return f1.subtract(f2);
    }

    static furthestPoint(shape: Vector[], d: Vector): Vector {
        let max = shape[0].dot(d);
        let index = 0

        for (let i = 1; i < shape.length; i++) {
            const dot = shape[i].dot(d);
            if (dot > max) {
                max = dot;
                index = i;
            }
        }
        return shape[index];
    }

    static checkSimplex(simplex: Vector[], direction: Vector): boolean {
        if (simplex.length == 2) {
            const a = simplex[1];
            const b = simplex[0];

            const ao = a.negate();
            const ab = b.subtract(a);

            direction.apply(ab.perpendicular());
            if (!direction.sameDirection(ao)) {
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

            direction.apply(ab.perpendicular());
            if (direction.sameDirection(c)) {
                direction.apply(direction.negate());
            }

            if (direction.sameDirection(ao)) {
                simplex.splice(0, 1);
                return false;
            }

            direction.apply(ac.perpendicular());
            if (direction.sameDirection(b)) {
                direction.apply(direction.negate());
            }

            if (direction.sameDirection(ao)) {
                simplex.splice(1, 1);
                return false;
            }

            return true;
        }
    }
}