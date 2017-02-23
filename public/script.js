// enable vibration support
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

// requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var draggableEl = document.querySelector('[data-drag]'),
    magnet = document.querySelector('.magnet-zone');

// create a SpringSystem and a Spring with a bouncy config.
var springSystem = new rebound.SpringSystem(),
    spring = springSystem.createSpring(100, 7.5),
    magnetSpring = springSystem.createSpring(450, 13),
    x = ($('body').width() / 2) - 30,
    y = 10,
    springDestX,
    springDestY,
    magnetX,
    magnetY,
    events = [];

spring.setCurrentValue(1).setAtRest();
magnetSpring.setCurrentValue(1).setAtRest();

function getCenteredCoordinates(el1, el2) {
  var rect1 = el1.getBoundingClientRect(),
      rect2 = el2.getBoundingClientRect(),
      x1 = (rect1.width / 2) + rect1.left,
      y1 = (rect1.height / 2) + rect1.top;
  
  return {
    x: x1 - (rect2.width / 2),
    y: y1 - (rect2.height / 2)
  };
}

// Add a listener to the spring. Every time the physics
// solver updates the Spring's value onSpringUpdate will
// be called.
function onSpringUpdate(spring) {
  // drop the spring when the user has let go
  // otherwise update x/y with springy values
  if (!$(draggableEl).hasClass('edge')) {
    var val = spring.getCurrentValue(),
        coords = getCenteredCoordinates(magnet, draggableEl),
        elRect = draggableEl.getBoundingClientRect();

    x = rebound.MathUtil.mapValueInRange(val, 0, 1, coords.x, springDestX || elRect.left);
    y = rebound.MathUtil.mapValueInRange(val, 0, 1, coords.y, springDestY || elRect.top);
    moveToPos(x, y);
  }
}

spring.addListener({ onSpringUpdate: onSpringUpdate });
magnetSpring.addListener({ onSpringUpdate: onSpringUpdate });

function vibrate(ms) {
    if (navigator.vibrate) {
        // vibration API supported
        navigator.vibrate(ms || 50);
    }
}

// the draw function
function moveToPos(newX, newY) {
  var el = draggableEl;
  
  newX = newX || x;
  newY = newY || y;
  
  // finally apply the x, y to the top, left of the circle
  el.style.transform = 
  el.style.webkitTransform = 
  el.style.MozTransform = 'translate(' + Math.round(newX, 10) + 'px, ' + Math.round(newY, 10) + 'px)';
}

function animate() {
  window.requestAnimationFrame( animate );
  moveToPos();
}

// kick off animate
animate();

function isOverlapping(el1, el2) {
  var rect1 = el1.getBoundingClientRect(),
    rect2 = el2.getBoundingClientRect();

  return !(
      rect1.top > rect2.bottom ||
      rect1.right < rect2.left ||
      rect1.bottom < rect2.top ||
      rect1.left > rect2.right
  );
}

function moveMagnet(x, y) {
  var dist = 12,
      width = $('body').width() / 2,
      height = $('body').height(),
      direction = x > width ? 1 : -1,
      percX = x > width ? (x - width) / width : -(width - x) / width,
      percY = Math.min(1, (height - y) / (height / 2));
  
  magnet.style.marginLeft = Math.round(dist * percX) + 'px';
  magnet.style.marginBottom = Math.round(dist * percY) + 'px';
}

function trackEvent(event) {
  if (events.length > 5) {
    events.pop();
  } 

  events.push(event);
}
var setInSlotToggle = false;
function move(event) {
  var el = draggableEl,
      magnetRect = magnet.getBoundingClientRect(),
      elRect = el.getBoundingClientRect();
  
  newX = this._posOrigin.x + event.pageX - this._touchOrigin.x;
  newY = this._posOrigin.y + event.pageY - this._touchOrigin.y;
  
  //moveMagnet(newX + (elRect.width / 2), newY + (elRect.height / 2));
  
  startMoving();
  
  var touchPos = {
    top: newY,
    right: newX + elRect.width,
    bottom: newY + elRect.height,
    left: newX
  };
  
  overlapping = !(
    touchPos.top > magnetRect.bottom ||
    touchPos.right < magnetRect.left ||
    touchPos.bottom < magnetRect.top ||
    touchPos.left > magnetRect.right
  );
  
  springDestX = newX;
  springDestY = newY;
  
  if (overlapping) {
    console.log('overlapping');
    if(setInSlotToggle === false)
      {
        setInSlotToggle = true;
        console.log('set')
      }
    // center the circle in the magnetic zone
    var mx = (magnetRect.width / 2) + magnetRect.left;
    var my = (magnetRect.height / 2) + magnetRect.top;
    newX = mx - (elRect.width / 2);
    newY = my - (elRect.height / 2);

    if (!$(el).hasClass('overlap')) {
      // set magnetSpring
      magnetSpring.setVelocity(5).setEndValue(0);
      spring.setCurrentValue(0).setAtRest();
      
      vibrate(25);
    }
    
    $(magnet).toggleClass('overlap', true);
    $(el).toggleClass('overlap', true);
    
    // if the spring is still moving then dont set x/y
    if (!springSystem.getIsIdle()) return;
  } else {

    if ($(el).hasClass('overlap')) {
      spring.setEndValue(1);
      magnetSpring.setCurrentValue(1).setAtRest();
    }
    
    $(magnet).removeClass('overlap');
    $(el).removeClass('overlap');
  }
  
  // update x/y values
  x = newX;
  y = newY;
};

$(draggableEl)
  .on('movestart', onTouchStart)
  .on('move', trackEvent)
  .on('move', move)
  .on('moveend', onTouchEnd);

function onTouchStart(event) {
  var rect = this.getBoundingClientRect();
  
  startTouching();
    
  this._touchOrigin = {
    x: event.pageX,
    y: event.pageY
  };
  this._posOrigin = {
    x: rect.left,
    y: rect.top
  };
}

function getVelocity() {
  var event = events[events.length - 1];
  return {
    x: event.velocityX,
    y: event.velocityY
  };
}

function stopTouching() {
  $('body').removeClass('touching');
}

function startTouching() {
  $('body').addClass('touching');
}

function startMoving() {
  //$('body').addClass('moving');
}

function stopMoving() {
  //$('body').removeClass('moving');
  //magnet.style.marginBottom = magnet.style.marginLeft = '0px';
}

function onTouchEnd(event) {
  var el = $(draggableEl),
      velocity = getVelocity();
  
  if (!el.hasClass('overlap')) {    
    flingWithVelocity(velocity);
    stopTouching();
    stopMoving();
  }
}

function distanceOverTime(velocity, ms) {
  return velocity * ms;
}

function decelerate(speed) {
  return speed > 0.01 || speed < -0.01  ? (speed - (speed * .05)) : 0;
}

// simulate gravitational pull
function addGravity(deltaTimeInMs) {
  var gravity = -9.5 / 2000;
  return gravity * deltaTimeInMs;
}

var timer;

function flingWithVelocity(velocity) {
  var ms = 10,
      rect = draggableEl.getBoundingClientRect(),
      fullscreen = $('body').width(),
      halfscreen = fullscreen / 2,
      height = $('body').height() - rect.height - 10,
      width = $('body').width() - rect.width + 10;

  if (x > halfscreen && x < width) {
    velocity.x -= addGravity(ms);
  } else if (x < halfscreen && x > 0) {
    velocity.x += addGravity(ms);
  } else {
    velocity.x = velocity.y = 0;
  }
  
  var newX = x + distanceOverTime(velocity.x, ms),
      newY = y + distanceOverTime(velocity.y, ms);
      
  x = Math.max(-10, Math.min(width, newX));
  y = Math.max(10, Math.min(height, newY));
  
  velocity.x = decelerate(velocity.x);
  velocity.y = decelerate(velocity.y);
  
  // recursively do this until there's no more velocity
  // every N ms
  if (velocity.x || velocity.y) {
    if (timer) clearTimeout(timer);
    
    timer = setTimeout(function() {
      flingWithVelocity(velocity);
    }, ms);
  }
}