import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";
import { GltfModel, GltfMesh, GltfScene, GltfNode, GltfCamera, GltfVertexObject } from "../../js/geometry/GltfModel.js";

export class GlSceneModel {
    name: string;
    glBuffers: WebGLBuffer[];
    glMeshes: GlMesh[];
    glScenes: GlScene[];
}

/**
 * GlMesh has 0 or more 'primitives'/vertexObject with a vao
 */
class GlMesh {
    vaos = [];
    vos: GltfVertexObject[] = [];
    mats: number[] = [];
}

/**
 * a mesh can be referenced more than once in a scene having different ppMatrices
 */
export class GlDrawMesh {
    glMesh: GlMesh;
    ppMatrix: mat4;
}

export class GlScene {
    drawMeshes: GlDrawMesh[];
}

export class GlSceneManager {
    gl: WebGL2RenderingContext;
    glModels: GlSceneModel[];
    attributeLayout: any;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.glModels = [];
        this.attributeLayout = { POSITION: 0, TEXCOORD_0: 1, NORMAL: 2 };
    }

    getModelNameIndex(name: string): number {
        let found = false; let i = 0;
        while (!found && i < this.glModels.length) {
            if (name == this.glModels[i].name) found = true; else i++;
        }
        if (found) return i; else return null;
    }

    private createGlModel(model: GltfModel) {
        let glModel = new GlSceneModel();
        glModel.name = model.name;
        glModel.glBuffers = new Array(model.bufferViews.length);
        glModel.glScenes = new Array(model.sceneCount);
        glModel.glMeshes = new Array(model.meshes.length);
        this.glModels.push(glModel);
        return this.glModels.length - 1;
    }

    private createGlScene(glModelId: number, model: GltfModel, sceneId: number): GlScene {
        let glScene: GlScene = new GlScene();

        let scene: GltfScene = model.getScene(sceneId);
        let meshNodes: GltfNode[] = scene.getMeshNodes();

        glScene.drawMeshes = new Array(meshNodes.length);

        for (let i = 0, ilen = meshNodes.length; i < ilen; i++) {
            let mesh: GltfMesh = meshNodes[i].getMesh(false);
            let drawMesh = new GlDrawMesh();

            let glModel = this.glModels[glModelId];
            if (!glModel.glMeshes[mesh.id]) {
                glModel.glMeshes[mesh.id] = this.createGlMesh(glModelId, model, mesh);
            }
            drawMesh.ppMatrix = meshNodes[i].ppMatrix;
            drawMesh.glMesh = glModel.glMeshes[mesh.id];
            glScene.drawMeshes[i] = drawMesh;
        }
        return glScene;
    }

    getGlScene(glftModel: GltfModel, sceneId: number): GlScene {
        let glModelId = this.getModelNameIndex(glftModel.name);
        if (!glModelId) {
            glModelId = this.createGlModel(glftModel);
        }
        let glModel = this.glModels[glModelId];

        if (glModel.glScenes[sceneId]) return glModel.glScenes[sceneId];
        // create glScene
        let glScene = this.createGlScene(glModelId, glftModel, sceneId);
        glModel.glScenes[sceneId] = glScene;
        return glScene;
    }

    private createGlMesh(glModelId: number, model: GltfModel, mesh: GltfMesh): GlMesh {
        let gl = this.gl;
        let glModel = this.glModels[glModelId];
        let glMesh = new GlMesh();

        // create a vao for every vertexObject in a mesh
        for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
            let vo = mesh.vertexObjects[j];

            //let mat = vo.material;
            glMesh.mats.push(vo.materialId);

            // get layout for material, for now default, material = null:
            //let layout = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
            //let layout = { POSITION: 0, NORMAL: 2, TEXCOORD_0: 1 };
            let layout = this.attributeLayout;

            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            let ib = vo.indexAccessor.bufferId;
            if (!glModel.glBuffers[ib]) {
                const ebo: WebGLBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);

                glModel.glBuffers[ib] = ebo;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glModel.glBuffers[ib]);

            let acc: Accessor;

            // POSITION
            acc = vo.accessors[vo.attributes.POSITION];
            this.createGlVertexBuffer(glModelId, model, acc);
            gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
            gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT,
                false, acc.stride, acc.byteOffset);
            gl.enableVertexAttribArray(layout.POSITION);

            // TEXTURE
            if (layout.TEXCOORD_0 !== undefined) {
                if (vo.attributes.TEXCOORD_0 !== undefined) {
                    acc = vo.accessors[vo.attributes.TEXCOORD_0];
                    this.createGlVertexBuffer(glModelId, model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
                    gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent,
                        gl.FLOAT, false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.TEXCOORD_0);
                }
            }
            // NORMAL
            if (layout.NORMAL !== undefined) {
                if (vo.attributes.NORMAL !== undefined) {
                    acc = vo.accessors[vo.attributes.NORMAL];
                    this.createGlVertexBuffer(glModelId, model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
                    acc = vo.accessors[vo.attributes.NORMAL];
                    gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT,
                        false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.NORMAL);
                }
            }
            glMesh.vaos.push(vao);
            glMesh.vos.push(vo);
        }
        return glMesh;
    }

    /**
     * 
     * @param glftModel 
     * @param acc 
     */
    createGlVertexBuffer(glModelId: number, glftModel: GltfModel, acc: Accessor) {
        let gl = this.gl;
        let ib = acc.bufferId;

        let glModel = this.glModels[glModelId];
        if (!glModel.glBuffers[ib]) {
            let vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, glftModel.bufferViews[ib].data, gl.STATIC_DRAW);
            glModel.glBuffers[ib] = vbo;
        }
    }

}
