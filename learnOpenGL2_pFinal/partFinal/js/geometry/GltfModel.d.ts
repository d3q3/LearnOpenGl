import { GltfResource } from "../../js/geometry/GltfLoader.js";
import { Accessor } from "../../js/geometry/VertexObjects.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { GltfTexture, GltfSampler, GltfMaterial } from "./GltfMaterial.js";
import { DrawModel, DrawMesh, DrawObject } from "../../js/geometry/Drawable.js";
export { GltfMaterial };
export declare class GltfModel extends DrawModel {
    private r;
    private useMaterials;
    bufferViews: GltfBufferView[];
    buffers: ArrayBuffer[];
    accessors: GltfAccessor[];
    nodes: GltfNode[];
    meshes: DrawMesh[];
    sceneCount: number;
    name: string;
    samplers: GltfSampler[];
    textures: GltfTexture[];
    materials: GltfMaterial[];
    meshJson(id: any): any;
    constructor(r: GltfResource, useMaterials: boolean);
    private getMaterial;
    private getMaterials;
    getMesh(mesh: any, id: any): DrawMesh;
    getMeshes(): DrawMesh[];
    getScene(id: number): GltfScene;
    createDrawObject(prim: any, useMaterials: any): DrawObject;
}
export declare class GltfNode {
    private model;
    children: GltfNode[];
    cameraId: any;
    meshId: any;
    meshObject: DrawMesh;
    skin: any;
    matrix: any;
    translation: any;
    rotation: any;
    scale: any;
    ppMatrix: mat4;
    constructor(model: GltfModel, node: any);
    setChildren(node: any): void;
    getMesh(useMaterials: any): DrawMesh;
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
