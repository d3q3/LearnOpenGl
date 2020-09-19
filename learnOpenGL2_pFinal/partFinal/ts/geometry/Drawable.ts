import { vec3, vec4, mat4, quat } from "../../../math/glmatrix/index.js";
import { VertexAccessors, Cube } from "../../js/geometry/VertexObjects.js";
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

    ppMatrix: mat4;

    vertexObjects: DrawObject[];
    constructor() {
        this.vertexObjects = [];
        this.ppMatrix = null;
    }
}

/**
 * D3Q: essentially an array of DrawMeshes
 */
export abstract class DrawModel {
    bufferCount: number;
    textureCount: number;
    drawMeshes: DrawMesh[];
    abstract getDrawScene(i: number);
    abstract getMeshes(): DrawMesh[];
    linkScene(scene: DrawScene) {
        scene.linkMeshes(this.drawMeshes)
    }
}

export class DrawScene {
    name: string;
    // start nodes of the scene
    private nodes: DrawNode[];
    private childIds: number[];

    /**
     * @param name 
     * @param nodes 
     * @param nodeIds 
     */
    constructor(name: string, nodes: DrawNode[], childIds: number[]) {
        this.name = name;
        this.nodes = nodes;
        this.childIds = childIds;

        // PpMatrices: Parent-product matrices
        this.updatePpMatrices();
    }

    linkMeshes(drawMeshes: DrawMesh[]) {
        for (let i = 0, leni = this.childIds.length; i < leni; i++) {
            this.nodes[this.childIds[i]].traverseUsingMeshes(drawMeshes);
        }
    }

    /**
    * D3Q: updates the ppMatrices in the nodes of this scene
    */
    updatePpMatrices() {
        for (let i = 0, leni = this.childIds.length; i < leni; i++) {
            this.nodes[this.childIds[i]].traversePreOrder(null, this.execUpdatePpMatrix);
        }
    }

    // getMeshNodes(): GltfNode[] {
    //     let nodes = [];
    //     for (let i = 0, leni = this.flatNodes.length; i < leni; i++) {
    //         if (this.flatNodes[i].getMesh(false)) nodes.push(this.flatNodes[i]);
    //     }
    //     return nodes;
    // }


    // private flatten() {
    //     this.flatNodes = [];
    //     for (let i = 0, leni = this.children.length; i < leni; i++) {
    //         this.children[i].flatten(this.flatNodes);
    //     }
    // }

    private execUpdatePpMatrix(node: DrawNode, parent: DrawNode) {
        if (parent !== null) {
            mat4.mul(node.ppMatrix, parent.ppMatrix, node.matrix);
        } else {
            mat4.copy(node.ppMatrix, node.matrix);
        }
    }
}





export class DrawNode {
    private nodes: DrawNode[];

    childIds: number[];

    meshId;
    meshObject: DrawMesh;

    // D3Q: local matrix
    matrix;
    translation;
    rotation;
    scale;

    //D3Q: ppMatrix : parentMatrix-product-this.matrix
    ppMatrix;

    constructor(nodes: DrawNode[], childIds: number[], matrix: mat4, meshId: number) {
        this.nodes = nodes;
        this.childIds = childIds;

        this.ppMatrix = mat4.create();

        // D3Q: The matrix is equal to TRS.
        this.matrix = matrix;
        // calculate T, R and S; TRS are used for animation
        this.translation = vec3.create();
        mat4.getTranslation(this.translation, this.matrix);
        this.rotation = quat.create();
        mat4.getRotation(this.rotation, this.matrix);
        this.scale = vec3.create();
        mat4.getScaling(this.scale, this.matrix);

        this.meshId = meshId
        this.meshObject = null;
    };

    getMesh(): DrawMesh {
        return this.meshObject;
    }

    flatten(nodes: DrawNode[]) {
        nodes.push(this);
        this.childIds.forEach(id => { nodes[id].flatten(nodes) });
    }

    /**
     * D3Q: execute Function in nodes top-down
     * @param parent 
     * @param executeFunction
    */
    traverseUsingMeshes(meshes: DrawMesh[]) {
        //executeFunction(this);
        if (this.meshId) {
            meshes[this.meshId].ppMatrix = this.ppMatrix;
        }
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traverseUsingMeshes(meshes);
        }
    };

    /**
     * D3Q: execute Function in nodes top-down
     * @param parent 
     * @param executeFunction
     */
    traversePreOrder(parent: DrawNode, executeFunction) {
        executeFunction(this, parent);
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traversePreOrder(this, executeFunction);
        }
    };

    /**
     * D3Q: execute Function in nodes bottom-up
     * @param parent DrawNode, parent of this node
     * @param executeFunction function(DrawNode, DrawNode)
     */
    traversePostOrder(parent: DrawNode, executeFunction) {
        for (var i = 0, ilen = this.childIds.length; i < ilen; i++) {
            this.nodes[this.childIds[i]].traversePostOrder(this, executeFunction);
        }
        executeFunction(this, parent);
    };
}



export class DrawCubeMap extends DrawObject {
    material: CubeMapMaterial;
    vas: VertexAccessors;
    constructor(material: CubeMapMaterial) {
        super(new Cube(), material);
    }
}