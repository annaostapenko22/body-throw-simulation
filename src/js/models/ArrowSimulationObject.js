import SimulationObject from './SimulationObject.js'
import {setStyle} from '../helpers.js'

class ArrowSimulationObject extends SimulationObject {
    constructor(domElemRef, x, y, angle = 45, speed = 111) {
        super(domElemRef, x, y);
        this._children = domElemRef.children;
        this.setInitialAngle(angle);
        this.setInitialSpeed(speed);
    }

    getInitialSpeed() {
        return this._initialSpeed;
    }

    setInitialSpeed(speed) {
        this._initialSpeed = speed;
    };  

    getInitialAngle() {
        return this._initialAngle;
    }

    setInitialAngle(angle) {
        this._initialAngle = angle;
        this.setCurrentAngle(angle);
    }

    getCurrentAngle() {
        return this._currentAngle;
    }

    setCurrentAngle(angle) {
        this._currentAngle = angle;
        super.setStyle('transform', `rotate(${-angle}deg)`);
    }

    setColor(color) {
        for (let child of this._children) {
            if (child.className === 'arrow-change-speed') {
                setStyle(child, 'background', color);
            }
        }
    }
}

export default ArrowSimulationObject;