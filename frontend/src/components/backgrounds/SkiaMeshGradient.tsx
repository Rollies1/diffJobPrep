import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';
import { BreathingGradient } from './BreathingGradient';

// Mesh gradient shader — 3-point color mesh with noise-based movement
const meshGradientShader = Skia.RuntimeEffect.Make(`
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324864573, 0.366025403784, -0.577350269189, 0.024390243902);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.7928429 - 0.85373472 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  half4 main(vec2 pos) {
    vec2 uv = pos / resolution;
    float t = time * 0.0003;
    
    float n1 = snoise(uv * 2.0 + t);
    float n2 = snoise(uv * 3.0 - t * 0.7);
    float n3 = snoise(uv * 1.5 + t * 1.3);
    
    vec3 c = mix(
      mix(color1, color2, smoothstep(-0.5, 0.5, n1)),
      color3,
      smoothstep(-0.3, 0.3, n2) * 0.6
    );
    
    // Add subtle grain
    float grain = snoise(uv * 500.0 + t * 10.0) * 0.03;
    c += grain;
    
    return half4(c, 1.0);
  }
`);

interface SkiaMeshGradientProps {
  children: React.ReactNode;
}

export const SkiaMeshGradient: React.FC<SkiaMeshGradientProps> = ({
  children,
}) => {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  
  // NOTE: react-native-skia might crash if useClock is called but Skia is missing or improperly linked.
  // The try/catch won't easily catch hook errors, but we can safely conditionally call if meshGradientShader exists.

  // Fallback for mid/low tier or reduced motion or if shader fails to compile
  if (tier !== 'high' || reducedMotion || !meshGradientShader) {
    return <BreathingGradient intensity={tier === 'high' ? 'medium' : 'subtle'}>{children}</BreathingGradient>;
  }

  return <SkiaMeshRenderer theme={theme}>{children}</SkiaMeshRenderer>;
};

const SkiaMeshRenderer: React.FC<{ children: React.ReactNode, theme: any }> = ({ children, theme }) => {
  const clock = useClock();

  const uniforms = useMemo(() => {
    // Dynamically pull colors from theme
    const hexColors = [
      theme.background, 
      theme.isDark ? '#1a1a3e' : '#e2e8f0', 
      theme.surface
    ];

    const c1 = hexToRgb(hexColors[0]);
    const c2 = hexToRgb(hexColors[1]);
    const c3 = hexToRgb(hexColors[2]);
    
    return {
      time: clock,
      resolution: vec(400, 800), // Approximate, updated via layout
      color1: [c1.r / 255, c1.g / 255, c1.b / 255],
      color2: [c2.r / 255, c2.g / 255, c2.b / 255],
      color3: [c3.r / 255, c3.g / 255, c3.b / 255],
    };
  }, [theme, clock]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Fill>
          {meshGradientShader && <Shader source={meshGradientShader} uniforms={uniforms} />}
        </Fill>
      </Canvas>
      {children}
    </View>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
