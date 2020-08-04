/// <reference types="webgl2" />
import { Shader } from "../../js/common/Shader.js";
import { GlMaterialModel } from "../../js/ChGltf/glMaterialManager.js";
export declare class PbrShader extends Shader {
    glUniforms: Object;
    materialModel: GlMaterialModel;
    materialId: number;
    constructor(gl: any, vertexCode: any, fragmentCode: any, geometryCode?: any);
    setMaterialModel(glMaterialModel: GlMaterialModel): void;
    setMaterial(gl: WebGL2RenderingContext, materialId: any): void;
    private createGlUniforms;
}
