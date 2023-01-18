class World {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gravity: number;

    private shapes: Shape[];

    constructor(canvasElementId: string) {
        this.canvas = document.getElementById(canvasElementId) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        this.gravity = 1;
    }




}

interface Shape {
    draw(): void
}

class Rect implements Shape {
    private posX: number;
    private posY: number;
    private velX: number;
    private velY: number;

    draw(): void {

    }
}