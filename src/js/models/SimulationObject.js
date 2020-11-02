import { setStyle, addOrRemoveClass } from '../helpers.js'

class SimulationObject {
    constructor(domElemRef, x, y) {
        this._domElemRef = domElemRef;
        this.setInitialPosition(x, y);
    }
    
    getInitialPosition() {
        return {
            initialX: this._initialX,
            initialY: this._initialY
        };
    }

    setInitialPosition(x = 0, y = 0) {
        this._initialX = x;
        this._initialY = y;
        this.setPosition(x, y);
    }

    getPosition() {
        return {
            x: this._x,
            y: this._y
        };
    }
    
    setPosition(x, y) {
        this._x = x;
        this._y = y;
        this.setStyle('left', `${x}px`);
        this.setStyle('bottom', `${y}px`);
    }
    
    resetPosition() {
        this.setPosition(this._initialX, this._initialY);
    }

    setStyle(key, value) {
        setStyle(this._domElemRef, key, value);
    }

    addClass(className) {
        addOrRemoveClass(this._domElemRef, className);
    }

    removeClass(className) {
        addOrRemoveClass(this._domElemRef, className, false);
    }
};

export default SimulationObject;