import {Manifold, Penetration} from "./collision.js";
import {Body} from "../physics/body.js";
import {Vector} from "../geometry/vector.js";

export class ClippingSolver {
    findContactPoints(bodyA: Body, bodyB: Body, penetration: Penetration): Manifold {
        if (bodyA.type == 0 && bodyB.type == 0) {
            return this.findContactPointsCircleCircle(bodyA, bodyB, penetration);
        } else if (bodyA.type == 0 && bodyB.type == 1) {
            return this.findContactPointsCirclePolygon(bodyA, bodyB, penetration);
        } else if (bodyA.type == 1 && bodyB.type == 0) {
            return this.findContactPointsPolygonCircle(bodyA, bodyB, penetration);
        } else if (bodyA.type == 1 && bodyB.type == 1) {
            return this.findContactPointsPolygonPolygon(bodyA, bodyB, penetration);
        }
    }

    private findContactPointsCircleCircle(circleA: Body, circleB: Body, penetration: Penetration): Manifold {
        const normal = penetration.normal;
        const depth = penetration.depth;

        const contactPoint = circleA.position.add(normal.multiply(circleA.radius - depth / 2));

        return {
            penetration: penetration,
            contactPoints: [ contactPoint ]
        };
    }

    private findContactPointsCirclePolygon(circleA: Body, polygonB: Body, penetration: Penetration): Manifold {
        const normal = penetration.normal;
        const depth = penetration.depth;

        const center = circleA.position;

        let minDistance = Number.POSITIVE_INFINITY;
        let contactPoint: Vector;

        for (let i = 0; i < polygonB.transformedVertices.length; i++) {
            const vertex = polygonB.transformedVertices[i];
            const nextVertex = polygonB.transformedVertices[(i + 1) % polygonB.transformedVertices.length];

            const distance = this.pointEdgeDistance(center, vertex, nextVertex);

            if (distance.distanceSquared < minDistance) {
                minDistance = distance.distanceSquared;
                contactPoint = distance.contactPoint;
            }
        }

        return {
            penetration: penetration,
            contactPoints: [ contactPoint ]
        };
    }

    private pointEdgeDistance(p: Vector, a: Vector, b:Vector): { contactPoint: Vector, distanceSquared: number } {
        const ab = b.subtract(a);
        const ap = p.subtract(a);

        const projection = ap.dot(ab);
        const edgeLengthSquared = ab.magnitudeSquared();
        const distance = projection / edgeLengthSquared;

        let contactPoint: Vector;
        if (distance <= 0.0) {
            contactPoint = a;
        } else if (distance >= 1.0) {
            contactPoint = b;
        } else {
            contactPoint = a.add(ab.multiply(distance));
        }

        return {
            contactPoint: contactPoint,
            distanceSquared: p.subtract(contactPoint).magnitudeSquared()
        }
    }

    private findContactPointsPolygonCircle(polygonA: Body, circleB: Body, penetration: Penetration): Manifold {
        return this.findContactPointsCirclePolygon(circleB, polygonA, penetration);
    }

    private findContactPointsPolygonPolygon(polygonA: Body, polygonB: Body, penetration: Penetration) {
        return undefined;
    }
}