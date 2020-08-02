export class Mouse {
    constructor() {
        this.mouseDown = false;
        this.downCallback = null;
        this.moveCallback = null;
        this.scrollCallback = null;
        this.firstMouse = true;
        let m = this;
        window.onmousedown = function (event) {
            m.mouseDown = true;
            m.lastX = event.clientX;
            m.lastY = event.clientY;
            if (m.downCallback)
                m.downCallback(event.clientX, event.clientY, event.which);
        };
        window.onmouseup = function (event) {
            m.mouseDown = false;
        };
        window.onmousemove = function (event) {
            if (!m.mouseDown) {
                return;
            }
            if (m.moveCallback) {
                let xoffset = event.clientX - m.lastX;
                let yoffset = m.lastY - event.clientY;
                m.lastX = event.clientX;
                m.lastY = event.clientY;
                m.moveCallback(xoffset, yoffset, event.which);
            }
        };
        window.onwheel = function (event) {
            if (m.scrollCallback)
                m.scrollCallback(event.deltaY);
        };
    }
}
//# sourceMappingURL=Mouse.js.map