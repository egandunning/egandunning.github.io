"use strict";

/*************************************
 * GLOBAL VARIABLES                  *
 *************************************/

var viewDiv = document.getElementById('view');
var canvas = document.getElementById('canvas');
var canvasEL = document.getElementById('effectsLayer');
var canvasUI = document.getElementById('uiLayer');
var startButton = document.getElementById('start_pause');
var disableRightClick = document.getElementById('disableRightClick');
var scoreField = document.getElementById('score');
var highScoreField = document.getElementById('high_score');
var field3 = document.getElementById('field3');
var opacitySlider = document.getElementById('opacity');

// Main canvas
var ctx = canvas.getContext('2d');
var rect = null;

// Effects Layer canvas
var ctxEL = canvasEL.getContext('2d');

// UI Layer canvas
var ctxUI = canvasUI.getContext('2d');

var TWO_PI = Math.PI * 2;

// Animation stuff
var raf;
var rafEL;

// Mouse x and y coords
var mx;
var my;

var move = false;
var isDragging = false;
var laserActive = false;
var explosionDamage = false;
var speed = 5;

var startTime = 0;
var currentTime = 0;
var pauseTime = 0;
var pauseStartTime = 0;
var elapsedTime = 0;

var isRunning = false;
var rocketCount = 0;
var nextLvlUp = 1000;

var frameCounter = 0;

var score = 0;
var highScore = 0;

// Objects in the scene
var dot;
var g1;
var g2;
var Powerup1;
var ghosts;
var powerups;
var points;
var laser;
var rocket;

// Object spawners
var ghostSpawner;
var powerupSpawner;
var pointSpawner;

// Effects
var explode;
var textSlide;

// Debug Flags
var NOSPAWN = false;

/*************************************
 * CANVAS SETUP                      *
 *************************************/

ctx.canvas.width = Math.floor(window.innerWidth * 0.9);
ctx.canvas.height = Math.floor(window.innerHeight * 0.8);
rect = canvas.getBoundingClientRect();

ctxEL.canvas.width = ctx.canvas.width;
ctxEL.canvas.height = ctx.canvas.height;

ctxUI.canvas.width = ctx.canvas.width;
ctxUI.canvas.height = ctx.canvas.height;

/*************************************
 * EFFECTS                           *
 *************************************/

class Particle {
    constructor(x, y, angle, speed, radius) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.speed = speed;
        this.radius = radius;
        this.fill = 'rgb(0, 0, 0)';
        this.startTime = 0;
    }
    
    draw() {
        ctxEL.beginPath();
        ctxEL.arc(this.x, this.y, this.radius, 0, TWO_PI, true);
        ctxEL.closePath();
        ctxEL.fillStyle = this.fill;
        ctxEL.fill();
    }
    
    move(drag, gravity) {
        // Bounce
        if (this.y >= ctxEL.canvas.height) {
            this.vy *= -0.25;
            this.vy -= (this.vy / 2);
            this.startTime = Date.now();
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= drag;
        
        var hangTime = Date.now() - this.startTime;
        this.vy += (gravity * hangTime);
        
        if (explosionDamage) {
            for (var i = 0; i < ghosts.length; i++) {
                if (ghosts[i].visible && circleCollide(this, ghosts[i])) {
                    ghosts[i].visible = false;
                }
            }
        }
    }
}

class Explosion {
    constructor(x, y, duration, numParticles, maxParticleSpeed, maxParticleSize) {
        
        this.x = x;
        this.y = y;
        this.startTime = 0;
        this.duration = duration;
        
        this.red = 255;
        this.green = 255;
        this.blue = 0;
        
        this.drag = 0.95;
        this.gravity = 9.8 / 1000;
        
        // Create array of particle objects
        this.particles = [];
        
        for (var i = 0; i < numParticles; i++) {
            var angle = TWO_PI * Math.random();
            var speed = Math.random() * maxParticleSpeed;
            var radius = Math.random() * maxParticleSize;
            this.particles.push(new Particle(this.x, this.y, angle, speed, radius));
        }
    }
    
    start() {
        this.startTime = Date.now();
        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].startTime = this.startTime;
        }
    }
    
    draw() {        
        ctxEL.clearRect(0, 0, canvas.width, canvas.height);
        var elapsedTime = Date.now() - this.startTime;
        this.red = 255 - (elapsedTime / 5);
        this.green = 255 - (elapsedTime);
        
        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].fill = fillStyleString(this.red, this.green, this.blue);
            this.particles[i].move(this.drag, this.gravity);
            this.particles[i].draw();
        };
    }
}

function drawExplode(x, y, size) {
    if (size == 0) {
        explode = new Explosion(x, y, 300, 50, 30, 2.5);
    } else if (size == 1) {
        explode = new Explosion(x, y, 300, 70, 60, 3.5);
    } else {
        explode = new Explosion(x, y, 3000, 700, 40, 2);
    }
    explode.start();
    rafEL = window.requestAnimationFrame(drawExplodeWorker);
}

function drawExplodeWorker() {
    
    if (explode != null) {
        explode.draw();
    }
    
    if (explode != null && (Date.now() - explode.startTime) < explode.duration) {
        rafEL = window.requestAnimationFrame(drawExplodeWorker);
    } else {
        ctxEL.clearRect(0, 0, ctxEL.canvas.width, ctxEL.canvas.height);
        explode = null;
        explosionDamage = false;
        rafEL = window.cancelAnimationFrame(drawExplodeWorker);
    }
}

/*************************************
 * UI LAYER                          *
 *************************************/

class TextSlide {
    constructor(text, font) {
        this.text = text;
        this.font = font;
        this.x = 0;
        this.y = 0;
        this.textWidth = ctxEL.measureText(this.text).width;
        this.textHeight = 50;
    }
    
    beginSlide(x, y) {
        this.x = x - (this.textWidth / 2);
        this.y = y;
    }
    
    draw() {
        ctxUI.clearRect(0, (ctxEL.canvas.height -  this.textHeight) / 2, ctxEL.canvas.width, this.textHeight);
        ctxUI.font = this.font;
        ctxUI.textAlign = 'end';
        ctxUI.textBaseline = 'middle';
        ctxUI.strokeStyle = 'rgb(0, 0, 0)';
        ctxUI.strokeText(this.text, this.x, this.y);
    }
    
    move() {
        this.x += (Math.pow(this.x - (ctxEL.canvas.width / 2), 2) / 1000) + 3;
    }
}

function drawTextSlide() {
    textSlide.beginSlide(0, ctxEL.canvas.height / 2);
    raf = window.requestAnimationFrame(drawTextSlideWorker);
}

function drawTextSlideWorker() {
    
    textSlide.move();
    textSlide.draw();
    if ((textSlide.x - textSlide.textWidth) < ctxEL.canvas.width) {
        raf = window.requestAnimationFrame(drawTextSlideWorker);
    } else {
        raf = null;
        ctxUI.clearRect(0, (ctxEL.canvas.height -  textSlide.textHeight) / 2, ctxEL.canvas.width, textSlide.textHeight);
        textSlide = null;
    }
}

/*************************************
 * OBJECTS                           *
 *************************************/

class Circle {
    constructor(x, y, speed, radius) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vx = 0;
        this.speed = speed;
        this.acceleration = 0;
        this.radius = radius;
    }
    
    updateVelocity(toX, toY) {
        var deltaX = toX - this.x;
        var deltaY = toY - this.y;

        var distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        var multiplier = this.speed / distance;
        // Prevent "yoyo-ing"
        if (this.speed > distance) {
            this.vx = deltaX * .9;
            this.vy = deltaY * .9;
            return;
        }
        // Normalize velocity
        this.vx = multiplier * deltaX;
        this.vy = multiplier * deltaY;
        // Accelerate
        this.speed += (this.acceleration / 1000);
    }
    
    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Powerup extends Circle {
    constructor(x, y, text, description, fillStyle) {
        super(x, y, 0, 15);
        this.text = text;
        this.description = description;
        this.fillStyle = fillStyle;
        this.duration = 10;
        this.activateTime = -1;
        this.visible = true;
    }
    
    draw() {
        if (this.x < 0) {
            this.x = ctx.canvas.width;
        }
        if (this.y < 0) {
            this.y = ctx.canvas.height;
        }
        if (this.x > ctx.canvas.width) {
            this.x = 0;
        }
        if (this.y > ctx.canvas.height) {
            this.y = 0;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI, true);
        ctx.closePath();
        ctx.fillStyle = this.fillStyle;
        ctx.fill();
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillText(this.text, this.x, this.y);
        
    }
    
    activate() {
        this.activateTime = currentTime;
        dot.speed = 20;
    }
    
    deactivate() {
        this.activateTime = -1;
        dot.speed = speed;
    }
        
}

class Rocket extends Circle {
    constructor(x, y, initialSpeed, acceleration) {
        super(x, y, initialSpeed, 5);
        this.targetX = 0;
        this.targetY = 0;
        this.targetGhost = null;
        this.speed = initialSpeed;
        this.acceleration = acceleration;
        this.snap = 2;
        this.angle = Math.PI / 2;
        this.visible = false;
        this.lockRange = 15;
        this.explodeRadius = 40;
    }
    
    fire(x, y, targetX, targetY) {
        rocketCount--;
        this.visible = true;
        for (var i = 0; i < ghosts.length; i++) {
            if (Math.sqrt(Math.pow(ghosts[i].x - targetX, 2) + Math.pow(ghosts[i].y - targetY, 2)) < ghosts[i].radius + this.lockRange) {
                this.targetGhost = ghosts[i];
                return;
            }
        }
        if ((targetX - x) > 0) { // Traveling right
            this.angle = - Math.PI / 2 + Math.atan((targetY - y) / (targetX - x));
        } else { // Traveling left
            this.angle = Math.PI / 2 + Math.atan((targetY - y) / (targetX - x));
        }
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
    }
    
    track() {
        if (this.targetGhost != null) {
            this.angle = ((this.targetX - this.x) > 0 ? -1 : 1) * Math.PI / 2 + Math.atan((this.targetY - this.y) / (this.targetX - this.x));
            this.targetX = this.targetGhost.x;
            this.targetY = this.targetGhost.y;
        }
        this.acceleration += this.snap;
        super.updateVelocity(this.targetX, this.targetY);
        if (this.vx == 0 && this.vy == 0) {
            this.detonate();
            return;
        }
        super.move();
    }
    
    detonate() {
        explosionDamage = true;
        drawExplode(this.x, this.y, 1);
        this.visible = false;
        this.targetGhost = null;
    }
    
    draw() {
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        // Body
        // -(rktWidth/2), 0, rktWidth, rktLength
        ctx.fillRect(-2, 0, 4, 6);
        // Cone
        // -(rktWidth/4), rktWidth, (rktWidth/2), rktCone
        ctx.fillRect(-1, 4, 2, 3);
        ctx.fill();
        // Fins
        // -(rktWidth/2), finWidth, fin position, finLength
        ctx.fillRect(-2, 1, -1, -4);
        // (rktWidth/2), finWidth, fin position, finLength
        ctx.fillRect(2, 1, 1, -4);
        // -(rktWidth/2), finWidth, one px, one px
        ctx.fillRect(-2, -1, 1, 1);
        // (rktWidth/2) - 1, finWidth, one px, one px
        ctx.fillRect(1, -1, 1, 1);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(-1, -3, 2, 2);
        ctx.fillStyle = 'orange';
        ctx.fillRect(-1, -5, 2, 2);
        ctx.fillStyle = 'red';
        ctx.fillRect(-1, -6, 2, 1);
        ctx.fillRect((Math.random() > 0.5) ? -1 : 0, -8, 1, 1);
        ctx.fillRect((Math.random() > 0.5) ? -1 : 0, -10, 1, 1);
        if (Math.random() > 0.5) {
            ctx.fillRect(-1, -7, 2, 1);
        } else {
            ctx.fillRect(-1, -9, 2, 1);
        }
        ctx.restore();
    }
}

class Laser {
    constructor(x, y, targetX, targetY) {
        this.distance = ctx.canvas.width;
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.stroke = 'rgb(0, 255, 0)';
        this.firing = false;
        this.startTime = 0;
        this.fireDuration = 0.5;
        this.m = 0;
        this.b = 0;
    }
    
    linearEq(x) {
        return (this.m * x) + this.b;
    }
    
    updateTarget(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        
        // y = mx + b
        this.m = (targetY - y) / (targetX - x);
        this.b = y - (this.m * x);
        if (x > targetX) {
            this.targetX = 0;
            this.targetY = this.b;
        } else if (x == targetX) {
            this.targetX = x;
            this.targetY = (this.m * x) + this.b;
        } else {
            this.targetX = ctx.canvas.width;
            this.targetY = (this.m * this.targetX) + this.b;
        }
    }
    
    startFiring() {
        this.firing = true;
        this.startTime = currentTime;
    }
    
    stopFiring() {
        this.firing = false;
    }
    
    draw() {
        if (this.firing && ((currentTime - this.startTime) / 1000) > this.fireDuration) {
            this.stopFiring();
            return;
        }
        
        if (this.firing) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetX, this.targetY);
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }
}

class LaserPowerup extends Powerup {
    constructor(x, y) {
        super(x, y, 'L', 'LASER BEAM', 'rgba(0, 0, 255, 0.5)');
    }
    
    activate() {
        laserActive = true;
        this.activateTime = currentTime;
    }
    
    deactivate() {
        laserActive = false;
        this.activateTime = false;
    }
}

class RocketPowerup extends Powerup {
    constructor(x, y) {
        super(x, y, 'R', 'ROCKET', 'rgba(0, 0, 255, 0.5)');
    }
    
    activate() {
        rocketCount++;
    }
    
    deactivate() {
        this.activateTime = -1;
    }
}
        
        
class HealthPowerup extends Powerup {
    constructor(x, y) {
        super(x, y, '+', '+ HEALTH', 'rgba(0, 0, 255, 0.5)');
    }

    activate() {
        dot.hp++;
    }
    
    deactivate() {
        this.activateTime = -1;
    }
}

class Ghost extends Circle {
    constructor(x, y, ghostSpeed, radius) {
        super(x, y, ghostSpeed, radius);
        this.visible = true;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
    }    
}

class SneakyGhost extends Ghost {
    constructor(x, y, ghostSpeed, radius) {
        super(x, y, ghostSpeed, radius);
        this.isSneaky = false;
        this.startTime = 0;
        this.sneakThreshold = ctx.canvas.width / 6;
        this.noSneakThreshold = ctx.canvas.width / 2;
        this.sneakDuration = 15;
        this.cooldown = 5;
        
        // Determine direction to flank
        this.xMult = 1;
        this.yMult = 1;
        if (Math.random() > 0.5) {
            this.xMult = -1;
        } else {
            this.yMult = -1;
        }
    }
    
    updateVelocity(x, y) {
        // Move toward dot
        super.updateVelocity(x, y);
        
        // If sneaking, try to flank the dot
        if (this.isSneaky) {
            var temp = this.vx;
            this.vx = this.xMult * this.vy;
            this.vy = this.yMult * temp;
        }
        
        var distance = circleDistance(dot, this)
        if (!this.isSneaky && ((currentTime - this.startTime) / 1000) > this.cooldown && distance > this.sneakThreshold && distance < this.noSneakThreshold && insideCanvas(this)) {
            this.startSneaking();
            return;
        }
        
        if (this.isSneaky && (distance - dot.radius - this.radius) < 50) {
            this.stopSneaking();
            return;
        }
        
        if (this.isSneaky && ((currentTime - this.startTime) / 1000) > this.sneakDuration) {
            this.stopSneaking();
            return;
        }
        
        if (this.isSneaky && !insideCanvas(this)) {
            this.stopSneaking();
            return;
        }
    }
    
    startSneaking() {
        this.isSneaky = true;
        this.startTime = currentTime;
    }
    
    stopSneaking() {
        this.isSneaky = false;
        this.startTime = currentTime;
    }
}

class Dot extends Circle {
    constructor(x, y, speed, radius) {
        super(x, y, speed, radius);
        this.hp = 0;
        this.colliding = false;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.fill();
    }
}

class PointCircle extends Circle {
    constructor(x, y, radius, amount) {
        super(x, y, 0, radius);
        this.amount = amount;
        this.visible = true;
        this.vx = 0;
        this.vy = 0;
    }
    
    draw() {
        if (this.x >= ctx.canvas.width || this.x <= 0) {
            this.vx *= -1;
        }
        if (this.y >= ctx.canvas.height || this.y <= 0) {
            this.vy *= -1;
        }
        ctx.fillStyle = 'gold';
        ctx.strokeStyle = 'silver';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    score() {
        this.visible = false;
        score += this.amount;
    }
}

class Spawner {
    constructor(interval) {
        this.interval = interval;
        this.startTime = 0;
    }
    
    init() {
        this.startTime = currentTime;
    }
    
    spawnIfReady(currentTime) {
        if (((currentTime - this.startTime) / 1000) > this.interval) {
            this.startTime = currentTime;
            this.spawn();
        }
    }
    
    spawn() {
        // Dummy method
    }
    
    upgrade() {
        // Dummy method
    }
}

class GhostSpawner extends Spawner {
    constructor() {
        super(5);
        this.maxSpeed = 4.5;
        this.radiusMultiplier = 20;
        this.sneakyGhostChance = 0.2;
        this.spawnRadius = Math.max(ctx.canvas.width, ctx.canvas.height) / 2;
    }
    
    upgrade() {
        this.maxSpeed += 0.25;
        this.interval--;
    }
    
    spawnCoords() {
        var angle = Math.random() * TWO_PI;
        var centerX = ctx.canvas.width / 2;
        var centerY = ctx.canvas.height / 2;
        return {
            x: centerX + (Math.cos(angle) * this.spawnRadius),
            y: centerY + (Math.sin(angle) * this.spawnRadius)
        };
    }
    
    spawn() {
        var coords = this.spawnCoords();
        var speed = Math.random() * this.maxSpeed;
        var radius = Math.ceil(1 + (this.radiusMultiplier - 1) / speed);
        if (Math.random() < this.sneakyGhostChance) {
            ghosts.push(new SneakyGhost(coords.x, coords.y, speed, radius));
        } else {
            ghosts.push(new Ghost(coords.x, coords.y, speed, radius));
        }
    }
}

class PointSpawner extends Spawner {
    constructor() {
        super(3);
        this.amount = 100;
        this.radius = 15;
        this.speed = 2;
    }
    
    upgrade() {
        this.amount *= 2;
        this.speed++;
        if (this.radius >= 5) {
            this.radius--;
        }
    }
    
    spawn() {
        var xCoord = Math.floor(Math.random() * ctx.canvas.width);
        var yCoord = Math.floor(Math.random() * ctx.canvas.height);
        var point = new PointCircle(xCoord, yCoord, this.radius, this.amount);
        point.vx = (Math.random() - 0.5) * this.speed;
        point.vy = (Math.random() - 0.5) * this.speed;
        points.push(point);
    }
}

class PowerupSpawner extends Spawner {
    constructor() {
        super(15);
        this.radius = 10;
        this.speed = 7;
        this.speedProb = .5;
        this.laserProb = .2;
        this.rocketProb = .2;
        this.healthProb = .1;
    }
    
    spawn() {
        var xCoord = Math.floor(Math.random() * ctx.canvas.width);
        var yCoord = Math.floor(Math.random() * ctx.canvas.height);
        
        var powerup;
        var powerupSelection = Math.random();
        
        if (powerupSelection < this.speedProb) {
            powerup = new Powerup(xCoord, yCoord, 'S', 'SPEED BOOST', 'rgba(0, 0, 255, 0.5)');
        } else if ((powerupSelection -= this.speedProb) < this.laserProb) {
            powerup = new LaserPowerup(xCoord, yCoord);
        } else if ((powerupSelection -= this.laserProb) < this.rocketProb) {
            powerup = new RocketPowerup(xCoord, yCoord);
        } else if ((powerupSelection -= this.rocketProb) < this.healthProb) {
            powerup = new HealthPowerup(xCoord, yCoord);
        }
        powerup.vx = (Math.random() - 0.5) * this.speed;
        powerup.vy = (Math.random() - 0.5) * this.speed;
        powerups.push(powerup);
    }
}

/*************************************
 * UTILITY FUNCTIONS                 *
 *************************************/
 
function fillStyleString(red, green, blue, alpha) {
    var fill = 'rgba(' + red + ',' + green + ',' + blue;
    if (alpha >= 0) {
        fill += ',' + alpha;
    }
    fill += ')';
    return fill;
}

function getMouseCoords(e) {
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    move = true;
}

function fillStyleString(red, green, blue, alpha) {
    var fill = 'rgba(' + red + ',' + green + ',' + blue;
    if (alpha >= 0) {
        fill += ',' + alpha;
    }
    fill += ')';
    return fill;
}

function laserIntersectCircle(l, c) {
    
    // Check direction
    if (((l.x - l.targetX) * (l.x - c.x)) < 0 || ((l.y - l.targetY) * (l.y - c.y)) < 0) {
        return false;
    }
    
    // Vertical beam
    if (l.x == l.targetX) {
        return Math.abs(l.x - c.x) <= c.radius;
    }
    // Horizontal beam
    if (l.y == l.targetY) {
        return Math.abs(l.y - c.y) <= c.radius;
    }
    
    var closestPointX = Math.floor((c.x + l.m * c.y - laser.m * laser.b) / (l.m * l.m + 1));
    var closestPointY = l.linearEq(closestPointX);

    var distance = Math.floor(Math.sqrt(Math.pow(closestPointX - c.x, 2) + Math.pow(closestPointY - c.y, 2)));
    return (distance - c.radius) < 0;
}

/**
 * Returns false if a circle is fully outside of the canvas
 */
function insideCanvas(c) {
    var diameter = 2 * c.radius;
    return c.x >= -diameter && c.y >= -diameter && c.x < (ctx.canvas.width + diameter) && c.y < (ctx.canvas.height + diameter);
}

/**
 * Returns the distance between two circle center points
 */
function circleDistance(c1, c2) {
    var deltaX = c2.x - c1.x;
    var deltaY = c2.y - c1.y;
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

/**
 * Returns true if two circles are overlapping.
 */
function circleCollide(c1, c2) {
    
    var deltaX = c2.x - c1.x;
    var deltaY = c2.y - c1.y;
    var radiusSum = c1.radius + c2.radius;
    
    // If circles are far away, return false
    if (deltaX > radiusSum || deltaY > radiusSum) {
        return false;
    }
    
    // Calculate distance between center of each circle
    var distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    
    return distance < (radiusSum)
}

/*************************************
 * MAIN LOOP                         *
 *************************************/

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    currentTime = Date.now() - pauseTime;
    
    elapsedTime = Math.floor((currentTime - startTime) / 1000);
    
    field3.innerText = frameCounter++;
    
    // Calculate points
    for (var i = 0; i < points.length; i++) {
        
        if (points[i].visible) {
            points[i].move();
            points[i].draw();
        }
        
        if (points[i].visible && circleCollide(dot, points[i])) {
            points[i].score();
            points.splice(i, 1);
        }
    }
    
    scoreField.innerText = score;
    
    // Remove deactivated ghosts
    for (var i = ghosts.length - 1; i >= 0; i--) {
        if (!ghosts[i].visible) {
            ghosts.splice(i, 1);
        }
    }
    
    // Calculate ghost collision
    var ghostCollision = false;
    
    for (var i = 0; i < ghosts.length; i++) {
        if (ghosts[i].visible) {
            ghosts[i].updateVelocity(dot.x, dot.y);
            ghosts[i].move();
            ghosts[i].draw();
            if (circleCollide(dot, ghosts[i])) {
                ghostCollision = true;
            }
        }
    }
    
    if (!dot.colliding && ghostCollision) {
        if (dot.hp > 0) {
            drawExplode(dot.x, dot.y, 0);
        }
        dot.colliding = true;
        dot.hp--;
    } else if (dot.colliding && !ghostCollision) {
        dot.colliding = false;
    }
    
    if (dot.hp < 0) {
        drawExplode(dot.x, dot.y);
        stop();
        return;
    }
    
    // Calculate power up collision, effects
    for (var i = 0; i < powerups.length; i++) {
        
        field3.innerText = (powerups[i].activateTime != -1) ? powerups[i].activateTime : 0;
        
        if (powerups[i].visible) {
            powerups[i].move();
            powerups[i].draw();
        }
        
        if (powerups[i].activateTime > -1 && ((currentTime - powerups[i].activateTime) / 1000) > powerups[i].duration) {
            powerups[i].deactivate();
            powerups.splice(i, 1);
            break;
        }
        
        if (powerups[i].visible && circleCollide(dot, powerups[i])) {
            textSlide = new TextSlide(powerups[i].description, 'italic 50px serif');
            drawTextSlide();
            powerups[i].visible = false;
            powerups[i].activate();
        }
    }
    
    // Spawn stuff
    if (!NOSPAWN) {
        ghostSpawner.spawnIfReady(currentTime);
        pointSpawner.spawnIfReady(currentTime);
        powerupSpawner.spawnIfReady(currentTime);
    }
    
    if (score >= nextLvlUp) {
        ghostSpawner.upgrade();
        pointSpawner.upgrade();
        powerupSpawner.upgrade();
        nextLvlUp *= 2;
        textSlide = new TextSlide('LEVEL UP', 'italic bold 50px serif');
        drawTextSlide();
    }
    
    // Move & draw dot
    var xMove = Math.abs(dot.x - mx) > 0.1;
    var yMove = Math.abs(dot.y - my) > 0.1;
    
    if (!move) {
        dot.draw();
    } else if (xMove || yMove) {
        dot.updateVelocity(mx, my);
        dot.move();
    } else {
        move = false;
    }
    
    dot.draw();
    
    // Draw laser
    if (laser.firing) {
        laser.updateTarget(dot.x, dot.y, laser.targetX, laser.targetY);
        laser.draw();
        ghosts.forEach(function(g, i, ghosts) {
            if (laserIntersectCircle(laser, g)) {
                drawExplode(g.x, g.y, 0);
                g.visible = false;
            }
        });
    }
    
    // Draw rocket
    if (rocket != null && rocket.visible) {
        rocket.track();
        rocket.draw();
        ghosts.forEach(function(g) {
            if (circleCollide(rocket, g)) {
                //drawExplode(g.x, g.y, 1);
                g.visible = false;
                rocket.detonate();
            }
        });
    }
    
    // Draw next frame
    raf = window.requestAnimationFrame(draw);
}


/*************************************
 * SETUP & CONTROL                   *
 *************************************/

function setupScene() {
    dot = new Dot(0, 0, 5, 5);
    g1 = new SneakyGhost(ctx.canvas.width, ctx.canvas.height, 4, 10);
    g2 = new SneakyGhost(ctx.canvas.width, 0, 2, 40);
    dot.draw();
    ghosts = [g1, g2];
    
    laser = new Laser(0, 0, 0, 0);
    rocket = null;
    
    //var powerup1 = new Powerup(100, 50, 'S', 'SPEED BOOST', 'rgba(0, 0, 255, 0.5)');
    /*var powerup1 = new LaserPowerup(50, 50);
    powerup1.vx = 4;
    powerup1.vy = 4;*/
    powerups = [];
    
    /*var point1 = new PointCircle(500, 500, 15, 100);
    point1.vx = -1;
    point1.vy = 3;*/
    points = [];
    
    ghostSpawner = new GhostSpawner();
    ghostSpawner.init();
    
    pointSpawner = new PointSpawner();
    pointSpawner.init();
    
    powerupSpawner = new PowerupSpawner();
    powerupSpawner.init();
}

function start() {
    
    // Clean up
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctxEL.clearRect(0, 0, ctxEL.canvas.width, ctxEL.canvas.height);
    ctxUI.clearRect(0, 0, ctxUI.canvas.width, ctxUI.canvas.height);
    
    startButton.innerText = 'Pause';
    nextLvlUp = 1000;
    raf = window.requestAnimationFrame(draw);
    if (pauseStartTime == 0) {
        setupScene();
        startTime = Date.now();
    } else {
        pauseTime += Date.now() - pauseStartTime;
        pauseStartTime = 0;
    }
    isRunning = true;
}

function pause() {
    startButton.innerText = 'Start';
    window.cancelAnimationFrame(raf);
    pauseStartTime = Date.now();
    isRunning = false;
}

function stop() {
    startButton.innerText = 'Start';
    laser.stopFiring();
    window.cancelAnimationFrame(raf);
    isRunning = false;
    
    pauseStartTime = 0;
    
    if (score > highScore) {
        highScore = score;
        textSlide = new TextSlide('NEW HIGH SCORE', 'italic bold 50px serif');
        drawTextSlide();
        highScoreField.innerText = highScore;
    }
    
    score = 0;
}

/*************************************
 * EVENT LISTENERS                   *
 *************************************/

startButton.addEventListener('click', function(e) {
    if (!isRunning) {
        start();
    } else if (isRunning) {
        pause();
    }
});

viewDiv.addEventListener('mousedown', function(e) {
    switch (e.button) {
        case 0:
            getMouseCoords(e);
            break;
        case 2:
            if (laserActive) {
                laser.startFiring();
            } else if (rocketCount > 0) {
                rocket = new Rocket(dot.x, dot.y, 1, 40);
                rocket.fire(dot.x, dot.y, e.clientX - rect.left, e.clientY - rect.top)
            }
            break;
        default:
            // do nothing
    }
    
    isDragging = true;
});

/**
 * Disable right click menu when the checkbox is clicked.
 */
viewDiv.oncontextmenu = function(e) {
    if (disableRightClick.checked) {
        e.preventDefault();
    }
}

/**
 * Only allow drag to move with primary mouse button.
 */
laser = new Laser(0, 0, 0, 0); // avoid type error
viewDiv.addEventListener('mousemove', function(e) {
    if (e.button == 0 && e.buttons != 2 && isDragging) {
        getMouseCoords(e);
    }
    
    if (laser.firing) {
        laser.targetX = e.clientX - rect.left;
        laser.targetY = e.clientY - rect.top;
    }
});

/**
 * Mouse drag has stopped.
 */
viewDiv.addEventListener('mouseup', function(e) {
    isDragging = false;
});


opacitySlider.onchange = function() {
    ctxUI.globalAlpha = opacitySlider.value;
}