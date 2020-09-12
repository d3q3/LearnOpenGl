import { Accessor, VertexAccessors, Cube } from "../../js/geometry/VertexObjects.js";
import { Material, CubeMapMaterial } from "../../js/material/Material.js";

/**
 * D3Q: A DrawObject has all the information that is needed to draw itself.
 * It is the combination of vertex accessors and a material
 */
export class DrawObject { //extends VertexAccessors {
    vas: VertexAccessors;
    material: Material;
    constructor(vas, material) {
        this.vas = vas;
        this.material = material;
    }
}

/**
 * D3Q: essentially an array of DrawObjects
 */
export class DrawMesh {
    name: string;
    id: number;

    vertexObjects: DrawObject[];
    constructor() {
        this.vertexObjects = [];
    }
}

/**
 * D3Q: essentially an array of DrawMeshes
 */
export abstract class DrawModel {
    bufferCount: number;
    textureCount: number;
    drawMeshes: DrawMesh[];
    //    abstract getTexture(i: number): Texture;
    abstract getMeshes(): DrawMesh[];
}

export class DrawCubeMap extends DrawObject {
    material: CubeMapMaterial;
    vas: VertexAccessors;
    constructor(material: CubeMapMaterial) {
        super(new Cube(), material);
    }
}