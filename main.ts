import { Rect, Shape } from "./shape.js";
import { GJK } from "./gjk.js";

export class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gravity: number;

    private shapes: Shape[];

    constructor(canvasElementId: string) {
        this.canvas = document.getElementById(canvasElementId) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        this.gravity = 1;
        this.shapes = [];

        const mr = new Rect(120, 120, 50, 50)
        this.canvas.addEventListener("mousemove", e => {
            mr.posX = e.offsetX;
            mr.posY = e.offsetY;
            mr.updateVector();
        });
        this.add(mr);
    }

    add(shape: Shape) {
        this.shapes.push(shape);
    }

    test() {
        console.log(this.shapes[0].getVectors());
        console.log(this.shapes[1].getVectors());
        console.log(GJK.intersect(this.shapes[0], this.shapes[1]));
    }

    run() {
        this.frame();
        window.requestAnimationFrame(() => this.run())
    }

    frame() {
        this.detect();
        this.shapes.forEach(shape => shape.draw(this.context));
        this.clear();
    }

    detect() {
        for (let i = 0; i < this.shapes.length - 1; i++) {
            if (GJK.intersect(this.shapes[i], this.shapes[i + 1])) {
                this.shapes[i].onCollision();
                this.shapes[i + 1].onCollision();
            } else {
                this.shapes[i].onCollision2();
                this.shapes[i + 1].onCollision2();
            }
        }
    }

    clear() {
        this.context.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}