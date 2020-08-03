// const GLFW_PRESS = true;
// let GLFW_KEY_W = false;
// let GLFW_KEY_S = false;
// let GLFW_KEY_A = false;
// let GLFW_KEY_D = false;

export class KeyInput {
    keysDown;
    /**
     * 
     * @param keys keys-object containing the keyboard key-values to follow
     */
    constructor(keys) {
        //let k = this;
        document.addEventListener('keydown', this.registerKeyDown.bind(this));
        document.addEventListener('keyup', this.registerKeyUp.bind(this));

        this.keysDown = {};
        Object.keys(keys).forEach((key, index) => {
            this.keysDown[keys[key]] = 0;
        });
    }

    registerKeyDown(event: KeyboardEvent) {
        Object.keys(this.keysDown).forEach((key, index) => {
            if (event.key == key) this.keysDown[key] = 1;
            // key: the name of the object key
            // index: the ordinal position of the key within the object 
        });
        // if (event.key == 'W' || event.key == 'w') GLFW_KEY_W = true;
        // if (event.key == 'S' || event.key == 's') GLFW_KEY_S = true;
        // if (event.key == 'A' || event.key == 'a') GLFW_KEY_A = true;
        // if (event.key == 'D' || event.key == 'd') GLFW_KEY_D = true;
    }

    registerKeyUp(event: KeyboardEvent) {
        Object.keys(this.keysDown).forEach((key, index) => {
            if (event.key == key) this.keysDown[key] = 0;
            // key: the name of the object key
            // index: the ordinal position of the key within the object 
        });
        // if (event.key == 'W' || event.key == 'w') GLFW_KEY_W = false;
        // if (event.key == 'S' || event.key == 's') GLFW_KEY_S = false;
        // if (event.key == 'A' || event.key == 'a') GLFW_KEY_A = false;
        // if (event.key == 'D' || event.key == 'd') GLFW_KEY_D = false;
    }

    isDown(key): boolean {
        return this.keysDown[key] == 1;
    }
}