export class GlMaterial {
    constructor(type) {
        this.type = type;
    }
}
export class GlMaterialGltf extends GlMaterial {
    constructor(type) { super(type); }
}
export class GlMaterialModel {
    getGlMaterial(materialId) {
        return this.glMaterials[materialId];
    }
}
export class GlMaterialManager {
    getModelNameIndex(name) {
        let found = false;
        let i = 0;
        while (!found && i < this.glModels.length) {
            if (name == this.glModels[i].name)
                found = true;
            else
                i++;
        }
        if (found)
            return i;
        else
            return null;
    }
    constructor(gl) {
        this.gl = gl;
        this.glModels = [];
    }
    createGlMaterialModel(model) {
        let glModel = new GlMaterialModel();
        glModel.name = model.name;
        let il = model.textures.length;
        glModel.glTextures = new Array(il);
        for (let i = 0; i < il; i++) {
            glModel.glTextures[i] = this.createGlTexture2D(this.gl, model.textures[i]);
        }
        glModel.glMaterials = new Array(model.materials.length);
        this.glModels.push(glModel);
        return this.glModels.length - 1;
    }
    getGlMaterialModelGltf(gltfModel) {
        let glModelId = this.getModelNameIndex(gltfModel.name);
        if (glModelId)
            return this.glModels[glModelId];
        glModelId = this.createGlMaterialModel(gltfModel);
        let glModel = this.glModels[glModelId];
        let il = gltfModel.materials.length;
        glModel.glMaterials = new Array(il);
        for (let i = 0; i < il; i++) {
            let m = glModel.glMaterials[i] = new GlMaterialGltf("gltf");
            let mat = gltfModel.materials[i];
            m.mapCode = 0;
            if (mat.pbrMetallicRoughness) {
                m.mapCode = 1;
                if (mat.pbrMetallicRoughness.baseColorTexture) {
                    m.mapCode += 2;
                    m.glBaseColor = glModel.glTextures[mat.pbrMetallicRoughness.baseColorTexture.index];
                }
                m.baseColorFactor = mat.pbrMetallicRoughness.baseColorFactor;
                if (mat.pbrMetallicRoughness.metallicRoughnessTexture) {
                    m.mapCode += 4;
                    m.glMetallicRoughness = glModel.glTextures[mat.pbrMetallicRoughness.metallicRoughnessTexture.index];
                }
                m.roughnessFactor = mat.pbrMetallicRoughness.roughnessFactor;
                m.metallicFactor = mat.pbrMetallicRoughness.metallicFactor;
            }
            if (mat.normalTexture) {
                m.mapCode += 8;
                m.glNormal = glModel.glTextures[mat.normalTexture.index];
                m.normalScale = mat.normalTexture.scale;
            }
            if (mat.occlusionTexture) {
                m.mapCode += 16;
                m.glOcclusion = glModel.glTextures[mat.occlusionTexture.index];
                m.occlusionStrength = mat.occlusionTexture.strength;
            }
            if (mat.emissiveTexture) {
                m.mapCode += 32;
                m.glEmissive = glModel.glTextures[mat.emissiveTexture.index];
            }
            m.emissiveFactor = mat.emissiveFactor;
        }
        return glModel;
    }
    createGlTexture2D(gl, texture) {
        let glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
        if (texture.sampler) {
            let sampler = texture.sampler;
            if (sampler.minFilter) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            }
            if (sampler.magFilter) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
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
}
//# sourceMappingURL=glMaterialManager.js.map