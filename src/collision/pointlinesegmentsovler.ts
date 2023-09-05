import {ContactPointSolver, Penetration} from "./collision.js";
import {Body} from "../physics/body.js";
import {Vector} from "../geometry/vector.js";
import {Epsilon} from "../epsilon.js";

export class PointLineSegmentSolver implements ContactPointSolver {
    findContactPoints(bodyA: Body, bodyB: Body, penetration: Penetration): Vector[] {
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

    private findContactPointsCircleCircle(circleA: Body, circleB: Body, penetration: Penetration): Vector[] {
        const normal = penetration.normal;
        const depth = penetration.depth;

        const contactPoint = circleA.position.add(normal.multiply(circleA.radius - depth / 2));

        return [
            contactPoint
        ];
    }

    private findContactPointsCirclePolygon(circleA: Body, polygonB: Body, penetration: Penetration): Vector[] {
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

        return [
            contactPoint
        ];
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

    private findContactPointsPolygonCircle(polygonA: Body, circleB: Body, penetration: Penetration): Vector[] {
        return this.findContactPointsCirclePolygon(circleB, polygonA, penetration);
    }

    private findContactPointsPolygonPolygon(polygonA: Body, polygonB: Body, penetration: Penetration): Vector[] {
        let minDistance = Number.POSITIVE_INFINITY;
        let contactPoint1: Vector;
        let contactPoint2: Vector;

        for (const point of polygonA.transformedVertices) {
            for (let i = 0; i < polygonB.transformedVertices.length; i++) {
                const vertex = polygonB.transformedVertices[i];
                const nextVertex = polygonB.transformedVertices[(i + 1) % polygonB.transformedVertices.length];

                const distance = this.pointEdgeDistance(point, vertex, nextVertex);

                if (Math.abs(distance.distanceSquared - minDistance) < Epsilon.E
                    && !distance.contactPoint.nealyEquals(contactPoint1)) {

                    contactPoint2 = distance.contactPoint;
                } else if (distance.distanceSquared < minDistance) {
                    minDistance = distance.distanceSquared;
                    contactPoint1 = distance.contactPoint;
                    contactPoint2 = null;
                }
            }
        }

        for (const point of polygonB.transformedVertices) {
            for (let i = 0; i < polygonA.transformedVertices.length; i++) {
                const vertex = polygonA.transformedVertices[i];
                const nextVertex = polygonA.transformedVertices[(i + 1) % polygonA.transformedVertices.length];

                const distance = this.pointEdgeDistance(point, vertex, nextVertex);

                if (Math.abs(distance.distanceSquared - minDistance) < Epsilon.E
                    && !distance.contactPoint.nealyEquals(contactPoint1)) {

                    contactPoint2 = distance.contactPoint;
                } else if (distance.distanceSquared < minDistance) {
                    minDistance = distance.distanceSquared;
                    contactPoint1 = distance.contactPoint;
                    contactPoint2 = null;
                }
            }
        }

        return contactPoint2
            ? [ contactPoint1, contactPoint2 ]
            : [ contactPoint1 ];
    }
}