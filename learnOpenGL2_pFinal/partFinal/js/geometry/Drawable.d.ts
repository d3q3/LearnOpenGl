import { mat4 } from "../../../math/glmatrix/index.js";
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
    ppMatrix: mat4;
    vertexObjects: DrawObject[];
    constructor();
}
export declare abstract class DrawModel {
    bufferCount: number;
    textureCount: number;
    drawMeshes: DrawMesh[];
    abstract getDrawScene(i: number): any;
    abstract getMeshes(): DrawMesh[];
    linkScene(scene: DrawScene): void;
}
export declare class DrawScene {
    name: string;
    private nodes;
    private childIds;
    constructor(name: string, nodes: DrawNode[], childIds: number[]);
    linkMeshes(drawMeshes: DrawMesh[]): void;
    updatePpMatrices(): void;
    private execUpdatePpMatrix;
}
export declare class DrawNode {
    private nodes;
    childIds: number[];
    meshId: any;
    meshObject: DrawMesh;
    matrix: any;
    translation: any;
    rotation: any;
    scale: any;
    ppMatrix: any;
    constructor(nodes: DrawNode[], childIds: number[], matrix: mat4, meshId: number);
    getMesh(): DrawMesh;
    flatten(nodes: DrawNode[]): void;
    traverseUsingMeshes(meshes: DrawMesh[]): void;
    traversePreOrder(parent: DrawNode, executeFunction: any): void;
    traversePostOrder(parent: DrawNode, executeFunction: any): void;
}
export declare class DrawCubeMap extends DrawObject {
    material: CubeMapMaterial;
    vas: VertexAccessors;
    constructor(material: CubeMapMaterial);
}
