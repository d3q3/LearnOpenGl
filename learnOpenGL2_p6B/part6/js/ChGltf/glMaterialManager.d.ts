/// <reference types="webgl2" />
import { GltfTexture } from "../../js/geometry/GltfMaterial.js";
import { GltfModel } from "../../js/geometry/GltfModel.js";
export declare class GlMaterial {
    type: any;
    constructor(type: any);
}
export declare class GlMaterialGltf extends GlMaterial {
    mapCode: number;
    glBaseColor: any;
    baseColorFactor: number[];
    glMetallicRoughness: any;
    roughnessFactor: number;
    metallicFactor: number;
    glNormal: any;
    normalScale: number;
    glOcclusion: any;
    occlusionStrength: number;
    glEmissive: any;
    emissiveFactor: number[];
    constructor(type: any);
}
export declare class GlMaterialModel {
    name: string;
    glTextures: WebGLTexture[];
    glMaterials: GlMaterial[];
    getGlMaterial(materialId: any): GlMaterial;
}
export declare class GlMaterialManager {
    gl: WebGL2RenderingContext;
    glModels: GlMaterialModel[];
    getModelNameIndex(name: string): number;
    constructor(gl: WebGL2RenderingContext);
    private createGlMaterialModel;
    getGlMaterialModelGltf(gltfModel: GltfModel): GlMaterialModel;
    createGlTexture2D(gl: any, texture: GltfTexture): WebGLTexture;
}
