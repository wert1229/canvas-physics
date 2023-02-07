import {Earth, Rect, Shape} from "./shape.js";
import { GJK } from "./gjk.js";
import {Vector} from "./vector";

export class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gravity: number;

    private shapes: Shape[];
    private collision: Vector[][]

    constructor(canvasElementId: string) {
        this.canvas = document.getElementById(canvasElementId) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        this.gravity = 0.5;
        this.shapes = [];
        this.collision = [];

        const earth = new Earth(0, this.canvas.height, this.canvas.width, 100);
        this.add(earth);

        // this.canvas.addEventListener("mousemove", e => {
        //     mr.posX = e.offsetX;
        //     mr.posY = e.offsetY;
        //     mr.updateVector();
        // });
        this.add(new Rect(100, 400, 50, 50))
        this.add(new Rect(300, 500, 50, 50));
    }

    add(shape: Shape) {
        this.shapes.push(shape);
    }

    test() {

    }

    run() {
        this.frame();
        window.requestAnimationFrame(() => this.run())
    }

    frame() {
        this.detect();
        this.solve();
        this.apply();
        this.draw();
        this.clear();
    }

    detect() {
        for (let i = 0; i < this.shapes.length; i++) {
            this.collision[i] = [];
        }

        for (let i = 0; i < this.shapes.length - 1; i++) {
            for (let j = i + 1; j < this.shapes.length; j++) {
                const vector = GJK.intersect(this.shapes[i], this.shapes[j]);
                if (vector) {
                    this.collision[i][j] = vector;
                    this.collision[j][i] = GJK.intersect(this.shapes[j], this.shapes[i]);
                }
            }
        }
    }

    solve() {
        for (let i = 0; i < this.collision.length; i++) {
            for (let j = 0; j < this.collision[i].length; j++) {
                const collisionVector = this.collision[i][j];
                if (collisionVector) {
                    this.shapes[i].onCollision(this.shapes[j], collisionVector);
                }
            }
        }
    }

    apply() {
        this.shapes.forEach(shape => shape.onGravity(this.gravity));
    }

    draw() {
        this.shapes.forEach(shape => shape.draw(this.context));
    }

    clear() {
        this.context.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.collision = [];
    }
}