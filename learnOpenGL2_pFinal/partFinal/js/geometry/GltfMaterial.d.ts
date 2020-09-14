import { Pbr0Material, Texture } from "../../js/material/Material.js";
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
    baseColorTexture: GltfTextureInfo;
    metallicRoughnessTexture: GltfTextureInfo;
    extensions: any;
    extras: any;
    constructor(mat: GltfMaterial, json: any);
}
export declare class GltfNormalTextureInfo {
    index: any;
    texCoord: any;
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
export declare class GltfMaterial extends Pbr0Material {
    name: any;
    extensions: any;
    extras: any;
    pbrMetallicRoughness: GltfPbrMetallicRoughness;
    normalTexture: GltfNormalTextureInfo;
    occlusionTexture: GltfOcclusionTextureInfo;
    emissiveTexture: GltfTextureInfo;
    alphaMode: any;
    alphaCutoff: any;
    doubleSided: any;
    constructor(textures: any, m: any, id: any);
}
