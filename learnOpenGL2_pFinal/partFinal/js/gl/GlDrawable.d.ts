/// <reference types="webgl2" />
import { Accessor } from "../../js/geometry/VertexObjects.js";
import { DrawMesh, DrawObject, DrawModel, DrawCubeMap } from "../../js/geometry/Drawable.js";
import { Material, Texture } from "../../js/material/Material.js";
import { Shaders } from "../../js/gl/shaders/Shaders.js";
import { Shader } from "../../js/gl/shaders/Shader.js";
import { mat4 } from "../../../math/glmatrix/index.js";
export declare class GlDrawObject {
    vao: WebGLVertexArrayObject;
    material: Material;
    indexAccessor: Accessor;
    glTextures: WebGLTexture[];
    shader: Shader;
}
export declare class GlDrawMesh {
    glDrawObjects: GlDrawObject[];
    ppMatrix: mat4;
    constructor(drawMesh: DrawMesh);
}
export declare class GlDrawModel {
    glBuffers: any;
    glTextures: any;
    glDrawMeshes: GlDrawMesh[];
    constructor(drawModel: DrawModel);
}
export declare class GlDrawCubeMapObject extends GlDrawObject {
    glTexture3D: any;
}
export declare class GlManager {
    gl: WebGL2RenderingContext;
    glVersion: any;
    glslVersion: any;
    EXT_color_buffer_float: any;
    shaders: Shaders;
    constructor(gl: WebGL2RenderingContext);
    getShader(type: any): Shader;
    private createVao;
    private createGlDrawModelObject;
    private createGlDrawModelMesh;
    createGlDrawModel(drawModel: DrawModel): GlDrawModel;
    drawModelObjects(glDrawModel: any, model: mat4): void;
    createGlVertexBuffer(glBuffers: any, drawObject: DrawObject, acc: Accessor): void;
    createGlTextures2D(glTextures: any, textures: Texture[]): void;
    createGlCubeMap(drawCubemap: DrawCubeMap): GlDrawCubeMapObject;
    drawGlCubeMap(glCube: GlDrawCubeMapObject): void;
    createGlTexture2D(gl: any, texture: Texture, sampler?: any, options?: any): WebGLTexture;
}
