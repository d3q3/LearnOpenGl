import { vec2 } from "../../../math/glmatrix/index.js";
export declare abstract class Curve2d {
    curveDivisions: number;
    curveLengths: number[];
    constructor();
    getPoint(t: any): vec2;
    getPointAt(u: any): vec2;
    getPoints(divisions: any): any[];
    getSpacedPoints(divisions: any): vec2[];
    getLength(): any;
    getLengths(): any[];
    getUtoTmapping(u: any): number;
    getTangent(t: any): vec2;
    getTangentAt(u: any): vec2;
}
export declare class Ellipse extends Curve2d {
    xy: vec2;
    xyRadius: vec2;
    startAngle: number;
    endAngle: number;
    clockwise: boolean;
    constructor(xy: vec2, xyRadius: vec2, startAngle?: any, endAngle?: any, clockwise?: any);
    getPoint(t: any): vec2;
    clone(): Ellipse;
}
export declare class Line extends Curve2d {
    start: vec2;
    end: vec2;
    constructor(start: vec2, end: vec2);
    getPoint(t: any): vec2;
    getPointAt(u: any): vec2;
    getTangent: () => any;
}
export declare class CubicBezier extends Curve2d {
    v0: vec2;
    v1: vec2;
    v2: vec2;
    v3: vec2;
    constructor(v0: any, v1: any, v2: any, v3: any);
    getPoint(t: any): vec2;
}
export declare class QuadraticBezier extends Curve2d {
    v0: vec2;
    v1: vec2;
    v2: vec2;
    constructor(v0: any, v1: any, v2: any);
    getPoint(t: any): vec2;
}
