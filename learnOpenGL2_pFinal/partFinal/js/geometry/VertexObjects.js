import { vec3 } from "../../../math/glmatrix/index.js";
export class VertexAccessors {
    constructor() {
        this.attributes = {};
        this.accessors = [];
    }
}
export class Accessor {
    constructor(bufferId, bytesComponent, countComponent, byteOffset, countElements, byteStride) {
        this.bufferId = bufferId;
        this.bytesComponent = bytesComponent;
        this.countComponent = countComponent;
        this.byteOffset = byteOffset;
        this.countElements = countElements;
        this.stride = byteStride;
    }
}
export class Cube extends VertexAccessors {
    constructor() {
        const bytesFloat = 4;
        const bytesUint16Array = 2;
        super();
        let stride = 8 * bytesFloat;
        let vertices = new Float32Array([
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
        let indices = new Uint16Array([
            0, 1, 2, 3, 4, 5,
            6, 7, 8, 9, 10, 11,
            12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23,
            24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34, 35
        ]);
        this.buffers[0] = vertices;
        this.buffers[1] = indices;
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, 36, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, 36, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, 36, stride)
        ];
        this.indexAccessor = new Accessor(1, bytesUint16Array, 1, 0, 36, bytesUint16Array);
    }
}
export class Quad extends VertexAccessors {
    constructor() {
        const bytesFloat = 4;
        const bytesUint16Array = 2;
        super();
        let stride = 8 * bytesFloat;
        let vertices = new Float32Array([
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0,
        ]);
        let indices = new Uint16Array([
            0, 1, 2, 3, 4, 5
        ]);
        this.buffers[0] = vertices;
        this.buffers[1] = indices;
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, 6, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, 6, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, 6, stride)
        ];
        this.indexAccessor = new Accessor(1, bytesUint16Array, 1, 0, 6, bytesUint16Array);
    }
}
export class Sphere extends VertexAccessors {
    constructor(widthSegments, heightSegments) {
        const radius = 1.0;
        const bytesFloat = 4;
        super();
        let stride = 8 * bytesFloat;
        let vertices = [];
        let indices = [];
        let radiusXZ = 0;
        var x, y, z;
        var normal = vec3.create();
        let thetaLength = Math.PI;
        let phiLength = 2 * Math.PI;
        for (var iy = 0; iy <= heightSegments; iy++) {
            var v = 1.0 - iy / heightSegments;
            for (var ix = 0; ix <= widthSegments; ix++) {
                var u = ix / widthSegments;
                radiusXZ = radius * Math.sin(v * thetaLength);
                x = radiusXZ * Math.cos(u * phiLength);
                y = radius * Math.cos(v * thetaLength);
                z = -radiusXZ * Math.sin(u * phiLength);
                vertices.push(x, y, z);
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);
                var uOffset = 0;
                if (iy == 0) {
                    uOffset = 0.5 / widthSegments;
                }
                else if (iy == (heightSegments + 1)) {
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);
            }
        }
        var iyFirst = 0;
        var iyNext = widthSegments + 1;
        var a, b, c, d;
        for (iy = 0; iy <= heightSegments; iy++) {
            for (ix = 0; ix <= widthSegments; ix++) {
                a = iyFirst + ix + 1;
                b = iyFirst + ix;
                c = iyNext + ix;
                d = iyNext + ix + 1;
                if (iy !== 0)
                    indices.push(a, b, d);
                if (iy !== heightSegments - 1)
                    indices.push(b, c, d);
            }
            iyFirst += widthSegments + 1;
            iyNext += widthSegments + 1;
        }
        this.buffers[0] = new Float32Array(vertices);
        this.buffers[1] = new Uint16Array(indices);
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, vertices.length / 8, stride)
        ];
    }
}
//# sourceMappingURL=VertexObjects.js.map