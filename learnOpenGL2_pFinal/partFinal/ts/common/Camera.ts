/**
 * D3Q: translation of Camera class of Chapter 10 learnOpenGL book from C -> typescript.
 * major differences: the glMatrix lib is used; only one constructor is translated.
 *  
 * The Camera holds the View matrix but not the projection matrix. However, the Zoom, used 
 * in the projection, is updated in ProcessMouseScroll. This Camera does no roll, only pitch 
 * and yaw.
 */

import { glMatrix, vec3, mat4 } from "../../../math/glmatrix/index.js";

// Defines several possible options for camera movement. Used as abstraction to stay away from window-system specific input methods
export enum CameraMovement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT
};

// Default camera values
const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 0.00025;
const SENSITIVITY = 0.1;
const ZOOM = 45.0;
const ZOOMDIFFERENCE = 1;


// camera class that processes input and calculates the corresponding Euler Angles, Vectors and Matrices for use in OpenGL
export class Camera {

    // Camera Attributes
    Position: vec3;
    Front: vec3;
    Up: vec3;
    Right: vec3;
    WorldUp: vec3;
    // Euler Angles
    Yaw: number;
    Pitch: number;
    // Camera options
    MovementSpeed: number;
    MouseSensitivity: number;
    Zoom: number;

    // Constructor with vectors
    constructor(position: vec3, up: vec3, yaw: number = YAW, pitch: number = PITCH) {
        this.Front = vec3.fromValues(0.0, 0.0, -1.0);
        this.MovementSpeed = SPEED;
        this.MouseSensitivity = SENSITIVITY
        this.Zoom = ZOOM;

        this.Position = position;
        this.WorldUp = up;
        this.Yaw = yaw;
        this.Pitch = pitch;
        this.updateCameraVectors();
    }


    // Returns the view matrix calculated using Euler Angles and the LookAt Matrix
    GetViewMatrix(): mat4 {
        let out: mat4 = mat4.create();
        mat4.lookAt(out, this.Position, vec3.add(vec3.create(), this.Position, this.Front), this.Up);
        return out;
    }

    // Processes input received from any keyboard-like input system. Accepts input parameter in the form of camera defined ENUM (to abstract it from windowing systems)
    ProcessKeyboard(direction: CameraMovement, deltaTime: number) {
        let velocity: number = this.MovementSpeed * deltaTime;
        if (direction == CameraMovement.FORWARD)
            vec3.add(this.Position, this.Position, vec3.scale(vec3.create(), this.Front, velocity));
        if (direction == CameraMovement.BACKWARD)
            vec3.subtract(this.Position, this.Position, vec3.scale(vec3.create(), this.Front, velocity));
        if (direction == CameraMovement.LEFT)
            vec3.subtract(this.Position, this.Position, vec3.scale(vec3.create(), this.Right, velocity));
        if (direction == CameraMovement.RIGHT)
            vec3.add(this.Position, this.Position, vec3.scale(vec3.create(), this.Right, velocity));
    }

    // Processes input received from a mouse input system. Expects the offset value in both the x and y direction.
    ProcessMouseMovement(xoffset: number, yoffset: number, constrainPitch: boolean = true) {
        xoffset *= this.MouseSensitivity;
        yoffset *= this.MouseSensitivity;

        this.Yaw += xoffset;
        this.Pitch += yoffset;

        // Make sure that when pitch is out of bounds, screen doesn't get flipped
        if (constrainPitch) {
            if (this.Pitch > 89.0)
                this.Pitch = 89.0;
            if (this.Pitch < -89.0)
                this.Pitch = -89.0;
        }

        // Update Front, Right and Up Vectors using the updated Euler angles
        this.updateCameraVectors();
    }

    // Processes input received from a mouse scroll-wheel event. Only requires input on the vertical wheel-axis
    ProcessMouseScroll(y: number) {
        let yoffset;
        if (y > 0) yoffset = ZOOMDIFFERENCE; else yoffset = - ZOOMDIFFERENCE;
        if (this.Zoom >= 1.0 && this.Zoom <= 45.0)
            this.Zoom -= yoffset;
        if (this.Zoom <= 1.0)
            this.Zoom = 1.0;
        if (this.Zoom >= 45.0)
            this.Zoom = 45.0;
    }

    // Calculates the front vector from the Camera's (updated) Euler Angles
    updateCameraVectors() {
        // Calculate the new Front vector
        let front = vec3.fromValues(
            Math.cos(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch)),
            Math.sin(glMatrix.toRadian(this.Pitch)),
            Math.sin(glMatrix.toRadian(this.Yaw)) * Math.cos(glMatrix.toRadian(this.Pitch))
        );
        vec3.normalize(this.Front, front);
        // Also re-calculate the Right and Up vector
        this.Right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.Front, this.WorldUp));  // Normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
        this.Up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.Right, this.Front));
    }
};
