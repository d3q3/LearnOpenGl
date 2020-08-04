import { fs_pbr, vs_pbr } from "../../js/ChGltf/shaders/index.js";
import { Shader } from "../../js/common/Shader.js";
let Shader_Static = {
    shaderVersionLine: '#version 300 es\n',
    bitMasks: {
        HAS_BASECOLORMAP: 4,
        HAS_NORMALMAP: 8,
        HAS_METALROUGHNESSMAP: 16,
        HAS_OCCLUSIONMAP: 32,
        HAS_EMISSIVEMAP: 64
    },
    vsMasterCode: vs_pbr,
    fsMasterCode: fs_pbr,
    programObjects: {}
};
export class PbrShader {
    constructor(gl) {
        this.hasEmissiveMap = function () {
            return this.flags & Shader_Static.bitMasks.HAS_EMISSIVEMAP;
        };
        this.gl = gl;
        this.flags = 0;
        this.programObject = null;
        this.vertexSource = '';
        this.fragmentSource = '';
    }
    hasBaseColorMap() {
        return this.flags & Shader_Static.bitMasks.HAS_BASECOLORMAP;
    }
    ;
    hasNormalMap() {
        return this.flags & Shader_Static.bitMasks.HAS_NORMALMAP;
    }
    ;
    hasMetalRoughnessMap() {
        return this.flags & Shader_Static.bitMasks.HAS_METALROUGHNESSMAP;
    }
    ;
    hasOcclusionMap() {
        return this.flags & Shader_Static.bitMasks.HAS_OCCLUSIONMAP;
    }
    ;
    defineMacro(macro) {
        if (Shader_Static.bitMasks[macro] !== undefined) {
            this.flags = Shader_Static.bitMasks[macro] | this.flags;
        }
        else {
            console.log('WARNING: ' + macro + ' is not a valid macro');
        }
    }
    ;
    createShaderCode() {
        var vsDefine = '';
        var fsDefine = '';
        if (this.flags & Shader_Static.bitMasks.HAS_BASECOLORMAP) {
            fsDefine += '#define HAS_BASECOLORMAP\n';
        }
        if (this.flags & Shader_Static.bitMasks.HAS_NORMALMAP) {
            fsDefine += '#define HAS_NORMALMAP\n';
        }
        if (this.flags & Shader_Static.bitMasks.HAS_METALROUGHNESSMAP) {
            fsDefine += '#define HAS_METALROUGHNESSMAP\n';
        }
        if (this.flags & Shader_Static.bitMasks.HAS_OCCLUSIONMAP) {
            fsDefine += '#define HAS_OCCLUSIONMAP\n';
        }
        if (this.flags & Shader_Static.bitMasks.HAS_EMISSIVEMAP) {
            fsDefine += '#define HAS_EMISSIVEMAP\n';
        }
        this.vertexSource =
            Shader_Static.shaderVersionLine +
                vsDefine +
                Shader_Static.vsMasterCode;
        this.fragmentSource =
            Shader_Static.shaderVersionLine +
                fsDefine +
                Shader_Static.fsMasterCode;
    }
    createUniformLocations() {
        var gl = this.gl;
        var us = this.programObject.uniformLocations;
        var program = this.programObject.program;
        us.projection = gl.getUniformLocation(program, 'projection');
        us.view = gl.getUniformLocation(program, 'view');
        us.model = gl.getUniformLocation(program, 'model');
        us.baseColorFactor = gl.getUniformLocation(program, 'baseColorFactor');
        us.metallicFactor = gl.getUniformLocation(program, 'metallicFactor');
        us.roughnessFactor = gl.getUniformLocation(program, 'roughnessFactor');
        if (this.flags & Shader_Static.bitMasks.HAS_BASECOLORMAP) {
            us.baseColorTexture = gl.getUniformLocation(program, 'baseColorTexture');
        }
        if (this.flags & Shader_Static.bitMasks.HAS_NORMALMAP) {
            us.normalTexture = gl.getUniformLocation(program, 'normalTexture');
            us.normalTextureScale = gl.getUniformLocation(program, 'normalTextureScale');
        }
        if (this.flags & Shader_Static.bitMasks.HAS_METALROUGHNESSMAP) {
            us.metallicRoughnessTexture = gl.getUniformLocation(program, 'metallicRoughnessTexture');
        }
        if (this.flags & Shader_Static.bitMasks.HAS_OCCLUSIONMAP) {
            us.occlusionTexture = gl.getUniformLocation(program, 'occlusionTexture');
            us.occlusionStrength = gl.getUniformLocation(program, 'occlusionStrength');
        }
        if (this.flags & Shader_Static.bitMasks.HAS_EMISSIVEMAP) {
            us.emissiveTexture = gl.getUniformLocation(program, 'emissiveTexture');
            us.emissiveFactor = gl.getUniformLocation(program, 'emissiveFactor');
        }
        us.diffuseEnvSampler = gl.getUniformLocation(program, 'diffuseEnvSampler');
        us.specularEnvSampler = gl.getUniformLocation(program, 'specularEnvSampler');
        us.brdfLUT = gl.getUniformLocation(program, 'brdfLUT');
    }
    compile() {
        var existingProgramObject = Shader_Static.programObjects[this.flags];
        if (existingProgramObject) {
            this.programObject = existingProgramObject;
            return;
        }
        this.createShaderCode();
        this.programObject = {
            program: new Shader(this.gl, this.vertexSource, this.fragmentSource, null),
            uniformLocations: {},
        };
        this.createUniformLocations();
        Shader_Static.programObjects[this.flags] = this.programObject;
    }
}
;
//# sourceMappingURL=PbrShader.js.map