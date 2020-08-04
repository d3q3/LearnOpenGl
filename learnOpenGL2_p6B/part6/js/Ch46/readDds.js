"use strict";
var DDS_MAGIC = 0x20534444;
var DDSD_CAPS = 0x1, DDSD_HEIGHT = 0x2, DDSD_WIDTH = 0x4, DDSD_PITCH = 0x8, DDSD_PIXELFORMAT = 0x1000, DDSD_MIPMAPCOUNT = 0x20000, DDSD_LINEARSIZE = 0x80000, DDSD_DEPTH = 0x800000;
var DDSCAPS_COMPLEX = 0x8, DDSCAPS_MIPMAP = 0x400000, DDSCAPS_TEXTURE = 0x1000;
var DDSCAPS2_CUBEMAP = 0x200, DDSCAPS2_CUBEMAP_POSITIVEX = 0x400, DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800, DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000, DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000, DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000, DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000, DDSCAPS2_VOLUME = 0x200000;
var DDPF_ALPHAPIXELS = 0x1, DDPF_ALPHA = 0x2, DDPF_FOURCC = 0x4, DDPF_RGB = 0x40, DDPF_YUV = 0x200, DDPF_LUMINANCE = 0x20000;
function fourCCToInt32(value) {
    return value.charCodeAt(0) +
        (value.charCodeAt(1) << 8) +
        (value.charCodeAt(2) << 16) +
        (value.charCodeAt(3) << 24);
}
function int32ToFourCC(value) {
    return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}
var FOURCC_DXT1 = fourCCToInt32("DXT1");
var FOURCC_DXT3 = fourCCToInt32("DXT3");
var FOURCC_DXT5 = fourCCToInt32("DXT5");
var headerLengthInt = 31;
var off_magic = 0;
var off_size = 1;
var off_flags = 2;
var off_height = 3;
var off_width = 4;
var off_mipmapCount = 7;
var off_pfFlags = 20;
var off_pfFourCC = 21;
function dxtToRgb565(src, src16Offset, width, height) {
    var c = new Uint16Array(4);
    var dst = new Uint16Array(width * height);
    var nWords = (width * height) / 4;
    var m = 0;
    var dstI = 0;
    var i = 0;
    var rb0 = 0, g0 = 0, rb1 = 0, g1 = 0;
    var blockWidth = width / 4;
    var blockHeight = height / 4;
    for (var blockY = 0; blockY < blockHeight; blockY++) {
        for (var blockX = 0; blockX < blockWidth; blockX++) {
            i = src16Offset + 4 * (blockY * blockWidth + blockX);
            c[0] = src[i];
            c[1] = src[i + 1];
            rb0 = c[0] & 0xf81f;
            g0 = c[0] & 0x7e0;
            rb1 = c[1] & 0xf81f;
            g1 = c[1] & 0x7e0;
            c[2] = (((5 * rb0 + 3 * rb1) >> 3) & 0xf81f)
                | (((5 * g0 + 3 * g1) >> 3) & 0x7e0);
            c[3] = (((5 * rb1 + 3 * rb0) >> 3) & 0xf81f)
                | (((5 * g1 + 3 * g0) >> 3) & 0x7e0);
            m = src[i + 2];
            dstI = (blockY * 4) * width + blockX * 4;
            dst[dstI] = c[m & 0x3];
            dst[dstI + 1] = c[(m >> 2) & 0x3];
            dst[dstI + 2] = c[(m >> 4) & 0x3];
            dst[dstI + 3] = c[(m >> 6) & 0x3];
            dstI += width;
            dst[dstI] = c[(m >> 8) & 0x3];
            dst[dstI + 1] = c[(m >> 10) & 0x3];
            dst[dstI + 2] = c[(m >> 12) & 0x3];
            dst[dstI + 3] = c[(m >> 14)];
            m = src[i + 3];
            dstI += width;
            dst[dstI] = c[m & 0x3];
            dst[dstI + 1] = c[(m >> 2) & 0x3];
            dst[dstI + 2] = c[(m >> 4) & 0x3];
            dst[dstI + 3] = c[(m >> 6) & 0x3];
            dstI += width;
            dst[dstI] = c[(m >> 8) & 0x3];
            dst[dstI + 1] = c[(m >> 10) & 0x3];
            dst[dstI + 2] = c[(m >> 12) & 0x3];
            dst[dstI + 3] = c[(m >> 14)];
        }
    }
    return dst;
}
function uploadDDSLevels(gl, ext, arrayBuffer, loadMipmaps) {
    var header = new Int32Array(arrayBuffer, 0, headerLengthInt), fourCC, blockBytes, internalFormat, width, height, dataLength, dataOffset, rgb565Data, byteArray, mipmapCount, i;
    if (header[off_magic] != DDS_MAGIC) {
        console.error("Invalid magic number in DDS header");
        return { mipmaps: 0, width: 0, height: 0 };
    }
    if (!(header[off_pfFlags] & DDPF_FOURCC)) {
        console.error("Unsupported format, must contain a FourCC code");
        return { mipmaps: 0, width: 0, height: 0 };
    }
    fourCC = header[off_pfFourCC];
    switch (fourCC) {
        case FOURCC_DXT1:
            blockBytes = 8;
            internalFormat = ext ? ext.COMPRESSED_RGB_S3TC_DXT1_EXT : null;
            break;
        case FOURCC_DXT3:
            blockBytes = 16;
            internalFormat = ext ? ext.COMPRESSED_RGBA_S3TC_DXT3_EXT : null;
            break;
        case FOURCC_DXT5:
            blockBytes = 16;
            internalFormat = ext ? ext.COMPRESSED_RGBA_S3TC_DXT5_EXT : null;
            break;
        default:
            console.error("Unsupported FourCC code:", int32ToFourCC(fourCC));
            return { mipmaps: 0, width: 0, height: 0 };
    }
    mipmapCount = 1;
    if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
        mipmapCount = Math.max(1, header[off_mipmapCount]);
    }
    width = header[off_width];
    height = header[off_height];
    dataOffset = header[off_size] + 4;
    var texWidth = width;
    var texHeight = height;
    if (ext) {
        for (i = 0; i < mipmapCount; ++i) {
            dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
            byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
            gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
            dataOffset += dataLength;
            width *= 0.5;
            height *= 0.5;
        }
    }
    else {
        if (fourCC == FOURCC_DXT1) {
            dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
            byteArray = new Uint16Array(arrayBuffer);
            rgb565Data = dxtToRgb565(byteArray, dataOffset / 2, width, height);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_SHORT_5_6_5, rgb565Data);
            if (loadMipmaps) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        }
        else {
            console.error("No manual decoder for", int32ToFourCC(fourCC), "and no native support");
            return { mipmaps: 0, width: 0, height: 0 };
        }
    }
    return { mipmaps: mipmapCount, width: texWidth, height: texHeight };
}
function loadDDSTextureEx(gl, ext, src, texture, loadMipmaps, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        if (this.status == 200) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            var data = uploadDDSLevels(gl, ext, this.response, loadMipmaps);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, data.mipmaps > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        }
        if (callback) {
            callback(texture, data.width, data.height, data.mipmaps);
        }
    };
    xhr.send(null);
    return texture;
}
export function loadDDSTexture(gl, ext, src, callback) {
    var texture = gl.createTexture();
    loadDDSTextureEx(gl, ext, src, texture, true, callback);
    return texture;
}
//# sourceMappingURL=readDds.js.map