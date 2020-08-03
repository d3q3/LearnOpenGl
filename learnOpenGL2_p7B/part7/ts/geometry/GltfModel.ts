import { GltfResource } from "../../js/geometry/GltfLoader.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";





export class GltfModel {
    private r: GltfResource;
    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];

    /**
     * creates the GltfModel with BufferViews and Accessors created
     * @param r GltfResource
     */
    constructor(r: GltfResource) {
        this.r = r;

        if (r.json.bufferViews) {
            let bfs = r.json.bufferViews;
            this.bufferViews = new Array(bfs.length);
            for (let i = 0, leni = this.bufferViews.length; i < leni; i++) {
                this.bufferViews[i] = new GltfBufferView(bfs[i], this.r.buffers[bfs[i].buffer]);
            }
        }

        if (r.json.accessors) {
            let acs = r.json.accessors;
            this.accessors = new Array(acs.length);
            for (let i = 0, leni = this.bufferViews.length; i < leni; i++) {
                this.accessors[i] = new GltfAccessor(acs[i], this.bufferViews[acs[i].bufferView]);
            }
        }
    }

    getMeshes(useMaterials: boolean) {
        if (useMaterials) {
            // first getMaterials()
        }
        let meshes: GltfMesh[] = [];
        if (this.r.json.meshes) {
            let mss = this.r.json.meshes;
            //        meshes = new Array(mss.length);    // store mesh object
            for (let i = 0, leni = mss.length; i < leni; i++) {
                meshes.push(this.createMesh(mss[i], i, useMaterials));
            }
        }
        return meshes;
    }

    /**
     * Create a GltfMesh from a json description
     * @param mesh json object of gltf mesh
     * @param useMaterials add material to glDrawable or not
     */
    createMesh(mesh, id, useMaterials: boolean): GltfMesh {
        let m: GltfMesh = new GltfMesh();
        m.name = mesh.name != undefined ? mesh.name : m.name = "mesh" + id;

        for (let i = 0, leni = mesh.primitives.length; i < leni; i++) {
            let prim = mesh.primitives[i];
            let vo = this.createVertexObject(prim, useMaterials);
            m.vertexObjects.push(vo);
        }
        return m;
    }

    /**
     * creates a VertexObject from a gltf primitive
     * @param prim json object of a gltf primitive
     */
    createVertexObject(prim, useMaterials): GltfVertexObject {
        let ia = prim.indices !== undefined ? prim.indices : null;
        if (ia === null) throw (new Error("Only models with indices can be used."));
        let indicesAccessor = this.accessors[ia];

        let vo = new GltfVertexObject();
        vo.indices = new Uint16Array(this.bufferViews[indicesAccessor.bufferId].data);

        if (useMaterials)
            vo.material = prim.material !== undefined ? prim.material : null;
        else vo.material = null;

        vo.attributes = prim.attributes;
        Object.keys(vo.attributes).forEach((key, index) => {
            let acc = this.accessors[vo.attributes[key]];
            vo.accessors.push(acc);
        });

        return vo;
    }
}


export class GltfVertexObject extends VertexObject {
    material;
}

export class GltfMesh {
    name: string;

    vertexObjects: GltfVertexObject[];
    constructor() {
        this.vertexObjects = [];
    }
}




// /**
//  * Mesh A set of primitives to be rendered.  
//  * A node can contain one mesh.  A node's transform places the mesh in the scene.
//  */
// export class Mesh {
//     primitives: Primitive[]; //required
//     name;
//     //extra fields
//     meshID; //ID of mesh given creation of Node: ID in Meshes[] collection

//     constructor(model: GltfModel, m, meshID) {
//         //D3Q: in constructor wordt nu json doorgegeven ipv m.
//         //        var m = json.meshes[meshID];
//         this.meshID = meshID;
//         this.name = m.name !== undefined ? m.name : null;

//         this.primitives = [];   // required

//         var p, primitive;

//         for (var i = 0, len = m.primitives.length; i < len; ++i) {
//             p = m.primitives[i];
//             primitive = new Primitive(model, json, p);
//             this.primitives.push(primitive);
//         }
//     }
// }

// /**
//  * 
//  */
// export class Primitive {
//     //fields copied from specification:
//     attributes; //required
//     indices;
//     material;

//     //extra fields
//     indicesComponentType;
//     indicesLength;
//     indicesOffset;
//     drawArraysCount;
//     drawArraysOffset;
//     //gl-fields
//     // vertexArray;   //vao
//     // vertexBuffer;
//     // indexBuffer;
//     // shader;

//     constructor(model: GltfModel, json, p) {
//         // <attribute name, accessor id>, required
//         // get hook up with accessor object in _postprocessing
//         this.attributes = p.attributes;
//         this.indices = p.indices !== undefined ? p.indices : null;  // accessor id

//         if (this.indices !== null) {
//             this.indicesComponentType = json.accessors[this.indices].componentType;
//             this.indicesLength = json.accessors[this.indices].count;
//             this.indicesOffset = (json.accessors[this.indices].byteOffset || 0);
//         } else {
//             // assume 'POSITION' is there
//             this.drawArraysCount = json.accessors[this.attributes.POSITION].count;
//             this.drawArraysOffset = (json.accessors[this.attributes.POSITION].byteOffset || 0);
//         }

//         var attname;
//         for (attname in this.attributes) {
//             this.attributes[attname] = model.accessors[this.attributes[attname]];
//         }
//         this.material = p.material !== undefined ? model.materials[p.material] : null;

//         // // ----gl run time related
//         // this.vertexArray = null;    //vao

//         // //D3Q: we can do without this vertexbuffer...???
//         // this.vertexBuffer = null;
//         // this.indexBuffer = null;
//         // this.shader = null;

//     }
// }



class GltfBufferView {
    //fields copied from specification:
    byteOffset;
    byteLength; //required
    byteStride;
    //D3Q: if target is defined it specifies the GPU buffer type it should be bound to;
    //valid values 34962 (ARRAY_BUFFER) and 34963 (ELEMENT_ARRAY_BUFFER) in Gltf version 1.0
    target;
    //extra fields
    data; //contains the data copied from the buffer using byteOffset and byteLength

    /**
     * Creates BufferView from json description
     * @param bfv json description of bufferView
     * @param bufferData 
     */
    constructor(bfv, bufferData) {
        this.byteLength = bfv.byteLength;
        this.byteOffset = bfv.byteOffset !== undefined ? bfv.byteOffset : 0;
        this.byteStride = bfv.byteStride !== undefined ? bfv.byteStride : 0;
        this.target = bfv.target !== undefined ? bfv.target : null;

        this.data = bufferData.slice(this.byteOffset, this.byteOffset + this.byteLength);
    }
}

// see https://github.com/KhronosGroup/glTF/blob/master/specification/1.0/README.md
// for possible values ComponentType parameter; values for sizeBytes are given in table
// that lacks INT, UNSIGNED_INT, DOUBLE
const ComponentTypeSizeBytes = {
    5120: 1, // BYTE
    5121: 1, // UNSIGNED_BYTE
    5122: 2, // SHORT
    5123: 2, // UNSIGNED_SHORT
    //5124: 4, // INT
    //5125: 4, // UNSIGNED_INT
    5126: 4, // FLOAT
    //5130:  8, // DOUBLE  
};

const CountComponentsInType = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};


//bufferId: number; bytesType: number; count: number; stride: number; offset: number;


export class GltfAccessor extends Accessor {
    //fields copied from specification:
    bufferViewId: number;
    componentType;   // required
    normalized;
    count: number;   // required
    //type: number;     // required


    /**
     * Creates GltfAccessor from json description
     * @param acs json description of accessor
     * @param bytesStride 
     */
    constructor(acs, bufferView: GltfBufferView) {
        super(
            acs.bufferView,
            ComponentTypeSizeBytes[acs.componentType],
            CountComponentsInType[acs.type],
            acs.byteOffset !== undefined ? acs.byteOffset : 0,
            bufferView.byteStride);
        this.normalized = acs.normalized !== undefined ? acs.normalized : false;
        this.componentType = acs.componentType;   // required
        this.count = acs.count;
    }
}

// var Type2NumOfComponent = {
//     'SCALAR': 1,
//     'VEC2': 2,
//     'VEC3': 3,
//     'VEC4': 4,
//     'MAT2': 4,
//     'MAT3': 9,
//     'MAT4': 16
// };

// export class Accessor {
//     bytesType: number; stride: number; offset: number; count: number;
//     constructor(bytesType: number, count: number, byteOffset: number, byteStride: number) {
//         this.bytesType = bytesType;
//         this.count = count;
//         this.offset = byteOffset;
//         this.stride = byteStride;
//     }
// }