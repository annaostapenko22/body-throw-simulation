import { MILLISECONDS_IN_SECOND } from '../consts.js';
import { setStyle, setStyles, setText } from '../helpers.js';

class Notificator {
    constructor(insertElementSelector) {
        this._isShownCurrently = false;
        this._currentTimeOutId = null;
        this._createIdentificatorDomElement(document.querySelector(insertElementSelector));
    }

    _createIdentificatorDomElement(parentElemDomRef) {
        this._domElemRef = document.createElement('div');
        this._textChildDomRef = document.createElement('p');
        this._domElemRef.append(this._textChildDomRef);

        const styles = {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: '60px',
            right: '5px',
            width: '220px',
            height: '50px',
            border: '1px solid black',
            borderRadius: '10px',
            backgroundColor: 'white',
            textAlign: 'center',
            opacity: 0,
            transition: 'opacity 1s'
        };
        setStyles(this._domElemRef, styles);

        parentElemDomRef.append(this._domElemRef);
    }

    showNotification(text, timeToHideInSeconds = 5) {
        if (this._isShownCurrently) {
            clearTimeout(this._currentTimeOutId);
        }
        
        this._isShownCurrently = true;
        const milliseconds = timeToHideInSeconds * MILLISECONDS_IN_SECOND;
        setText(this._textChildDomRef, text);
        setStyle(this._domElemRef, 'opacity', 1);

        this._currentTimeOutId = setTimeout(() => {
            this._hideNotifcation();
        }, milliseconds);
    }

    _hideNotifcation() {
        this._isShownCurrently = false;
        setStyle(this._domElemRef, 'opacity', 0);
    }
}

export default Notificator;