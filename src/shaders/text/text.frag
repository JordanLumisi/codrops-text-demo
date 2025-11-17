uniform vec3 uBaseColor;
uniform vec3 uSpotColor;
uniform vec3 uGlowColor;
uniform vec2 uSpotCenter;
uniform float uSpotRadius;
uniform float uSpotSoftness;
uniform float uBaseAlpha;
uniform float uAspect;

varying vec2 vUv;


void main() {
	// Normalize distance so the spotlight appears circular even on wide text blocks
	vec2 offset = vUv - uSpotCenter;
	offset.x *= uAspect;
	float dist = length(offset);

    float edge0 = uSpotRadius;
    float edge1 = uSpotRadius + uSpotSoftness;
    float t = 1.0 - smoothstep(edge0, edge1, dist);
    
    // Core spot color
    vec3 coreColor = mix(uBaseColor, uSpotColor, t);

    // Glow band outside the main spot (from radius to radius + 2*softness)
    float glowEdge0 = edge1;
    float glowEdge1 = uSpotRadius + 2.0 * uSpotSoftness;
    float glowT = 1.0 - smoothstep(glowEdge0, glowEdge1, dist);

    vec3 glowMixed = mix(coreColor, uGlowColor, glowT);

    vec3 color = glowMixed;
    float alpha = mix(uBaseAlpha, 1.0, max(t, glowT));
    gl_FragColor = vec4(color, alpha);
}
