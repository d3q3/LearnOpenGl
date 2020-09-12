export class Mouse {
    lastX; lastY;
    mouseDown = false;
    downCallback = null;
    moveCallback = null;
    scrollCallback = null;
    firstMouse: boolean = true;

    constructor() {
        let m = this;

        window.onmousedown = function (event) {
            m.mouseDown = true;
            m.lastX = event.clientX;
            m.lastY = event.clientY;

            if (m.downCallback) m.downCallback(event.clientX, event.clientY, event.which);
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
                let yoffset = m.lastY - event.clientY; // reversed since y-coordinates go from bottom to top

                m.lastX = event.clientX;
                m.lastY = event.clientY;

                m.moveCallback(xoffset, yoffset, event.which);
            }
        };

        window.onwheel = function (event: WheelEvent) {
            if (m.scrollCallback)
                m.scrollCallback(event.deltaY);
        };
    }
}