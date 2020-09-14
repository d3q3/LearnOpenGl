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

    addTextureAttribute(attr, id) {
        this.attributes[attr] = id;
    }

}

export class CubeMapMaterial extends TexturedMaterial {
    bits: number;
    //width: number; width/height in Texture

    constructor() {
        super("env0", { POSITION: 0 });
        this.bits = 8;
    }
}

/**
 * D3Q: Physics bases material; derived from gltf format
 */
export class Pbr0Material extends TexturedMaterial {
    // D3Q: if a material is shared between meshes then the materials have
    // (of course) the same id. In PbrShader.setMaterial(mat) we can return if
    // the id has not changed.
    id;
    // D3Q: mapCode has a binary encoding for the existence of the maps used.
    // this code is passed to the shader.
    mapCode: number;

    //glBaseColor;
    baseColorFactor: number[];
    //glMetallicRoughness;
    roughnessFactor: number;
    metallicFactor: number;
    //glNormal;
    normalScale: number;
    //glOcclusion;
    occlusionStrength: number;
    //glEmissive;
    emissiveFactor: number[];

    setMapCode() {
        this.mapCode = 0;
        //    if (this.attributes["PBR"]) this.mapCode = 1;
        if (this.attributes.BASECOLOR != undefined) this.mapCode += 2;
        if (this.attributes.PBR != undefined) this.mapCode += 4;
        if (this.attributes.NORMAL != undefined) this.mapCode += 8;
        if (this.attributes.OCCLUSION != undefined) this.mapCode += 16;
        if (this.attributes.EMISSIVE != undefined) this.mapCode += 32;
    }

}
