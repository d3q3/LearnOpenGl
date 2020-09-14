export class Material {
    constructor(type, layout) {
        this.type = type;
        this.shaderLayout = layout;
    }
}
export class Texture {
    constructor(id) {
        this.id = id;
    }
}
export class TexturedMaterial extends Material {
    constructor() {
        super(...arguments);
        this.attributes = {};
    }
    addTextureAttribute(attr, id) {
        this.attributes[attr] = id;
    }
}
export class CubeMapMaterial extends TexturedMaterial {
    constructor() {
        super("env0", { POSITION: 0 });
        this.bits = 8;
    }
}
export class Pbr0Material extends TexturedMaterial {
    setMapCode() {
        this.mapCode = 0;
        if (this.attributes.BASECOLOR != undefined)
            this.mapCode += 2;
        if (this.attributes.PBR != undefined)
            this.mapCode += 4;
        if (this.attributes.NORMAL != undefined)
            this.mapCode += 8;
        if (this.attributes.OCCLUSION != undefined)
            this.mapCode += 16;
        if (this.attributes.EMISSIVE != undefined)
            this.mapCode += 32;
    }
}
//# sourceMappingURL=Material.js.map