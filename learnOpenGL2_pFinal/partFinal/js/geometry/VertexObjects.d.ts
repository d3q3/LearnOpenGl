export declare class VertexAccessors {
    buffers: ArrayBuffer[];
    indexAccessor: Accessor;
    attributes: any;
    accessors: Accessor[];
}
export declare class Accessor {
    bufferId: number;
    bytesComponent: number;
    countComponent: number;
    stride: number;
    byteOffset: number;
    countElements: number;
    constructor(bufferId: any, bytesComponent: number, countComponent: number, byteOffset: number, countElements: number, byteStride: number);
}
export declare class Cube extends VertexAccessors {
    constructor();
}
export declare class Quad extends VertexAccessors {
    constructor();
}
export declare class Sphere extends VertexAccessors {
    constructor(widthSegments: number, heightSegments: number);
}
