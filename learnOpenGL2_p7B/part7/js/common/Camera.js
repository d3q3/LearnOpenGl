import { glMatrix, vec3, mat4 } from "../../../math/glmatrix/index.js";
export var CameraMovement;
(function (CameraMovement) {
    CameraMovement[CameraMovement["FORWARD"] = 0] = "FORWARD";
    CameraMovement[CameraMovement["BACKWARD"] = 1] = "BACKWARD";
    CameraMovement[CameraMovement["LEFT"] = 2] = "LEFT";
    CameraMovement[CameraMovement["RIGHT"] = 3] = "RIGHT";
})(CameraMovement || (CameraMovement = {}));
;
const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 0.00025;
const SENSITIVITY = 0.1;
const ZOOM = 45.0;
const ZOOMDIFFERENCE = 1;
export class Camera {
    constructor(position, up, yaw = YAW, pitch = PITCH) {
        this.Front = vec3.fromValues(0.0, 0.0, -1.0);
        this.MovementSpeed = SPEED;
        this.MouseSensitivity = SENSITIVITY;
        this.Zoom = ZOOM;
        this.Position = position;
        this.WorldUp = up;
        this.Yaw = yaw;
        this.Pitch = pitch;
        this.updateCameraVectors();
    }
    GetViewMatrix() {
        let out = mat4.create();
        mat4.lookAt(out, this.Position, vec3.add(vec3.create(), this.Position, this.Front), this.Up);
        return out;
    }
    ProcessKeyboard(direction, deltaTime) {
        let velocity = this.MovementSpeed * deltaTime;
        if (direction == CameraMovement.FORWARD)
            vec3.add(this.Position, this.Position, vec3.scale(vec3.create(), this.Front, velocity));
        if (direction == CameraMovement.BACKWARD)
            vec3.subtract(this.Position, this.Position, vec3.scale(vec3.create(), this.Front, velocity));
        if (direction == CameraMovement.LEFT)
            vec3.subtract(this.Position, this.Position, vec3.scale(vec3.create(), this.Right, velocity));
        if (direction == CameraMovement.RIGHT)
            vec3.add(this.Position, this.Position, vec3.scale(vec3.create(), this.Right, velocity));
    }
    ProcessMouseMovement(xoffset, yoffset, constrainPitch = true) {
        xoffset *= this.MouseSensitivity;
        yoffset *= this.MouseSensitivity;
        this.Yaw += xoffset;
        this.Pitch += yoffset;
        if (constrainPitch) {
            if (this.Pitch > 89.0)
                this.Pitch = 89.0;
            if (this.Pitch < -89.0)
                this.Pitch = -89.0;
        }
        this.updateCameraVectors();
    }
    ProcessMouseScroll(y) {
        let yoffset;
        if (y > 0)
            yoffset = ZOOMDIFFERENCE;
        else
            yoffset = -ZOOMDIFFERENCE;
        if (this.Zoom >= 1.0 && this.Zoom <= 45.0)
            this.Zoom -= yoffset;
        if (this.Zoom <= 1.0)
            this.Zoom = 1.0;
        if (this.Zoom >= 45.0)
            this.Zoom = 45.0;
    }
    updateCameraVectors() {
        let front = vec3.fromValues(Math.cos(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch)), Math.sin(glMatrix.toRadian(this.Pitch)), Math.sin(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch)));
        vec3.normalize(this.Front, front);
        this.Right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.Front, this.WorldUp));
        this.Up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.Right, this.Front));
    }
}
;
//# sourceMappingURL=Camera.js.map