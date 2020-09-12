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
}
export class CubeMapMaterial extends TexturedMaterial {
    constructor() {
        super("env0", { POSITION: 0 });
        this.bits = 8;
    }
}
//# sourceMappingURL=Material.js.map