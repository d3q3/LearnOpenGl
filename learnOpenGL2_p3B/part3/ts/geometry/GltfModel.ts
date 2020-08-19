import { GltfResource } from "../../js/geometry/GltfLoader.js";
import { VertexObject, Accessor, AccessorObject } from "../../js/geometry/VertexObjects.js";
import { vec3, vec4, mat4, quat } from "../../../math/glmatrix/index.js"

/**
 * D3Q: may 16 2020; Part of learnOpenGL2_p3B, Ch 21, use of models.
 */

/**
 * class GltfModel, top-level class.
 * Created using a GltfResource loaded with GltfLoader.load(uri)
 */
export class GltfModel {
    private r: GltfResource;
    private useMaterials: boolean;

    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];
    nodes: GltfNode[];
    meshes: GltfMesh[];

    meshJson(id) {
        return this.r.json.meshes[id];
    }

    /**
     * creates the GltfModel with BufferViews and Accessors created.
     * Also Nodes are created, but without meshes: call getMesh()
     * Meshes is a cache for meshes and is initially empty.
     * if useMaterials == true the materials will be loaded as well (see part6, ChGltf)
     * @param r GltfResource
     * @param useMaterials boolean
     */
    constructor(r: GltfResource, useMaterials: boolean) {
        this.r = r;
        this.useMaterials = useMaterials;

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
            for (let i = 0, leni = this.accessors.length; i < leni; i++) {
                this.accessors[i] = new GltfAccessor(acs[i], this.bufferViews[acs[i].bufferView]);
            }
        }

        if (r.json.nodes) {
            let nds = r.json.nodes;
            this.nodes = new Array(nds.length);
            for (let i = 0, leni = this.nodes.length; i < leni; i++) {
                this.nodes[i] = new GltfNode(this, nds[i]);
            }
            for (let i = 0, leni = this.nodes.length; i < leni; i++) {
                this.nodes[i].setChildren(nds[i]);
            }
        }

        if (r.json.meshes) {
            this.meshes = new Array(r.json.meshes.length);
        }
        else this.meshes = new Array(0);
    }

    /**
    * Create a GltfMesh from a json description
    * @param mesh json object of gltf mesh
    * @param useMaterials add material to glDrawable or not
    */
    getMesh(mesh, id): GltfMesh {
        if (this.meshes[id]) return this.meshes[id];

        let m: GltfMesh = new GltfMesh();
        m.name = mesh.name != undefined ? mesh.name : m.name = "mesh" + id;
        m.id = id;

        for (let i = 0, leni = mesh.primitives.length; i < leni; i++) {
            let prim = mesh.primitives[i];
            let vo = this.createVertexObject(prim, this.useMaterials);
            m.vertexObjects.push(vo);
        }

        this.meshes[id] = m;
        return m;
    }

    getMeshes() {
        if (this.useMaterials) {
            // first getMaterials()
        }

        if (this.r.json.meshes) {
            let mss = this.r.json.meshes;

            for (let i = 0, leni = mss.length; i < leni; i++) {
                this.meshes[i] = this.getMesh(mss[i], i);//.push(this.createMesh(mss[i], i, useMaterials));
            }

        }
        return this.meshes;
    }

    getScene(id: number): GltfScene {

        let sc = this.r.json.scenes[id];
        if (!sc) return null;
        let scene = new GltfScene(this, sc);
        return scene;
    }

    /**
     * creates a VertexObject from a gltf primitive
     * @param prim json object of a gltf primitive
     */
    createVertexObject(prim, useMaterials): GltfVertexObject {
        let ia = prim.indices !== undefined ? prim.indices : null;
        if (ia === null) throw (new Error("Only models with indices can be used."));

        let vo = new GltfVertexObject();
        vo.indexAccessor = this.accessors[ia];

        //vo.indices = new Uint16Array(this.bufferViews[vo.indexAccessor.bufferId].data);

        if (useMaterials)
            vo.materialId = prim.material !== undefined ? prim.material : 0;
        else vo.materialId = -1;

        Object.assign(vo.attributes, prim.attributes);

        let accId = 0;
        Object.keys(prim.attributes).forEach((key, index) => {
            // D3Q: find the accessor in the models accessors list
            let acc = this.accessors[vo.attributes[key]];
            // add it to the accessor list of the vertexObject
            vo.attributes[key] = accId;
            vo.accessors.push(acc);
            accId++;
        });

        return vo;
    }
}

/**
 * Temporarily(?) in this file;
 * A GltfVertexObject does not contain the vertices and indices. Instead the
 * data are in our models BufferViews. The data can be accessed via the accessors.
 * materialId=0: default material
 * materialId=-1: no material
 */
export class GltfVertexObject extends AccessorObject {
    materialId: number;
}

/**
 * created by model.getMesh()
 */
export class GltfMesh {
    name: string;
    id: number;

    vertexObjects: GltfVertexObject[];
    constructor() {
        this.vertexObjects = [];
    }
}


/**
 * A GltfNode has 0..N children
 * A mesh, skin and camera are optional
 * A Gltf node can define a local space transformation either 
 *      by supplying a matrix property, 
 *      or any of translation, rotation, and scale properties (TRS properties).
 */
export class GltfNode {
    //D3Q: we need a ref to model in the call to getMesh()
    private model: GltfModel;

    children: GltfNode[];

    //D3Q: the cameras are created by GltfScene.getCameras()
    cameraId;

    // D3Q: the meshObject is only created after first getMesh()
    meshId;
    meshObject: GltfMesh;

    skin;

    // D3Q: local matrix
    matrix;
    translation;
    rotation;
    scale;

    //D3Q: ppMatrix : parentMatrix-product-this.matrix
    ppMatrix = mat4.create();

    constructor(model: GltfModel, node) {
        this.model = model;

        //D3Q: the following block makes sure every node has the properties
        //matrix, translation, rotation and sccale.
        this.matrix = mat4.create();

        if (node.hasOwnProperty('matrix')) {
            for (var i = 0; i < 16; ++i) {
                this.matrix[i] = node.matrix[i];
            }
            // calculate T, R and S
            this.translation = vec3.create();
            mat4.getTranslation(this.translation, this.matrix);
            this.rotation = quat.create();
            mat4.getRotation(this.rotation, this.matrix);
            this.scale = vec3.create();
            mat4.getScaling(this.scale, this.matrix);
        }
        else {
            this.translation = node.translation !== undefined ?
                vec3.fromValues(node.translation[0], node.translation[1], node.translation[2])
                : vec3.fromValues(0, 0, 0);
            this.rotation = node.rotation !== undefined ?
                vec4.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])
                : vec4.fromValues(0, 0, 0, 1);
            this.scale = node.scale !== undefined ?
                vec3.fromValues(node.scale[0], node.scale[1], node.scale[2]) : vec3.fromValues(1, 1, 1);

            mat4.fromRotationTranslation(this.matrix, this.rotation, this.translation);
            mat4.scale(this.matrix, this.matrix, this.scale);
        }

        this.cameraId = node.camera !== undefined ? node.camera : null;

        this.meshId = node.mesh !== undefined ? node.mesh : null;
        this.meshObject = null;



        // if (node.children) {
        //     this.children = new Array(node.children.length);
        //     for (let i = 0, ilen = this.children.length; i < ilen; i++) {
        //         this.children[i] = model.nodes[node.children[i]];
        //     }
        // }
        // else
        //     this.children = [];
    };

    setChildren(node) {
        if (node.children) {
            this.children = new Array(node.children.length);
            for (let i = 0, ilen = this.children.length; i < ilen; i++) {
                this.children[i] = this.model.nodes[node.children[i]];
            }
        }
        else
            this.children = [];
    }

    getMesh(useMaterials): GltfMesh {
        if (this.meshObject) return this.meshObject;
        if (this.meshId !== null)
            return this.model.getMesh(this.model.meshJson(this.meshId), this.meshId);
        return null;
    }

    flatten(nodes: GltfNode[]) {
        nodes.push(this);
        this.children.forEach(node => { node.flatten(nodes) });
    }

    /**
     * D3Q: execute Function in nodes top-down
     * @param parent 
     * @param executeFunction
     */
    traversePreOrder(parent: GltfNode, executeFunction) {
        executeFunction(this, parent);
        for (var i = 0, ilen = this.children.length; i < ilen; i++) {
            this.children[i].traversePreOrder(this, executeFunction);
        }
    };

    /**
     * D3Q: execute Function in nodes bottom-up
     * @param parent 
     * @param executeFunction
     */
    traversePostOrder(parent: GltfNode, executeFunction) {
        for (var i = 0, ilen = this.children.length; i < ilen; i++) {
            this.children[i].traversePostOrder(this, executeFunction);
        }
        executeFunction(this, parent);
    };
}

/**
 * D3Q: all camera nodes are retrieved using Scene.getCameras().
 * The information on camera type (perspective/) is not retrieved yet, the view
 * matrix is the ppMatrix of flatNode.
 * the id of the camera and a ref to model is in flatNode, so it can be done.
 */
export class GltfCamera {
    flatNode: GltfNode;
    constructor(node: GltfNode) {
        this.flatNode = node;
    }

    getView() {
        return mat4.invert(mat4.create(), this.flatNode.ppMatrix);
        //return mat4.clone(this.flatNode.ppMatrix);
    }

    getPosition() {
        return mat4.getTranslation(vec3.create(), this.flatNode.ppMatrix);
    }
}


/**
 * D3Q: Scene contains a collection of treeswith GltfNodes
 */
export class GltfScene {
    name: string;
    private children: GltfNode[];
    private flatNodes: GltfNode[];

    constructor(model: GltfModel, sc) {
        this.name = sc.name !== undefined ? sc.name : null;
        let ilen = (sc.nodes) ? sc.nodes.length : 0;
        this.children = new Array(ilen);

        for (var i = 0; i < ilen; i++) {
            this.children[i] = model.nodes[sc.nodes[i]];
        }

        this.flatten()
        this.updatePpMatrices();
    }

    /**
    * D3Q: updates the ppMatrices in the nodes of this scene
    */
    updatePpMatrices() {
        for (let i = 0, leni = this.children.length; i < leni; i++) {
            this.children[i].traversePreOrder(null, this.execUpdatePpMatrix);
        }
    }

    getMeshNodes(): GltfNode[] {
        let nodes = [];
        for (let i = 0, leni = this.flatNodes.length; i < leni; i++) {
            if (this.flatNodes[i].getMesh(false)) nodes.push(this.flatNodes[i]);
        }
        return nodes;
    }

    getCameraNodes(): GltfCamera[] {
        let cameras = [];
        for (let i = 0, leni = this.flatNodes.length; i < leni; i++) {
            if (this.flatNodes[i].cameraId !== null) {
                let camera = new GltfCamera(this.flatNodes[i])
                cameras.push(camera);
            }
        }
        return cameras;
    }

    private flatten() {
        this.flatNodes = [];
        for (let i = 0, leni = this.children.length; i < leni; i++) {
            this.children[i].flatten(this.flatNodes);
        }
    }

    private execUpdatePpMatrix(node: GltfNode, parent: GltfNode) {
        if (parent !== null) {
            mat4.mul(node.ppMatrix, parent.ppMatrix, node.matrix);
        } else {
            mat4.copy(node.ppMatrix, node.matrix);
        }
    }
}

// D3Q: Next: Access to data, GltfBufferView and GltfAccessor

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



export class GltfAccessor extends Accessor {
    //fields copied from specification:
    bufferViewId: number;
    componentType;   // required
    normalized;
    //count: number;   // required
    //type: number;     // required

    /**
     * Creates GltfAccessor from json description
     * @param acs json description of accessor
     * @param bytesStride 
     */
    constructor(acs, bufferView: GltfBufferView) {
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

        super(
            acs.bufferView,
            ComponentTypeSizeBytes[acs.componentType],
            CountComponentsInType[acs.type],
            acs.byteOffset !== undefined ? acs.byteOffset : 0,
            acs.count,
            bufferView.byteStride);
        this.normalized = acs.normalized !== undefined ? acs.normalized : false;
        this.componentType = acs.componentType;   // required
        //this.count = acs.count;
    }
}