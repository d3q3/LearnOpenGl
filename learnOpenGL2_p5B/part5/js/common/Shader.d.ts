/// <reference types="webgl2" />
export declare class Shader {
    programId: number;
    private createShader;
    constructor(gl: any, vertexCode: string, fragmentCode: string, geometryCode?: any);
    use(gl: any): void;
    setBoolean(gl: any, name: string, value: boolean): void;
    setInt(gl: WebGL2RenderingContext, name: any, value: number): void;
    setFloat(gl: any, name: any, value: number): void;
}
