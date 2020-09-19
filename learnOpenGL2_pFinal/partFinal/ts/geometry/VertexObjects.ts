import { vec3 } from "../../../math/glmatrix/index.js"

/**
 * D3Q: A VertexAccessors has a combination of accessors for one VertexObject.
 * this object does not own the indices and vertex-data, unlike a constructed 
 * VertexObject like a cube, Quad or Sphere. It has a pointer to the buffers 
 * that are referenced by the Accessors using a bufferId.
 */
export class VertexAccessors {
    /**
     * a pointer to the buffers of a vertexbuffer or to a buffer with indices
     */
    buffers: ArrayBuffer[];
    /**
     * the accessor for the index buffer
     */
    indexAccessor: Accessor;
    /**
     * names and ids of accessor, e.g. {NORMAL: 2, TEXCOORD_0: 4, POSITION: 1},
     * in the same way as used in a GLTF file
     */
    attributes: any = {};
    /**
     * the accessors for the attributes. The accessors can have different
     * bufferId's. For a subclass VertexObject the bufferId's of the accessors
     * are all equal to 0.
     */
    accessors: Accessor[] = [];
}

/**
 * D3Q: A VertexObject contains the vertices and indices of an object. The vertices 
 * have all the properties of points in space (its coordinates, colors, etc.). The
 * indices defines the triangles.
 * Finally, a VertexObject, being a subclass of VertexAccessors, has attributes + accessors 
 * that describe the layout of the content of the vertices buffer.
 * 
 * One of the simplest examples of a subclass is in the cube.ts file. There we use
 * attributes = {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, meaning that for the attribute
 * POSITION we use as accessor accessors[0], etc.
 * 
 * 
 */
// abstract class VertexObject extends VertexAccessors {
//     // vertices: Float32Array;
//     // indices: Uint16Array;

//     // getBuffers(): Float32Array[] {
//     //     return [this.vertices];
//     // }
// }

/**
 * D3Q: accessor into the vertices buffer.
 * example: 
 * a Matrix3 has 3x3 elements of the basetype, suppose float of 4 bytes. Then use
 * an accessor with bytesComponent=4 and countComponent=9. byteOffset is the index in the buffer
 * of the first Matrix3. countElements is the number of matrices. bytesStride is the 
 * number of bytes before next Matrix3 can be found.
 * 
 * Similar to an Accessor in a Khronos Gltf-file.
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
 */
export class Cube extends VertexAccessors {

    constructor() {
        const bytesFloat = 4;
        const bytesUint16Array = 2;


        super();
        this.buffers = new Array(2);
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;

        let vertices = new Float32Array([
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

/**
 * D3Q: Quad between (-1, -1, 1) and (1, 1, 1).
 * Every vertex has POSTITION, NORMAL and TEXCOORD_0 data.
 *
 *  Adapted from original source LearnOpenGL.com
 */
export class Quad extends VertexAccessors {

    constructor() {
        const bytesFloat = 4;
        const bytesUint16Array = 2;

        super();
        this.buffers = new Array(2);
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;
        //this.bytesStride = stride;

        let vertices = new Float32Array([
            // front face
            - 1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
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

/**
 * D3Q: Sphere with radius 1.0.
 * Every vertex has POSTITION, NORMAL and TEXCOORD_0 data.
 */
export class Sphere extends VertexAccessors {

    constructor(widthSegments: number, heightSegments: number) {
        const radius = 1.0;

        const bytesFloat = 4;

        super();
        this.buffers = new Array(2);
        // stride: the length of a record is 8*bytesFloat = 32 bytes;
        // 3 floats for POSITION + 3 floats for NORMAL + 2 floats for TEXCOORD_0.
        let stride = 8 * bytesFloat;

        let vertices = [];
        let indices = [];

        //radius projected on the XZ-plane
        let radiusXZ = 0;
        var x: number, y: number, z: number;

        var normal: vec3 = vec3.create();
        let thetaLength = Math.PI;
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

        // heightSegments+1 heights
        for (var iy = 0; iy <= heightSegments; iy++) {
            var v = 1.0 - iy / heightSegments;

            // widthSegments+1 widths
            for (var ix = 0; ix <= widthSegments; ix++) {
                var u = ix / widthSegments;

                // position:
                radiusXZ = radius * Math.sin(v * thetaLength);
                x = radiusXZ * Math.cos(u * phiLength);
                y = radius * Math.cos(v * thetaLength);
                z = -radiusXZ * Math.sin(u * phiLength);
                vertices.push(x, y, z);

                // normal
                normal = vec3.fromValues(x, y, z);
                vec3.normalize(normal, normal);
                vertices.push(normal[0], normal[1], normal[2]);

                // uv
                var uOffset = 0;
                if (iy == 0) {
                    // D3Q: at north pole
                    uOffset = 0.5 / widthSegments;
                } else if (iy == (heightSegments + 1)) {
                    // D3Q: at south pole
                    uOffset = 0.5 / widthSegments;
                }
                vertices.push(u + uOffset, v);
            }

        }

        //this.vertices = new Float32Array(vertices);

        // indices
        // iyFirst is start index for this segment
        // iyNext is start index next segment
        // there are widthSegments squares in each segment
        var iyFirst = 0;
        var iyNext = widthSegments + 1;

        // put indices for square at (ix, iy) in a, b, c, d
        var a: number, b: number, c: number, d: number;

        for (iy = 0; iy <= heightSegments; iy++) {

            for (ix = 0; ix <= widthSegments; ix++) {

                a = iyFirst + ix + 1;
                b = iyFirst + ix;
                c = iyNext + ix;
                d = iyNext + ix + 1;

                // create (except for top and bottom of sphere) two triangles
                if (iy !== 0) indices.push(a, b, d);
                if (iy !== heightSegments - 1) indices.push(b, c, d);
            }
            // next segment
            iyFirst += widthSegments + 1;
            iyNext += widthSegments + 1;
        }

        //this.indices = new Uint16Array(indices);

        this.buffers[0] = new Float32Array(vertices);
        this.buffers[1] = new Uint16Array(indices); //indices;

        this.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
        this.accessors = [
            new Accessor(0, bytesFloat, 3, 0, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 3, 3 * bytesFloat, vertices.length / 8, stride),
            new Accessor(0, bytesFloat, 2, 6 * bytesFloat, vertices.length / 8, stride)
        ];
    }
}
