export class GlSceneModel {
}
class GlMesh {
    constructor() {
        this.vaos = [];
        this.vos = [];
        this.mats = [];
    }
}
export class GlDrawMesh {
}
export class GlScene {
}
export class GlSceneManager {
    constructor(gl) {
        this.gl = gl;
        this.glModels = [];
        this.attributeLayout = { POSITION: 0, TEXCOORD_0: 1, NORMAL: 2 };
    }
    getModelNameIndex(name) {
        let found = false;
        let i = 0;
        while (!found && i < this.glModels.length) {
            if (name == this.glModels[i].name)
                found = true;
            else
                i++;
        }
        if (found)
            return i;
        else
            return null;
    }
    createGlModel(model) {
        let glModel = new GlSceneModel();
        glModel.name = model.name;
        glModel.glBuffers = new Array(model.bufferViews.length);
        glModel.glScenes = new Array(model.sceneCount);
        glModel.glMeshes = new Array(model.meshes.length);
        this.glModels.push(glModel);
        return this.glModels.length - 1;
    }
    createGlScene(glModelId, model, sceneId) {
        let glScene = new GlScene();
        let scene = model.getScene(sceneId);
        let meshNodes = scene.getMeshNodes();
        glScene.drawMeshes = new Array(meshNodes.length);
        for (let i = 0, ilen = meshNodes.length; i < ilen; i++) {
            let mesh = meshNodes[i].getMesh(false);
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
    getGlScene(glftModel, sceneId) {
        let glModelId = this.getModelNameIndex(glftModel.name);
        if (!glModelId) {
            glModelId = this.createGlModel(glftModel);
        }
        let glModel = this.glModels[glModelId];
        if (glModel.glScenes[sceneId])
            return glModel.glScenes[sceneId];
        let glScene = this.createGlScene(glModelId, glftModel, sceneId);
        glModel.glScenes[sceneId] = glScene;
        return glScene;
    }
    createGlMesh(glModelId, model, mesh) {
        let gl = this.gl;
        let glModel = this.glModels[glModelId];
        let glMesh = new GlMesh();
        for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
            let vo = mesh.vertexObjects[j];
            glMesh.mats.push(vo.materialId);
            let layout = this.attributeLayout;
            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            let ib = vo.indexAccessor.bufferId;
            if (!glModel.glBuffers[ib]) {
                const ebo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);
                glModel.glBuffers[ib] = ebo;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glModel.glBuffers[ib]);
            let acc;
            acc = vo.accessors[vo.attributes.POSITION];
            this.createGlVertexBuffer(glModelId, model, acc);
            gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
            gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
            gl.enableVertexAttribArray(layout.POSITION);
            if (layout.TEXCOORD_0 !== undefined) {
                if (vo.attributes.TEXCOORD_0 !== undefined) {
                    acc = vo.accessors[vo.attributes.TEXCOORD_0];
                    this.createGlVertexBuffer(glModelId, model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
                    gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.TEXCOORD_0);
                }
            }
            if (layout.NORMAL !== undefined) {
                if (vo.attributes.NORMAL !== undefined) {
                    acc = vo.accessors[vo.attributes.NORMAL];
                    this.createGlVertexBuffer(glModelId, model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, glModel.glBuffers[acc.bufferId]);
                    acc = vo.accessors[vo.attributes.NORMAL];
                    gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.NORMAL);
                }
            }
            glMesh.vaos.push(vao);
            glMesh.vos.push(vo);
        }
        return glMesh;
    }
    createGlVertexBuffer(glModelId, glftModel, acc) {
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
//# sourceMappingURL=glSceneManager.js.map