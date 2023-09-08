import {Vector} from "./geometry/vector.js";
import {Body} from "./physics/body.js";
import {Gjk} from "./collision/gjk.js";
import {CollisionData, CollisionDetector, ContactPointSolver, Manifold} from "./collision/collision.js";
import {PointLineSegmentSolver} from "./collision/pointlinesegmentsovler.js";
import {Epsilon} from "./epsilon.js";

export class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gravity: Vector;

    private accumulatedTime: number;

    private timePerFrame: number;

    private lastTime: number;
    private bodies: Body[];
    private collisionDetector: CollisionDetector;

    private manifolds: Manifold[];
    private contactPointSolver: ContactPointSolver;

    private stepMs: number = 0;

    constructor(canvasElementId: string) {
        this.canvas = document.getElementById(canvasElementId) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        this.context.setTransform(1,0,0,-1,0, this.canvas.height);
        this.gravity = new Vector(0, -300.0);
        this.accumulatedTime = 0;
        this.timePerFrame = 1.0 / 60.0;
        this.bodies = [];
        this.manifolds = [];
        this.collisionDetector = new Gjk();
        this.contactPointSolver = new PointLineSegmentSolver();

        this.initSampleData();
    }

    initSampleData() {
        const earth = Body.createBox(
            new Vector(this.canvas.width / 2, 25),
            this.canvas.width,
            50,
            true
        );
        this.add(earth);

        const platform = Body.createBox(
            new Vector(300, 500),
            600,
            50,
            true
        );
        platform.rotate(- Math.PI / 10);
        this.add(platform);

        this.canvas.onclick = e => {
            const body = Math.random() < 0.5
                ? Body.createCircle(
                    new Vector(e.offsetX, this.canvas.height - e.offsetY),
                    Math.floor(Math.random() * 30) + 20,
                    false
                )
                : Body.createBox(
                    new Vector(e.offsetX, this.canvas.height - e.offsetY),
                    Math.floor(Math.random() * 30) + 20,
                    Math.floor(Math.random() * 30) + 20,
                    false
                );
            this.add(body);
        }
    }

    add(body: Body): void {
        this.bodies.push(body);
    }

    addAll(bodies: Body[]): void {
        this.bodies.push(...bodies);
    }

    run() {
        const now = Date.now();
        if (!this.lastTime) {
            this.lastTime = now;
        }
        const elapsedTime = now - this.lastTime;
        this.update(elapsedTime / 1000);
        this.lastTime = now;
        window.requestAnimationFrame(() => this.run())
    }

    update(elapsedTime: number) {
        this.accumulatedTime += elapsedTime;
        if (this.accumulatedTime >= this.timePerFrame) {
            this.accumulatedTime -= this.timePerFrame;
            this.step(elapsedTime, 20);
        }
    }

    step(elapsedTime: number, iteration: number) {
        const before = Date.now()
        for (let i = 0; i < iteration; i++) {
            this.clear();
            this.stepBodies(elapsedTime / iteration);
            this.detect();
            this.solve(elapsedTime / iteration);
        }
        this.stepMs = Date.now() - before;

        this.draw();
    }

    stepBodies(elapsedTime: number) {
        for (const body of this.bodies) {
            body.step(elapsedTime, this.gravity);
        }
    }

    broadPhase() {

    }

    detect() {
        for (let i = 0; i < this.bodies.length - 1; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyA = this.bodies[i];
                const bodyB = this.bodies[j];

                if (bodyA.isStatic && bodyB.isStatic) {
                    continue;
                }

                const collision = this.collisionDetector.detect(bodyA, bodyB);
                if (!collision) {
                    continue;
                }

                this.separate(collision);

                const contactPoints = this.contactPointSolver.findContactPoints(
                    collision.bodyA,
                    collision.bodyB,
                    collision.penetration
                );

                this.manifolds.push({
                    bodyA: collision.bodyA,
                    bodyB: collision.bodyB,
                    penetration: collision.penetration,
                    contactPoints: contactPoints
                });
            }
        }
    }

    separate(collision: CollisionData) {
        if (collision.bodyA.isStatic) {
            collision.bodyB.move(collision.penetration.normal.multiply(collision.penetration.depth));
        } else if (collision.bodyB.isStatic) {
            collision.bodyA.move(collision.penetration.normal.multiply(collision.penetration.depth).negate());
        } else {
            collision.bodyA.move(collision.penetration.normal.multiply(collision.penetration.depth / 2.0).negate());
            collision.bodyB.move(collision.penetration.normal.multiply(collision.penetration.depth / 2.0));
        }
    }

    solve(elapsedTime: number) {
        for (const manifold of this.manifolds) {
            this.resolveCollision2(manifold);
        }
    }

    private resolveCollision2(manifold: Manifold) {
        const bodyA = manifold.bodyA;
        const bodyB = manifold.bodyB;

        const staticFriction = (bodyA.staticFriction + bodyB.staticFriction) * 0.5;
        const dynamicFriction = (bodyA.dynamicFriction + bodyB.dynamicFriction) * 0.5;

        for (const contactPoint of manifold.contactPoints) {
            const ra = contactPoint.subtract(bodyA.position);
            const rb = contactPoint.subtract(bodyB.position);

            const raPerp = ra.perpendicular();
            const rbPerp = rb.perpendicular();

            const angularLinearVelocityA = raPerp.multiply(bodyA.angularVelocity);
            const angularLinearVelocityB = rbPerp.multiply(bodyB.angularVelocity);

            const relativeVelocity = bodyB.linearVelocity.add(angularLinearVelocityB)
                .subtract(bodyA.linearVelocity.add(angularLinearVelocityA));

            const contactVelocityMag = relativeVelocity.dot(manifold.penetration.normal);

            if (contactVelocityMag > 0) {
                continue;
            }

            const raPerpDotN = raPerp.dot(manifold.penetration.normal);
            const rbPerpDotN = rbPerp.dot(manifold.penetration.normal);

            const denom = bodyA.invMass + bodyB.invMass
                + (raPerpDotN * raPerpDotN) * bodyA.invInertia
                + (rbPerpDotN * rbPerpDotN) * bodyB.invInertia;
            const j = -(1.0 + Math.min(bodyA.restitution, bodyB.restitution)) * contactVelocityMag
                / (denom * manifold.contactPoints.length);

            const impulse = manifold.penetration.normal.multiply(j);

            bodyA.linearVelocity = bodyA.linearVelocity.add(impulse.negate().multiply(bodyA.invMass));
            bodyA.angularVelocity += -ra.cross(impulse) * bodyA.invInertia;
            bodyB.linearVelocity = bodyB.linearVelocity.add(impulse.multiply(bodyB.invMass));
            bodyB.angularVelocity += rb.cross(impulse) * bodyB.invInertia;

            let tangent = relativeVelocity.subtract(manifold.penetration.normal.multiply(relativeVelocity.dot(manifold.penetration.normal)));

            if (tangent.magnitude() < Epsilon.E) {
                continue;
            } else {
                tangent = tangent.normalize();
            }

            const raPerpDotT = raPerp.dot(tangent);
            const rbPerpDotT = rbPerp.dot(tangent);

            const jt = relativeVelocity.dot(tangent.negate()) / (denom * manifold.contactPoints.length);

            const frictionImpulse = Math.abs(jt) < j * staticFriction
                ? tangent.multiply(jt)
                : tangent.multiply(-j * dynamicFriction);

            bodyA.linearVelocity = bodyA.linearVelocity.add(frictionImpulse.negate().multiply(bodyA.invMass));
            bodyA.angularVelocity += -ra.cross(frictionImpulse) * bodyA.invInertia;
            bodyB.linearVelocity = bodyB.linearVelocity.add(frictionImpulse.multiply(bodyB.invMass));
            bodyB.angularVelocity += rb.cross(frictionImpulse) * bodyB.invInertia;
        }
    }

    draw() {
        this.context.save();
        this.context.resetTransform();
        this.context.font = "30px Arial";
        this.context.fillText(`body count: ${this.bodies.length}`, 50, 500);
        this.context.fillText(`step time: ${this.stepMs} ms`, 50, 600);
        this.context.restore();

        this.bodies.forEach(body => {
            if (body.type === 0) {
                this.context.beginPath();
                this.context.arc(
                    body.position.x,
                    body.position.y,
                    body.radius,
                    0,
                    Math.PI * 2,
                    true
                )
                this.context.stroke();
            } else {
                const transformedVertices = body.transformedVertices;
                this.context.beginPath();
                this.context.moveTo(transformedVertices[0].x, transformedVertices[0].y);
                for (let i = 1; i < transformedVertices.length; i++) {
                    this.context.lineTo(transformedVertices[i].x, transformedVertices[i].y);
                }
                this.context.lineTo(transformedVertices[0].x, transformedVertices[0].y);
                this.context.stroke();
            }

            // const aabb = body.aabb;
            // this.context.strokeRect(aabb.min.x, aabb.min.y, aabb.max.x - aabb.min.x, aabb.max.y - aabb.min.y);
        });

        this.manifolds.forEach(manifold => {
            this.context.beginPath();
            this.context.arc(
                manifold.contactPoints[0].x,
                manifold.contactPoints[0].y,
                3,
                0,
                Math.PI * 2,
                true
            );
            this.context.stroke();
            if (manifold.contactPoints.length > 1) {
                this.context.beginPath();
                this.context.arc(
                    manifold.contactPoints[1].x,
                    manifold.contactPoints[1].y,
                    3,
                    0,
                    Math.PI * 2,
                    true
                );
                this.context.stroke();
            }
        })
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.manifolds = [];

        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].aabb.max.y < 0) {
                this.bodies.splice(i, 1);
            }
        }
    }
}