import {Vector} from "./geometry/vector.js";
import {Body} from "./physics/body.js";
import {Gjk} from "./collision/gjk.js";
import {CollisionDetector, ContactPointSolver, Manifold} from "./collision/collision.js";
import {PointLineSegmentSolver} from "./collision/pointlinesegmentsovler.js";

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

    private stepMs: number = 1000 / 60;

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
        // const circles: Body[] = [...new Array(10)]
        //     .map(() => {
        //         return Body.createCircle(
        //             new Vector(
        //                 Math.floor(Math.random() * this.canvas.width - 50) + 50,
        //                 Math.floor(Math.random() * this.canvas.height - 50) + 50,
        //             ),
        //             Math.floor(Math.random() * 30) + 20,
        //             false
        //         );
        //     });
        //
        // this.addAll(circles);
        //
        // const boxes: Body[] = [...new Array(10)]
        //     .map(() => {
        //         return Body.createBox(
        //             new Vector(
        //                 Math.floor(Math.random() * this.canvas.width - 50) + 50,
        //                 Math.floor(Math.random() * this.canvas.height - 50) + 50,
        //             ),
        //             Math.floor(Math.random() * 30) + 20,
        //             Math.floor(Math.random() * 30) + 20,
        //             true
        //         );
        //     });
        //
        // this.addAll(boxes);
        //
        // this.tempBody = this.bodies[0];
        //
        // this.canvas.addEventListener("mousemove", e => {
        //     this.tempForce = new Vector(e.offsetX, e.offsetY).subtract(this.tempBody.position);
        // });

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

    tempForce: Vector = Vector.zero();
    tempBody: Body;

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
        this.clear();
        const before = Date.now()
        for (let i = 0; i < iteration; i++) {
            this.detect();
            this.solve(elapsedTime / iteration);
        }
        this.stepMs = Date.now() - before;

        this.draw();
    }

    detect() {
        // for (let i = 0; i < this.bodies.length - 1; i++) {
        //     for (let j = i + 1; j < this.bodies.length; j++) {
        //         const bodyA = this.bodies[i];
        //         const bodyB = this.bodies[j];
        //
        //         const distance = Vector.distance(bodyA.position, bodyB.position);
        //
        //         if (distance > bodyA.radius + bodyB.radius) {
        //             continue;
        //         }
        //
        //         this.collisions.push(
        //             new Collision(
        //                 bodyA,
        //                 bodyB,
        //                 bodyB.position.subtract(bodyA.position).norm(),
        //                 bodyA.radius + bodyB.radius - distance
        //             )
        //         );
        //     }
        // }

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

    solve(elapsedTime: number) {
        for (const manifold of this.manifolds) {
            if (manifold.bodyA.isStatic) {
                manifold.bodyB.move(manifold.penetration.normal.multiply(manifold.penetration.depth));
            } else if (manifold.bodyB.isStatic) {
                manifold.bodyA.move(manifold.penetration.normal.multiply(manifold.penetration.depth).negate());
            } else {
                manifold.bodyA.move(manifold.penetration.normal.multiply(manifold.penetration.depth / 2.0).negate());
                manifold.bodyB.move(manifold.penetration.normal.multiply(manifold.penetration.depth / 2.0));
            }

            this.resolveCollision(manifold);
        }

        // this.tempBody.applyForce(this.tempForce.multiply(elapsedTime * this.tempBody.mass * 10));

        for (const body of this.bodies) {
            body.applyForce(this.gravity.multiply(body.mass));
            body.integrateVelocity(elapsedTime);
            body.integratePosition(elapsedTime);
        }
    }

    private resolveCollision(manifold: Manifold) {
        const bodyA = manifold.bodyA;
        const bodyB = manifold.bodyB;

        const relativeVelocity = bodyB.linearVelocity.subtract(bodyA.linearVelocity);

        if (relativeVelocity.dot(manifold.penetration.normal) > 0) {
            return;
        }

        const e = Math.min(bodyA.restitution, bodyB.restitution);
        const j = -(1.0 + e) * relativeVelocity.dot(manifold.penetration.normal) / (bodyA.invMass + bodyB.invMass);

        const impulse = manifold.penetration.normal.multiply(j);

        // bodyA.applyForce(impulse.negate());
        // bodyB.applyForce(impulse);

        bodyA.linearVelocity = bodyA.linearVelocity.subtract(impulse.multiply(bodyA.invMass));
        bodyB.linearVelocity = bodyB.linearVelocity.add(impulse.multiply(bodyB.invMass));
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