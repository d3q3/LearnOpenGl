import { GltfResource } from "../../js/geometry/GltfLoader.js";
import { Accessor, AccessorObject } from "../../js/geometry/VertexObjects.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
export declare class GltfModel {
    private r;
    private useMaterials;
    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];
    nodes: GltfNode[];
    meshes: GltfMesh[];
    meshJson(id: any): any;
    constructor(r: GltfResource, useMaterials: boolean);
    getMesh(mesh: any, id: any): GltfMesh;
    getMeshes(): GltfMesh[];
    getScene(id: number): GltfScene;
    createVertexObject(prim: any, useMaterials: any): GltfVertexObject;
}
export declare class GltfVertexObject extends AccessorObject {
    materialId: number;
}
export declare class GltfMesh {
    name: string;
    id: number;
    vertexObjects: GltfVertexObject[];
    constructor();
}
export declare class GltfNode {
    private model;
    children: GltfNode[];
    cameraId: any;
    meshId: any;
    meshObject: GltfMesh;
    skin: any;
    matrix: any;
    translation: any;
    rotation: any;
    scale: any;
    ppMatrix: mat4;
    constructor(model: GltfModel, node: any);
    setChildren(node: any): void;
    getMesh(useMaterials: any): GltfMesh;
    flatten(nodes: GltfNode[]): void;
    traversePreOrder(parent: GltfNode, executeFunction: any): void;
    traversePostOrder(parent: GltfNode, executeFunction: any): void;
}
export declare class GltfCamera {
    flatNode: GltfNode;
    constructor(node: GltfNode);
    getView(): mat4;
    getPosition(): vec3;
}
export declare class GltfScene {
    name: string;
    private children;
    private flatNodes;
    constructor(model: GltfModel, sc: any);
    updatePpMatrices(): void;
    getMeshNodes(): GltfNode[];
    getCameraNodes(): GltfCamera[];
    private flatten;
    private execUpdatePpMatrix;
}
declare class GltfBufferView {
    byteOffset: any;
    byteLength: any;
    byteStride: any;
    target: any;
    data: any;
    constructor(bfv: any, bufferData: any);
}
export declare class GltfAccessor extends Accessor {
    bufferViewId: number;
    componentType: any;
    normalized: any;
    constructor(acs: any, bufferView: GltfBufferView);
}
export {};
