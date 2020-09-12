export declare class KeyInput {
    keysDown: any;
    constructor(keys: any);
    registerKeyDown(event: KeyboardEvent): void;
    registerKeyUp(event: KeyboardEvent): void;
    isDown(key: any): boolean;
}
