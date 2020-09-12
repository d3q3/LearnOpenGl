export class GltfResource {
    constructor() {
        this.modelName = null;
        this.json = null;
        this.buffers = [];
        this.images = [];
    }
}
export class GltfLoader {
    initLoad() {
        this.isLoaded = false;
        this.buffersRequested = 0;
        this.buffersLoaded = 0;
        this.imagesRequested = 0;
        this.imagesLoaded = 0;
    }
    buffersComplete(resource) {
        return (this.buffersRequested == this.buffersLoaded);
    }
    imagesComplete(resource) {
        return (this.imagesRequested == this.imagesLoaded);
    }
    complete(resource) {
        return (this.buffersComplete(resource) &&
            (this.imagesComplete(resource)));
    }
    load(uri) {
        return new Promise((resolve, reject) => {
            this.initLoad();
            var loader = this;
            var gltfResource = new GltfResource();
            gltfResource.modelName = getFileName(uri);
            this.baseUri = getBaseUri(uri);
            let extension = getExtension(uri);
            if (extension == '.gltf') {
                loadJSON(uri, function (response) {
                    gltfResource.json = JSON.parse(response);
                    function isBase64(dataProtocol) {
                        return (/^data:.*,.*$/i.test(dataProtocol));
                    }
                    function fromBase64(dataProtocol) {
                        var buffers = (dataProtocol).split(";base64,");
                        var adata = buffers[1];
                        var bdata = atob(adata);
                        var bytes = new Uint8Array(bdata.length);
                        for (var i = 0; i < bdata.length; i++) {
                            bytes[i] = bdata.charCodeAt(i);
                        }
                        return bytes.buffer;
                    }
                    var loadArrayBufferCallback = function (resource, bid) {
                        gltfResource.buffers[bid] = resource;
                        loader.buffersLoaded++;
                        if (loader.complete(gltfResource))
                            resolve(gltfResource);
                    };
                    var loadImageCallback = function (img, iid) {
                        gltfResource.images[iid] = img;
                        loader.imagesLoaded++;
                        if (loader.complete(gltfResource))
                            resolve(gltfResource);
                    };
                    var errorImageCallback = function (msg, iid) {
                        console.log(msg);
                        loader.imagesLoaded++;
                        reject(msg);
                    };
                    if (gltfResource.json.buffers) {
                        var bid;
                        for (bid in gltfResource.json.buffers) {
                            if (isBase64(gltfResource.json.buffers[bid].uri)) {
                                gltfResource.buffers[bid] = fromBase64(gltfResource.json.buffers[bid].uri);
                            }
                            else {
                                loader.buffersRequested++;
                                loadArrayBuffer(loader.baseUri + gltfResource.json.buffers[bid].uri, bid, loadArrayBufferCallback);
                            }
                        }
                    }
                    if (gltfResource.json.images) {
                        var iid;
                        for (iid in gltfResource.json.images) {
                            if (isBase64(gltfResource.json.images[iid].uri)) {
                                loader.imagesRequested++;
                                loadImage(gltfResource.json.images[iid].uri, iid, loadImageCallback, errorImageCallback);
                            }
                            else {
                                loader.imagesRequested++;
                                loadImage(loader.baseUri + gltfResource.json.images[iid].uri, iid, loadImageCallback, errorImageCallback);
                            }
                        }
                    }
                    if (loader.complete(gltfResource))
                        resolve(gltfResource);
                });
            }
        });
    }
}
function getBaseUri(uri) {
    var basePath = '';
    var i = uri.lastIndexOf('/');
    if (i !== -1) {
        basePath = uri.substring(0, i + 1);
    }
    return basePath;
}
function getFileName(uri) {
    let uriParts = uri.split('/');
    if (uriParts.length >= 1)
        return uriParts[uriParts.length - 1];
    else
        return uri;
}
function getExtension(uri) {
    var extension = '';
    var i = uri.lastIndexOf('.');
    if (i !== -1) {
        extension = uri.substring(i);
    }
    return extension;
}
function loadJSON(uri, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', uri, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if (xobj.status == 200) {
                callback(xobj.responseText, this);
            }
            else
                throw (new Error("not found: " + uri));
        }
    };
    xobj.send(null);
}
function loadArrayBuffer(url, bid, callback) {
    var xobj = new XMLHttpRequest();
    xobj.responseType = 'arraybuffer';
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if (xobj.status == 200) {
                var arrayBuffer = xobj.response;
                if (arrayBuffer && callback) {
                    callback(arrayBuffer, bid);
                }
            }
            else
                throw (new Error("not found: " + url));
        }
    };
    xobj.send(null);
}
function loadImage(url, iid, callback, errorCallback) {
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
        callback(img, iid);
    };
    img.onerror = function () {
        errorCallback("error in image " + url + "-", iid);
    };
    img.src = url;
}
//# sourceMappingURL=GltfLoader.js.map