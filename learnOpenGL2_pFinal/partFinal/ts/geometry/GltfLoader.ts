/**
 * D3Q: The GltfLoader creates a GltfResource object
 */
export class GltfResource {
    modelName: string;
    json;
    buffers;
    images;

    constructor() {
        this.modelName = null;
        this.json = null;
        this.buffers = [];
        this.images = [];
    }
}

/**
 * D3Q: Load a .gltf file using: resource = new GltfLoader().load(uri)
 */
export class GltfLoader {
    baseUri;

    isLoaded;
    buffersRequested;
    buffersLoaded;
    imagesRequested;
    imagesLoaded;

    initLoad() {
        this.isLoaded = false;
        this.buffersRequested = 0;
        this.buffersLoaded = 0;
        this.imagesRequested = 0;
        this.imagesLoaded = 0;
    }

    buffersComplete(resource: GltfResource): boolean {
        return (this.buffersRequested == this.buffersLoaded
        );
    }

    imagesComplete(resource: GltfResource): boolean {
        return (this.imagesRequested == this.imagesLoaded
        );
    }

    complete(resource: GltfResource) {
        return (this.buffersComplete(resource) &&
            (this.imagesComplete(resource)))
    }

    load(uri) {
        return new Promise<GltfResource>((resolve, reject) => {
            this.initLoad();
            var loader = this;
            var gltfResource = new GltfResource();

            gltfResource.modelName = getFileName(uri);

            this.baseUri = getBaseUri(uri);
            let extension = getExtension(uri);

            if (extension == '.gltf') {
                // load json description
                loadJSON(uri, function (response) {
                    //D3Q: Parse JSON string into object
                    gltfResource.json = JSON.parse(response);

                    function isBase64(dataProtocol) {
                        return (/^data:.*,.*$/i.test(dataProtocol))
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
                        if (loader.complete(gltfResource)) resolve(gltfResource);
                    };

                    var loadImageCallback = function (img, iid) {
                        gltfResource.images[iid] = img;
                        loader.imagesLoaded++;
                        if (loader.complete(gltfResource)) resolve(gltfResource);
                    };

                    var errorImageCallback = function (msg, iid) {
                        console.log(msg);
                        loader.imagesLoaded++;
                        reject(msg);
                        //loader._checkComplete(gltfResource);
                    }

                    // load resources: buffers
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
                    // load resources: images
                    if (gltfResource.json.images) {
                        var iid;
                        for (iid in gltfResource.json.images) {
                            if (isBase64(gltfResource.json.images[iid].uri)) {
                                loader.imagesRequested++;
                                loadImage(gltfResource.json.images[iid].uri,
                                    iid, loadImageCallback, errorImageCallback);

                            }
                            else {
                                loader.imagesRequested++;
                                loadImage(loader.baseUri + gltfResource.json.images[iid].uri,
                                    iid, loadImageCallback, errorImageCallback);
                            }
                        }
                    }

                    if (loader.complete(gltfResource)) resolve(gltfResource);
                });
            }
        })
    }
}

//--------------------D3Q: FILE functions-----------------------------
function getBaseUri(uri) {
    var basePath = '';
    var i = uri.lastIndexOf('/');
    if (i !== -1) {
        basePath = uri.substring(0, i + 1);
    }
    return basePath;
}

function getFileName(uri: string) {
    let uriParts = uri.split('/');
    if (uriParts.length >= 1) return uriParts[uriParts.length - 1]; else return uri;
}

function getExtension(uri: string) {
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
            if (xobj.status == 200) { // Status OK; D3Q: number, not string
                //D3Q: this is undefined, not used in callback...
                callback(xobj.responseText, this);
            }
            else throw (new Error("not found: " + uri));
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
            if (xobj.status == 200) { // Status OK; D3Q: number, not string
                var arrayBuffer = xobj.response;
                if (arrayBuffer && callback) {
                    callback(arrayBuffer, bid);
                }
            }
            else throw (new Error("not found: " + url))
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
        errorCallback("error in image " + url + "-", iid)
    }
    img.src = url;
}