import { Curve2d, Line, CubicBezier, QuadraticBezier } from "../../js/geometry/Curves2d.js";
import { Earcut } from "../../js/geometry/Earcut.js";
import { vec2 } from "../../../math/glmatrix/index.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";
const divs = { m: -1, l: 5, q: 10, b: 10 };
class Move extends Curve2d {
    constructor() {
        super();
        this.clockwise = false;
    }
}
class Orientation {
    constructor() {
        this.clockwise = false;
        this.leftMost = vec2.create();
        this.from = vec2.create();
        this.to = vec2.create();
    }
    init(start) {
        this.clockwise = false;
        vec2.set(this.leftMost, start[0], start[1]);
        vec2.set(this.from, start[0], start[1]);
        vec2.set(this.to, start[0], start[1]);
    }
    setClockwise() {
        let cross = ((this.from[0] - this.leftMost[0]) * (this.to[1] - this.leftMost[1]) -
            (this.from[1] - this.leftMost[1]) * (this.to[0] - this.leftMost[0]));
        if (cross > 0) {
            this.clockwise = true;
        }
        if (cross < 0) {
            this.clockwise = false;
        }
    }
}
export class GlyphVertexObject extends VertexObject {
    constructor(id, cL, dL) {
        super();
        const bytesFloat = 4;
        let i = 0;
        const il = cL.length;
        let moveIndices = [];
        while (i < il) {
            if (dL[i] < 0)
                moveIndices.push(i);
            i++;
        }
        let groupIndices = [];
        let startClockwise;
        i = 0;
        const mil = moveIndices.length;
        let idCount = 0;
        let iStartGroup = 0, iEndGroup = 0;
        if (mil > 0)
            startClockwise = (cL[moveIndices[i]].clockwise);
        while (idCount <= id) {
            iStartGroup = i;
            if (startClockwise) {
                if (!cL[moveIndices[i]].clockwise)
                    throw (new Error("error inside font; start positive"));
                i++;
                while (i < mil && (!cL[moveIndices[i]].clockwise))
                    i++;
            }
            else {
                while (i < mil && (!cL[moveIndices[i]].clockwise))
                    i++;
                if (i == mil)
                    throw (new Error("error inside font; only counter clockwise"));
                if (i < mil && (!cL[moveIndices[i]].clockwise))
                    throw (new Error("error inside font; end positive"));
                i++;
            }
            iEndGroup = i;
            idCount++;
        }
        if (startClockwise)
            i = moveIndices[iStartGroup] + 1;
        else
            i = moveIndices[iEndGroup - 1] + 1;
        let currentIndex = 0;
        let ptsl;
        let earIndices = [];
        let earPtsArr = new Array();
        while ((i < il) && dL[i] >= 0) {
            let pts = cL[i].getSpacedPoints(dL[i]);
            ptsl = pts.length;
            let earPts = ((new Float32Array(2 * ptsl)));
            earPtsArr.push(earPts);
            for (let k = 0; k < ptsl; k++) {
                earPts[2 * k] = pts[k][0];
                earPts[2 * k + 1] = pts[k][1];
            }
            currentIndex += 2 * ptsl;
            i++;
        }
        for (let j = iStartGroup; j < iEndGroup; j++) {
            i = moveIndices[j];
            if (cL[i].clockwise)
                continue;
            earIndices.push(currentIndex / 2);
            i++;
            while ((i < il) && dL[i] >= 0) {
                let pts = cL[i].getSpacedPoints(dL[i]);
                ptsl = pts.length;
                let earPts = ((new Float32Array(2 * ptsl)));
                earPtsArr.push(earPts);
                for (let k = 0; k < ptsl; k++) {
                    earPts[2 * k] = pts[k][0];
                    earPts[2 * k + 1] = pts[k][1];
                }
                currentIndex += 2 * ptsl;
                i++;
            }
        }
        let earArray = new Float32Array(currentIndex);
        i = 0;
        earPtsArr.forEach(val => {
            for (let j = 0, jl = val.length; j < jl; j++) {
                earArray[i] = val[j];
                i++;
            }
        });
        this.indices = new Uint16Array(Earcut.triangulate(earArray, earIndices));
        const row = 6;
        const irow = earArray.length / 2;
        this.vertices = new Float32Array(irow * row);
        for (let i = 0; i < irow; i++) {
            this.vertices[i * row] = earArray[i * 2];
            this.vertices[i * row + 1] = earArray[i * 2 + 1];
            this.vertices[i * row + 2] = 0;
            this.vertices[i * row + 3] = 0;
            this.vertices[i * row + 4] = 0;
            this.vertices[i * row + 5] = -1.0;
        }
        let stride = row * bytesFloat;
        this.attributes = { POSITION: 0, NORMAL: 1 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, stride),
        ];
    }
}
export class Glyph {
    constructor(jsonGlyph, ttf) {
        (ttf == undefined) ? this.ttf = true : this.ttf = ttf;
        let curveCodes = jsonGlyph.o;
        this.horizAdv = jsonGlyph.ha;
        this.ids = 0;
        if (curveCodes)
            this.parse(curveCodes);
    }
    createVertexObject(id) {
        if (id > this.ids - 1)
            throw (new Error("Glyph has not that many clockwise contours"));
        let vo = new GlyphVertexObject(id, this.curveList, this.divisionList);
        return vo;
    }
    parse(curveCodes) {
        this.curveList = [];
        this.divisionList = [];
        let glyphStart = vec2.create();
        let start = vec2.create();
        let end = vec2.create();
        let ctrl1 = vec2.create();
        let ctrl2 = vec2.create();
        let orientation = new Orientation();
        let move;
        let fromDir = vec2.create();
        let codes = curveCodes.split(" ");
        let i = 0;
        let il = codes.length;
        while (i < il) {
            switch (codes[i]) {
                case "m":
                    glyphStart[0] = +codes[i + 1];
                    glyphStart[1] = +codes[i + 2];
                    fromDir[0] = +codes[i + 1];
                    fromDir[1] = +codes[i + 2];
                    if (orientation.clockwise)
                        this.ids++;
                    move = new Move();
                    this.curveList.push(move);
                    orientation.init(glyphStart);
                    this.divisionList.push(divs.m);
                    start[0] = +codes[i + 1];
                    start[1] = +codes[i + 2];
                    i += 3;
                    break;
                case "l":
                    end[0] = +codes[i + 1];
                    end[1] = +codes[i + 2];
                    this.updateLeftPosition(orientation, fromDir, start, end);
                    move.clockwise = orientation.clockwise;
                    this.curveList.push(new Line(start, end));
                    this.divisionList.push(divs.l);
                    fromDir[0] = start[0];
                    fromDir[1] = start[1];
                    start[0] = +end[0];
                    start[1] = +end[1];
                    i += 3;
                    break;
                case "z":
                    this.updateLeftPosition(orientation, fromDir, start, glyphStart);
                    move.clockwise = orientation.clockwise;
                    this.curveList.push(new Line(start, glyphStart));
                    this.divisionList.push(divs.l);
                    i++;
                    break;
                case "q":
                    end[0] = +codes[i + 1];
                    end[1] = +codes[i + 2];
                    this.updateLeftPosition(orientation, fromDir, start, end);
                    move.clockwise = orientation.clockwise;
                    ctrl1[0] = +codes[i + 3];
                    ctrl1[1] = +codes[i + 4];
                    this.curveList.push(new QuadraticBezier(start, ctrl1, end));
                    this.divisionList.push(divs.q);
                    fromDir[0] = +codes[i + 3];
                    fromDir[1] = +codes[i + 4];
                    start[0] = +end[0];
                    start[1] = +end[1];
                    i += 5;
                    break;
                case "b":
                    end[0] = +codes[i + 1];
                    end[1] = +codes[i + 2];
                    this.updateLeftPosition(orientation, fromDir, start, end);
                    move.clockwise = orientation.clockwise;
                    ctrl1[0] = +codes[i + 3];
                    ctrl1[1] = +codes[i + 4];
                    ctrl2[0] = +codes[i + 5];
                    ctrl2[1] = +codes[i + 6];
                    this.curveList.push(new CubicBezier(start, ctrl1, ctrl2, end));
                    this.divisionList.push(divs.b);
                    fromDir[0] = +codes[i + 5];
                    fromDir[1] = +codes[i + 6];
                    start[0] = +end[0];
                    start[1] = +end[1];
                    i += 7;
                    break;
                case "":
                    i++;
                    break;
                default:
                    throw "error parsing Glyph";
            }
        }
        if (orientation.clockwise)
            this.ids++;
        if (!this.ttf) {
            this.ids = 0;
            for (let i = 0, il = this.divisionList.length; i < il; i++) {
                if (this.divisionList[i] < 0) {
                    if (!this.curveList[i].clockwise)
                        this.ids++;
                    this.curveList[i].clockwise = !this.curveList[i].clockwise;
                }
            }
        }
        if (this.ids == 0)
            this.ids = 1;
    }
    updateLeftPosition(o, from, start, to) {
        if (to[0] < o.leftMost[0]) {
            o.leftMost[0] = to[0];
            o.leftMost[1] = to[1];
            o.from[0] = start[0];
            o.from[1] = start[1];
        }
        else if (start[0] == o.leftMost[0] && start[1] == o.leftMost[1]) {
            o.to[0] = to[0];
            o.to[1] = to[1];
            o.setClockwise();
        }
        else if (to[0] == o.leftMost[0] && to[1] == o.leftMost[1]) {
            o.from[0] = start[0];
            o.from[1] = start[1];
            o.setClockwise();
        }
    }
}
//# sourceMappingURL=Glyph.js.map