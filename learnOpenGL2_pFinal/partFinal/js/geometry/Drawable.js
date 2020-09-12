import { Cube } from "../../js/geometry/VertexObjects.js";
export class DrawObject {
    constructor(vas, material) {
        this.vas = vas;
        this.material = material;
    }
}
export class DrawMesh {
    constructor() {
        this.vertexObjects = [];
    }
}
export class DrawModel {
}
export class DrawCubeMap extends DrawObject {
    constructor(material) {
        super(new Cube(), material);
    }
}
//# sourceMappingURL=Drawable.js.map