/**
 * A texture and its sampler.
 */
export class GltfTexture {
    //fields copied from specification:
    name;
    sampler: GltfSampler;
    source;
    extensions;
    extras;

    constructor(t, samplers, images) {
        this.name = t.name !== undefined ? t.name : null;
        this.sampler = t.sampler !== undefined ? samplers[t.sampler] : null;
        this.source = t.source !== undefined ? images[t.source] : null;

        this.extensions = t.extensions !== undefined ? t.extensions : null;
        this.extras = t.extras !== undefined ? t.extras : null;

    }
}


/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export class GltfSampler {
    //fields copied from specification:
    magFilter;
    minFilter;
    wrapS;
    wrapT;
    name;
    extensions;
    extras;


    constructor(s) {
        this.name = s.name !== undefined ? s.name : null;
        this.magFilter = s.magFilter !== undefined ? s.magFilter : null;
        this.minFilter = s.minFilter !== undefined ? s.minFilter : null;
        this.wrapS = s.wrapS !== undefined ? s.wrapS : 10497;
        this.wrapT = s.wrapT !== undefined ? s.wrapT : 10497;

        this.extensions = s.extensions !== undefined ? s.extensions : null;
        this.extras = s.extras !== undefined ? s.extras : null;
    }
}

/**
 * "Reference to a texture."
 */
export class GltfTextureInfo {
    //fields copied from specification:
    index; //required, the index of the texture
    texCoord; //integer, "TEXCOORD_"+texCoord, default 0
    strength;
    extensions;
    extras
    constructor(json) {
        this.index = json.index;
        this.texCoord = json.texCoord !== undefined ? json.texCoord : 0;
        this.strength = json.strength !== undefined ? json.strength : 1;

        this.extensions = json.extensions !== undefined ? json.extensions : null;
        this.extras = json.extras !== undefined ? json.extras : null;
    }
}

export class GltfPbrMetallicRoughness {
    //fields copied from specification:
    baseColorFactor;
    baseColorTexture: GltfTextureInfo;
    metallicFactor;
    roughnessFactor;
    metallicRoughnessTexture: GltfTextureInfo; // B and G channel, R and A channel ignored
    extensions;
    extras;

    constructor(json) {
        this.baseColorFactor = json.baseColorFactor !== undefined ? json.baseColorFactor : [1, 1, 1, 1];
        this.baseColorTexture = json.baseColorTexture !== undefined ? new GltfTextureInfo(json.baseColorTexture) : null;
        this.metallicFactor = json.metallicFactor !== undefined ? json.metallicFactor : 1;
        this.roughnessFactor = json.roughnessFactor !== undefined ? json.roughnessFactor : 1;
        this.metallicRoughnessTexture = json.metallicRoughnessTexture !== undefined ? new GltfTextureInfo(json.metallicRoughnessTexture) : null;

        this.extensions = json.extensions !== undefined ? json.extensions : null;
        this.extras = json.extras !== undefined ? json.extras : null;
    }
}

export class GltfNormalTextureInfo {
    //fields copied from specification:
    index;
    texCoord;
    scale; //scaledNormal =  normalize((<sampled normal texture value> * 2.0 - 1.0) * vec3(<normal scale>, <normal scale>, 1.0))
    extensions;
    extras;

    constructor(json) {
        this.index = json.index;
        this.texCoord = json.texCoord !== undefined ? json.texCoord : 0;
        this.scale = json.scale !== undefined ? json.scale : 1;

        this.extensions = json.extensions !== undefined ? json.extensions : null;
        this.extras = json.extras !== undefined ? json.extras : null;
    }
}

export class GltfOcclusionTextureInfo {
    //fields copied from specification:
    index;
    texCoord;
    strength; //lerp(color, color * <sampled occlusion texture value>, <occlusion strength>)
    extensions;
    extras;

    constructor(json) {
        this.index = json.index;
        this.texCoord = json.texCoord !== undefined ? json.texCoord : 0;
        this.strength = json.strength !== undefined ? json.strength : 1;

        this.extensions = json.extensions !== undefined ? json.extensions : null;
        this.extras = json.extras !== undefined ? json.extras : null;
    }
}

export class GltfMaterial {
    //fields copied from specification:
    name;
    extensions;
    extras;

    id;
    pbrMetallicRoughness: GltfPbrMetallicRoughness;
    normalTexture: GltfNormalTextureInfo;
    occlusionTexture: GltfOcclusionTextureInfo;
    emissiveTexture: GltfTextureInfo;
    emissiveFactor;
    alphaMode;
    alphaCutoff;
    doubleSided;

    constructor(m, id) {
        this.name = m.name !== undefined ? m.name : "material" + id;
        this.id = id;

        this.pbrMetallicRoughness = m.pbrMetallicRoughness !== undefined ?
            new GltfPbrMetallicRoughness(m.pbrMetallicRoughness) :
            new GltfPbrMetallicRoughness({
                baseColorFactor: [1, 1, 1, 1],
                metallicFactor: 1,
                metallicRoughnessTexture: 1
            });
        this.normalTexture = m.normalTexture !== undefined ? new GltfNormalTextureInfo(m.normalTexture) : null;
        this.occlusionTexture = m.occlusionTexture !== undefined ? new GltfOcclusionTextureInfo(m.occlusionTexture) : null;
        this.emissiveTexture = m.emissiveTexture !== undefined ? new GltfTextureInfo(m.emissiveTexture) : null;

        this.emissiveFactor = m.emissiveFactor !== undefined ? m.emissiveFactor : [0, 0, 0];
        this.alphaMode = m.alphaMode !== undefined ? m.alphaMode : "OPAQUE";
        this.alphaCutoff = m.alphaCutoff !== undefined ? m.alphaCutoff : 0.5;
        this.doubleSided = m.doubleSided || false;

        this.extensions = m.extensions !== undefined ? m.extensions : null;
        this.extras = m.extras !== undefined ? m.extras : null;
    }
}

