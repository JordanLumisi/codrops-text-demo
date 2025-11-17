import Commons from "./Commons";
import * as THREE from "three";

import fragmentShader from "../../shaders/text/text.frag";
import vertexShader from "../../shaders/text/text.vert";

// @ts-ignore
import { Text } from "troika-three-text";

interface Props {
	scene: THREE.Scene;
	element: HTMLElement;
}
export default class WebGLText {
	private commons: Commons;

	private scene: THREE.Scene;
	private element: HTMLElement;

	private computedStyle: CSSStyleDeclaration;
	private font!: string; // Path to our .ttf font file.
	private bounds!: DOMRect;
	private color!: THREE.Color;
	private material!: THREE.ShaderMaterial;
	private mesh!: Text;

	// We assign the correct font bard on our element's font weight from here
	private weightToFontMap: Record<string, string> = {
		"900": "/fonts/Humane-Black.ttf",
		"800": "/fonts/Humane-ExtraBold.ttf",
		"700": "/fonts/Humane-Bold.ttf",
		"600": "/fonts/Humane-SemiBold.ttf",
		"500": "/fonts/Humane-Medium.ttf",
		"400": "/fonts/Humane-Regular.ttf",
		"300": "/fonts/Humane-Light.ttf",
		"200": "/fonts/Humane-ExtraLight.ttf",
		"100": "/fonts/Humane-Thin.ttf",
	};

	private y: number = 0; // Scroll-adjusted bounds.top
	private isVisible: boolean = true;

	private mouse: { x: number; y: number } = { x: 0.5, y: 0.5 };
	private spotCenter: THREE.Vector2 = new THREE.Vector2(0.5, 0.5);

	constructor({ scene, element }: Props) {
		this.commons = Commons.getInstance();

		this.scene = scene;
		this.element = element;

		this.computedStyle = window.getComputedStyle(this.element); // Saving initial computed style.

		this.createFont();
		this.createColor();
		this.createBounds();
		this.createMaterial();
		this.createMesh();
		this.setStaticValues();

		this.scene.add(this.mesh);

		this.element.style.color = "transparent"; // Setting the DOM Element to invisible, so that only WebGLText remains.

		this.addEventListeners();
	}

	private createFont() {
		this.font = this.weightToFontMap[this.computedStyle.fontWeight] || "/fonts/Humane-Regular.ttf";
	}

	private createBounds() {
		this.bounds = this.element.getBoundingClientRect();
		this.y = this.bounds.top + this.commons.lenis.actualScroll;
	}

	private createColor() {
		this.color = new THREE.Color(this.computedStyle.color);
	}

	private createMaterial() {
		// Allow per-element brand colors via data attributes
		const spotColorAttr = this.element.dataset.spotColor;
		const glowColorAttr = this.element.dataset.glowColor;

		const spotColor = new THREE.Color(spotColorAttr || "#ff6600");
		const glowColor = new THREE.Color(glowColorAttr || "#ffb080");

		this.material = new THREE.ShaderMaterial({
			fragmentShader,
			vertexShader,
			uniforms: {
				uBaseColor: new THREE.Uniform(new THREE.Color(239 / 255, 239 / 255, 239 / 255)),
				uSpotColor: new THREE.Uniform(spotColor),
				uGlowColor: new THREE.Uniform(glowColor),
				uSpotCenter: new THREE.Uniform(new THREE.Vector2(0.5, 0.5)),
				uSpotRadius: new THREE.Uniform(0.02),
				uSpotSoftness: new THREE.Uniform(0.12),
				uBaseAlpha: new THREE.Uniform(0.15),
				uAspect: new THREE.Uniform(this.bounds.width / this.bounds.height),
			},
		});
	}

	private createMesh() {
		this.mesh = new Text();

		this.mesh.text = this.element.innerText; // Always use innerText (not innerHTML or textContent).
		this.mesh.font = this.font;

		this.mesh.anchorX = "0%"; // We set to position it from the left, instead of the center as in traditional ThreeJS/WebGL
		this.mesh.anchorY = "50%";

		this.mesh.material = this.material;
	}

	/**
	 * Sets static values that don't have to be updated on every frame.
	 * This is called at initialization and resize.
	 */
	private setStaticValues() {
		const { fontSize, letterSpacing, lineHeight, whiteSpace, textAlign } = this.computedStyle;

		const fontSizeNum = window.parseFloat(fontSize);

		this.mesh.fontSize = fontSizeNum;

		this.mesh.textAlign = textAlign;

		// Troika defines letter spacing in em's, so we convert to them
		this.mesh.letterSpacing = parseFloat(letterSpacing) / fontSizeNum;

		// Same with line height
		this.mesh.lineHeight = parseFloat(lineHeight) / fontSizeNum;

		// Important to define maxWidth for the mesh, so that our text doesn't overflow
		this.mesh.maxWidth = this.bounds.width;

		this.mesh.whiteSpace = whiteSpace;
	}

	onResize() {
		this.computedStyle = window.getComputedStyle(this.element);
		this.createBounds();
		this.setStaticValues();
		if (this.material?.uniforms?.uAspect) {
			this.material.uniforms.uAspect.value = this.bounds.width / this.bounds.height;
		}
	}

	update() {
		if (this.isVisible) {
			this.mesh.position.y =
				-this.y +
				this.commons.lenis.animatedScroll +
				this.commons.sizes.screen.height / 2 -
				this.bounds.height / 2;

			this.mesh.position.x = this.bounds.left - this.commons.sizes.screen.width / 2;

			const uvX = (this.mouse.x - this.bounds.left) / this.bounds.width;
			const uvY = (this.mouse.y - this.commons.lenis.animatedScroll - this.y) / this.bounds.height;

			// Easing the spotlight center towards the target UV for a smoother motion
			const targetX = uvX;
			const targetY = 1 - uvY;
			const ease = 0.1; // Smaller = slower, smoother
			this.spotCenter.x += (targetX - this.spotCenter.x) * ease;
			this.spotCenter.y += (targetY - this.spotCenter.y) * ease;

			this.material.uniforms.uSpotCenter.value.set(this.spotCenter.x, this.spotCenter.y);
		}
	}

	/**
	 * Inits visibility tracking using motion.
	 */
	private addEventListeners() {
		window.addEventListener("mousemove", (event: MouseEvent) => {
			this.mouse.x = event.clientX;
			this.mouse.y = event.clientY;
		});
	}
}
