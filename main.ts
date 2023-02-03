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

        this.canvas.addEventListener("click", e => {
            this.test();
        });

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
        this.context.transform(1, 0, 0, -1, 0, this.canvas.height);
        const s1 = new Rect(100, 100, 50, 50);
        s1.color = "red";
        // 1 x
        const s2 = new Rect(130, 100, 50, 50);
        // 2 o
        // const s2 = new Rect(70, 130, 50, 50);
        // 3 x
        // const s2 = new Rect(70, 70, 50, 50);
        // 4 o
        // const s2 = new Rect(130, 70, 50, 50);

        s1.draw(this.context);
        s2.draw(this.context);
        console.log(GJK.intersect(s1, s2));
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
            const vector = GJK.intersect(this.shapes[i], this.shapes[i + 1]);
            if (vector) {
                this.shapes[1].onCollision(vector);
            }
        }
    }

    clear() {
        this.context.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}