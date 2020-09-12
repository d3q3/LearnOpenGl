/**
 * 
 */
export class Material {
    type: string;
    shaderLayout: any;

    constructor(type: string, layout) {
        this.type = type;
        this.shaderLayout = layout;
    }
}

/**
 * 
 */
export class Texture {
    id: number;
    sourceData;
    width;
    height;

    constructor(id) {
        this.id = id;
    }
}

/**
 * 
 */
export class TexturedMaterial extends Material {
    textures: Texture[];
    attributes: any = {};
}

export class CubeMapMaterial extends TexturedMaterial {
    bits: number;
    //width: number; width/height in Texture

    constructor() {
        super("env0", { POSITION: 0 });
        this.bits = 8;
    }
}