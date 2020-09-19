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
export function loadImage(url, iid, callback, errorCallback) {
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
//# sourceMappingURL=filing.js.map