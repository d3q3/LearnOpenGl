import { vec3 } from "../../../math/glmatrix/index.js"

export class Sphere {

    public indexCount: number;
    indices: number[];
    vertices: number[];

    //stride: distance in bytes between consecutive vertices
    stride: number;

    constructor(radius: number, widthSegments: number, heightSegments: number,
        phiStart: number, phiLength: number, thetaStart: number, thetaLength: number) {

        const sizeFloat = 4;

        this.stride = (3 + 3 + 2) * sizeFloat;

        let vertices = [];
        let indices = [];

        //radius projected on the xz-plane
        let radiusxy = 0;
        var x: number, y: number, z: number;

        var normal: vec3 = vec3.create();
        var vertexCount = 0;
        var thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);


        /*
        For the sphere we use sperical polar coordinates (Arfken, page 117) with y in
        the up-direction:
        y=+r.cos(theta)
        x=-r.sin(theta).cos(phi)
        z=+r.sin(theta).sin(phi)

        We cover the selected area of the sphere bij rectangles,
        for every (heightSegment, widthSegment) we create vertices:
        positions, normals and uvs
         
        In the uv-mapping We use the cylindrical projection. The top of the sphere
        has v=1 and the bottom v=0;

        When theta==0 or theta==pi all the widthSegments are in fact the same point
        on the sphere. These will be given different uv-values and the top segemnt
        and the bottom segment will be represented by triangles instead of rectangles.
        */

        //heightSegments+1 heights
        for (var iy = 0; iy <= heightSegments; iy++) {
            var v = 1.0 - iy / heightSegments;

            //widthSegments+1 widths
            for (var ix = 0; ix <= widthSegments; ix++) {
                var u = ix / widthSegments;

                // position:
                radiusxy = radius * Math.sin(thetaStart + v * thetaLength);
                x = radiusxy * Math.cos(phiStart + u * phiLength);
                y = radius * Math.cos(thetaStart + v * thetaLength);
                z = -radiusxy * Math.sin(phiStart + u * phiLength);
                vertices.push(x, y, z);

                // uv
                var uOffset = 0;
                if (iy == 0 && thetaStart == 0) {
                    uOffset = 0.5 / widthSegments;
                } else if (iy == (heightSegments + 1) && thetaEnd == Math.PI) {
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);

                // normal
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);

                vertexCount++;
            }

        }
        this.vertices = vertices;

        // indices
        var iyFirst = 0;
        var iyNext = widthSegments + 1;
        var a: number, b: number, c: number, d: number;
        for (iy = 0; iy <= heightSegments; iy++) {

            for (ix = 0; ix <= widthSegments; ix++) {

                a = iyFirst + ix + 1;
                b = iyFirst + ix;
                c = iyNext + ix;
                d = iyNext + ix + 1;

                if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
                if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);

            }
            iyFirst += widthSegments + 1;
            iyNext += widthSegments + 1;
        }
        this.indices = indices;
        this.indexCount = indices.length;
    }
}


/**
 * This Sphere class is more conform the text in LearnOpenGL.
 * Not that radius in the constructor and the last 4 parameters are not used.
 */
export class Sphere2 {
    public indexCount: number;
    indices: number[];
    vertices: number[];

    //stride: distance in bytes between consecutive vertices
    stride: number;

    /**
     * Creates a sphere of radius 1.0
     * @param radius always = 1.0
     * @param xSegments 
     * @param ySegments 
     * @param phiStart not used
     * @param phiLength not used
     * @param thetaStart not used
     * @param thetaLength not used
     */
    constructor(radius: number, xSegments: number, ySegments: number,
        phiStart: number, phiLength: number, thetaStart: number, thetaLength: number) {

        const sizeFloat = 4;

        this.stride = (3 + 2 + 3) * sizeFloat;

        let positions: number[] = [];
        let uv: number[] = [];
        let normals: number[] = [];

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
            if (!oddRow) // even rows: y == 0, y == 2; and so on
            {
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
    indices: number[];
    vertices: number[];
    stride: number;



}

class Primitive {

    attributes; //required
    indices;
    material;
    mode; // 4 = GL_TRIANGLES
    //extra fields
    indicesComponentType;
    indicesLength;
    indicesOffset;
    drawArraysCount;
    drawArraysOffset;
    boundingBox;

}

class Attribute {
    componentType;   // required
    normalized;
    count;   // required
    type;     // required
    min;   // @tmp assume required for now (for bbox)
    max;   // @tmp assume required for now (for bbox)

    constructor(componentType,
        normalized,
        count,
        type
    ) {
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.type = type;
    }

}

const attributeNames = ['POSITION', 'NORMAL', 'TEXTURE'];