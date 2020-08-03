import { Accessor } from "./VertexObjects.js"
/**
 * The class of the object the loader tries to load from a url
 */
export class GltfResource {
    json;
    buffers;
    images;

    constructor() {
        this.json = null;
        this.buffers = [];
        this.images = [];
    }
}

export class GltfLoader {
    baseUri;

    isLoaded;
    buffersRequested;
    buffersLoaded;

    initLoad() {
        this.isLoaded = false;
        this.buffersRequested = 0;
        this.buffersLoaded = 0;
    }

    buffersComplete(resource: GltfResource): boolean {
        return (this.buffersRequested == this.buffersLoaded
        );
    }

    load(uri) {
        return new Promise((resolve, reject) => {
            this.initLoad();
            var loader = this;
            var gltfResource = new GltfResource();

            this.baseUri = getBaseUri(uri);
            let extension = getExtension(uri);

            if (extension == '.gltf') {
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
                        if (loader.buffersComplete(gltfResource)) resolve(gltfResource);
                    };

                    // Launch loading resources task: buffers, etc.
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

                    if (loader.buffersComplete(gltfResource)) resolve(gltfResource);
                });
            }
        })
    }
}

// TODO: get from gl context
var ComponentType2ByteSize = {
    5120: 1, // BYTE
    5121: 1, // UNSIGNED_BYTE
    5122: 2, // SHORT
    5123: 2, // UNSIGNED_SHORT
    5126: 4  // FLOAT
};

var Type2NumOfComponent = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};


// ------ Scope limited private util functions---------------


// for animation use
//D3Q: at the moment olny used in _getAccessorData...
//D3Q: renamed buffer to bufferViewData
function _arrayBuffer2TypedArray(bufferViewData, byteOffset, countOfComponentType, componentType) {
    switch (componentType) {
        // @todo: finish
        case 5122: return new Int16Array(bufferViewData, byteOffset, countOfComponentType);
        case 5123: return new Uint16Array(bufferViewData, byteOffset, countOfComponentType);
        case 5124: return new Int32Array(bufferViewData, byteOffset, countOfComponentType);
        case 5125: return new Uint32Array(bufferViewData, byteOffset, countOfComponentType);
        case 5126: return new Float32Array(bufferViewData, byteOffset, countOfComponentType);
        default: return null;
    }
}

// function _getAccessorData(accessor: Accessor) {
//     return _arrayBuffer2TypedArray(
//         accessor.bufferView.data,
//         accessor.byteOffset,
//         accessor.count * Type2NumOfComponent[accessor.type],
//         accessor.componentType
//     );
// }

//--------------------FILE functions-----------------------------
function getBaseUri(uri) {
    var basePath = '';
    var i = uri.lastIndexOf('/');
    if (i !== -1) {
        basePath = uri.substring(0, i + 1);
    }
    return basePath;
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
