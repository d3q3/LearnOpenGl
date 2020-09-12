import { VertexAccessors } from "../../js/geometry/VertexObjects.js";
import { Material, CubeMapMaterial } from "../../js/material/Material.js";
export declare class DrawObject {
    vas: VertexAccessors;
    material: Material;
    constructor(vas: any, material: any);
}
export declare class DrawMesh {
    name: string;
    id: number;
    vertexObjects: DrawObject[];
    constructor();
}
export declare abstract class DrawModel {
    bufferCount: number;
    textureCount: number;
    drawMeshes: DrawMesh[];
    abstract getMeshes(): DrawMesh[];
}
export declare class DrawCubeMap extends DrawObject {
    material: CubeMapMaterial;
    vas: VertexAccessors;
    constructor(material: CubeMapMaterial);
}
