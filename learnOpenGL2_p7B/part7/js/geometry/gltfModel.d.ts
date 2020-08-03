import { GltfResource } from "../../js/geometry/GltfLoader.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";
export declare class GltfModel {
    private r;
    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];
    constructor(r: GltfResource);
    getMeshes(useMaterials: boolean): GltfMesh[];
    createMesh(mesh: any, id: any, useMaterials: boolean): GltfMesh;
    createVertexObject(prim: any, useMaterials: any): GltfVertexObject;
}
export declare class GltfVertexObject extends VertexObject {
    material: any;
}
export declare class GltfMesh {
    name: string;
    vertexObjects: GltfVertexObject[];
    constructor();
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
    count: number;
    constructor(acs: any, bufferView: GltfBufferView);
}
export {};
