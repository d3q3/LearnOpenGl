import { Curve2d } from "../../js/geometry/Curves2d.js";
import { vec2 } from "../../../math/glmatrix/index.js";
import { VertexObject } from "../../js/geometry/VertexObjects.js";
declare class Orientation {
    clockwise: boolean;
    leftMost: vec2;
    from: vec2;
    to: vec2;
    constructor();
    init(start: vec2): void;
    setClockwise(): void;
}
export declare class GlyphVertexObject extends VertexObject {
    constructor(id: number, cL: Curve2d[], dL: number[]);
}
export declare class Glyph {
    horizAdv: any;
    curveList: any;
    divisionList: any;
    ttf: boolean;
    ids: number;
    constructor(jsonGlyph: any, ttf?: any);
    createVertexObject(id: any): GlyphVertexObject;
    parse(curveCodes: string): void;
    updateLeftPosition(o: Orientation, from: vec2, start: vec2, to: vec2): void;
}
export {};
