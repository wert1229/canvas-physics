import {Vector} from "../geometry/vector.js";
import {Transform} from "../geometry/transform.js";
import {Aabb} from "../geometry/aabb.js";

export class Body {
    static DEFAULT_DENSITY: number = 1.0;
    static DEFAULT_RESTITUTION: number = 0.5;
    static DEFAULT_STATIC_FRICTION: number = 0.6;
    static DEFAULT_DYNAMIC_FRICTION: number = 0.4;

    position: Vector;
    linearVelocity: Vector;
    private rotation: number;
    angularVelocity: number;

    private force: Vector;

    private density: number;
    mass: number;
    invMass: number;
    inertia: number;
    invInertia: number;
    staticFriction: number;
    dynamicFriction: number;

    private area: number;
    restitution: number;

    isStatic: boolean;

    radius: number;
    width: number;
    height: number;

    readonly type: number;

    readonly vertices: Vector[];
    transformedVertices: Vector[];
    aabb: Aabb;

    private constructor(position: Vector,
                        linearVelocity: Vector,
                        rotation: number,
                        angularVelocity: number,
                        density: number,
                        mass: number,
                        invMass: number,
                        inertia: number,
                        invInertia: number,
                        staticFriction: number,
                        dynamicFriction: number,
                        area: number,
                        restitution: number,
                        isStatic: boolean,
                        radius: number,
                        width: number,
                        height: number,
                        type: number,
                        vertices: Vector[]) {
        this.position = position;
        this.linearVelocity = linearVelocity;
        this.rotation = rotation;
        this.angularVelocity = angularVelocity;
        this.force = Vector.zero();
        this.density = density;
        this.mass = mass;
        this.invMass = invMass;
        this.inertia = inertia;
        this.invInertia = invInertia;
        this.staticFriction = staticFriction;
        this.dynamicFriction = dynamicFriction;
        this.area = area;
        this.restitution = restitution;
        this.isStatic = isStatic;
        this.radius = radius;
        this.width = width;
        this.height = height;
        this.type = type;
        this.vertices = vertices;
        this.transformedVertices = [];
        this.transformVertices();
        this.aabb = this.getAabb();
    }

    static createCircle(position: Vector,
                        radius: number,
                        isStatic: boolean): Body {
        const density = Body.DEFAULT_DENSITY;
        const area = Math.PI * radius * radius;
        const mass = area * density;
        const inertia = (1.0 / 12.0) * mass * radius * radius;
        return new Body(
            position,
            Vector.zero(),
            0.0,
            0.0,
            density,
            mass,
            isStatic ? 0 : 1.0 / mass,
            inertia,
            isStatic ? 0 : 1.0 / inertia,
            Body.DEFAULT_STATIC_FRICTION,
            Body.DEFAULT_DYNAMIC_FRICTION,
            area,
            Body.DEFAULT_RESTITUTION,
            isStatic,
            radius,
            0.0,
            0.0,
            0,
            []
        );
    }

    static createBox(position: Vector,
                     width: number,
                     height: number,
                     isStatic: boolean): Body {
        const density = Body.DEFAULT_DENSITY;
        const area = width * height;
        const mass = area * density;
        const inertia = (1.0 / 12.0) * mass * (width * width + height * height);
        const vertices = [
            new Vector(-width / 2, -height / 2),
            new Vector(width / 2, -height / 2),
            new Vector(width / 2, height / 2),
            new Vector(-width / 2, height / 2)
        ];

        return new Body(
            position,
            Vector.zero(),
            0.0,
            0.0,
            density,
            mass,
            isStatic ? 0 : 1.0 / mass,
            inertia,
            isStatic ? 0 : 1.0 / inertia,
            Body.DEFAULT_STATIC_FRICTION,
            Body.DEFAULT_DYNAMIC_FRICTION,
            area,
            Body.DEFAULT_RESTITUTION,
            isStatic,
            0.0,
            width,
            height,
            1,
            vertices
        );
    }

    move(position: Vector): void {
        this.position = this.position.add(position);
        this.transformVertices();
        this.aabb = this.getAabb();
    }

    moveTo(position: Vector): void {
        this.position = position;
        this.transformVertices();
        this.aabb = this.getAabb();
    }

    rotate(radians: number): void {
        this.rotation += radians;
        this.transformVertices();
        this.aabb = this.getAabb();
    }

    private transformVertices(): void {
        const transform = new Transform(this.position, this.rotation);
        this.transformedVertices = this.vertices.map(vertex => vertex.transform(transform));
    }

    furthestPoint(direction: Vector): Vector {
        if (this.type == 0) {
            return this.position.add(direction.normalize().multiply(this.radius));
        } else {
            let max = Number.NEGATIVE_INFINITY;
            let index = 0;

            for (let i = 0; i < this.transformedVertices.length; i++) {
                const dot = this.transformedVertices[i].dot(direction);
                if (dot > max) {
                    max = dot;
                    index = i;
                }
            }
            return this.transformedVertices[index];
        }
    }

    step(elapsedTime: number, gravity: Vector): void {
        if (this.isStatic) {
            return;
        }

        this.linearVelocity = this.linearVelocity.add(gravity.multiply(elapsedTime));
        this.position = this.position.add(this.linearVelocity.multiply(elapsedTime));
        this.rotation = this.rotation + this.angularVelocity * elapsedTime;

        this.force = Vector.zero();
        this.transformVertices();
        this.aabb = this.getAabb();
    }

    getAabb(): Aabb {
        if (this.type == 0) {
            const min = this.position.subtract(new Vector(this.radius, this.radius));
            const max = this.position.add(new Vector(this.radius, this.radius));
            return new Aabb(min, max);
        } else {
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;

            for (let i = 0; i < this.transformedVertices.length; i++) {
                const vertex = this.transformedVertices[i];
                if (vertex.x < minX) {
                    minX = vertex.x;
                }
                if (vertex.x > maxX) {
                    maxX = vertex.x;
                }
                if (vertex.y < minY) {
                    minY = vertex.y;
                }
                if (vertex.y > maxY) {
                    maxY = vertex.y;
                }
            }
            return new Aabb(new Vector(minX, minY), new Vector(maxX, maxY));
        }
    }
}