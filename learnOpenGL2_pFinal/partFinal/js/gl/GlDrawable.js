import { TexturedMaterial } from "../../js/material/Material.js";
import { Shaders } from "../../js/gl/shaders/Shaders.js";
import { mat4 } from "../../../math/glmatrix/index.js";
export class GlDrawObject {
}
export class GlDrawMesh {
    constructor(drawMesh) {
        this.glDrawObjects = new Array(drawMesh.vertexObjects.length);
        this.ppMatrix = drawMesh.ppMatrix;
    }
}
export class GlDrawModel {
    constructor(drawModel) {
        this.glBuffers = new Array(drawModel.bufferCount);
        this.glTextures = new Array(drawModel.textureCount);
        this.glDrawMeshes = new Array(drawModel.drawMeshes.length);
    }
}
export class GlDrawCubeMapObject extends GlDrawObject {
}
export class GlManager {
    constructor(gl) {
        this.gl = gl;
        this.EXT_color_buffer_float = gl.getExtension("EXT_color_buffer_float");
        this.glVersion = gl.getParameter(gl.VERSION);
        this.glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        this.shaders = new Shaders(gl);
    }
    getShader(type) {
        return this.shaders.getShader(type);
    }
    createVao(glBuffers, drawObject, layout) {
        let gl = this.gl;
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        let vas = drawObject.vas;
        let ib = vas.indexAccessor.bufferId;
        if (!glBuffers[ib]) {
            const ebo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vas.buffers[ib], gl.STATIC_DRAW);
            glBuffers[ib] = ebo;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers[ib]);
        let acc;
        acc = vas.accessors[vas.attributes.POSITION];
        this.createGlVertexBuffer(glBuffers, drawObject, acc);
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
        gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.POSITION);
        if (layout.TEXCOORD_0 !== undefined) {
            if (vas.attributes.TEXCOORD_0 !== undefined) {
                acc = vas.accessors[vas.attributes.TEXCOORD_0];
                this.createGlVertexBuffer(glBuffers, drawObject, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
                gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.TEXCOORD_0);
            }
        }
        if (layout.NORMAL !== undefined) {
            if (vas.attributes.NORMAL !== undefined) {
                acc = vas.accessors[vas.attributes.NORMAL];
                this.createGlVertexBuffer(glBuffers, drawObject, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[acc.bufferId]);
                acc = vas.accessors[vas.attributes.NORMAL];
                gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.NORMAL);
            }
        }
        return vao;
    }
    createGlDrawModelObject(glDrawModel, drawObject) {
        let gl = this.gl;
        let glDrawObject = new GlDrawObject();
        let layout = drawObject.material.shaderLayout;
        glDrawObject.vao = this.createVao(glDrawModel.glBuffers, drawObject, layout);
        glDrawObject.indexAccessor = drawObject.vas.indexAccessor;
        if (drawObject.material) {
            glDrawObject.material = drawObject.material;
            if (drawObject.material instanceof TexturedMaterial) {
                this.createGlTextures2D(glDrawModel.glTextures, drawObject.material.textures);
            }
            glDrawObject.glTextures = glDrawModel.glTextures;
            glDrawObject.shader = this.shaders.getShader(drawObject.material.type);
        }
        else
            glDrawObject.material = null;
        return glDrawObject;
    }
    createGlDrawModelMesh(glDrawModel, drawMesh) {
        let glDrawMesh = new GlDrawMesh(drawMesh);
        for (let i = 0; i < drawMesh.vertexObjects.length; i++) {
            glDrawMesh.glDrawObjects[i] =
                this.createGlDrawModelObject(glDrawModel, drawMesh.vertexObjects[i]);
        }
        return glDrawMesh;
    }
    createGlDrawModel(drawModel) {
        let glDrawModel = new GlDrawModel(drawModel);
        for (let i = 0; i < drawModel.drawMeshes.length; i++) {
            glDrawModel.glDrawMeshes[i] = this.createGlDrawModelMesh(glDrawModel, drawModel.drawMeshes[i]);
        }
        return glDrawModel;
    }
    drawModelObjects(glDrawModel, model) {
        let gl = this.gl;
        let meshMatrix = mat4.create();
        for (let i = 0; i < glDrawModel.glDrawMeshes.length; i++) {
            let glMesh = glDrawModel.glDrawMeshes[i];
            if (glMesh.ppMatrix) {
                mat4.multiply(meshMatrix, model, glMesh.ppMatrix);
            }
            else
                meshMatrix = mat4.clone(model);
            for (let j = 0; j < glMesh.glDrawObjects.length; j++) {
                let glObject = glMesh.glDrawObjects[j];
                if (glObject.material.type = "pbr0") {
                    let material = (glObject.material);
                    let shader = (glObject.shader);
                    shader.setMaterial(gl, material, glDrawModel.glTextures);
                    shader.setModel(meshMatrix);
                    gl.bindVertexArray(glMesh.glDrawObjects[j].vao);
                    gl.drawElements(gl.TRIANGLES, glMesh.glDrawObjects[j].indexAccessor.countElements, gl.UNSIGNED_SHORT, glMesh.glDrawObjects[j].indexAccessor.byteOffset);
                }
            }
        }
    }
    createGlVertexBuffer(glBuffers, drawObject, acc) {
        let gl = this.gl;
        let ib = acc.bufferId;
        if (!glBuffers[ib]) {
            let vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, drawObject.vas.buffers[ib], gl.STATIC_DRAW);
            glBuffers[ib] = vbo;
        }
    }
    createGlTextures2D(glTextures, textures) {
        for (let i = 0; i < textures.length; i++) {
            if (!glTextures[textures[i].id]) {
                glTextures[textures[i].id] =
                    this.createGlTexture2D(this.gl, textures[i]);
            }
        }
    }
    createGlCubeMap(drawCubemap) {
        let layout = { POSITION: 0 };
        let gl = this.gl;
        let glCubeMap = new GlDrawCubeMapObject();
        let glBuffers = new Array(2);
        glCubeMap.vao = this.createVao(glBuffers, drawCubemap, layout);
        glCubeMap.indexAccessor = drawCubemap.vas.indexAccessor;
        glCubeMap.material = drawCubemap.material;
        let id = gl.createTexture();
        gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, id);
        let material = drawCubemap.material;
        let f1 = gl.RGB;
        let f2 = gl.RGB;
        if (material.bits == 16) {
            f1 = gl.RGB16F;
            f2 = gl.FLOAT;
        }
        for (let i = 0; i < 6; i++) {
            let ci = material.textures[i];
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, f1, ci.width, ci.height, 0, f2, gl.UNSIGNED_BYTE, ci.sourceData);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        glCubeMap.shader = this.shaders.getShader(glCubeMap.material.type);
        glCubeMap.glTexture3D = id;
        return glCubeMap;
    }
    drawGlCubeMap(glCube) {
        let gl = this.gl;
        gl.depthFunc(gl.LEQUAL);
        let glObject = glCube;
        if (glObject.material.type = "env0") {
            let material = (glObject.material);
            let shader = (glObject.shader);
            shader.use();
            shader.setMaterial(gl, glCube.glTexture3D);
            gl.bindVertexArray(glObject.vao);
            gl.drawElements(gl.TRIANGLES, glObject.indexAccessor.countElements, gl.UNSIGNED_SHORT, glObject.indexAccessor.byteOffset);
        }
        gl.depthFunc(gl.LESS);
    }
    createGlTexture2D(gl, texture, sampler, options) {
        let glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.sourceData);
        if (sampler) {
            if (sampler.minFilter) {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
            }
            else {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            }
            if (sampler.magFilter) {
                gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
            }
            else {
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
    }
    ;
}
//# sourceMappingURL=GlDrawable.js.map