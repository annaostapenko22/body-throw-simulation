import colorsRange from "./colors-range.js";

export const setStyle = (domElemRef, key, value) => {
    domElemRef.style[key] = value;
};

export const setStyles = (domElemRef, keyValueObject) => {
    for (let style of Object.entries(keyValueObject)) {
        setStyle(domElemRef, style[0], style[1]);
    }
};

export const setText = (domElemRef, text) => {
    setAttribute(domElemRef, 'innerText', text);
};

export const setAttribute = (domElemRef, attributeName, value) => {
    domElemRef[attributeName] = value;
};

export const addOrRemoveClass = (domElemRef, className, add = true) => {
    const classList = domElemRef.classList;
    if (add) {
        classList.add(className);
    } else {
        classList.remove(className);
    }
};

export const getColorFromColorsRange = (value, maxValue) => {
    const colorsRangeLength = colorsRange.length;
    const rangePart = maxValue / (colorsRangeLength - 1);
    return colorsRange[Math.floor(value / rangePart)];
};