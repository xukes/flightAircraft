export class LightningShader {
    private static readonly vertexShader = `
        attribute vec2 aPosition;
        attribute vec2 aTexCoord;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;
        uniform vec2 uResolution;

        varying vec2 vTexCoord;
        varying vec2 vPosition;

        void main() {
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 0.0, 1.0);
            vTexCoord = aTexCoord;
            vPosition = (uModelMatrix * vec4(aPosition, 0.0, 1.0)).xy;
        }
    `;

    private static readonly fragmentShader = `
        precision mediump float;

        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uStartPoint;
        uniform vec2 uEndPoint;
        uniform float uThickness;

        varying vec2 vTexCoord;
        varying vec2 vPosition;

        // Noise function for lightning randomness
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Calculate distance to line segment
        float distanceToLine(vec2 p, vec2 a, vec2 b) {
            vec2 pa = p - a;
            vec2 ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h);
        }

        // Generate zigzag lightning pattern
        float lightningPattern(vec2 p, vec2 start, vec2 end, float thickness) {
            vec2 direction = normalize(end - start);
            vec2 perpendicular = vec2(-direction.y, direction.x);

            float distance = length(end - start);
            int segments = int(distance / 30.0) + 2;

            float minDist = 9999.0;

            // Generate zigzag points
            for (int i = 0; i <= 20; i++) {
                if (i > segments) break;

                float t = float(i) / float(segments);
                vec2 point = start + (end - start) * t;

                // Add perpendicular offset for zigzag (except start and end)
                if (i > 0 && i < segments) {
                    float offset = (noise(vec2(t * 10.0, uTime)) - 0.5) * 40.0;
                    point += perpendicular * offset;
                }

                // Calculate distance to this segment
                vec2 nextPoint = start + (end - start) * min(float(i + 1) / float(segments), 1.0);
                if (i < segments) {
                    float nextT = float(i + 1) / float(segments);
                    nextPoint = start + (end - start) * nextT;
                    if (i < segments) {
                        float nextOffset = (noise(vec2(nextT * 10.0, uTime)) - 0.5) * 40.0;
                        nextPoint += perpendicular * nextOffset;
                    }
                }

                float dist = distanceToLine(p, point, nextPoint);
                minDist = min(minDist, dist);
            }

            // Create core and glow
            float core = 1.0 - smoothstep(0.0, thickness, minDist);
            float glow = 1.0 - smoothstep(thickness, thickness * 3.0, minDist);

            return core * 1.0 + glow * 0.3;
        }

        void main() {
            vec2 texel = texture2D(uMainSampler, vTexCoord).rgb;

            // Calculate lightning pattern
            float lightning = lightningPattern(vPosition, uStartPoint, uEndPoint, uThickness);

            if (lightning <= 0.0) {
                discard;
            }

            // Add flicker effect
            float flicker = 0.8 + 0.2 * sin(uTime * 20.0) * noise(vTexCoord * 5.0 + uTime);
            lightning *= flicker * uIntensity;

            // Apply color with energy effect
            vec3 finalColor = uColor * lightning;

            // Add electric blue tint at edges
            float edgeEffect = 1.0 - lightning;
            finalColor = mix(finalColor, vec3(0.3, 0.6, 1.0), edgeEffect * 0.3);

            gl_FragColor = vec4(finalColor, lightning);
        }
    `;

    static createShaderConfig(color: number, startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, thickness: number = 6) {
        return {
            fragShader: this.fragmentShader,
            vertShader: this.vertexShader,
            uniforms: {
                uResolution: { type: '2f', value: [800, 600] },
                uColor: {
                    type: '3f',
                    value: [
                        ((color >> 16) & 0xFF) / 255,
                        ((color >> 8) & 0xFF) / 255,
                        (color & 0xFF) / 255
                    ]
                },
                uTime: { type: '1f', value: 0 },
                uIntensity: { type: '1f', value: 1 },
                uStartPoint: { type: '2f', value: [startPoint.x, startPoint.y] },
                uEndPoint: { type: '2f', value: [endPoint.x, endPoint.y] },
                uThickness: { type: '1f', value: thickness }
            }
        };
    }
}