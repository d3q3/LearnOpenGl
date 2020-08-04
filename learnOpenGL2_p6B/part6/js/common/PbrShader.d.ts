export declare class PbrShader {
    gl: any;
    flags: any;
    programObject: any;
    vertexSource: any;
    fragmentSource: any;
    constructor(gl: any);
    hasBaseColorMap(): number;
    hasNormalMap(): number;
    hasMetalRoughnessMap(): number;
    hasOcclusionMap(): number;
    hasEmissiveMap: () => number;
    defineMacro(macro: any): void;
    private createShaderCode;
    createUniformLocations(): void;
    compile(): void;
}
