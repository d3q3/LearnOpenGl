/// <reference types="webgl2" />
import { mat4 } from "../../../math/glmatrix/index.js";
import { Accessor } from "../../js/geometry/VertexObjects.js";
import { GltfModel, GltfVertexObject } from "../geometry/GltfModel.js";
export declare class GlSceneModel {
    name: string;
    glBuffers: WebGLBuffer[];
    glMeshes: GlMesh[];
    glScenes: GlScene[];
}
declare class GlMesh {
    vaos: any[];
    vos: GltfVertexObject[];
    mats: number[];
}
export declare class GlDrawMesh {
    glMesh: GlMesh;
    ppMatrix: mat4;
}
export declare class GlScene {
    drawMeshes: GlDrawMesh[];
}
export declare class GlSceneManager {
    gl: WebGL2RenderingContext;
    glModels: GlSceneModel[];
    attributeLayout: any;
    getModelNameIndex(name: string): number;
    constructor(gl: WebGL2RenderingContext);
    private createGlModel;
    private createGlScene;
    getGlScene(glftModel: GltfModel, sceneId: number): GlScene;
    private createGlMesh;
    createGlVertexBuffer(glModelId: number, glftModel: GltfModel, acc: Accessor): void;
}
export {};
