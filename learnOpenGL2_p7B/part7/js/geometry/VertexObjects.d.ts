export declare class VertexObject {
    vertices: Float32Array;
    indices: Uint16Array;
    attributes: any;
    accessors: Accessor[];
    getBuffers(): Float32Array[];
}
export declare class Accessor {
    bufferId: number;
    bytesComponent: number;
    countComponent: number;
    stride: number;
    offset: number;
    constructor(bufferId: any, bytesComponent: number, countComponent: number, byteOffset: number, byteStride: number);
}
export declare class Cube extends VertexObject {
    constructor();
}
export declare class Quad extends VertexObject {
    constructor();
}
export declare class Sphere extends VertexObject {
    constructor(widthSegments: number, heightSegments: number);
}
export declare class Sphere2 extends VertexObject {
    stride: number;
    constructor(xSegments: number, ySegments: number);
}
