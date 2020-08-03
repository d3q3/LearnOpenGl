import { vec2 } from "../../../math/glmatrix/index.js";
export class Curve2d {
    constructor() {
        this.curveDivisions = 40;
    }
    getPoint(t) {
        console.warn('getPoint() not implemented.');
        return null;
    }
    getPointAt(u) {
        let t = this.getUtoTmapping(u);
        return this.getPoint(t);
    }
    getPoints(divisions) {
        if (divisions === undefined)
            divisions = 5;
        let points = [];
        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPoint(d / divisions));
        }
        return points;
    }
    getSpacedPoints(divisions) {
        if (divisions === undefined)
            divisions = 5;
        let points = [];
        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPointAt(d / divisions));
        }
        return points;
    }
    getLength() {
        let lengths = this.getLengths();
        return lengths[lengths.length - 1];
    }
    getLengths() {
        if (this.curveLengths)
            return this.curveLengths;
        let lengths = [];
        let divisions = this.curveDivisions;
        let current, last = this.getPoint(0);
        let iDiv, sum = 0;
        lengths.push(0);
        for (iDiv = 1; iDiv <= divisions; iDiv++) {
            current = this.getPoint(iDiv / divisions);
            sum += vec2.dist(current, last);
            lengths.push(sum);
            last = current;
        }
        return lengths;
    }
    getUtoTmapping(u) {
        let curveLengths = this.getLengths();
        let i = 0, il = curveLengths.length;
        let targetArcLength = u * curveLengths[il - 1];
        let low = 0, high = il - 1, comparison;
        while (low <= high) {
            i = Math.floor(low + (high - low) / 2);
            comparison = curveLengths[i] - targetArcLength;
            if (comparison < 0) {
                low = i + 1;
            }
            else if (comparison > 0) {
                high = i - 1;
            }
            else {
                high = i;
                break;
            }
        }
        i = high;
        if (curveLengths[i] === targetArcLength) {
            return i / (il - 1);
        }
        let lengthBefore = curveLengths[i];
        let lengthAfter = curveLengths[i + 1];
        let segmentLength = lengthAfter - lengthBefore;
        let segmentFraction = (targetArcLength - lengthBefore) / segmentLength;
        let t = (i + segmentFraction) / (il - 1);
        return t;
    }
    getTangent(t) {
        let delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;
        if (t1 < 0)
            t1 = 0;
        if (t2 > 1)
            t2 = 1;
        let pt1 = this.getPoint(t1);
        let pt2 = this.getPoint(t2);
        let tan = vec2.clone(pt2);
        vec2.sub(tan, tan, pt1);
        vec2.normalize(tan, tan);
        return tan;
    }
    getTangentAt(u) {
        let t = this.getUtoTmapping(u);
        return this.getTangent(t);
    }
}
;
export class Ellipse extends Curve2d {
    constructor(xy, xyRadius, startAngle, endAngle, clockwise) {
        super();
        this.xy = xy;
        this.xyRadius = vec2.clone(xyRadius);
        this.startAngle = startAngle || 0;
        this.endAngle = endAngle || 2 * Math.PI;
        this.clockwise = clockwise || false;
    }
    getPoint(t) {
        let twoPi = Math.PI * 2;
        let deltaAngle = this.endAngle - this.startAngle;
        let samePoints = Math.abs(deltaAngle) < Number.EPSILON;
        while (deltaAngle < 0)
            deltaAngle += twoPi;
        while (deltaAngle > twoPi)
            deltaAngle -= twoPi;
        if (deltaAngle < Number.EPSILON) {
            if (samePoints) {
                deltaAngle = 0;
            }
            else {
                deltaAngle = twoPi;
            }
        }
        if (this.clockwise === true && !samePoints) {
            if (deltaAngle === twoPi) {
                deltaAngle = -twoPi;
            }
            else {
                deltaAngle = deltaAngle - twoPi;
            }
        }
        let angle = this.startAngle + t * deltaAngle;
        let x = this.xy[0] + this.xyRadius[0] * Math.cos(angle);
        let y = this.xy[1] + this.xyRadius[1] * Math.sin(angle);
        return vec2.fromValues(x, y);
    }
    ;
    clone() {
        return new Ellipse(vec2.fromValues(this.xy[0], this.xy[1]), vec2.fromValues(this.xyRadius[0], this.xyRadius[1]), this.startAngle, this.endAngle, this.clockwise);
    }
}
export class Line extends Curve2d {
    constructor(start, end) {
        super();
        this.getTangent = function () {
            var tangent = this.end.clone().sub(this.v1);
            return tangent.normalize();
        };
        this.start = vec2.clone(start);
        this.end = vec2.clone(end);
    }
    getPoint(t) {
        let point = vec2.clone(this.end);
        vec2.subtract(point, point, this.start);
        vec2.scale(point, point, t);
        vec2.add(point, point, this.start);
        return point;
    }
    ;
    getPointAt(u) {
        return this.getPoint(u);
    }
    ;
}
export class CubicBezier extends Curve2d {
    constructor(v0, v1, v2, v3) {
        super();
        this.v0 = vec2.clone(v0);
        this.v1 = vec2.clone(v1);
        this.v2 = vec2.clone(v2);
        this.v3 = vec2.clone(v3);
    }
    getPoint(t) {
        let s = 1 - t;
        let t2 = t * t;
        let s2 = s * s;
        let cub = vec2.create();
        let cub2 = vec2.create();
        vec2.scale(cub, this.v0, s2 * s);
        vec2.scale(cub2, this.v1, 3 * s2 * t);
        vec2.add(cub, cub, cub2);
        vec2.scale(cub2, this.v2, 3 * s * t2);
        vec2.add(cub, cub, cub2);
        vec2.scale(cub2, this.v3, t * t2);
        vec2.add(cub, cub, cub2);
        return cub;
    }
    ;
}
export class QuadraticBezier extends Curve2d {
    constructor(v0, v1, v2) {
        super();
        this.v0 = vec2.clone(v0);
        this.v1 = vec2.clone(v1);
        this.v2 = vec2.clone(v2);
    }
    getPoint(t) {
        let s = 1 - t;
        let quad = vec2.create();
        let quad2 = vec2.create();
        vec2.scale(quad, this.v0, s * s);
        vec2.scale(quad2, this.v1, 2 * s * t);
        vec2.add(quad, quad, quad2);
        vec2.scale(quad2, this.v2, t * t);
        vec2.add(quad, quad, quad2);
        return quad;
    }
    ;
}
//# sourceMappingURL=Curves2d.js.map