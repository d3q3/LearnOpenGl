import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";
export class GltfModel {
    constructor(r) {
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
    getMeshes(useMaterials) {
        if (useMaterials) {
        }
        let meshes = [];
        if (this.r.json.meshes) {
            let mss = this.r.json.meshes;
            for (let i = 0, leni = mss.length; i < leni; i++) {
                meshes.push(this.createMesh(mss[i], i, useMaterials));
            }
        }
        return meshes;
    }
    createMesh(mesh, id, useMaterials) {
        let m = new GltfMesh();
        m.name = mesh.name != undefined ? mesh.name : m.name = "mesh" + id;
        for (let i = 0, leni = mesh.primitives.length; i < leni; i++) {
            let prim = mesh.primitives[i];
            let vo = this.createVertexObject(prim, useMaterials);
            m.vertexObjects.push(vo);
        }
        return m;
    }
    createVertexObject(prim, useMaterials) {
        let ia = prim.indices !== undefined ? prim.indices : null;
        if (ia === null)
            throw (new Error("Only models with indices can be used."));
        let indicesAccessor = this.accessors[ia];
        let vo = new GltfVertexObject();
        vo.indices = new Uint16Array(this.bufferViews[indicesAccessor.bufferId].data);
        if (useMaterials)
            vo.material = prim.material !== undefined ? prim.material : null;
        else
            vo.material = null;
        vo.attributes = prim.attributes;
        Object.keys(vo.attributes).forEach((key, index) => {
            let acc = this.accessors[vo.attributes[key]];
            vo.accessors.push(acc);
        });
        return vo;
    }
}
export class GltfVertexObject extends VertexObject {
}
export class GltfMesh {
    constructor() {
        this.vertexObjects = [];
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
export class GltfAccessor extends Accessor {
    constructor(acs, bufferView) {
        super(acs.bufferView, ComponentTypeSizeBytes[acs.componentType], CountComponentsInType[acs.type], acs.byteOffset !== undefined ? acs.byteOffset : 0, bufferView.byteStride);
        this.normalized = acs.normalized !== undefined ? acs.normalized : false;
        this.componentType = acs.componentType;
        this.count = acs.count;
    }
}
//# sourceMappingURL=gltfModel.js.map