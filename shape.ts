import { Vector } from "./vector.js";

export interface Shape {
    draw(context: CanvasRenderingContext2D): void
    getVectors(): Vector[]
    onCollision(shape:Shape, vector: Vector): void
    onGravity(gravity: number): void
}

export class Rect implements Shape {
    private _posX: number;
    private _posY: number;
    private width: number;
    private height: number;
    private _color: string;

    private _velX: number;
    private _velY: number;
    private _accX: number;
    private _accY: number;

    private vectorList: Vector[];

    constructor(posX: number, posY: number, width: number, height: number) {
        this._posX = posX;
        this._posY = posY;
        this.width = width;
        this.height = height;
        this._velX = 0;
        this._velY = 0;
        this._accX = 0;
        this._accY = 0;

        this.updateVector();
    }

    set posX(value: number) {
        this._posX = value;
    }

    set posY(value: number) {
        this._posY = value;
    }

    set color(value: string) {
        this._color = value;
    }

    updateVector() {
        this.vectorList = [
            new Vector(this._posX, this._posY),
            new Vector(this._posX + this.width, this._posY),
            new Vector(this._posX + this.width, this._posY - this.height),
            new Vector(this._posX, this._posY - this.height)
        ];
    }

    getVectors(): Vector[] {
        return this.vectorList;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = this._color ?? "green";

        context.beginPath();
        context.moveTo(this.vectorList[0].x, this.vectorList[0].y);
        context.lineTo(this.vectorList[1].x, this.vectorList[1].y);
        context.lineTo(this.vectorList[2].x, this.vectorList[2].y);
        context.lineTo(this.vectorList[3].x, this.vectorList[3].y);
        context.fill();
    }

    onCollision(shape:Shape, vector: Vector) {
        console.log(shape);
        this._color = "red";
        this._velY = -this._velY
        this.updateVector();
    }

    onGravity(gravity: number) {
        this._accY = gravity;
        this._velY += this._accY;
        this._posY += this._velY;
        this.updateVector();
    }
}

export class Earth extends Rect {
    constructor(posX: number, posY: number, width: number, height: number) {
        super(posX, posY, width, height);
    }

    onCollision(shape:Shape, vector: Vector) {

    }

    onGravity(gravity: number) {

    }
}