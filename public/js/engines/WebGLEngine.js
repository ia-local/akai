// public/js/WebGLEngine.js
import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from './shaders.js';

export class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl");

        if (!this.gl) {
            console.error("WebGL non supporté !");
            return;
        }

        // État interne des variables (Uniforms)
        this.uniforms = {
            u_time: 0,
            u_resolution: [canvas.width, canvas.height],
            u_knob1: 0.5,
            u_knob2: 0.5,
            u_knob3: 0.5,
            u_knob4: 0.5
        };

        this.init();
    }

    init() {
        // 1. Création du Programme Shader
        const program = this.createProgram(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
        this.gl.useProgram(program);
        this.program = program;

        // 2. Définition de la Géométrie (Un grand rectangle couvrant l'écran)
        // Deux triangles : [-1,-1] à [1,1]
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
        ]), this.gl.STATIC_DRAW);

        // Liaison de l'attribut a_position
        const positionLocation = this.gl.getAttribLocation(program, "a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // 3. Récupération des emplacements des Uniforms (les variables pilotables)
        this.uniformLocations = {
            u_time: this.gl.getUniformLocation(program, "u_time"),
            u_resolution: this.gl.getUniformLocation(program, "u_resolution"),
            u_knob1: this.gl.getUniformLocation(program, "u_knob1"),
            u_knob2: this.gl.getUniformLocation(program, "u_knob2"),
            u_knob3: this.gl.getUniformLocation(program, "u_knob3"),
            u_knob4: this.gl.getUniformLocation(program, "u_knob4"),
        };
    }

    // --- MÉTHODE PRINCIPALE : MISE A JOUR DES VARIABLES ---
    updateUniforms(time, midiState) {
        this.uniforms.u_time = time;
        if (midiState) {
            // Mapping MIDI (0-127) vers GPU (0.0-1.0)
            if (midiState[0] !== undefined) this.uniforms.u_knob1 = midiState[0] / 127;
            if (midiState[1] !== undefined) this.uniforms.u_knob2 = midiState[1] / 127;
            if (midiState[2] !== undefined) this.uniforms.u_knob3 = midiState[2] / 127;
            if (midiState[3] !== undefined) this.uniforms.u_knob4 = midiState[3] / 127;
        }
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.uniforms.u_resolution = [this.canvas.width, this.canvas.height];
    }

    render() {
        // Envoi des valeurs au GPU
        this.gl.uniform1f(this.uniformLocations.u_time, this.uniforms.u_time);
        this.gl.uniform2fv(this.uniformLocations.u_resolution, this.uniforms.u_resolution);
        this.gl.uniform1f(this.uniformLocations.u_knob1, this.uniforms.u_knob1);
        this.gl.uniform1f(this.uniformLocations.u_knob2, this.uniforms.u_knob2);
        this.gl.uniform1f(this.uniformLocations.u_knob3, this.uniforms.u_knob3);
        this.gl.uniform1f(this.uniformLocations.u_knob4, this.uniforms.u_knob4);

        // Dessin
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    // --- UTILITAIRES DE COMPILATION ---
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Erreur Shader:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vsSource, fsSource) {
        const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Erreur Program:", this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
}