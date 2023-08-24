import {Vector} from "../geometry/vector.js";
import {Transform} from "../geometry/transform.js";

export class Body {
    static DEFAULT_DENSITY: number = 0.5;
    static DEFAULT_RESTITUTION: number = 0.5;

    position: Vector;
    private linearVelocity: Vector;
    private rotation: number;
    private angularVelocity: number;

    private density: number;
    private mass: number;
    private area: number;
    private restitution: number;

    private isStatic: boolean;

    radius: number;
    width: number;
    height: number;

    readonly type: number;

    readonly vertices: Vector[];
    transformedVertices: Vector[];

    private constructor(position: Vector,
                        linearVelocity: Vector,
                        rotation: number,
                        angularVelocity: number,
                        density: number,
                        mass: number,
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
        this.density = density;
        this.mass = mass;
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
    }

    static createCircle(position: Vector,
                        radius: number,
                        isStatic: boolean): Body {
        const density = Body.DEFAULT_DENSITY;
        const area = Math.PI * radius * radius;
        return new Body(
            position,
            Vector.zero(),
            0.0,
            0.0,
            density,
            area * density,
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
        const area = width * height
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
            area * density,
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
    }

    moveTo(position: Vector): void {
        this.position = position;
        this.transformVertices();
    }

    rotate(radians: number): void {
        this.rotation += radians;
        this.transformVertices();
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
}