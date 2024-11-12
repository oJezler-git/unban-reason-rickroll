let gl;
let shaderProgram;
let vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

let fragmentShaderSource = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    
    uniform float u_time;
    
    // Complex number multiplication
    vec2 cmult(vec2 a, vec2 b) {
        return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }
    
    // Complex number power
    vec2 cpow(vec2 z, int n) {
        vec2 result = z;
        for(int i = 0; i < 20; i++) { // Using fixed iteration as GLSL doesn't support dynamic loops
            if(i >= n-1) break;
            result = cmult(result, z);
        }
        return result;
    }
    
    float julia(vec2 z, vec2 c, int max_iter) {
        float smooth_iter = 0.0;
        for(int i = 0; i < 2000; i++) { // Increased maximum iterations
            if(i >= max_iter) break;
            
            // Multiple Julia set iterations
            z = cmult(cpow(z, 3), vec2(cos(u_time * 0.1), sin(u_time * 0.1))) + c;
            
            // Additional computational load with trigonometric functions
            z += 0.1 * vec2(sin(z.x * 5.0 + u_time), cos(z.y * 5.0 + u_time));
            
            if(length(z) > 2.0) {
                // Smooth coloring calculation
                smooth_iter = float(i) - log2(log2(dot(z,z))) + 4.0;
                break;
            }
        }
        return smooth_iter;
    }
    
    void main() {
        vec2 uv = (gl_FragCoord.xy - vec2(320.0, 240.0)) / 320.0;
        
        // Multiple Julia set calculations with different parameters
        float iter1 = julia(uv, vec2(0.285, 0.01), 1500);
        float iter2 = julia(uv * 1.5, vec2(-0.4, 0.6), 1500);
        float iter3 = julia(uv * 0.75, vec2(0.285, -0.01), 1500);
        
        // color calculation
        float t = u_time * 0.1;
        vec3 color1 = vec3(
            sin(iter1 * 0.1 + t) * 0.5 + 0.5,
            sin(iter1 * 0.15 + t + 2.094) * 0.5 + 0.5,
            sin(iter1 * 0.2 + t + 4.188) * 0.5 + 0.5
        );
        
        vec3 color2 = vec3(
            sin(iter2 * 0.12 + t) * 0.5 + 0.5,
            sin(iter2 * 0.17 + t + 2.094) * 0.5 + 0.5,
            sin(iter2 * 0.22 + t + 4.188) * 0.5 + 0.5
        );
        
        vec3 color3 = vec3(
            sin(iter3 * 0.14 + t) * 0.5 + 0.5,
            sin(iter3 * 0.19 + t + 2.094) * 0.5 + 0.5,
            sin(iter3 * 0.24 + t + 4.188) * 0.5 + 0.5
        );
        
        // blend colors with additional trigonometric functions
        vec3 finalColor = color1 * 0.4 + color2 * 0.3 + color3 * 0.3;
        finalColor *= vec3(
            sin(uv.x * 10.0 + u_time) * 0.1 + 0.9,
            cos(uv.y * 10.0 + u_time) * 0.1 + 0.9,
            sin((uv.x + uv.y) * 10.0 + u_time) * 0.1 + 0.9
        );
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

document
  .getElementById("startTestButton")
  .addEventListener("click", function () {
    const canvas = document.getElementById("webglCanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
      document.getElementById("status").textContent = "WebGL not supported!";
      return;
    }

    // compile shaders and link the program
    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      document.getElementById("status").textContent =
        "Shader program linking failed!";
      return;
    }

    gl.useProgram(shaderProgram);

    // vertices for a fullscreen quad
    const vertices = new Float32Array([
      -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // uniform for time
    const timeLocation = gl.getUniformLocation(shaderProgram, "u_time");

    // start loop
    render(timeLocation);
    document.getElementById("status").textContent = "gpu LSD roadtrip starting";
  });

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function render(timeLocation) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(timeLocation, performance.now() * 0.001);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(() => render(timeLocation));
}
