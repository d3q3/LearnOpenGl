import { Accessor, VertexAccessors } from "../../js/geometry/VertexObjects.js";
import { DrawScene, DrawNode } from "../../js/geometry/Drawable.js";
import { vec3, vec4, mat4, quat } from "../../../math/glmatrix/index.js";
import { GltfTexture, GltfSampler, GltfMaterial } from "./GltfMaterial.js";
import { DrawModel, DrawMesh, DrawObject } from "../../js/geometry/Drawable.js";
export { GltfMaterial };
export class GltfModel extends DrawModel {
    constructor(r, useMaterials) {
        super();
        this.samplers = null;
        this.textures = null;
        this.materials = null;
        this.bufferCount = 0;
        this.textureCount = 0;
        this.r = r;
        this.useMaterials = useMaterials;
        this.sceneCount = r.json.scenes.length;
        this.name = r.modelName;
        if (r.json.bufferViews) {
            let bfs = r.json.bufferViews;
            this.bufferViews = new Array(bfs.length);
            this.buffers = new Array(bfs.length);
            for (let i = 0, leni = this.bufferViews.length; i < leni; i++) {
                this.bufferViews[i] = new GltfBufferView(bfs[i], this.r.buffers[bfs[i].buffer]);
                this.buffers[i] = this.bufferViews[i].data;
            }
            this.bufferCount = bfs.length;
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
        else
            this.meshes = new Array(0);
        if (useMaterials) {
            if (r.json.samplers) {
                this.samplers = new Array(r.json.samplers.length);
                for (let i = 0, leni = this.samplers.length; i < leni; i++) {
                    this.samplers[i] = new GltfSampler(r.json.samplers[i]);
                }
            }
            else
                this.samplers = new Array(0);
            if (r.json.textures) {
                this.textures = new Array(r.json.textures.length);
                for (let i = 0, leni = this.textures.length; i < leni; i++) {
                    this.textures[i] = new GltfTexture(i, r.json.textures[i], this.samplers, r.images);
                }
                this.textureCount = r.json.textures.length;
            }
            else
                this.textures = new Array(0);
            if (r.json.materials) {
                this.materials = new Array(r.json.materials.length);
                this.getMaterials();
            }
            else
                this.materials = new Array(0);
        }
    }
    meshJson(id) {
        return this.r.json.meshes[id];
    }
    getDrawNodes() {
        let drawNodes = new Array(this.nodes.length);
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            drawNodes[i] = new DrawNode(drawNodes, node.childIds, node.matrix, node.meshId);
        }
        return drawNodes;
    }
    getDrawScene(id) {
        let gltfScene = this.getScene(id);
        let drawNodes = this.getDrawNodes();
        return new DrawScene(gltfScene.name, drawNodes, gltfScene.childIds);
    }
    getMaterial(material, id) {
        if (!this.materials[id])
            this.materials[id] = new GltfMaterial(this.textures, material, id);
        return this.materials[id];
    }
    getMaterials() {
        if (this.r.json.materials) {
            let mats = this.r.json.materials;
            for (let i = 0, leni = mats.length; i < leni; i++) {
                this.materials[i] = this.getMaterial(mats[i], i);
            }
        }
    }
    getMesh(mesh, id) {
        if (this.meshes[id])
            return this.meshes[id];
        let m = new DrawMesh();
        m.name = mesh.name != undefined ? mesh.name : m.name = "mesh" + id;
        m.id = id;
        for (let i = 0, leni = mesh.primitives.length; i < leni; i++) {
            let prim = mesh.primitives[i];
            let vo = this.createDrawObject(prim, this.useMaterials);
            m.vertexObjects.push(vo);
        }
        this.meshes[id] = m;
        return m;
    }
    getMeshes() {
        if (this.r.json.meshes) {
            let mss = this.r.json.meshes;
            for (let i = 0, leni = mss.length; i < leni; i++) {
                this.meshes[i] = this.getMesh(mss[i], i);
            }
        }
        return this.meshes;
    }
    getScene(id) {
        let sc = this.r.json.scenes[id];
        if (!sc)
            return null;
        let scene = new GltfScene(this, sc);
        return scene;
    }
    createDrawObject(prim, useMaterials) {
        let ia = prim.indices !== undefined ? prim.indices : null;
        if (ia === null)
            throw (new Error("Only models with indices can be used."));
        let vas = new VertexAccessors();
        vas.indexAccessor = this.accessors[ia];
        vas.buffers = this.buffers;
        Object.assign(vas.attributes, prim.attributes);
        let accId = 0;
        Object.keys(prim.attributes).forEach((key, index) => {
            let acc = this.accessors[vas.attributes[key]];
            vas.attributes[key] = accId;
            vas.accessors.push(acc);
            accId++;
        });
        let material;
        if (useMaterials)
            material = prim.material !== undefined ? this.materials[prim.material] :
                this.materials[0];
        else
            material = null;
        let drawObject = new DrawObject(vas, material);
        return drawObject;
    }
}
export class GltfNode {
    constructor(model, node) {
        this.ppMatrix = mat4.create();
        this.model = model;
        this.matrix = mat4.create();
        if (node.hasOwnProperty('matrix')) {
            for (var i = 0; i < 16; ++i) {
                this.matrix[i] = node.matrix[i];
            }
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
    }
    ;
    setChildren(node) {
        if (node.children) {
            this.childIds = node.children;
            this.children = new Array(node.children.length);
            for (let i = 0, ilen = this.children.length; i < ilen; i++) {
                this.children[i] = this.model.nodes[node.children[i]];
            }
        }
        else {
            this.childIds = [];
            this.children = [];
        }
    }
    getMesh(useMaterials) {
        if (this.meshObject)
            return this.meshObject;
        if (this.meshId !== null)
            return this.model.getMesh(this.model.meshJson(this.meshId), this.meshId);
        return null;
    }
    flatten(nodes) {
        nodes.push(this);
        this.children.forEach(node => { node.flatten(nodes); });
    }
    traversePreOrder(parent, executeFunction) {
        executeFunction(this, parent);
        for (var i = 0, ilen = this.children.length; i < ilen; i++) {
            this.children[i].traversePreOrder(this, executeFunction);
        }
    }
    ;
    traversePostOrder(parent, executeFunction) {
        for (var i = 0, ilen = this.children.length; i < ilen; i++) {
            this.children[i].traversePostOrder(this, executeFunction);
        }
        executeFunction(this, parent);
    }
    ;
}
export class GltfCamera {
    constructor(node) {
        this.flatNode = node;
    }
    getView() {
        return mat4.invert(mat4.create(), this.flatNode.ppMatrix);
    }
    getPosition() {
        return mat4.getTranslation(vec3.create(), this.flatNode.ppMatrix);
    }
}
export class GltfScene {
    constructor(model, sc) {
        this.name = (sc.name !== undefined) ? sc.name : null;
        this.childIds = sc.nodes;
        let ilen = (sc.nodes) ? sc.nodes.length : 0;
        this.children = new Array(ilen);
        for (var i = 0; i < ilen; i++) {
            this.children[i] = model.nodes[sc.nodes[i]];
        }
        this.flatten();
        this.updatePpMatrices();
    }
    updatePpMatrices() {
        for (let i = 0, leni = this.children.length; i < leni; i++) {
            this.children[i].traversePreOrder(null, this.execUpdatePpMatrix);
        }
    }
    getMeshNodes() {
        let nodes = [];
        for (let i = 0, leni = this.flatNodes.length; i < leni; i++) {
            if (this.flatNodes[i].getMesh(false))
                nodes.push(this.flatNodes[i]);
        }
        return nodes;
    }
    getCameraNodes() {
        let cameras = [];
        for (let i = 0, leni = this.flatNodes.length; i < leni; i++) {
            if (this.flatNodes[i].cameraId !== null) {
                let camera = new GltfCamera(this.flatNodes[i]);
                cameras.push(camera);
            }
        }
        return cameras;
    }
    flatten() {
        this.flatNodes = [];
        for (let i = 0, leni = this.children.length; i < leni; i++) {
            this.children[i].flatten(this.flatNodes);
        }
    }
    execUpdatePpMatrix(node, parent) {
        if (parent !== null) {
            mat4.mul(node.ppMatrix, parent.ppMatrix, node.matrix);
        }
        else {
            mat4.copy(node.ppMatrix, node.matrix);
        }
    }
}
class GltfBufferView {
    constructor(bfv, bufferData) {
        this.byteLength = bfv.byteLength;
        this.byteOffset = bfv.byteOffset !== undefined ? bfv.byteOffset : 0;
        this.byteStride = bfv.byteStride !== undefined ? bfv.byteStride : 0;
        this.target = bfv.target !== undefined ? bfv.target : null;
        this.data = bufferData.slice(this.byteOffset, this.byteOffset + this.byteLength);
    }
}
export class GltfAccessor extends Accessor {
    constructor(acs, bufferView) {
        const ComponentTypeSizeBytes = {
            5120: 1,
            5121: 1,
            5122: 2,
            5123: 2,
            5126: 4,
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
        super(acs.bufferView, ComponentTypeSizeBytes[acs.componentType], CountComponentsInType[acs.type], acs.byteOffset !== undefined ? acs.byteOffset : 0, acs.count, bufferView.byteStride);
        this.normalized = acs.normalized !== undefined ? acs.normalized : false;
        this.componentType = acs.componentType;
    }
}
//# sourceMappingURL=GltfModel.js.map