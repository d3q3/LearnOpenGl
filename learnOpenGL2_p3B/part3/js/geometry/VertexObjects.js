import { vec3 } from "../../../math/glmatrix/index.js";
export class AccessorObject {
    constructor() {
        this.attributes = {};
        this.accessors = [];
    }
}
export class VertexObject extends AccessorObject {
    getBuffers() {
        return [this.vertices];
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
export class Cube extends VertexObject {
    constructor() {
        const bytesFloat = 4;
        super();
        let stride = 8 * bytesFloat;
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
            new Accessor(0, bytesFloat, 3, 0, 36, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, 36, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, 36, stride)
        ];
    }
}
export class Quad extends VertexObject {
    constructor() {
        const bytesFloat = 4;
        super();
        let stride = 8 * bytesFloat;
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
            new Accessor(0, bytesFloat, 3, 0, 6, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, 6, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, 6, stride)
        ];
    }
}
export class Sphere extends VertexObject {
    constructor(widthSegments, heightSegments) {
        const radius = 1.0;
        const bytesFloat = 4;
        super();
        let stride = 8 * bytesFloat;
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
            new Accessor(0, bytesFloat, 3, 0, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, vertices.length / 8, stride)
        ];
    }
}
export class Sphere2 extends VertexObject {
    constructor(xSegments, ySegments) {
        const bytesFloat = 4;
        super();
        let stride = 8 * bytesFloat;
        let vertices = [];
        let indices = [];
        const sizeFloat = 4;
        let positions = [];
        let uv = [];
        let normals = [];
        const PI = Math.PI;
        for (let y = 0; y <= ySegments; ++y) {
            for (let x = 0; x <= xSegments; ++x) {
                let xSegment = x / xSegments;
                let ySegment = y / ySegments;
                let xPos = Math.cos(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
                let yPos = Math.cos(ySegment * PI);
                let zPos = Math.sin(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
                positions.push(xPos, yPos, zPos);
                uv.push(xSegment, ySegment);
                normals.push(xPos, yPos, zPos);
            }
        }
        let oddRow = false;
        for (let y = 0; y < ySegments; ++y) {
            if (!oddRow) {
                for (let x = 0; x <= xSegments; ++x) {
                    indices.push(y * (xSegments + 1) + x);
                    indices.push((y + 1) * (xSegments + 1) + x);
                }
            }
            else {
                for (let x = xSegments; x >= 0; --x) {
                    indices.push((y + 1) * (xSegments + 1) + x);
                    indices.push(y * (xSegments + 1) + x);
                }
            }
            oddRow = !oddRow;
        }
        this.indices = new Uint16Array(indices);
        for (let i = 0; i < positions.length; ++i) {
            vertices.push(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
            vertices.push(normals[3 * i], normals[3 * i + 1], normals[3 * i + 2]);
            vertices.push(uv[2 * i], uv[2 * i + 1]);
        }
        this.vertices = new Float32Array(vertices);
        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, vertices.length / 8, stride)
        ];
    }
}
//# sourceMappingURL=VertexObjects.js.map