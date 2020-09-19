import { loadImage } from "../../js/filing/filing.js";
export class ImageResource {
}
export class ImageLoader {
    constructor(baseUrl) {
        this.imagesLoaded = 0;
        this.imagesRequested = 0;
        this.baseUrl = baseUrl;
    }
    initLoad() {
        this.imagesRequested = 0;
        this.imagesLoaded = 0;
    }
    complete() {
        return (this.imagesRequested == this.imagesLoaded);
    }
    ;
    load(uris) {
        var images;
        var loader = this;
        this.initLoad();
        return new Promise((resolve, reject) => {
            images = new Array(uris.length);
            var loadImageCallback = function (img, iid) {
                images[iid] = img;
                loader.imagesLoaded++;
                if (loader.complete())
                    resolve(images);
            };
            var errorImageCallback = function (msg, iid) {
                console.log(msg);
                loader.imagesLoaded++;
                reject(msg);
            };
            if (uris) {
                for (let iid = 0; iid < images.length; iid++) {
                    loader.imagesRequested++;
                    loadImage(loader.baseUrl + uris[iid], iid, loadImageCallback, errorImageCallback);
                }
            }
        });
    }
}
//# sourceMappingURL=imageLoader.js.map