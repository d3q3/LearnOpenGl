export declare class GltfResource {
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
    initLoad(): void;
    buffersComplete(resource: GltfResource): boolean;
    load(uri: any): Promise<{}>;
}
