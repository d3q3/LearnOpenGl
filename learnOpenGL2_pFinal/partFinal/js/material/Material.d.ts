export declare class Material {
    type: string;
    shaderLayout: any;
    constructor(type: string, layout: any);
}
export declare class Texture {
    id: number;
    sourceData: any;
    width: any;
    height: any;
    constructor(id: any);
}
export declare class TexturedMaterial extends Material {
    textures: Texture[];
    attributes: any;
    addTextureAttribute(attr: any, id: any): void;
}
export declare class CubeMapMaterial extends TexturedMaterial {
    bits: number;
    constructor();
}
export declare class Pbr0Material extends TexturedMaterial {
    id: any;
    mapCode: number;
    baseColorFactor: number[];
    roughnessFactor: number;
    metallicFactor: number;
    normalScale: number;
    occlusionStrength: number;
    emissiveFactor: number[];
    setMapCode(): void;
}
