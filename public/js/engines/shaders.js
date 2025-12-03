// public/js/shaders.js

// 1. VERTEX SHADER (GÉOMÉTRIE)
// Son job : Dessiner un carré qui remplit tout le canvas (-1 à +1)
export const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
        // Convertit la position (-1.0 à 1.0) en coordonnées de texture (0.0 à 1.0)
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// 2. FRAGMENT SHADER (COULEUR & EFFETS)
// Son job : Calculer la couleur de chaque pixel en fonction du Temps et du MIDI
export const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;

    // --- VARIABLES ENTRANTES (UNIFORMS) ---
    // Ces variables sont pilotées par le CPU (JavaScript / MIDI)
    uniform float u_time;       // Temps de la Timeline (Séquençage)
    uniform vec2 u_resolution;  // Taille de l'écran
    
    // Contrôleurs MIDI (MPD218 Knobs)
    uniform float u_knob1;      // CC 0 (0.0 à 1.0)
    uniform float u_knob2;      // CC 1
    uniform float u_knob3;      // CC 2
    uniform float u_knob4;      // CC 3

    // Coordonnées reçues du Vertex Shader
    varying vec2 v_uv;

    void main() {
        // Normaliser les coordonnées
        vec2 st = gl_FragCoord.xy / u_resolution.xy;

        // --- ALGORITHME GÉNÉRATIF (Exemple: Plasma) ---
        
        // Couleur de base qui change avec le temps
        float r = 0.5 + 0.5 * sin(u_time + st.x * 10.0 * u_knob1);
        float g = 0.5 + 0.5 * cos(u_time + st.y * 10.0 * u_knob2);
        float b = u_knob3; // Contrôle direct du bleu

        // Effet de scanline (Séquençage visuel)
        float scanline = sin(st.y * 200.0 * u_knob4 + u_time * 10.0);
        
        vec3 color = vec3(r, g, b) + scanline * 0.1;

        gl_FragColor = vec4(color, 1.0);
    }
`;