/// <reference types="webgl2" />
export declare class Shader {
    programId: number;
    private createShader;
    constructor(gl: any, vertexCode: string, fragmentCode: string, geometryCode?: any);
    use(gl: any): void;
    setBoolean(gl: any, name: string, value: boolean): void;
    setInt(gl: WebGL2RenderingContext, name: any, value: number): void;
    setFloat(gl: any, name: any, value: number): void;
    setFloat2(gl: any, name: any, value1: number, value2: number): void;
    setFloat3(gl: any, name: any, value1: number, value2: number, value3: number): void;
    setFloat4(gl: any, name: any, value1: number, value2: number, value3: number, value4: number): void;
}
