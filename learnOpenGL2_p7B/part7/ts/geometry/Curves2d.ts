import { vec2 } from "../../../math/glmatrix/index.js"

/**
 * D3Q: adapted from three.js-master\src\extras (author zz85)
 *
 * Some common of curve methods:
 * .getPoint(t), 
 * .getTangent(t)
 * .getPointAt(u), 
 * .getTangentAt(u)
 * .getPoints(), 
 * .getSpacedPoints()
 * .getLength()
 *
 **/


/**
 * Subclasses are in this file: Ellipse, Line, CubicBezier, QuadraticBezierCurve.
 * The subclass Move is not a real shape.
 */
export abstract class Curve2d {
    // when the curve has curveDivisions divisions then curveLengths has the 
    // total lengths at every division point, starting with 0 and ending with
    // the curve length.
    curveDivisions: number;
    curveLengths: number[];

    constructor() {
        this.curveDivisions = 40;
    }

    /**
     * All curves are parametrized with t, 0<=t<=1.
     * t==0: start of curve; t==1: end of the curve.
     * getPoint must return the vec2 value of the curve at t
     * @param t the parameter of the curve
     */
    getPoint(t): vec2 {
        console.warn('getPoint() not implemented.');
        return null;
    }

    /**
     * get the point where the length of the curve is fraction u (0<=u<=1)
     * @param u the fraction of the total length of the curve
     */
    getPointAt(u): vec2 {
        let t = this.getUtoTmapping(u);
        return this.getPoint(t);
    }

    // Get sequence of points using getPoint( t )

    getPoints(divisions) {
        if (divisions === undefined) divisions = 5;
        let points = [];
        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPoint(d / divisions));
        }
        return points;
    }

    // Get sequence of points using getPointAt( u )
    getSpacedPoints(divisions): vec2[] {
        if (divisions === undefined) divisions = 5;
        let points = [];
        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPointAt(d / divisions));
        }
        return points;
    }

    // Get total curve arc length
    getLength() {
        let lengths = this.getLengths();
        return lengths[lengths.length - 1];
    }

    // Get list of cumulative segment lengths
    getLengths() {
        if (this.curveLengths) return this.curveLengths;
        let lengths = [];
        let divisions = this.curveDivisions;
        let current: vec2, last: vec2 = this.getPoint(0);
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


    // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant
    getUtoTmapping(u) {
        let curveLengths = this.getLengths();
        let i = 0, il = curveLengths.length;
        let targetArcLength = u * curveLengths[il - 1];

        // binary search for the index with largest value smaller than target u distance
        let low = 0, high = il - 1, comparison;

        while (low <= high) {
            i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

            comparison = curveLengths[i] - targetArcLength;
            if (comparison < 0) {
                low = i + 1;
            } else if (comparison > 0) {
                high = i - 1;
            } else {
                high = i;
                break;
                // DONE
            }
        }

        i = high;
        if (curveLengths[i] === targetArcLength) {
            return i / (il - 1);
        }

        // we could get finer grain at lengths, or use simple interpolation between two points
        let lengthBefore = curveLengths[i];
        let lengthAfter = curveLengths[i + 1];
        let segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points
        let segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

        // add that fractional amount to t
        let t = (i + segmentFraction) / (il - 1);

        return t;
    }

    // Returns a unit vector tangent at t
    // In case any sub curve does not implement its tangent derivation,
    // 2 points a small delta apart will be used to find its gradient
    // which seems to give a reasonable approximation
    getTangent(t) {

        let delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        if (t1 < 0) t1 = 0;
        if (t2 > 1) t2 = 1;

        let pt1 = this.getPoint(t1);
        let pt2 = this.getPoint(t2);

        let tan: vec2 = vec2.clone(pt2);
        vec2.sub(tan, tan, pt1);
        vec2.normalize(tan, tan);

        return tan;
    }

    getTangentAt(u) {
        let t = this.getUtoTmapping(u);
        return this.getTangent(t);
    }
};


export class Ellipse extends Curve2d {
    xy: vec2;
    xyRadius: vec2;
    startAngle: number;
    endAngle: number;
    clockwise: boolean;

    constructor(xy: vec2, xyRadius: vec2, startAngle?, endAngle?, clockwise?) {
        super();
        this.xy = xy;
        this.xyRadius = vec2.clone(xyRadius);

        this.startAngle = startAngle || 0;
        this.endAngle = endAngle || 2 * Math.PI;
        this.clockwise = clockwise || false;
    }

    getPoint(t): vec2 {
        let twoPi = Math.PI * 2;
        let deltaAngle = this.endAngle - this.startAngle;
        let samePoints = Math.abs(deltaAngle) < Number.EPSILON;

        // ensures that deltaAngle is 0 .. 2 PI
        while (deltaAngle < 0) deltaAngle += twoPi;
        while (deltaAngle > twoPi) deltaAngle -= twoPi;

        if (deltaAngle < Number.EPSILON) {
            if (samePoints) {
                deltaAngle = 0;
            } else {
                deltaAngle = twoPi;
            }
        }

        if (this.clockwise === true && !samePoints) {
            if (deltaAngle === twoPi) {
                deltaAngle = - twoPi;
            } else {
                deltaAngle = deltaAngle - twoPi;
            }
        }

        let angle = this.startAngle + t * deltaAngle;
        let x = this.xy[0] + this.xyRadius[0] * Math.cos(angle);
        let y = this.xy[1] + this.xyRadius[1] * Math.sin(angle);
        return vec2.fromValues(x, y);
    };

    clone(): Ellipse {
        return new Ellipse(
            vec2.fromValues(this.xy[0], this.xy[1]),
            vec2.fromValues(this.xyRadius[0], this.xyRadius[1]),
            this.startAngle, this.endAngle, this.clockwise
        )
    }
}


export class Line extends Curve2d {
    start: vec2;
    end: vec2;

    constructor(start: vec2, end: vec2) {
        super();
        this.start = vec2.clone(start);
        this.end = vec2.clone(end);
    }

    getPoint(t) {
        let point = vec2.clone(this.end);
        vec2.subtract(point, point, this.start);
        vec2.scale(point, point, t);
        vec2.add(point, point, this.start);
        return point;
    };

    // Line curve is linear, so we can overwrite default getPointAt
    getPointAt(u) {
        return this.getPoint(u);
    };

    getTangent = function ( /* t */) {
        var tangent = this.end.clone().sub(this.v1);
        return tangent.normalize();
    };

}



export class CubicBezier extends Curve2d {

    v0: vec2; v1: vec2; v2: vec2; v3: vec2;
    constructor(v0, v1, v2, v3) {
        super();
        this.v0 = vec2.clone(v0);
        this.v1 = vec2.clone(v1);
        this.v2 = vec2.clone(v2);
        this.v3 = vec2.clone(v3);
    }

    getPoint(t) {
        let s = 1 - t; let t2 = t * t; let s2 = s * s;
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
    };

}


export class QuadraticBezier extends Curve2d {
    v0: vec2; v1: vec2; v2: vec2;

    constructor(v0, v1, v2) {
        super();
        this.v0 = vec2.clone(v0);
        this.v1 = vec2.clone(v1);
        this.v2 = vec2.clone(v2);
    }

    getPoint(t): vec2 {

        let s = 1 - t;
        let quad = vec2.create();
        let quad2 = vec2.create();

        vec2.scale(quad, this.v0, s * s);
        vec2.scale(quad2, this.v1, 2 * s * t);
        vec2.add(quad, quad, quad2);

        vec2.scale(quad2, this.v2, t * t);
        vec2.add(quad, quad, quad2);

        return quad;
    };

}
