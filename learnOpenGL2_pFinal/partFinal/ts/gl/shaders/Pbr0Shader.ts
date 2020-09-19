import { Shader } from "../../../js/gl/shaders/Shader.js";
import { vec3, mat4 } from "../../../../math/glmatrix/index.js";
import { Pbr0Material } from "../../../js/material/Material.js";
import { vs_pbr, fs_pbr } from "../../../js/gl/shaders/pbr0/index.js";

const TEXUNIT_BASECOLOR = 0, TEXUNIT_NORMAL = 1, TEXUNIT_METALLIC_ROUGHNESS = 2,
    TEXUNIT_OCCLUSION = 3, TEXUNIT_EMISSIVE = 4;

export class PbrShader extends Shader {
    glUniforms: Object;
    materialId: number;

    /**
     * D3Q: Use the Shaders-collection to create a Pbr0Shader
     * @param gl 
     */
    constructor(gl) {
        super(gl, vs_pbr, fs_pbr);

        this.materialId = -1;

        this.init(gl);
        this.createGlUniforms(gl);
    }

    private init(gl) {
        this.use();

        this.setInt(gl, "baseColorMap", TEXUNIT_BASECOLOR);
        this.setInt(gl, "normalMap", TEXUNIT_NORMAL);
        this.setInt(gl, "metallicRoughnessMap", TEXUNIT_METALLIC_ROUGHNESS);
        this.setInt(gl, "occlusionMap", TEXUNIT_OCCLUSION);
        this.setInt(gl, "emissiveMap", TEXUNIT_EMISSIVE);
    }

    setMaterial(gl: WebGL2RenderingContext, glMat: Pbr0Material, glTextures: WebGLTexture[]) {
        const
            CUsePbr = 1,
            CUseBaseColorMap = 2,
            CUseMetallicRoughnessMap = 4,
            CUseNormalMap = 8,
            CUseOcclusionMap = 16,
            CUseEmissveMap = 32;

        var us = this.glUniforms;

        if (glMat.id == this.materialId) return;

        this.init(gl);
        this.materialId = glMat.id;
        let mapCode: number = glMat.mapCode;

        if (mapCode & CUseBaseColorMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_BASECOLOR);
            gl.bindTexture(gl.TEXTURE_2D, glTextures[glMat.attributes.BASECOLOR]);
        }
        if (mapCode & CUseNormalMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
            gl.bindTexture(gl.TEXTURE_2D, glTextures[glMat.attributes.NORMAL]);
            gl.uniform1f(us['normalScale'], glMat.normalScale);
        }
        if (mapCode & CUseMetallicRoughnessMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_METALLIC_ROUGHNESS);
            gl.bindTexture(gl.TEXTURE_2D, glTextures[glMat.attributes.PBR]);
        }
        if (mapCode & CUseOcclusionMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_OCCLUSION);
            gl.bindTexture(gl.TEXTURE_2D, glTextures[glMat.attributes.OCCLUSION]);
            gl.uniform1f(us['occlusionStrength'], glMat.occlusionStrength);
        }
        if (mapCode & CUseEmissveMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_EMISSIVE);
            gl.bindTexture(gl.TEXTURE_2D, glTextures[glMat.attributes.EMISSIVE]);
        }

        //D3Q: the values for factors are always filled
        //default values: see specifiction gltf
        gl.uniform1i(us['mapCode'], glMat.mapCode);
        gl.uniform4fv(us['baseColorFactor'], glMat.baseColorFactor);
        gl.uniform1f(us['metallicFactor'], glMat.metallicFactor);
        gl.uniform1f(us['roughnessFactor'], glMat.roughnessFactor);
        gl.uniform3fv(us['emissiveFactor'], glMat.emissiveFactor);
    }


    setLights(lightPositions: Float32Array, lightColors: Float32Array) {
        this.gl.uniform3fv(this.glUniforms["lightPositions"], lightPositions);
        this.gl.uniform3fv(this.glUniforms["lightColors"], lightColors);

    }
    setCameraPosition(position: vec3) {
        this.gl.uniform3fv(this.glUniforms["cameraPosition"], position);
    }
    setProjection(projection: mat4) {
        this.gl.uniformMatrix4fv(this.glUniforms["projection"], false, projection);
    }
    setView(view: mat4) {
        this.gl.uniformMatrix4fv(this.glUniforms["view"], false, view);
    }
    setModel(model: mat4) {
        this.gl.uniformMatrix4fv(this.glUniforms["model"], false, model);
    }

    private createGlUniforms(gl) {
        this.glUniforms = new Object();
        var us = this.glUniforms;
        var program = this.programId;

        this.use();
        us["mapCode"] = gl.getUniformLocation(program, 'mapCode');

        us["projection"] = gl.getUniformLocation(program, 'projection');
        us["view"] = gl.getUniformLocation(program, 'view');
        us["model"] = gl.getUniformLocation(program, 'model');

        us["cameraPosition"] = gl.getUniformLocation(program, 'camPos');

        us["lightColors"] = gl.getUniformLocation(program, 'lightColors');
        us["lightPositions"] = gl.getUniformLocation(program, 'lightPositions');

        us["baseColorFactor"] = gl.getUniformLocation(program, 'baseColorFactor');
        us["baseColorMap"] = gl.getUniformLocation(program, 'baseColorMap');
        us["normalMap"] = gl.getUniformLocation(program, 'normalMap');
        us["normalTextureScale"] = gl.getUniformLocation(program, 'normalTextureScale');
        us["metallicFactor"] = gl.getUniformLocation(program, 'metallicFactor');
        us["roughnessFactor"] = gl.getUniformLocation(program, 'roughnessFactor');
        us["metallicRoughnessMap"] = gl.getUniformLocation(program, 'metallicRoughnessMap');
        us["occlusionMap"] = gl.getUniformLocation(program, 'occlusionTexture');
        us["occlusionStrength"] = gl.getUniformLocation(program, 'occlusionStrength');
        us["emissiveMap"] = gl.getUniformLocation(program, 'emissiveMap');
        us["emissiveFactor"] = gl.getUniformLocation(program, 'emissiveFactor');
    }
}
