export declare class ImageResource {
    images: any;
}
export declare class ImageLoader {
    baseUrl: string;
    imagesLoaded: number;
    imagesRequested: number;
    constructor(baseUrl: string);
    initLoad(): void;
    complete(): boolean;
    load(uris: any): Promise<{}>;
}
