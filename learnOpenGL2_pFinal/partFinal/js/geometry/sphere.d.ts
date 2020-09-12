export declare class Sphere {
    indexCount: number;
    indices: number[];
    vertices: number[];
    stride: number;
    constructor(radius: number, widthSegments: number, heightSegments: number, phiStart: number, phiLength: number, thetaStart: number, thetaLength: number);
}
export declare class Sphere2 {
    indexCount: number;
    indices: number[];
    vertices: number[];
    stride: number;
    constructor(radius: number, xSegments: number, ySegments: number, phiStart: number, phiLength: number, thetaStart: number, thetaLength: number);
}
