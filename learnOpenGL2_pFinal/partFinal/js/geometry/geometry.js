import { vec3 } from "../../../math/glmatrix/index.js";
export class Geometry {
    constructor(bytesStride) {
        this.attributes = {};
        this.accessors = [];
        this.bytesStride = bytesStride;
    }
}
export class Accessor {
    constructor(bytesType, count, byteOffset, byteStride) {
        this.bytesType = bytesType;
        this.count = count;
        this.offset = byteOffset;
        this.stride = byteStride;
    }
}
export class Cube extends Geometry {
    constructor() {
        const bytesFloat = 4;
        let stride = 8 * bytesFloat;
        super(stride);
        this.vertices = new Float32Array([
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0,
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0,
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0,
            1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0,
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0,
            -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0,
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0
        ]);
        this.indices = new Uint16Array([
            0, 1, 2, 3, 4, 5,
            6, 7, 8, 9, 10, 11,
            12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23,
            24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34, 35
        ]);
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(bytesFloat, 3, 0, stride),
            new Accessor(bytesFloat, 3, 3 * bytesFloat, stride),
            new Accessor(bytesFloat, 2, 6 * bytesFloat, stride)
        ];
    }
}
export class Quad extends Geometry {
    constructor() {
        const bytesFloat = 4;
        let stride = 8 * bytesFloat;
        super(stride);
        this.vertices = new Float32Array([
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0,
        ]);
        this.indices = new Uint16Array([
            0, 1, 2, 3, 4, 5
        ]);
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(bytesFloat, 3, 0, stride),
            new Accessor(bytesFloat, 3, 3 * bytesFloat, stride),
            new Accessor(bytesFloat, 2, 6 * bytesFloat, stride)
        ];
    }
}
export class Sphere extends Geometry {
    constructor(widthSegments, heightSegments) {
        const radius = 1.0;
        const bytesFloat = 4;
        let stride = 8 * bytesFloat;
        super(stride);
        let vertices = [];
        let indices = [];
        let radiusxy = 0;
        var x, y, z;
        var normal = vec3.create();
        let thetaStart = 0;
        let thetaEnd = Math.PI;
        let thetaLength = Math.PI;
        let phiStart = 0;
        let phiLength = 2 * Math.PI;
        for (var iy = 0; iy <= heightSegments; iy++) {
            var v = 1.0 - iy / heightSegments;
            for (var ix = 0; ix <= widthSegments; ix++) {
                var u = ix / widthSegments;
                radiusxy = radius * Math.sin(thetaStart + v * thetaLength);
                x = radiusxy * Math.cos(phiStart + u * phiLength);
                y = radius * Math.cos(thetaStart + v * thetaLength);
                z = -radiusxy * Math.sin(phiStart + u * phiLength);
                vertices.push(x, y, z);
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);
                var uOffset = 0;
                if (iy == 0 && thetaStart == 0) {
                    uOffset = 0.5 / widthSegments;
                }
                else if (iy == (heightSegments + 1) && thetaEnd == Math.PI) {
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);
            }
        }
        this.vertices = new Float32Array(vertices);
        var iyFirst = 0;
        var iyNext = widthSegments + 1;
        var a, b, c, d;
        for (iy = 0; iy <= heightSegments; iy++) {
            for (ix = 0; ix <= widthSegments; ix++) {
                a = iyFirst + ix + 1;
                b = iyFirst + ix;
                c = iyNext + ix;
                d = iyNext + ix + 1;
                if (iy !== 0 || thetaStart > 0)
                    indices.push(a, b, d);
                if (iy !== heightSegments - 1 || thetaEnd < Math.PI)
                    indices.push(b, c, d);
            }
            iyFirst += widthSegments + 1;
            iyNext += widthSegments + 1;
        }
        this.indices = new Uint16Array(indices);
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(bytesFloat, 3, 0, stride),
            new Accessor(bytesFloat, 3, 3 * bytesFloat, stride),
            new Accessor(bytesFloat, 2, 6 * bytesFloat, stride)
        ];
    }
}
//# sourceMappingURL=geometry.js.map