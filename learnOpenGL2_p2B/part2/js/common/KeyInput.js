export class KeyInput {
    constructor(keys) {
        document.addEventListener('keydown', this.registerKeyDown.bind(this));
        document.addEventListener('keyup', this.registerKeyUp.bind(this));
        this.keysDown = {};
        Object.keys(keys).forEach((key, index) => {
            this.keysDown[keys[key]] = 0;
        });
    }
    registerKeyDown(event) {
        Object.keys(this.keysDown).forEach((key, index) => {
            if (event.key == key)
                this.keysDown[key] = 1;
        });
    }
    registerKeyUp(event) {
        Object.keys(this.keysDown).forEach((key, index) => {
            if (event.key == key)
                this.keysDown[key] = 0;
        });
    }
    isDown(key) {
        return this.keysDown[key] == 1;
    }
}
//# sourceMappingURL=KeyInput.js.map