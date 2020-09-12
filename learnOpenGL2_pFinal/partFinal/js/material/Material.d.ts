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
}
export declare class CubeMapMaterial extends TexturedMaterial {
    bits: number;
    constructor();
}
