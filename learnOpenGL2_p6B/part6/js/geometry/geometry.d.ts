export declare class Geometry {
    vertices: Float32Array;
    indices: Uint16Array;
    bytesStride: number;
    attributes: any;
    accessors: Accessor[];
    constructor(bytesStride: number);
}
export declare class Accessor {
    bytesType: number;
    stride: number;
    offset: number;
    count: number;
    constructor(bytesType: number, count: number, byteOffset: number, byteStride: number);
}
export declare class Cube extends Geometry {
    constructor();
}
export declare class Quad extends Geometry {
    constructor();
}
export declare class Sphere extends Geometry {
    constructor(widthSegments: number, heightSegments: number);
}
