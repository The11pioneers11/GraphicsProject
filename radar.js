const canvas = document.getElementById('radarCanvas');
const gl = canvas.getContext('2d');

let selectedAirplane = null;

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.9;
}

const callsigns = ["SKW3459", "AAL695"]

//Spawn points for random spawning of aircraft
const spawnPoints = [
    {degree: 178, radius: 0.9, label: "KLBB" },
    { degree: 263, radius: 0.9, label: "KABQ" },
    { degree: 80, radius: 0.9, label: "KOKC" },
    { degree: 329, radius: 0.9, label: "KDEN" },
    { degree: 145, radius: 0.9, label: "DUMPS" },
    { degree: 38, radius: 0.7, label: "Runway 4/22 End" },
    { degree: 218, radius: 0.7, label: "Runway 4/22 Opposite End" },
    { degree: 129, radius: 0.5, label: "Runway 13/31 End" },
    { degree: 309, radius: 0.5, label: "Runway 13/31 Opposite End" },
];

const updateInterval = 100; // Ensure update interval is defined
const airplanes = []; // Airplane array for tracking all airplanes

// Function to draw airplanes
function drawAirplane(centerX, centerY, degree, radius, callsign) {
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    const airplane = document.createElement("div");
    airplane.className = "airplane";
    airplane.dataset.callsign = callsign;
    airplane.style.position = "absolute";
    airplane.style.width = "10px";
    airplane.style.height = "10px";
    airplane.style.backgroundColor = "red";
    airplane.style.borderRadius = "50%";
    airplane.style.left = `${x - 5}px`;
    airplane.style.top = `${y - 5}px`;
    airplane.style.cursor = "pointer";
    document.body.appendChild(airplane);

    airplanes.push({
        callsign,
        element: airplane,
        degree,
        targetDegree: degree,
        radius,
        altitude: 0,
        targetAltitude: 0,
        speed: 100,
    });

    // Add click event to select the airplane
    airplane.addEventListener("click", () => {
        selectedAirplane = airplanes.find((a) => a.callsign === callsign);
        document.getElementById("callsign").innerText = `Callsign: ${callsign}`;
    });
}

// Function to spawn random airplanes
function spawnRandomAirplane(centerX, centerY) {
    if (airplanes.length >= 1) {
        console.log("Maximum number of airplanes reached.");
        return;
    }

    const randomDegree = Math.floor(Math.random() * 360); // Random initial direction
    const randomRadius = 0.5; // Start at a default radius
    const randomCallsign = callsigns[Math.floor(Math.random() * callsigns.length)];
    drawAirplane(centerX, centerY, randomDegree, randomRadius, randomCallsign);
}

// Update airplane movements
// Function to update airplane movement
function updateAirplanes() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    airplanes.forEach((airplane) => {
        // Gradually adjust the heading if there's a difference
        if (airplane.degree !== airplane.targetDegree) {
            const difference = airplane.targetDegree - airplane.degree;
            const step = Math.sign(difference) * Math.min(Math.abs(difference), 1); // Turn by 1° per tick
            airplane.degree += step;
        }

        // Convert heading to radians for movement
        const radian = (airplane.degree - 90) * (Math.PI / 180);
        const distancePerTick = (airplane.speed * updateInterval) / 3600000; // Convert knots to pixels

        // Update the radius and ensure it stays within bounds
        airplane.radius = Math.max(0.1, Math.min(1, airplane.radius + distancePerTick));

        // Calculate the new position
        const x = centerX + airplane.radius * Math.min(canvas.width, canvas.height) / 2.5 * Math.cos(radian);
        const y = centerY + airplane.radius * Math.min(canvas.width, canvas.height) / 2.5 * Math.sin(radian);

        airplane.element.style.left = `${x - 5}px`;
        airplane.element.style.top = `${y - 5}px`;

        // Adjust altitude if climbing or descending
        if (airplane.targetAltitude !== undefined) {
            if (airplane.altitude < airplane.targetAltitude) {
                airplane.altitude += 100; // Climb at 100 ft per tick
                if (airplane.altitude >= airplane.targetAltitude) {
                    airplane.altitude = airplane.targetAltitude;
                }
            } else if (airplane.altitude > airplane.targetAltitude) {
                airplane.altitude -= 100; // Descend at 100 ft per tick
                if (airplane.altitude <= airplane.targetAltitude) {
                    airplane.altitude = airplane.targetAltitude;
                }
            }

            // Update altitude status for the selected airplane
            if (selectedAirplane && selectedAirplane.callsign === airplane.callsign) {
                document.getElementById("currentAltitude").innerText = `${airplane.altitude} ft`;
            }
        }
    });

    setTimeout(updateAirplanes, updateInterval);
}

// Command functions
function sendHeading() {
    if (!selectedAirplane) {
        alert("No airplane selected!");
        return;
    }

    const heading = parseFloat(document.getElementById("heading").value);
    if (!isNaN(heading)) {
        selectedAirplane.targetDegree = heading; // Set target heading
        document.getElementById("currentHeading").innerText = `${heading}° (turning)`;
    }
}

function sendAltitude() {
    if (!selectedAirplane) {
        alert("No airplane selected!");
        return;
    }

    const altitude = parseFloat(document.getElementById("altitude").value);
    if (!isNaN(altitude)) {
        selectedAirplane.targetAltitude = altitude;
        document.getElementById("currentAltitude").innerText = `${altitude} ft (climbing/descending)`;
    }
}

function sendSpeed() {
    if (!selectedAirplane) {
        alert("No airplane selected!");
        return;
    }

    const speed = parseFloat(document.getElementById("speed").value);
    if (!isNaN(speed)) {
        selectedAirplane.speed = speed;
        document.getElementById("currentSpeed").innerText = `${speed} knots`;
    }
}

function sendDirect() {
    if (!selectedAirplane) {
        alert("No airplane selected!");
        return;
    }

    const radius = parseFloat(document.getElementById("direct").value);
    if (!isNaN(radius)) {
        selectedAirplane.radius = Math.max(0.1, Math.min(1, radius));
        document.getElementById("currentDirect").innerText = `Radius: ${radius.toFixed(2)}`;
    }
}

// Event listeners for `Enter` key
["heading", "altitude", "speed", "direct"].forEach((id) => {
    document.getElementById(id).addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const functionName = `send${id.charAt(0).toUpperCase() + id.slice(1)}`;
            window[functionName]();
            document.getElementById(id).value = ""; // Clear input box
        }
    });
});

// Start the airplane update loop
updateAirplanes();



resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawRadar() {
    gl.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2.5;
    const radarColor = 'lime';
    const fontSize = 14;

    // Draw circles
    for (let i = 1; i <= 6; i++) {
        gl.beginPath();
        gl.arc(centerX, centerY, (maxRadius / 6) * i, 0, Math.PI * 2);
        gl.strokeStyle = radarColor;
        gl.lineWidth = 1;
        gl.stroke();
    }

    // Draw lines and magnetic degree labels
    gl.font = `${fontSize}px Arial`;
    gl.fillStyle = radarColor;
    gl.textAlign = 'center';
    gl.textBaseline = 'middle';

    for (let angle = 0; angle < 360; angle += 30) {
        const radian = ((angle - 90) * Math.PI) / 180;
        const xOuter = centerX + maxRadius * Math.cos(radian);
        const yOuter = centerY + maxRadius * Math.sin(radian);
        const xInner = centerX + (maxRadius * 0.9) * Math.cos(radian);
        const yInner = centerY + (maxRadius * 0.9) * Math.sin(radian);
        
        // Draw tick marks
        gl.beginPath();
        gl.moveTo(xInner, yInner);
        gl.lineTo(xOuter, yOuter);
        gl.strokeStyle = radarColor;
        gl.lineWidth = 1;
        gl.stroke();

        // Draw degree labels slightly outside the outer circle
        const xLabel = centerX + (maxRadius * 1.05) * Math.cos(radian);
        const yLabel = centerY + (maxRadius * 1.05) * Math.sin(radian);
        gl.fillText(`${angle}°`, xLabel, yLabel);
    }

    function drawRunway(angle, length, width, offsetX = 0, offsetY = 0) {
        const radian = (angle - 90) * (Math.PI / 180); 
        gl.save();
        gl.translate(centerX + offsetX, centerY + offsetY);
        gl.rotate(radian);
        gl.beginPath();
        gl.rect(-width / 2, -length / 2, width, length);
        gl.fillStyle = radarColor;
        gl.fill();
        gl.restore();
    }

    // Draw Runway 13/31
    const runway13_31Length = maxRadius * 0.12; 
    const runway13_31Width = maxRadius * 0.01;
    const runway13_31OffsetX = 30; 
    const runway13_31OffsetY = -10; 
    drawRunway(38, runway13_31Length, runway13_31Width, runway13_31OffsetX, runway13_31OffsetY);

    // Draw Runway 4/22
    const runway4_22Length = maxRadius * 0.2; 
    const runway4_22Width = maxRadius * 0.01;
    const runway4_22OffsetX = -15; 
    const runway4_22OffsetY = 0;
    drawRunway(129, runway4_22Length, runway4_22Width, runway4_22OffsetX, runway4_22OffsetY);

    // Functions for Waypoints and other airports as destinations
    drawKLBBMarker(centerX, centerY, maxRadius); //Degree from KAMA is 178
    drawKABQMarker(centerX, centerY, maxRadius); //Degree from KAMA is 263
    drawKOKCMarker(centerX, centerY, maxRadius); //Degree from KAMA is 80
    drawKDENMarker(centerX, centerY, maxRadius); //Degree from KAMA is 329
    drawDUMPSMarker(centerX, centerY, maxRadius); //Degree from KAMA is 145
    drawKPYXMarker(centerX, centerY, maxRadius); //Degree from KAMA is 27
    drawRAVEEMarker(centerX, centerY, maxRadius); //Degree from KAMA is 228
    drawMDANOMarker(centerX, centerY, maxRadius); //Degree from KAMA is 111
    drawKPPAMarker(centerX, centerY, maxRadius); //Degree from KAMA is 50
    drawMIRMEMarker(centerX, centerY, maxRadius); //Degree from KAMA is 283
}

function drawKLBBMarker(centerX, centerY, radius) {
    const degree = 178;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KLBB text
    const text = document.createElement("div");
    text.innerText = "KLBB";
    text.style.position = "absolute";
    text.style.color = "White";
    text.style.fontSize = "12px";
    text.style.fontFamily = "Arial, sans-serif";
    text.style.left = `${x - 15}px`; // - numb is to the left, + numb is to the right
    text.style.top = `${y - 20}px`; // - numb is up, + numb is down
    document.body.appendChild(text);
}

function drawKABQMarker(centerX, centerY, radius) {
    const degree = 263;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KABQ text
    const text = document.createElement("div");
    text.innerText = "KABQ";
    text.style.position = "absolute";
    text.style.color = "White";
    text.style.fontSize = "12px";
    text.style.fontFamily = "Arial, sans-serif";
    text.style.left = `${x - (50)}px`; // - numb is to the left, + numb is to the right
    text.style.top = `${y - 10}px`; // - numb is up, + numb is down
    document.body.appendChild(text);
}

function drawKOKCMarker(centerX, centerY, radius) {
    const degree = 80;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KOKC text
    const text = document.createElement("div");
    text.innerText = "KOKC";
    text.style.position = "absolute";
    text.style.color = "White";
    text.style.fontSize = "12px";
    text.style.fontFamily = "Arial, sans-serif";
    text.style.left = `${x - (-15)}px`; // - numb is to the left, + numb is to the right
    text.style.top = `${y - 5}px`; // - numb is up, + numb is down
    document.body.appendChild(text);
}

function drawKDENMarker(centerX, centerY, radius) {
    const degree = 329;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KDEN text
    const text = document.createElement("div");
    text.innerText = "KDEN";
    text.style.position = "absolute";
    text.style.color = "White";
    text.style.fontSize = "12px";
    text.style.fontFamily = "Arial, sans-serif";
    text.style.left = `${x - 15}px`; // - numb is to the left, + numb is to the right
    text.style.top = `${y - (-15)}px`; // - numb is up, + numb is down
    document.body.appendChild(text);
}

function drawKPYXMarker(centerX, centerY, radius) {
    const degree = 27;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KPYX text
    const text1 = document.createElement("div");
    text1.innerText = "KPYX";
    text1.style.position = "absolute";
    text1.style.color = "White";
    text1.style.fontSize = "12px";
    text1.style.fontFamily = "Arial, sans-serif";
    text1.style.left = `${x - 25}px`; // - numb is to the left, + numb is to the right
    text1.style.top = `${y - (25)}px`; // - numb is up, + numb is down
    document.body.appendChild(text1);
}

function drawDUMPSMarker(centerX, centerY, radius){
    const degree = 145;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw triangle
    const triangle1 = document.createElement("div");
    triangle1.style.position = "absolute";
    triangle1.style.width = "0";
    triangle1.style.height = "0";
    triangle1.style.borderLeft = "10px solid transparent";
    triangle1.style.borderRight = "10px solid transparent";
    triangle1.style.borderBottom = "20px solid rgba(0, 255, 0, 0.1)"; // Semi-transparent lime color
    triangle1.style.transform = `rotate(${degree - 0}deg)`;
    triangle1.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    triangle1.style.top = `${y - 20}px`; // - numb is up, + numb is down
    document.body.appendChild(triangle1);


      // Draw DUMPS text
      const text5 = document.createElement("div");
      text5.innerText = "DUMPS";
      text5.style.position = "absolute";
      text5.style.color = "White";
      text5.style.fontSize = "12px";
      text5.style.fontFamily = "Arial, sans-serif";
      text5.style.left = `${x - (-15)}px`; // - numb is to the left, + numb is to the right
      text5.style.top = `${y - (-5)}px`;   // - numb is up, + numb is down
      document.body.appendChild(text5);
}

function drawRAVEEMarker(centerX, centerY, radius){
    const degree = 228;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw triangle
    const triangle = document.createElement("div");
    triangle.style.position = "absolute";
    triangle.style.width = "0";
    triangle.style.height = "0";
    triangle.style.borderLeft = "10px solid transparent";
    triangle.style.borderRight = "10px solid transparent";
    triangle.style.borderBottom = "20px solid rgba(0, 255, 0, 0.1)"; // Semi-transparent lime color
    triangle.style.transform = `rotate(${degree - 0}deg)`;
    triangle.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    triangle.style.top = `${y - 20}px`; // - numb is up, + numb is down
    document.body.appendChild(triangle);


      // Draw RAVEE text
      const text = document.createElement("div");
      text.innerText = "RAVEE";
      text.style.position = "absolute";
      text.style.color = "White";
      text.style.fontSize = "12px";
      text.style.fontFamily = "Arial, sans-serif";
      text.style.left = `${x - (55)}px`; // - numb is to the left, + numb is to the right
      text.style.top = `${y - (-15)}px`;   // - numb is up, + numb is down
      document.body.appendChild(text);
}

function drawMDANOMarker(centerX, centerY, radius){
    const degree = 111;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw triangle
    const triangle = document.createElement("div");
    triangle.style.position = "absolute";
    triangle.style.width = "0";
    triangle.style.height = "0";
    triangle.style.borderLeft = "10px solid transparent";
    triangle.style.borderRight = "10px solid transparent";
    triangle.style.borderBottom = "20px solid rgba(0, 255, 0, 0.1)"; // Semi-transparent lime color
    triangle.style.transform = `rotate(${degree - 0}deg)`;
    triangle.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    triangle.style.top = `${y - 20}px`; // - numb is up, + numb is down
    document.body.appendChild(triangle);


      // Draw MDANO text
      const text = document.createElement("div");
      text.innerText = "MDANO";
      text.style.position = "absolute";
      text.style.color = "White";
      text.style.fontSize = "12px";
      text.style.fontFamily = "Arial, sans-serif";
      text.style.left = `${x - (-25)}px`; // - numb is to the left, + numb is to the right
      text.style.top = `${y - (10)}px`;   // - numb is up, + numb is down
      document.body.appendChild(text);
}

function drawKPPAMarker(centerX, centerY, radius) {
    const degree = 50;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "20");
    star.setAttribute("height", "20");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "lime");
    star.style.position = "absolute";
    star.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    star.style.top = `${y - 10}px`; // - numb is up, + numb is down
    star.innerHTML = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    `;
    document.body.appendChild(star);

    // Draw KPPA text
    const text = document.createElement("div");
    text.innerText = "KPPA";
    text.style.position = "absolute";
    text.style.color = "White";
    text.style.fontSize = "12px";
    text.style.fontFamily = "Arial, sans-serif";
    text.style.left = `${x - (-15)}px`; // - numb is to the left, + numb is to the right
    text.style.top = `${y - 5}px`; // - numb is up, + numb is down
    document.body.appendChild(text);
}

function drawMIRMEMarker(centerX, centerY, radius){
    const degree = 283;
    const radian = (degree - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    // Draw triangle
    const triangle = document.createElement("div");
    triangle.style.position = "absolute";
    triangle.style.width = "0";
    triangle.style.height = "0";
    triangle.style.borderLeft = "10px solid transparent";
    triangle.style.borderRight = "10px solid transparent";
    triangle.style.borderBottom = "20px solid rgba(0, 255, 0, 0.1)"; // Semi-transparent lime color
    triangle.style.transform = `rotate(${degree - 0}deg)`;
    triangle.style.left = `${x - 10}px`; // - numb is to the left, + numb is to the right
    triangle.style.top = `${y - 20}px`; // - numb is up, + numb is down
    document.body.appendChild(triangle);


      // Draw MIRME text
      const text = document.createElement("div");
      text.innerText = "MIRME";
      text.style.position = "absolute";
      text.style.color = "White";
      text.style.fontSize = "12px";
      text.style.fontFamily = "Arial, sans-serif";
      text.style.left = `${x - (60)}px`; // - numb is to the left, + numb is to the right
      text.style.top = `${y - (15)}px`;   // - numb is up, + numb is down
      document.body.appendChild(text);
}

function animate() {
    drawRadar();
    requestAnimationFrame(animate);
}

//Plane spawn timer
setInterval(() => {
    spawnRandomAirplane(canvas.width / 2, canvas.height / 2);
}, 3000); // Spawn a new airplane every 3 seconds

animate();
