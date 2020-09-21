export declare class GltfResource {
    modelName: string;
    json: any;
    buffers: any;
    images: any;
    constructor();
}
export declare class GltfLoader {
    baseUri: any;
    isLoaded: any;
    buffersRequested: any;
    buffersLoaded: any;
    imagesRequested: any;
    imagesLoaded: any;
    initLoad(): void;
    buffersComplete(resource: GltfResource): boolean;
    imagesComplete(resource: GltfResource): boolean;
    complete(resource: GltfResource): boolean;
    load(uri: any): Promise<GltfResource>;
}
