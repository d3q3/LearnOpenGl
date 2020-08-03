import { Curve2d, Line, CubicBezier, QuadraticBezier } from "../../js/geometry/Curves2d.js"
import { Earcut } from "../../js/geometry/Earcut.js"
import { vec2 } from "../../../math/glmatrix/index.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js"

/**
 * D3Q: may 14 2020; Part of learnOpenGL2_p7B, Ch 48, use of text.
 */

/**
 * D3Q: constants used in the divisionList. It tels how many divisions
 * a Curve2d will get in the GlyphVertexObject constructor. E.g. 'b: 10'
 * means that a cubic Bezier curve will have 10 subdivisions.
 */
const divs = { m: -1, l: 5, q: 10, b: 10 };

/**
 * D3Q: Dummy subclass of Curve2d; getPoint not implemented.
 * Used to register font Move commands
 */
class Move extends Curve2d {
    start: vec2;
    clockwise: boolean;

    constructor() {
        super();
        this.clockwise = false;
    }
}

/**
 * D3Q: Class used to find the clockwise orientation of the curves
 */
class Orientation {
    clockwise: boolean;
    leftMost: vec2;
    from: vec2;
    to: vec2;
    constructor() {
        this.clockwise = false;
        this.leftMost = vec2.create();
        this.from = vec2.create();
        this.to = vec2.create();
    }

    init(start: vec2) {
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

/**
 * D3Q: A VertexObject created for a clockwise contour in the Glyph.
 * The object is created using Earcut.js
 */
export class GlyphVertexObject extends VertexObject {

    /**
     * D3Q: A Glyph can have more than one clockwise contours
     * @param id id contour
     * @param cL commandList created in parse()
     * @param dL divisionList created in parse()
     */
    constructor(id: number, cL: Curve2d[], dL: number[]) {
        super();

        const bytesFloat = 4;

        // create moveIndices from dL
        let i = 0; const il = cL.length;
        let moveIndices = [];
        while (i < il) {
            if (dL[i] < 0) moveIndices.push(i);
            i++;
        }

        // find start and end of group cl's for vertexobject id
        let groupIndices = []; let startClockwise: boolean;
        i = 0; const mil = moveIndices.length; let idCount = 0; let iStartGroup = 0, iEndGroup = 0;
        if (mil > 0) startClockwise = ((<Move>cL[moveIndices[i]]).clockwise);
        while (idCount <= id) {
            // read group 
            iStartGroup = i;
            if (startClockwise) {
                if (!(<Move>cL[moveIndices[i]]).clockwise) throw (new Error("error inside font; start positive"));
                i++;
                while (i < mil && (!(<Move>cL[moveIndices[i]]).clockwise)) i++;
            }
            else {
                while (i < mil && (!(<Move>cL[moveIndices[i]]).clockwise)) i++;
                if (i == mil) throw (new Error("error inside font; only counter clockwise"));
                if (i < mil && (!(<Move>cL[moveIndices[i]]).clockwise)) throw (new Error("error inside font; end positive"));
                i++;
            }
            iEndGroup = i;
            idCount++;
        }

        //now use the group
        if (startClockwise) i = moveIndices[iStartGroup] + 1; else i = moveIndices[iEndGroup - 1] + 1;
        //il = cL.length;
        let currentIndex = 0; let ptsl;
        let earIndices = [];
        let earPtsArr = new Array();

        //for selected clockwise contour do
        while ((i < il) && dL[i] >= 0) {
            let pts: vec2[] = cL[i].getSpacedPoints(dL[i]);
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

        //add all hole arrays in this group
        for (let j = iStartGroup; j < iEndGroup; j++) {
            i = moveIndices[j];
            if ((<Move>cL[i]).clockwise) continue;
            earIndices.push(currentIndex / 2);
            i++;
            // for each conterclockwise contour do
            while ((i < il) && dL[i] >= 0) {
                let pts: vec2[] = cL[i].getSpacedPoints(dL[i]);
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

        // now build the flat array for Earcut
        let earArray = new Float32Array(currentIndex);
        i = 0;
        earPtsArr.forEach(val => {
            for (let j = 0, jl = val.length; j < jl; j++) {
                earArray[i] = val[j]; i++;
            }
        });

        // now create VertexObject (indices, vertices and attributes)
        this.indices = new Uint16Array(
            Earcut.triangulate(earArray, earIndices)
        );

        const row = 6;
        const irow = earArray.length / 2;
        this.vertices = new Float32Array(irow * row);
        for (let i = 0; i < irow; i++) {
            this.vertices[i * row] = earArray[i * 2];
            this.vertices[i * row + 1] = earArray[i * 2 + 1];
            this.vertices[i * row + 2] = 0; //vertices are in XY plane
            this.vertices[i * row + 3] = 0; // normal z-axis
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

/**
 * D3Q: A glyph is a char, an accent or anything with a visual. The visual
 * is after parsing represented by the curveList.
 * With ttf=true we have a TrueType font.
 */
export class Glyph {
    horizAdv;
    curveList;
    divisionList;
    ttf: boolean;
    // D3Q: a glyph can have 0..ids-1 clockwise contours
    ids: number;

    /**
     * D3Q: The constructor parses the json description. The result is 
     * in the curveList and divisionList. Both lists have the same number
     * of elements. When divisionList[i]<0 then curveList[i] is a 
     * Move object. After creation of Glyph, use createVertexObject to 
     * create a VertexObject.
     * @param jsonGlyph the json description of the glyph
     * @param ttf boolean, true for ttf fonts, fals for ps fonts
     */
    constructor(jsonGlyph, ttf?) {

        (ttf == undefined) ? this.ttf = true : this.ttf = ttf;

        let curveCodes = jsonGlyph.o;
        this.horizAdv = jsonGlyph.ha;
        this.ids = 0;
        if (curveCodes)
            this.parse(curveCodes);
    }

    createVertexObject(id): GlyphVertexObject {
        if (id > this.ids - 1) throw (new Error("Glyph has not that many clockwise contours"));
        let vo: GlyphVertexObject = new GlyphVertexObject(id, this.curveList, this.divisionList);
        return vo;
    }

    parse(curveCodes: string) {
        this.curveList = [];
        this.divisionList = [];

        let glyphStart = vec2.create();
        let start = vec2.create(); let end = vec2.create()
        let ctrl1 = vec2.create(); let ctrl2 = vec2.create();

        let orientation = new Orientation();
        let move: Move;
        let fromDir: vec2 = vec2.create();

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

                    if (orientation.clockwise) this.ids++;
                    move = new Move();
                    this.curveList.push(move);

                    orientation.init(glyphStart);

                    this.divisionList.push(divs.m);

                    //start is endpoint previous command
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
                    //this.updateClockwise(orientation, fromDir, start, glyphStart);
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
        if (orientation.clockwise) this.ids++;

        // change clockwise for postscript fonts
        if (!this.ttf) {
            this.ids = 0;
            for (let i = 0, il = this.divisionList.length; i < il; i++) {
                if (this.divisionList[i] < 0) {
                    if (!(<Move>this.curveList[i]).clockwise) this.ids++;
                    (<Move>this.curveList[i]).clockwise = !(<Move>this.curveList[i]).clockwise;
                }
            }
        }
        // should not be needed...
        if (this.ids == 0) this.ids = 1;
    }


    /**
     * D3Q: We will find the left-most element of the contour. At that point
     * we find the handedness of the contour.
     * @param o orientation object
     * @param from from previous (control)point
     * @param start beginning point of curve2d
     * @param to end point of curve2d
     */
    updateLeftPosition(o: Orientation, from: vec2, start: vec2, to: vec2) {
        if (to[0] < o.leftMost[0]) {
            // new leftMost
            o.leftMost[0] = to[0];
            o.leftMost[1] = to[1];
            o.from[0] = start[0];
            o.from[1] = start[1];
        }
        else
            if (start[0] == o.leftMost[0] && start[1] == o.leftMost[1]) {
                // we start at leftMost
                o.to[0] = to[0];
                o.to[1] = to[1];

                o.setClockwise();
            }
            else
                if (to[0] == o.leftMost[0] && to[1] == o.leftMost[1]) {
                    //we end at leftMost
                    o.from[0] = start[0];
                    o.from[1] = start[1];

                    o.setClockwise();
                }
    }
}

