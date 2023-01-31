import { Vector } from "./vector";

export interface Shape {
    draw(): void
    getVectors(): Vector[]
}

export class Rect implements Shape {
    private posX: number;
    private posY: number;
    private width: number;
    private height: number;

    private velX: number;
    private velY: number;

    private vectorList: Vector[];

    constructor(posX: number, posY: number, width: number, height: number) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;

        this.vectorList = [
            new Vector(posX, posY),
            new Vector(posX + width, posY),
            new Vector(posX + width, posY + height),
            new Vector(posX, posY + height)
        ];
    }

    getVectors(): Vector[] {
        return this.vectorList;
    }

    draw(): void {

    }
}