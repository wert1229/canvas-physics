import { Rect } from "./shape.js";
import { GJK } from "./gjk.js";
var World = /** @class */ (function () {
    function World(canvasElementId) {
        var _this = this;
        this.canvas = document.getElementById(canvasElementId);
        this.context = this.canvas.getContext("2d");
        this.gravity = 1;
        this.shapes = [];
        this.canvas.addEventListener("click", function (e) {
            _this.test();
        });
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
        this.context.transform(1, 0, 0, -1, 0, this.canvas.height);
        var s1 = new Rect(100, 100, 50, 50);
        s1.color = "red";
        // 1 x
        var s2 = new Rect(130, 100, 50, 50);
        // 2 o
        // const s2 = new Rect(70, 130, 50, 50);
        // 3 x
        // const s2 = new Rect(70, 70, 50, 50);
        // 4 o
        // const s2 = new Rect(130, 70, 50, 50);
        s1.draw(this.context);
        s2.draw(this.context);
        console.log(GJK.intersect(s1, s2));
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
            var vector = GJK.intersect(this.shapes[i], this.shapes[i + 1]);
            if (vector) {
                this.shapes[1].onCollision(vector);
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
