import { Accessor } from "../../js/geometry/VertexObjects.js";
import { DrawMesh, DrawObject, DrawModel, DrawCubeMap } from "../../js/geometry/Drawable.js";
import { Material, Texture, TexturedMaterial, CubeMapMaterial } from "../../js/material/Material.js";

/**
 * D3Q: the GL-version of DrawObject
 */
export class GlDrawObject {
    vao: WebGLVertexArrayObject;
    material: Material;
    indexAccessor: Accessor;
}

/**
 * D3Q: the GL-version of DrawMesh
 */
export class GlDrawMesh {
    glDrawObjects: GlDrawObject[];
    constructor(drawMesh: DrawMesh) {
        this.glDrawObjects = new Array(drawMesh.vertexObjects.length);
    }
}

export class GlDrawModel {
    glBuffers;
    glTextures;
    glDrawMeshes: GlDrawMesh[];
    constructor(drawModel: DrawModel) {
        this.glBuffers = new Array(drawModel.bufferCount);
        this.glTextures = new Array(drawModel.textureCount);
        this.glDrawMeshes = new Array(drawModel.drawMeshes.length);
    }
}

export class GlDrawCubeMapObject extends GlDrawObject {
    glTexture3D;
}

export class GlManager {
    gl: WebGL2RenderingContext;
    glVersion;
    glslVersion;
    EXT_color_buffer_float;

    //attributeLayout: any;
    // glTextures: WebGLTexture[];
    // glBuffers: WebGLBuffer[];

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.EXT_color_buffer_float = gl.getExtension("EXT_color_buffer_float");
        this.glVersion = gl.getParameter(gl.VERSION);
        this.glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);

        //this.attributeLayout = { POSITION: 0, TEXCOORD_0: 1, NORMAL: 2 };
    }

    // setTextureCount(count: number) {
    //     //TODO delete old textures
    //     this.glTextures = new Array(count);
    // }

    // setBufferCount(count: number) {
    //     //TODO delete old textures
    //     this.glBuffers = new Array(count);
    // }

    // setModelTextures(drawModel: DrawModel) {
    //     this.setTextureCount(drawModel.textureCount);
    //     for (let i = 0; i < drawModel.textureCount; i++) {
    //         this.glTextures[i] = this.createGlTexture2D(this.gl, drawModel.getTexture(i), null);
    //     }
    // }

    //setAttributeLayout(attributes) { this.attributeLayout = attributes };

    /**
     * D3Q: creates VertexArrayObject for a drawObject
     */
    private createVao(glBuffers, drawObject, layout): WebGLVertexArrayObject {
        let gl = this.gl;

        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let vas = drawObject.vas;
        let ib = vas.indexAccessor.bufferId;
        if (!glBuffers[ib]) {
            const ebo: WebGLBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vas.buffers[ib], gl.STATIC_DRAW);

            glBuffers[ib] = ebo;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers[ib]);

        let acc: Accessor;

        // POSITION
        acc = vas.accessors[vas.attributes.POSITION];
        this.createGlVertexBuffer(glBuffers, drawObject, acc);
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
        gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT,
            false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.POSITION);

        // TEXTURE
        if (layout.TEXCOORD_0 !== undefined) {
            if (vas.attributes.TEXCOORD_0 !== undefined) {
                acc = vas.accessors[vas.attributes.TEXCOORD_0];
                this.createGlVertexBuffer(glBuffers, drawObject, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
                gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent,
                    gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.TEXCOORD_0);
            }
        }
        // NORMAL
        if (layout.NORMAL !== undefined) {
            if (vas.attributes.NORMAL !== undefined) {
                acc = vas.accessors[vas.attributes.NORMAL];
                this.createGlVertexBuffer(glBuffers, drawObject, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
                acc = vas.accessors[vas.attributes.NORMAL];
                gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT,
                    false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.NORMAL);
            }
        }

        return vao;
    }


    private createGlDrawModelObject(glDrawModel: GlDrawModel, drawObject: DrawObject): GlDrawObject {
        //let layout = this.attributeLayout;
        let gl = this.gl;

        let glDrawObject = new GlDrawObject();

        let layout = drawObject.material.shaderLayout;
        glDrawObject.vao = this.createVao(glDrawModel.glBuffers, drawObject, layout);

        glDrawObject.indexAccessor = drawObject.vas.indexAccessor;

        if (drawObject.material) {
            glDrawObject.material = drawObject.material;
            if (glDrawObject.material instanceof TexturedMaterial) {
                this.createGlTextures2D(glDrawModel.glTextures, (glDrawObject.material as TexturedMaterial).textures);
            }
        }
        else glDrawObject.material = null; //error??

        return glDrawObject;
    }

    private createGlDrawModelMesh(glDrawModel: GlDrawModel, drawMesh: DrawMesh): GlDrawMesh {
        let glDrawMesh = new GlDrawMesh(drawMesh);
        for (let i = 0; i < drawMesh.vertexObjects.length; i++) {
            glDrawMesh.glDrawObjects[i] =
                this.createGlDrawModelObject(glDrawModel, drawMesh.vertexObjects[i]);
        }
        return glDrawMesh;
    }

    createGlDrawModel(drawModel: DrawModel): GlDrawModel {
        let glDrawModel = new GlDrawModel(drawModel);
        for (let i = 0; i < drawModel.drawMeshes.length; i++) {
            glDrawModel.glDrawMeshes[i] = this.createGlDrawModelMesh(glDrawModel, drawModel.drawMeshes[i]);
        }
        //glDrawModel.glDrawMeshes[i] = this.createGlDrawMesh(drawModel.drawMeshes[i]);

        return glDrawModel;
    }

    /**
     * D3Q: creates a WebGLBuffer
     * @param drawObject has the data buffers
     * @param acc has the index into the data-buffers
     */
    createGlVertexBuffer(glBuffers, drawObject: DrawObject, acc: Accessor) {
        let gl = this.gl;
        let ib = acc.bufferId;

        if (!glBuffers[ib]) {
            let vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, drawObject.vas.buffers[ib], gl.STATIC_DRAW);
            glBuffers[ib] = vbo;
        }
    }

    /** 
    * D3Q: creates the GL-textures in a TexturedMaterial. The textures already know
    * the index they will have in the glTextures array (it is their id)
    * @param textures
    */
    createGlTextures2D(glTextures, textures: Texture[]) {
        for (let i = 0; i < textures.length; i++) {
            if (!glTextures[textures[i].id]) {
                glTextures[textures[i].id] =
                    this.createGlTexture2D(this.gl, textures[i]);
            }
        }
    }

    /**
     * D3Q: create cube GL cubemap
     * @param drawCubemap
     */
    createGlCubeMap(drawCubemap: DrawCubeMap): GlDrawCubeMapObject {
        let layout = { POSITION: 0 }
        let gl = this.gl;

        let glCubeMap = new GlDrawCubeMapObject();

        let glBuffers = new Array(2);
        glCubeMap.vao = this.createVao(glBuffers, drawCubemap, layout)

        glCubeMap.indexAccessor = drawCubemap.vas.indexAccessor;

        let id = gl.createTexture();
        gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, id);

        let material = drawCubemap.material;
        let f1 = gl.RGB; let f2 = gl.RGB;
        if (material.bits == 16) { f1 = gl.RGB16F; f2 = gl.FLOAT; }
        for (let i = 0; i < 6; i++) {
            let ci = material.textures[i];
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0, f1, ci.width, ci.height, 0, f2, gl.UNSIGNED_BYTE, ci.sourceData
            );
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        glCubeMap.glTexture3D = id;

        return glCubeMap;
    }

    /**
    * D3Q: creates a GL texture from a texture. An optional sampler can
    * give filtering and wrapping information for the GL Texture. The options
    * parameter is not used but is meant for lod and format options
    * @param gl 
    * @param texture 
    * @param sampler 
    * @param options
    */
    createGlTexture2D(gl, texture: Texture, sampler?: any, options?: any) {
        let glTexture: WebGLTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,  // assumed
            0,        // Level of details
            gl.RGBA, // Format
            gl.RGBA,
            gl.UNSIGNED_BYTE, // Size of each channel
            texture.sourceData
        );
        if (sampler) {
            if (sampler.minFilter) {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
            } else {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            }
            if (sampler.magFilter) {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
            } else {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return glTexture;
    };
}


