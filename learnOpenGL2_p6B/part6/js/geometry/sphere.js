import { vec3 } from "../../../math/glmatrix/index.js";
export class Sphere {
    constructor(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
        const sizeFloat = 4;
        this.stride = (3 + 3 + 2) * sizeFloat;
        let vertices = [];
        let indices = [];
        let radiusxy = 0;
        var x, y, z;
        var normal = vec3.create();
        var vertexCount = 0;
        var thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
        for (var iy = 0; iy <= heightSegments; iy++) {
            var v = 1.0 - iy / heightSegments;
            for (var ix = 0; ix <= widthSegments; ix++) {
                var u = ix / widthSegments;
                radiusxy = radius * Math.sin(thetaStart + v * thetaLength);
                x = radiusxy * Math.cos(phiStart + u * phiLength);
                y = radius * Math.cos(thetaStart + v * thetaLength);
                z = -radiusxy * Math.sin(phiStart + u * phiLength);
                vertices.push(x, y, z);
                var uOffset = 0;
                if (iy == 0 && thetaStart == 0) {
                    uOffset = 0.5 / widthSegments;
                }
                else if (iy == (heightSegments + 1) && thetaEnd == Math.PI) {
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);
                vertexCount++;
            }
        }
        this.vertices = vertices;
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
        this.indices = indices;
        this.indexCount = indices.length;
    }
}
export class Sphere2 {
    constructor(radius, xSegments, ySegments, phiStart, phiLength, thetaStart, thetaLength) {
        const sizeFloat = 4;
        this.stride = (3 + 2 + 3) * sizeFloat;
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
        this.indices = [];
        let oddRow = false;
        for (let y = 0; y < ySegments; ++y) {
            if (!oddRow) {
                for (let x = 0; x <= xSegments; ++x) {
                    this.indices.push(y * (xSegments + 1) + x);
                    this.indices.push((y + 1) * (xSegments + 1) + x);
                }
            }
            else {
                for (let x = xSegments; x >= 0; --x) {
                    this.indices.push((y + 1) * (xSegments + 1) + x);
                    this.indices.push(y * (xSegments + 1) + x);
                }
            }
            oddRow = !oddRow;
        }
        this.indexCount = this.indices.length;
        this.vertices = [];
        for (let i = 0; i < positions.length; ++i) {
            this.vertices.push(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
            this.vertices.push(uv[2 * i], uv[2 * i + 1]);
            this.vertices.push(normals[3 * i], normals[3 * i + 1], normals[3 * i + 2]);
        }
    }
}
class SphereMesh {
}
class Primitive {
}
class Attribute {
    constructor(componentType, normalized, count, type) {
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.type = type;
    }
}
const attributeNames = ['POSITION', 'NORMAL', 'TEXTURE'];
//# sourceMappingURL=sphere.js.map