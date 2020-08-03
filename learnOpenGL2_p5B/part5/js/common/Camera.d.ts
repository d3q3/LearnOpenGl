import { vec3, mat4 } from "../../../math/glmatrix/index.js";
export declare enum CameraMovement {
    FORWARD = 0,
    BACKWARD = 1,
    LEFT = 2,
    RIGHT = 3
}
export declare class Camera {
    Position: vec3;
    Front: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;
    Yaw: number;
    Pitch: number;
    MovementSpeed: number;
    MouseSensitivity: number;
    Zoom: number;
    constructor(position: vec3, up: vec3, yaw?: number, pitch?: number);
    GetViewMatrix(): mat4;
    ProcessKeyboard(direction: CameraMovement, deltaTime: number): void;
    ProcessMouseMovement(xoffset: number, yoffset: number, constrainPitch?: boolean): void;
    ProcessMouseScroll(y: number): void;
    updateCameraVectors(): void;
}
