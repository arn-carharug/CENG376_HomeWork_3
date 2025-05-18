// Vertex Shader 2D to 3D Update
const vertexShaderSource = `
    attribute vec3 a_position;
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_projectionMatrix;
    void main() {
        gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
    }
`;

// Fragment Shader
const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

// Create a shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Create a shader program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Generate circle vertices
function setCircleVertices(gl, cx, cy, radius) {
    const segments = 100;
    let vertices = [];
    for (let i = 0; i <= segments; i++) {
        let angle = (i / segments) * 2 * Math.PI;
        let x = cx + radius * Math.cos(angle);
        let y = cy + radius * Math.sin(angle);
        let z= 0; // Horizantal plane
        vertices.push(x, y, z); // Update
    }
    return new Float32Array(vertices);
}

// Generates vertex and index data for a sphere using latitude-longitude bands
function createSphereVertices(radius, latBands, longBands) {
    const positions = [];

    for (let latNumber = 0; latNumber <= latBands; latNumber++) {
        const theta = latNumber * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let longNumber = 0; longNumber <= longBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Convert spherical coordinates to Cartesian coordinates
            const x = radius * cosPhi * sinTheta;
            const y = radius * cosTheta;
            const z = radius * sinPhi * sinTheta;

            positions.push(x, y, z);
        }
    }

    const indices = [];
    for (let latNumber = 0; latNumber < latBands; latNumber++) {
        for (let longNumber = 0; longNumber < longBands; longNumber++) {
            // Calculate vertex indices for two triangles forming each quad
            const first = (latNumber * (longBands + 1)) + longNumber;
            const second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint16Array(indices)
    };
}



// TRIANGLE_FAN drawing circle
function drawCircle(gl, program, cx, cy, radius, color) {
    // Bind buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, setCircleVertices(gl, cx, cy, radius), gl.STATIC_DRAW);

    //Get location
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    //Color
    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);
    // Drawing circle
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);
}

// Dashed orbit drawing
function drawDashedCircle(gl, program, cx, cy, cz, radius, color, dashCount = 60, dashLength = 0.03) {
    const vertices = [];
    const zScale = radius * 0.3; // ADDED

    for (let i = 0; i < dashCount; i++) {
        const startAngle = (i / dashCount) * 2 * Math.PI;
        const endAngle = startAngle + dashLength;

        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const z1 = cz + Math.sin(startAngle) * zScale; // ADDED

        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const z2 =cz + Math.sin(endAngle) * zScale; // ADDED

        vertices.push(x1, y1, z1, x2, y2, z2); // UPDTAE
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0); // Update

    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.LINES, 0,  vertices.length / 3); // UPDATE
}

// Draws a 3D sphere using generated vertex and index buffers
function drawSphere(gl, program, center, radius, color) {
    const { positions, indices } = createSphereVertices(radius, 20, 20);

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Enable and configure vertex attribute
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Set color uniform
    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    // Create model transformation matrix
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, center);

    // Combine view and model matrices
    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    // Pass final model-view matrix to the shader
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);

    // Draw the sphere using indexed drawing
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

let viewMatrix; // UPDATE
let modelViewMatrixLocation; // UPDATE
let projectionMatrixLocation; // UPDATE

//Main function
function main() {
    // Camera variables
    let cameraPosition = [0, 300, 1200];
    let cameraFront = vec3.normalize([], vec3.sub([], [0, 0, 0], cameraPosition));
    let cameraUp = [0, 1, 0];
    let yaw = -90;  // initial angle facing negative Z
    let pitch = -45;
    let movementSpeed = 10;
    let sensitivity = 0.1;
    let keysPressed = {};

    const center = [0, 0, 0]; // ADDED

    const canvas = document.getElementById("glCanvas");

    // Mouse events
    canvas.onclick = () => {
        canvas.requestPointerLock();
    };

    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement !== canvas) return;

        const offsetX = event.movementX * sensitivity;
        const offsetY = event.movementY * sensitivity;

        yaw += offsetX;
        pitch -= offsetY;

        if (pitch > 89) pitch = 89;
        if (pitch < -89) pitch = -89;

        const frontX = Math.cos(degToRad(yaw)) * Math.cos(degToRad(pitch));
        const frontY = Math.sin(degToRad(pitch));
        const frontZ = Math.sin(degToRad(yaw)) * Math.cos(degToRad(pitch));

        cameraFront = vec3.normalize([], [frontX, frontY, frontZ]);
    });

    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === canvas) {
            const hint = document.getElementById("mouseHint");
            hint.style.display = "block";
            setTimeout(() => {
                hint.style.display = "none";
            }, 5000);
        }
    });



    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    // Create and use WebGL program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Get Location for transformation matrices
    modelViewMatrixLocation = gl.getUniformLocation(program, "u_modelViewMatrix");
    projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");


    // Set the background color to black
    gl.clearColor(0, 0, 0, 1);

    // Depth test
    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);


    // Set the resolution uniform
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // Unified animation state
    let lastFrameTime = 0;

    let sunPulseActive = false;
    let sunScale = 1.0;
    let sunDirection = 1;

    let earthRotationActive = false;
    let earthAngle = 0;
    let earthSpeed = 1;
    const earthRadius = 320;

    let moonRotationActive = false;
    let moonAngle = 0;
    let moonSpeed = 5;
    const moonRadius = 90;

    let moonPulseActive = false;
    let moonScale = 1.0;
    let moonPulseDirection = 1;

    // Get UI elements
    const earthSlider = document.getElementById("earthSpeed");
    const earthSpeedDisplay = document.getElementById("earthSpeedValue");
    earthSlider.addEventListener("input", () => {
        earthSpeed = parseFloat(earthSlider.value);
        earthSpeedDisplay.textContent = earthSpeed.toString();
    });

    const moonSlider = document.getElementById("moonSpeed");
    const moonSpeedDisplay = document.getElementById("moonSpeedValue");
    moonSlider.addEventListener("input", () => {
        moonSpeed = parseFloat(moonSlider.value);
        moonSpeedDisplay.textContent = moonSpeed.toString();
    });

    // Toggle buttons
    document.getElementById("toggleSunPulse").addEventListener("click", () => {
        sunPulseActive = !sunPulseActive;
    });

    document.getElementById("toggleEarthRotation").addEventListener("click", () => {
        earthRotationActive = !earthRotationActive;
    });

    document.getElementById("toggleMoonRotation").addEventListener("click", () => {
        moonRotationActive = !moonRotationActive;
    });

    document.getElementById("toggleMoonPulse").addEventListener("click", () => {
        moonPulseActive = !moonPulseActive;
    });

    // Reset button
    document.getElementById("resetButton").addEventListener("click", () => {
        // Reset animation state
        sunScale = 1.0;
        sunDirection = 1;
        sunPulseActive = false;

        earthAngle = 0;
        earthRotationActive = false;

        moonAngle = 0;
        moonRotationActive = false;

        moonScale = 1.0;
        moonPulseDirection = 1;
        moonPulseActive = false;

        // Reset sliders to default values
        earthSpeed = 1;
        moonSpeed = 5;
        document.getElementById("earthSpeed").value = earthSpeed;
        document.getElementById("earthSpeedValue").textContent = earthSpeed;
        document.getElementById("moonSpeed").value = moonSpeed;
        document.getElementById("moonSpeedValue").textContent = moonSpeed;
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });


    // Unified animation loop
    function renderScene(time) {
        const deltaTime = time - lastFrameTime;
        lastFrameTime = time;

        // Move camera based on pressed keys
        const velocity = movementSpeed;
        const cameraRight = vec3.normalize([], vec3.cross([], cameraFront, cameraUp));
        const cameraDir = vec3.clone(cameraFront);

        if (keysPressed['w']) {
            cameraPosition = vec3.add([], cameraPosition, vec3.scale([], cameraDir, velocity));
        }
        if (keysPressed['s']) {
            cameraPosition = vec3.sub([], cameraPosition, vec3.scale([], cameraDir, velocity));
        }
        if (keysPressed['a']) {
            cameraPosition = vec3.sub([], cameraPosition, vec3.scale([], cameraRight, velocity));
        }
        if (keysPressed['d']) {
            cameraPosition = vec3.add([], cameraPosition, vec3.scale([], cameraRight, velocity));
        }


        // Create model-view and projection matrices
        viewMatrix = mat4.create(); // UPDATE
        const projectionMatrix = mat4.create();

        //  Define camera vectors ADDED
        const eye = [0, 800, 1200];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        // Calculate matrices
        mat4.lookAt(viewMatrix, cameraPosition, vec3.add([], cameraPosition, cameraFront), cameraUp); // Uptade
        mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 5000);

        // Send to shader
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);


        // Update sun pulse
        if (sunPulseActive) {
            const speed = 0.0015;
            sunScale += sunDirection * speed * deltaTime;
            if (sunScale >= 1.5) {
                sunScale = 1.5;
                sunDirection = -1;
            } else if (sunScale <= 0.5) {
                sunScale = 0.5;
                sunDirection = 1;
            }
        }

        // Update earth orbit
        if (earthRotationActive && earthSpeed !== 0) {
            earthAngle += (earthSpeed * 0.01);
        }

        // Update moon orbit
        if (moonRotationActive && moonSpeed !== 0) {
            moonAngle += (moonSpeed * 0.01);
        }

        // Update moon pulse
        if (moonPulseActive) {
            const moonPulseSpeed = 0.0015;
            moonScale += moonPulseDirection * moonPulseSpeed * deltaTime;
            if (moonScale >= 1.25) {
                moonScale = 1.25;
                moonPulseDirection = -1;
            } else if (moonScale <= 0.75) {
                moonScale = 0.75;
                moonPulseDirection = 1;
            }
        }

        // Calculate positions
        const earthX = center[0] + earthRadius * Math.cos(earthAngle); // UPDATE
        const earthY = center[1] + earthRadius * Math.sin(earthAngle); // UPDATE
        const earthZ = center[2] + Math.sin(earthAngle) * (earthRadius * 0.3); // UPDATE

        const moonX = earthX + moonRadius * Math.cos(moonAngle); // UPDATE
        const moonY = earthY + moonRadius * Math.sin(moonAngle); // UPDATE
        const moonZ = earthZ + Math.sin(moonAngle) * (moonRadius * 0.3); // UPDATE

        // Draw scene
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // UPDATE
        //Draw dashed orbits
        drawDashedCircle(gl, program, center[0], center[1], center[2], earthRadius, [1, 1, 1, 0.2]); // Earth orbit UPDATE
        drawDashedCircle(gl, program, earthX, earthY, earthZ, moonRadius, [1, 1, 1, 0.2]); // Moon orbit Update

        const sunDrawRadius = sunPulseActive ? 90 * sunScale : 90;
        const moonDrawRadius = moonPulseActive ? 20 * moonScale : 20;
         // RENDERED up-down
        drawSphere(gl, program, [moonX, moonY, moonZ], moonDrawRadius, [1.0, 1.0, 0.616, 1.0]); // UPDATE 2d to 3D
        drawSphere(gl, program, [earthX, earthY, earthZ], 50, [0.196, 0.326, 0.604, 1.0]); // UPDATE 2d to 3D
        drawSphere(gl, program,  center, sunDrawRadius, [0.988, 0.700, 0.0, 1.0]); // UPDATE 2d to 3D


        requestAnimationFrame(renderScene);
    }

    // Mouse events helper
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }


    requestAnimationFrame(renderScene);
}

// Execute the main function when the DOM is loaded
document.addEventListener("DOMContentLoaded", main);
