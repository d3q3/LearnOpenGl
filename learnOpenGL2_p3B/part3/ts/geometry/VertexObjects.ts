
import { vec3 } from "../../../math/glmatrix/index.js"

/**
 * D3Q: An AccessorObject is a combination of accessors for one VertexObject.
 * 
 */
export class AccessorObject {
    indexAccessor: Accessor;
    attributes: any = {};
    accessors: Accessor[] = [];
}

/**
 * D3Q: A VertexObject contains the vertices and indices of an object. The vertices 
 * have all the properties of points in space (its coordinates, colors, etc.). The
 * indices defines the triangles.
 * Finally, a VertexObject has attributes + accessors that describe the layout of the 
 * content of the vertices buffer.
 * 
 * In a VertexObject the vertices buffer acts as a BufferView of a .gltf file. The contents
 * of the buffer is accessed using accessors.  The attributes correspond to accessors, 
 * also as in a .gltf file. 
 * One of the simplest examples of a subclass is in the cube.ts file. There we use
 * attributes = {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, meaning that for the attribute
 * POSITION we use as accessor accessors[0], etc.
 * 
 * 
 * All subclasses must have indices defined.
 */
export class VertexObject extends AccessorObject {
    vertices: Float32Array;
    indices: Uint16Array;
    //bytesStride: number;

    // attributes: any = {};
    // accessors: Accessor[] = [];

    // constructor() {
    //     this.bytesStride = bytesStride;
    // }

    getBuffers(): Float32Array[] {
        return [this.vertices];
    }
}

/**
 * D3Q: accessor into the vertices buffer.
 * example: 
 * a Matrix3 has 3x3 elements of the basetype, suppose float of 4 bytes. Then use
 * an accessor with bytesComponent=4 and countComponent=9. byteOffset is the index in the buffer
 * of the first Matrix3. countElements is the number of matrices. bytesStride is the 
 * number of bytes before next Matrix3 can be found.
 */
export class Accessor {
    bufferId: number;
    bytesComponent: number;
    countComponent: number;
    stride: number;
    byteOffset: number;
    countElements: number
    constructor(bufferId, bytesComponent: number, countComponent: number,
        byteOffset: number, countElements: number, byteStride: number) {
        this.bufferId = bufferId;
        this.bytesComponent = bytesComponent;
        this.countComponent = countComponent;
        this.byteOffset = byteOffset;
        this.countElements = countElements;
        this.stride = byteStride;
    }
}

/**
 * D3Q: Cube between (-1, -1, -1) and (1, 1, 1), so the sides have length=2.
 * Every vertex has POSTITION, NORMAL and TEXCOORD_0 data.
 * 
 *  Adapted from original source LearnOpenGL.com
 */
export class Cube extends VertexObject {

    constructor() {
        const bytesFloat = 4;
        super();
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;
        //this.bytesStride = stride;

        this.vertices = new Float32Array([
            // back face
            - 1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, // bottom-right
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, // top-left
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
            -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, // top-left
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 0.0, 0.0, // bottom-right
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
            // right face
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
            1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, // top-right         
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
            1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
            1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0, // top-left
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
            -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0, // bottom-right
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
            // top face
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
            1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0, // top-right     
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
            -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0  // bottom-left        
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

/**
 * D3Q: Quad between (-1, -1, 1) and (1, 1, 1).
 * Every vertex has POSTITION, NORMAL and TEXCOORD_0 data.
 *
 *  Adapted from original source LearnOpenGL.com
 */
export class Quad extends VertexObject {

    constructor() {
        const bytesFloat = 4;
        super();
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;
        //this.bytesStride = stride;

        this.vertices = new Float32Array([
            // front face
            - 1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
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

/**
 * D3Q: Sphere with radius 1.0.
 * Every vertex has POSTITION, NORMAL and TEXCOORD_0 data.
 *
 * Adapted from original source Three.js
 */
export class Sphere extends VertexObject {

    constructor(widthSegments: number, heightSegments: number) {
        const radius = 1.0;

        const bytesFloat = 4;

        super();
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;
        //this.bytesStride = stride;

        let vertices = [];
        let indices = [];

        //radius projected on the xz-plane
        let radiusxy = 0;
        var x: number, y: number, z: number;

        var normal: vec3 = vec3.create();
        //var thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
        let thetaStart = 0;
        let thetaEnd = Math.PI;
        let thetaLength = Math.PI;
        let phiStart = 0;
        let phiLength = 2 * Math.PI;


        /*
        D3Q: For the sphere we use sperical polar coordinates (Arfken, page 117) with y in
        the up-direction:
        y=+r.cos(theta)
        x=-r.sin(theta).cos(phi)
        z=+r.sin(theta).sin(phi)
 
        We cover the selected area of the sphere bij 'rectangles' (two triangles),
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

                // normal
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);

                // uv
                var uOffset = 0;
                if (iy == 0 && thetaStart == 0) {
                    // D3Q: at north pole
                    uOffset = 0.5 / widthSegments;
                } else if (iy == (heightSegments + 1) && thetaEnd == Math.PI) {
                    // D3Q: at south pole
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);
            }

        }
        this.vertices = new Float32Array(vertices);

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
        this.indices = new Uint16Array(indices);

        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, vertices.length / 8, stride)
        ];

    }
}


/**
 * This Sphere class is more conform the text in LearnOpenGL.
 * Not that radius is 1.0.
 * Rendering must be done with GL_TRIANGLE_STRIP!
 */
export class Sphere2 extends VertexObject {

    //stride: distance in bytes between consecutive vertices
    stride: number;

    /**
     * Creates a sphere of radius 1.0
     * @param xSegments 
     * @param ySegments 
     */
    constructor(xSegments: number, ySegments: number) {

        const bytesFloat = 4;

        super()
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;
        //this.bytesStride = stride;

        let vertices = [];
        let indices = [];
        const sizeFloat = 4;

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

        let oddRow = false;
        for (let y = 0; y < ySegments; ++y) {
            if (!oddRow) // even rows: y == 0, y == 2; and so on
            {
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

