import { TexturedMaterial, Texture } from "../../js/material/Material.js";
export declare class GltfTexture extends Texture {
    name: any;
    sampler: GltfSampler;
    extensions: any;
    extras: any;
    constructor(id: number, t: any, samplers: any, images: any);
}
export declare class GltfSampler {
    magFilter: any;
    minFilter: any;
    wrapS: any;
    wrapT: any;
    name: any;
    extensions: any;
    extras: any;
    constructor(s: any);
}
export declare class GltfTextureInfo {
    index: any;
    texCoord: any;
    strength: any;
    extensions: any;
    extras: any;
    constructor(mat: GltfMaterial, attr: any, json: any);
}
export declare class GltfPbrMetallicRoughness {
    baseColorFactor: any;
    baseColorTexture: GltfTextureInfo;
    metallicFactor: any;
    roughnessFactor: any;
    metallicRoughnessTexture: GltfTextureInfo;
    extensions: any;
    extras: any;
    constructor(mat: GltfMaterial, json: any);
}
export declare class GltfNormalTextureInfo {
    index: any;
    texCoord: any;
    scale: any;
    extensions: any;
    extras: any;
    constructor(mat: GltfMaterial, json: any);
}
export declare class GltfOcclusionTextureInfo {
    index: any;
    texCoord: any;
    strength: any;
    extensions: any;
    extras: any;
    constructor(mat: GltfMaterial, json: any);
}
export declare class GltfMaterial extends TexturedMaterial {
    name: any;
    extensions: any;
    extras: any;
    id: any;
    pbrMetallicRoughness: GltfPbrMetallicRoughness;
    normalTexture: GltfNormalTextureInfo;
    occlusionTexture: GltfOcclusionTextureInfo;
    emissiveTexture: GltfTextureInfo;
    emissiveFactor: any;
    alphaMode: any;
    alphaCutoff: any;
    doubleSided: any;
    constructor(textures: any, m: any, id: any);
    addTextureAttribute(attr: any, id: any): void;
}
