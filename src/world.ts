import {Vector} from "./geometry/vector.js";
import {Body} from "./physics/body.js";
import {Gjk} from "./collision/gjk.js";
import {CollisionData, CollisionDetector} from "./collision/collision.js";

export class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gravity: Vector;

    private accumulatedTime: number;

    private timePerFrame: number;

    private lastTime: number;
    private bodies: Body[];
    private collisions: CollisionData[];
    private collisionDetector: CollisionDetector;

    constructor(canvasElementId: string) {
        this.canvas = document.getElementById(canvasElementId) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        this.gravity = new Vector(0, -10.0);
        this.accumulatedTime = 0;
        this.timePerFrame = 1.0 / 60.0;
        this.bodies = [];
        this.collisions = [];
        this.collisionDetector = new Gjk();

        this.initSampleData();
    }

    initSampleData() {
        const circles: Body[] = [...new Array(10)]
            .map(() => {
                return Body.createCircle(
                    new Vector(
                        Math.floor(Math.random() * this.canvas.width - 50) + 50,
                        Math.floor(Math.random() * this.canvas.height - 50) + 50,
                    ),
                    Math.floor(Math.random() * 30) + 20,
                    false
                );
            });

        this.addAll(circles);

        const boxes: Body[] = [...new Array(10)]
            .map(() => {
                return Body.createBox(
                    new Vector(
                        Math.floor(Math.random() * this.canvas.width - 50) + 50,
                        Math.floor(Math.random() * this.canvas.height - 50) + 50,
                    ),
                    Math.floor(Math.random() * 30) + 20,
                    Math.floor(Math.random() * 30) + 20,
                    false
                );
            });

        this.addAll(boxes);

        const controlledBody = this.bodies[0]
        this.canvas.addEventListener("mousemove", e => {
            controlledBody.moveTo(new Vector(e.offsetX, e.offsetY));
        });
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
            this.step(elapsedTime);
        }
    }

    step(elapsedTime: number) {
        this.clear();
        this.detect();
        this.solve(elapsedTime);
        this.apply();
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

                const collision = this.collisionDetector.detect(bodyA, bodyB);
                if (!collision) {
                    continue;
                }

                this.collisions.push(collision);
            }
        }
    }

    solve(elapsedTime: number) {
        // this.bodies
        //     .filter(body => body.type == 1)
        //     .forEach(body => {
        //         body.rotate(Math.PI / 2.0 * 0.1);
        //     });

        for (const collision of this.collisions) {
            collision.bodyA.move(collision.penetration.normal.multiply(collision.penetration.depth / 2.0).negate());
            collision.bodyB.move(collision.penetration.normal.multiply(collision.penetration.depth / 2.0));
        }

        // for (let i = 0; i < this.collision.length; i++) {
        //     for (let j = 0; j < this.collision[i].length; j++) {
        //         const collisionVector = this.collision[i][j];
        //         if (collisionVector) {
        //             this.shapes[i].onCollision(this.shapes[j], collisionVector);
        //         }
        //     }
        // }
    }

    apply() {
        // this.shapes.forEach(shape => shape.onGravity(this.gravity));
    }

    draw() {
        this.bodies.forEach(body => {
            if (body.type === 0) {
                this.context.beginPath();
                this.context.arc(
                    body.position.x,
                    body.position.y,
                    body.radius,
                    0,
                    Math.PI * 2, true
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
        });
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.collisions = [];
    }
}