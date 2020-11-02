import { FREE_FALL_ACCELERATON } from './consts.js';

const square = num => Math.pow(num, 2);

const degreesToRadians = degree => degree * Math.PI / 180; 

/** Formulas for a body thrown at an angle to the horizon **/

// Total time of movement
// t_smax = (u_0 * sin(L) +  √(v_0^2 * sin(L)^2 + 2 * g * h_0)) / g

export const getTotalMovementTime = (initialSpeed, angle, initialHeight = 0) => 
    (initialSpeed * Math.sin(degreesToRadians(angle)) + Math.sqrt(square(initialSpeed) * square(Math.sin(degreesToRadians(angle))) + 2 * FREE_FALL_ACCELERATON * initialHeight)) / FREE_FALL_ACCELERATON;

// Current x position at certain time
// x = u_0 * t * cos(L)

export const getCurrentXPositionInTime = (initialSpeed, angle, time) => 
    initialSpeed * time * Math.cos(degreesToRadians(angle));

// Current y position at certain time
// y = h_0 + (u_0 * t * sin(L)) - (g * t^2) / 2

export const getCurrentYPositionInTime = (initialSpeed, angle, time, initialHeight = 0) => 
    initialHeight + (initialSpeed * time * Math.sin(degreesToRadians(angle))) - (FREE_FALL_ACCELERATON * square(time)) / 2;

// Current y position at certain x position
// y = h_0 + (x * tg(L)) - (g * x^2) / (2 * u_0^2 * cos(L)^2)

export const getCurrentYPositionFromXPosition = (initialSpeed, angle, xPosition, initialHeight = 0) => 
    initialHeight + (xPosition * Math.tan(degreesToRadians(angle))) - (FREE_FALL_ACCELERATON * square(xPosition)) / (2 * square(initialSpeed) * square(Math.cos(degreesToRadians(angle))));

// Total distance 
// S_max = u_0 * t_smax * cos(L)

export const getTotalDistance = (initialSpeed, angle, initialHeight = 0) =>
    initialSpeed * getTotalMovementTime(initialSpeed, angle, initialHeight) * Math.cos(degreesToRadians(angle));

export const getTriangleSideHeightFromAngleAndDiagonal = (angle, diagonalLength) => Math.sin(degreesToRadians(angle)) * diagonalLength;

export const getTriangleSideWidthFromAngleAndDiagonal = (angle, diagonalLength) => Math.cos(degreesToRadians(angle)) * diagonalLength;