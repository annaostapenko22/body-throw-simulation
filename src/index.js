import './css/style.css';
import {
  getCurrentXPositionInTime,
  getCurrentYPositionInTime,
  getTotalDistance,
  getTotalMovementTime,
  getTriangleSideHeightFromAngleAndDiagonal
} from './js/formulas.js';
import { MILLISECONDS_IN_SECOND } from './js/consts.js';
import SimulationObject from './js/models/SimulationObject.js';
import ArrowSimulationObject from './js/models/ArrowSimulationObject.js'
import Notificator from './js/models/Notificator.js';
import { getColorFromColorsRange, setAttribute, setStyle, setText } from './js/helpers.js';
import NotificationMessages from './js/enums/NotificationMessages.js';

/** References to controlled DOM elements **/
const screenElem = document.getElementById('screen');
const mapElem = document.getElementById('map');
const arrowElem = document.getElementById('arrow');
const arrowDragPointElem = document.querySelector('.arrow-drag-point');
const arrowChangeAngleElem = document.querySelector('.arrow-change-angle');
const arrowChangeSpeedElem = document.querySelector('.arrow-change-speed');
const startButtonElem = document.getElementById('start-button');
const pauseButtonElem = document.getElementById('pause-button');
const simulationSpeedSelectElem = document.getElementById('simulation-speed-select');
const distanceElem = document.querySelector('.distance');
const heightElem = document.querySelector('.height');
const angleElem = document.querySelector('.angle');
const initialSpeedElem = document.querySelector('.speed');
const initialSpeedColorElem = document.querySelector('.speed-color');
const barrierElem = document.querySelector('.barrier');
const groundElem = document.querySelector('.ground');
const barrierCheckboxElem = document.getElementById('barrier-checkbox');
const bounceCheckboxElem = document.getElementById('bounce-checkbox');

const INITIAL_ANGLE = 45;
const INITIAL_SPEED = 111;
const MIN_Y = 75; // Level of ground in pixels
const MAX_ANGLE = 90;
const MIN_ANGLE = 0;
const MAX_SPEED = 777;
const MIN_SPEED = 0;
const MIN_ALLOWED_BOUNCE_SPEED = 1; // Minimal allowed bounce speed set because it will never be 0, without other energy parts in conditions 
const MIN_ALLOWED_ANGLE_CHANGING_SPEED = 30; // FOR BOUNCE BEUTY REASONS
const ARROW_LENGTH = 105;
const ARROW_THICKNESS = 5;
const RECOVERY_FACTOR = 0.5;

/** Notifications object */
const notificator = new Notificator('.simulator');
notificator.showNotification(NotificationMessages.HOVER_ARROW, 10);

/** Simulation objects - objects, which are being moved */
const arrow = new ArrowSimulationObject(arrowElem, 0, MIN_Y, INITIAL_ANGLE, INITIAL_SPEED);
const map = new SimulationObject(mapElem, 0, 99600);
const barrier = new SimulationObject(barrierElem, 0, MIN_Y);
const ground = new SimulationObject(groundElem, -100, 0);

/** Modes of movement */
let inPauseMode = false;
let inStartMode = false;
let inBarrierMode = false;
let inBounceMode = true;

/** Initial global values */
const screenHalves = {
  x: screenElem.clientWidth / 2,
  y: (screenElem.clientHeight - MIN_Y) / 2
};
let initialHeight;
let elapsedTime;
let previousCycleTime;
let totalExpectedDistance;
let mouseDownYOffset;
let totalMovementTime;
let angleOneDegreeChangeTime;
let arrowProjectionHeight;
let previousGroundBumpDistance;

const calculateBarrierPosition = () => {
  if (inBarrierMode && totalExpectedDistance >= screenElem.clientWidth) {
    barrier.setPosition(Math.max(totalExpectedDistance / 2, ARROW_LENGTH), MIN_Y);
  } 
};

const calculateGroundPosition = () => {
  if (inBounceMode || totalExpectedDistance < screenElem.clientWidth) {
    ground.setPosition(-100, 0);
  } else {
    if (inBarrierMode && totalExpectedDistance >= screenElem.clientWidth) {
      ground.setPosition(totalExpectedDistance / 2 - 50, MIN_Y - 15);
    }
    if (!inBarrierMode) {
      ground.setPosition(totalExpectedDistance - 10, MIN_Y - 15);
    }
  } 
};

const recalculateDistanceAndTime = (bouncing = false) => {
  totalExpectedDistance = previousGroundBumpDistance + getTotalDistance(arrow.getInitialSpeed(), arrow.getInitialAngle(), initialHeight);
  totalMovementTime = getTotalMovementTime(arrow.getInitialSpeed(), arrow.getInitialAngle(), initialHeight);
  const angleRange = arrow.getInitialAngle() * 2;
  angleOneDegreeChangeTime = totalMovementTime / angleRange;
  arrowProjectionHeight = Math.round(getTriangleSideHeightFromAngleAndDiagonal(arrow.getInitialAngle(), ARROW_LENGTH)) - ARROW_THICKNESS;
  if (!bouncing) {
    calculateGroundPosition();
    calculateBarrierPosition();
  }
};

const setDefaultState = () => {
  initialHeight = 0;
  elapsedTime = 0;
  previousGroundBumpDistance = 0;
  const initialSpeedColor = getColorFromColorsRange(arrow.getInitialSpeed(), MAX_SPEED);
  arrow.setInitialSpeed(INITIAL_SPEED);
  arrow.setInitialAngle(INITIAL_ANGLE);
  arrow.setColor(initialSpeedColor);
  setStyle(initialSpeedColorElem, 'backgroundColor', initialSpeedColor);
  recalculateDistanceAndTime();
  setText(distanceElem, Number(initialHeight).toFixed(2));
  setText(heightElem, Number(0).toFixed(2));
  setText(angleElem, arrow.getInitialAngle());
  setText(initialSpeedElem, arrow.getInitialSpeed());
};

setDefaultState();

const moveMap = (arrowPositionX, arrowPositionY) => {
  const mapPosition = map.getPosition();
  const mapInitialPosition = map.getInitialPosition();
  let newMapPositionX = mapPosition.x;
  let newMapPositionY = mapPosition.y;

  
  if (arrowPositionX > screenHalves.x) {
    newMapPositionX = -arrowPositionX + screenHalves.x;
  }
  
  if (arrowPositionY > screenHalves.y) {
    newMapPositionY = mapInitialPosition.initialY - arrowPositionY + screenHalves.y;
  }

  if (newMapPositionX !== mapPosition.x || newMapPositionY !== mapPosition.y) {
    map.setPosition(newMapPositionX, newMapPositionY);
  }

  // y position of arrow is almost never equal to 0 in calculations, 
  // so we need to set our map into intial y position in case y position of arrow is starting to be less than 0,
  // when the arrow is flying down to the bottom and not to have drilling into ground
  if (arrowPositionY < MIN_Y + arrowProjectionHeight) {
    map.setPosition(newMapPositionX, mapInitialPosition.initialY);
  }
};

const moveArrow = () => {
  if (inStartMode && !inPauseMode) {
    const currentCycleTime = new Date();
    elapsedTime += ((currentCycleTime - previousCycleTime) / MILLISECONDS_IN_SECOND) * Number(simulationSpeedSelectElem.value);
    
    if (arrow.getInitialSpeed() >= MIN_ALLOWED_ANGLE_CHANGING_SPEED) {
      // For reasons of not having blinking arrow angle for small speed
      arrow.setCurrentAngle(arrow.getInitialAngle() - elapsedTime / angleOneDegreeChangeTime);
      // For cases, when arrow is falling
      if (arrow.getCurrentAngle() <= 0) {
        arrowProjectionHeight = Math.max(Math.round(getTriangleSideHeightFromAngleAndDiagonal(Math.abs(arrow.getCurrentAngle()), ARROW_LENGTH)) - ARROW_THICKNESS, 0);
      }
    } else {
      arrow.setCurrentAngle(0);
      arrowProjectionHeight = 0;
    }
    
    let x = previousGroundBumpDistance + getCurrentXPositionInTime(arrow.getInitialSpeed(), arrow.getInitialAngle(), elapsedTime);
    const y = getCurrentYPositionInTime(arrow.getInitialSpeed(), arrow.getInitialAngle(), elapsedTime, initialHeight) + MIN_Y;

    arrow.setPosition(x, y);
    previousCycleTime = currentCycleTime;

    const barrierPositionX = barrier.getPosition().x;
    if (inBarrierMode && x + ARROW_LENGTH > barrierPositionX) {
      x = barrierPositionX - ARROW_LENGTH;
      arrow.setPosition(x, y);
    }

    moveMap(x, y);
    setText(distanceElem, x.toFixed(2));

    let currentHeight; 
    if (x > totalExpectedDistance) {
      currentHeight = y - MIN_Y;
    } else {
      currentHeight = y - MIN_Y - arrowProjectionHeight;
    }
    setText(heightElem, Number(Math.max(currentHeight, 0)).toFixed(2));

    if (arrow.getCurrentAngle() >= 0 && Math.ceil(y) >= MIN_Y || arrow.getCurrentAngle() < 0 && Math.ceil(y) >= MIN_Y + arrowProjectionHeight) {
      requestAnimationFrame(() => {
        moveArrow();
      });
    } else {
      arrow.setInitialSpeed(RECOVERY_FACTOR * arrow.getInitialSpeed());
      if (inBounceMode && arrow.getInitialSpeed() >= MIN_ALLOWED_BOUNCE_SPEED) {
        previousGroundBumpDistance = x;
        elapsedTime = 0;
        initialHeight = 0;
        recalculateDistanceAndTime(true);

        requestAnimationFrame(() => {
          moveArrow();
        });
      } else {
        setStyle(pauseButtonElem, 'display', 'none');
        arrow.setPosition(x, MIN_Y + arrowProjectionHeight);
      }
    }
  }
};

/** HADLING CHANGE OF ARROW INITIAL HEIGHT */
const startArrowDrag = (e) => {
  mouseDownYOffset = e.offsetY;
  arrowDragPointElem.addEventListener('mousemove', dragArrow);
};

const dragArrow = (e) => {
  const { target } = e;
  const parent = target.parentNode.parentNode; // mapElem
  const arrowPosition = arrow.getPosition();
  const newYPosition = arrowPosition.y + mouseDownYOffset - e.offsetY;
  if (
    newYPosition + target.clientHeight <= parent.clientHeight &&
    newYPosition >= MIN_Y
  ) {
    arrow.setPosition(arrowPosition.x, newYPosition);
    moveMap(arrowPosition.x, newYPosition);
    setText(heightElem, Number(newYPosition - MIN_Y).toFixed(2));
    initialHeight = newYPosition - MIN_Y;
    recalculateDistanceAndTime();
  }
};

const stopArrowDrag = () => {
  arrowDragPointElem.removeEventListener('mousemove', dragArrow);
};

arrowDragPointElem.addEventListener('mousedown', startArrowDrag);
arrowDragPointElem.addEventListener('mouseup', stopArrowDrag);
arrowDragPointElem.addEventListener('mouseleave', stopArrowDrag);
/** HADLING CHANGE OF ARROW INITIAL HEIGHT END */



/** HADLING CHANGE OF ARROW INITIAL ANGLE */
const startArrowAngleChange = (e) => {
  mouseDownYOffset = e.offsetY;
  arrowChangeAngleElem.addEventListener('mousemove', changeArrowAngle);
};
 
const changeArrowAngle = (e) => {
  const newAngle = arrow.getCurrentAngle() + mouseDownYOffset - e.offsetY;
  if (newAngle <= MAX_ANGLE && newAngle >= MIN_ANGLE) {
    arrow.setInitialAngle(newAngle);
    setText(angleElem, newAngle);
    recalculateDistanceAndTime();
  } else {
    notificator.showNotification(NotificationMessages.ALLOWED_ANGLE);
  }
};

const stopArrowAngleChange = () => {
  arrowChangeAngleElem.removeEventListener('mousemove', changeArrowAngle);
};

arrowChangeAngleElem.addEventListener('mousedown', startArrowAngleChange);
arrowChangeAngleElem.addEventListener('mouseup', stopArrowAngleChange);
arrowChangeAngleElem.addEventListener('mouseleave', stopArrowAngleChange);
/** HADLING CHANGE OF ARROW INITIAL ANGLE END */



/** HADLING CHANGE OF ARROW INITIAL SPEED */
const startArrowInitialSpeedChange = (e) => {
  mouseDownYOffset = e.offsetY;
  arrowChangeSpeedElem.addEventListener('mousemove', changeArrowInitialSpeed);
};
 
const changeArrowInitialSpeed = (e) => {
  const yDiff = e.offsetY - mouseDownYOffset;
  let newInitialSpeed = arrow.getInitialSpeed();

  if (yDiff < 0) {
    newInitialSpeed = arrow.getInitialSpeed() + Math.abs(yDiff); 
  }

  if (yDiff > 0) {
    newInitialSpeed = arrow.getInitialSpeed() - yDiff;
  }

  if (newInitialSpeed >= MIN_SPEED && newInitialSpeed <= MAX_SPEED) {
    if (newInitialSpeed !== arrow.getInitialSpeed()) {
      const initialSpeedColor = getColorFromColorsRange(arrow.getInitialSpeed(), MAX_SPEED);
      arrow.setInitialSpeed(newInitialSpeed);
      arrow.setColor(initialSpeedColor);
      setStyle(initialSpeedColorElem, 'backgroundColor', initialSpeedColor);
      setText(initialSpeedElem, newInitialSpeed);
      recalculateDistanceAndTime();
    }
  } else {
      notificator.showNotification(NotificationMessages.ALLOWED_SPEED);
  }
};

const stopArrowInitialSpeedChange = () => {
  arrowChangeSpeedElem.removeEventListener('mousemove', changeArrowInitialSpeed);
};

arrowChangeSpeedElem.addEventListener('mousedown', startArrowInitialSpeedChange);
arrowChangeSpeedElem.addEventListener('mouseup', stopArrowInitialSpeedChange);
arrowChangeSpeedElem.addEventListener('mouseleave', stopArrowInitialSpeedChange);
/** HADLING CHANGE OF ARROW INITIAL SPEED END */



/** HANDLING CONTROL PANEL COMMANDS */
const startArrowMove = () => {
  inStartMode = true;
  setText(startButtonElem, 'Reset');
  setStyle(pauseButtonElem, 'display', 'inline');
  setAttribute(barrierCheckboxElem, 'disabled', true);
  setAttribute(bounceCheckboxElem, 'disabled', true);
  arrow.addClass('move');
  previousCycleTime = new Date();
  moveArrow();
};

const resetArroveMove = () => {
  inStartMode = false;
  setText(startButtonElem, 'Start');
  arrow.removeClass('move');
  arrow.resetPosition();
  map.resetPosition();
  setDefaultState();
  setStyle(pauseButtonElem, 'display', 'none');
  setAttribute(barrierCheckboxElem, 'disabled', false);
  setAttribute(bounceCheckboxElem, 'disabled', false);
};

const pauseArrowMove = () => {
  inPauseMode = true;
  setText(pauseButtonElem, 'Continue');
};

const continueArrowMove = () => {
  inPauseMode = false;
  setText(pauseButtonElem, 'Pause');
  startArrowMove();
};

const startOrResetArrowMove = () => {
  inPauseMode = false;
  setText(pauseButtonElem, 'Pause');

  if (inStartMode) {
    resetArroveMove();
  } else {
    startArrowMove();
  }
};

const pauseOrContinueArrowMove = () => {
  if (inPauseMode) {
    continueArrowMove();
  } else {
    pauseArrowMove();
  }
};

startButtonElem.addEventListener('click', startOrResetArrowMove);
pauseButtonElem.addEventListener('click', pauseOrContinueArrowMove);
/** HANDLING CONTROL PANEL COMMANDS END*/

const showOrHideBarrier = (e) => { 
  const { checked } = e.target;

  if (checked) {
    barrier.setStyle('display', 'block');
  } else {
    barrier.setStyle('display', 'none');
  }
  
  inBarrierMode = !inBarrierMode;
  calculateBarrierPosition();
  calculateGroundPosition();
};

const changeBounceMode = () => { 
  inBounceMode = !inBounceMode;
  calculateGroundPosition();
};

barrierCheckboxElem.addEventListener('change', showOrHideBarrier);
bounceCheckboxElem.addEventListener('change', changeBounceMode);

// Disable drag of drag-point, change-angle and change-initialSpeed elements of the arrow
arrowDragPointElem.ondragstart = () => false;
arrowChangeAngleElem.ondragstart = () => false;
arrowChangeSpeedElem.ondragstart = () => false;
