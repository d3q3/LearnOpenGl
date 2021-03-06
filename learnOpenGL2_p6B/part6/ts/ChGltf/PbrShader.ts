import { Shader } from "../../js/common/Shader.js";
import { GlMaterialModel, GlMaterialGltf } from "../../js/ChGltf/glMaterialManager.js";

const TEXUNIT_BASECOLOR = 0, TEXUNIT_NORMAL = 1, TEXUNIT_METALLIC_ROUGHNESS = 2,
    TEXUNIT_OCCLUSION = 3, TEXUNIT_EMISSIVE = 4;

export class PbrShader extends Shader {
    glUniforms: Object;
    materialModel: GlMaterialModel;
    materialId: number;

    constructor(gl, vertexCode, fragmentCode, geometryCode?) {
        super(gl, vertexCode, fragmentCode, geometryCode);

        this.materialId = -1;

        this.createGlUniforms(gl);

        this.setInt(gl, "baseColorMap", TEXUNIT_BASECOLOR);
        this.setInt(gl, "normalMap", TEXUNIT_NORMAL);
        this.setInt(gl, "metallicRoughnessMap", TEXUNIT_METALLIC_ROUGHNESS);
        this.setInt(gl, "occlusionMap", TEXUNIT_OCCLUSION);
        this.setInt(gl, "emissiveMap", TEXUNIT_EMISSIVE);
    }

    setMaterialModel(glMaterialModel: GlMaterialModel) {
        this.materialModel = glMaterialModel;
    }

    setMaterial(gl: WebGL2RenderingContext, materialId) {
        const
            CUsePbr = 1,
            CUseBaseColorMap = 2,
            CUseMetallicRoughnessMap = 4,
            CUseNormalMap = 8,
            CUseOcclusionMap = 16,
            CUseEmissveMap = 32;

        var us = this.glUniforms;

        if (materialId == this.materialId) return;
        this.materialId = materialId;
        //let glTextures = this.materialModel.glTextures;
        let glMat = <GlMaterialGltf>this.materialModel.glMaterials[materialId];
        let mapCode: number = glMat.mapCode;

        if (mapCode & CUseBaseColorMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_BASECOLOR);
            gl.bindTexture(gl.TEXTURE_2D, glMat.glBaseColor);
        }
        if (mapCode & CUseNormalMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
            gl.bindTexture(gl.TEXTURE_2D, glMat.glNormal);
            gl.uniform1f(us['normalScale'], glMat.normalScale);
        }
        if (mapCode & CUseMetallicRoughnessMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_METALLIC_ROUGHNESS);
            gl.bindTexture(gl.TEXTURE_2D, glMat.glMetallicRoughness);
        }
        if (mapCode & CUseOcclusionMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_OCCLUSION);
            gl.bindTexture(gl.TEXTURE_2D, glMat.glOcclusion);
            gl.uniform1f(us['occlusionStrength'], glMat.occlusionStrength);

        }
        if (mapCode & CUseEmissveMap) {
            gl.activeTexture(gl.TEXTURE0 + TEXUNIT_EMISSIVE);
            gl.bindTexture(gl.TEXTURE_2D, glMat.glEmissive);
        }

        //D3Q: the values for factors are always filled
        //default values: see specifiction gltf
        gl.uniform1i(us['mapCode'], glMat.mapCode);
        gl.uniform4fv(us['baseColorFactor'], glMat.baseColorFactor);
        gl.uniform1f(us['metallicFactor'], glMat.metallicFactor);
        gl.uniform1f(us['roughnessFactor'], glMat.roughnessFactor);
        gl.uniform3fv(us['emissiveFactor'], glMat.emissiveFactor);
    }

    private createGlUniforms(gl) {
        this.glUniforms = new Object();
        var us = this.glUniforms;
        var program = this.programId;

        this.use(gl);
        us["mapCode"] = gl.getUniformLocation(program, 'mapCode');

        us["projection"] = gl.getUniformLocation(program, 'projection');
        us["view"] = gl.getUniformLocation(program, 'view');
        us["model"] = gl.getUniformLocation(program, 'model');

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
