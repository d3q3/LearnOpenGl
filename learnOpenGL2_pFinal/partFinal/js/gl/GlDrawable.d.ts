/// <reference types="webgl2" />
import { Accessor } from "../../js/geometry/VertexObjects.js";
import { DrawMesh, DrawObject, DrawModel, DrawCubeMap } from "../../js/geometry/Drawable.js";
import { Material, Texture } from "../../js/material/Material.js";
export declare class GlDrawObject {
    vao: WebGLVertexArrayObject;
    material: Material;
    indexAccessor: Accessor;
}
export declare class GlDrawMesh {
    glDrawObjects: GlDrawObject[];
    constructor(drawMesh: DrawMesh);
}
export declare class GlDrawModel {
    glBuffers: any;
    glTextures: any;
    glDrawMeshes: GlDrawMesh[];
    constructor(drawModel: DrawModel);
}
export declare class GlDrawCubeMapObject {
}
export declare class GlManager {
    gl: WebGL2RenderingContext;
    glVersion: any;
    glslVersion: any;
    EXT_color_buffer_float: any;
    glTextures: WebGLTexture[];
    glBuffers: WebGLBuffer[];
    constructor(gl: WebGL2RenderingContext);
    setTextureCount(count: number): void;
    setBufferCount(count: number): void;
    private createVao;
    createGlDrawObject(drawObject: DrawObject): GlDrawObject;
    createGlDrawMesh(drawMesh: DrawMesh): GlDrawMesh;
    createGlModel(drawModel: DrawModel): GlDrawModel;
    createGlVertexBuffer(drawObject: DrawObject, acc: Accessor): void;
    createGlTextures2D(textures: Texture[]): void;
    createGlCubeMap(drawCubemap: DrawCubeMap): GlDrawCubeMapObject;
    createGlTexture2D(gl: any, texture: Texture, sampler?: any, options?: any): WebGLTexture;
}
