/**
 * Mouse Tracking with p5.js
 * Dual canvas system: white base + orange masked
 */

let currentPos = { x: 0, y: 0 };

const circleOptions = {
	radius: 160,
	smoothing: 0.1,
};

function setup() {
	let canvas = createCanvas(windowWidth, windowHeight);
	canvas.id("whiteCircle");

	// Initialize position to center
	currentPos.x = width / 2;
	currentPos.y = height / 2;
}

function draw() {
	clear();
	background(33, 33, 57);

	currentPos.x = lerp(currentPos.x, mouseX, circleOptions.smoothing);
	currentPos.y = lerp(currentPos.y, mouseY, circleOptions.smoothing);

	drawWhiteCircle();
}

function drawWhiteCircle() {
	push();

	let gradient = drawingContext.createRadialGradient(
		currentPos.x,
		currentPos.y,
		0,
		currentPos.x,
		currentPos.y,
		circleOptions.radius
	);

	gradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
	gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

	drawingContext.fillStyle = gradient;
	noStroke();
	circle(currentPos.x, currentPos.y, circleOptions.radius * 2);
	pop();
}
