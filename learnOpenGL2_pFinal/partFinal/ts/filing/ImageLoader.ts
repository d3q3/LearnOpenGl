import { loadImage } from "../../js/filing/filing.js"

export class ImageResource {
    images
}

export class ImageLoader {
    baseUrl: string;
    imagesLoaded = 0;
    imagesRequested = 0;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    initLoad() {
        this.imagesRequested = 0;
        this.imagesLoaded = 0;
    }

    complete(): boolean {
        return (this.imagesRequested == this.imagesLoaded)
    };

    load(uris) {
        var images;
        var loader = this;
        this.initLoad();

        return new Promise<HTMLImageElement[]>((resolve, reject) => {
            images = new Array(uris.length);

            var loadImageCallback = function (img, iid) {
                images[iid] = img;
                loader.imagesLoaded++;
                if (loader.complete()) resolve(images);
            };

            var errorImageCallback = function (msg, iid) {
                console.log(msg);
                loader.imagesLoaded++;
                reject(msg);
            }

            if (uris) {
                for (let iid = 0; iid < images.length; iid++) {
                    loader.imagesRequested++;
                    loadImage(loader.baseUrl + uris[iid],
                        iid, loadImageCallback, errorImageCallback);
                }
            }
        });
    }
}

