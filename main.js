import { Rect } from "./shape.js";
import { GJK } from "./gjk.js";
var World = /** @class */ (function () {
    function World(canvasElementId) {
        this.canvas = document.getElementById(canvasElementId);
        this.context = this.canvas.getContext("2d");
        this.gravity = 1;
        this.shapes = [];
        var mr = new Rect(120, 120, 50, 50);
        this.canvas.addEventListener("mousemove", function (e) {
            mr.posX = e.offsetX;
            mr.posY = e.offsetY;
            mr.updateVector();
        });
        this.add(mr);
    }
    World.prototype.add = function (shape) {
        this.shapes.push(shape);
    };
    World.prototype.test = function () {
        console.log(this.shapes[0].getVectors());
        console.log(this.shapes[1].getVectors());
        console.log(GJK.intersect(this.shapes[0], this.shapes[1]));
    };
    World.prototype.run = function () {
        var _this = this;
        this.frame();
        window.requestAnimationFrame(function () { return _this.run(); });
    };
    World.prototype.frame = function () {
        var _this = this;
        this.detect();
        this.shapes.forEach(function (shape) { return shape.draw(_this.context); });
        this.clear();
    };
    World.prototype.detect = function () {
        for (var i = 0; i < this.shapes.length - 1; i++) {
            if (GJK.intersect(this.shapes[i], this.shapes[i + 1])) {
                this.shapes[i].onCollision();
                this.shapes[i + 1].onCollision();
            }
            else {
                this.shapes[i].onCollision2();
                this.shapes[i + 1].onCollision2();
            }
        }
    };
    World.prototype.clear = function () {
        this.context.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    return World;
}());
export { World };
