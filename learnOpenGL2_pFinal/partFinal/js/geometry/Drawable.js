import { vec3, mat4, quat } from "../../../math/glmatrix/index.js";
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
        this.ppMatrix = null;
    }
}
export class DrawModel {
    linkScene(scene) {
        scene.linkMeshes(this.drawMeshes);
    }
}
export class DrawScene {
    constructor(name, nodes, childIds) {
        this.name = name;
        this.nodes = nodes;
        this.childIds = childIds;
        this.updatePpMatrices();
    }
    linkMeshes(drawMeshes) {
        for (let i = 0, leni = this.childIds.length; i < leni; i++) {
            this.nodes[this.childIds[i]].traverseUsingMeshes(drawMeshes);
        }
    }
    updatePpMatrices() {
        for (let i = 0, leni = this.childIds.length; i < leni; i++) {
            this.nodes[this.childIds[i]].traversePreOrder(null, this.execUpdatePpMatrix);
        }
    }
    execUpdatePpMatrix(node, parent) {
        if (parent !== null) {
            mat4.mul(node.ppMatrix, parent.ppMatrix, node.matrix);
        }
        else {
            mat4.copy(node.ppMatrix, node.matrix);
        }
    }
}
export class DrawNode {
    constructor(nodes, childIds, matrix, meshId) {
        this.nodes = nodes;
        this.childIds = childIds;
        this.ppMatrix = mat4.create();
        this.matrix = matrix;
        this.translation = vec3.create();
        mat4.getTranslation(this.translation, this.matrix);
        this.rotation = quat.create();
        mat4.getRotation(this.rotation, this.matrix);
        this.scale = vec3.create();
        mat4.getScaling(this.scale, this.matrix);
        this.meshId = meshId;
        this.meshObject = null;
    }
    ;
    getMesh() {
        return this.meshObject;
    }
    flatten(nodes) {
        nodes.push(this);
        this.childIds.forEach(id => { nodes[id].flatten(nodes); });
    }
    traverseUsingMeshes(meshes) {
        if (this.meshId) {
            meshes[this.meshId].ppMatrix = this.ppMatrix;
        }
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traverseUsingMeshes(meshes);
        }
    }
    ;
    traversePreOrder(parent, executeFunction) {
        executeFunction(this, parent);
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traversePreOrder(this, executeFunction);
        }
    }
    ;
    traversePostOrder(parent, executeFunction) {
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traversePostOrder(this, executeFunction);
        }
        executeFunction(this, parent);
    }
    ;
}
export class DrawCubeMap extends DrawObject {
    constructor(material) {
        super(new Cube(), material);
    }
}
//# sourceMappingURL=Drawable.js.map