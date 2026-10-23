document.getElementById("ai").addEventListener("change", toggleAi)
document.getElementById("fps").addEventListener("input", changeFps)
document.getElementById("border").addEventListener("input", changeBorder)

const video = document.getElementById("video");
const c1 = document.getElementById('c1');
const ctx1 = c1.getContext('2d');
var cameraAvailable = false;
var aiEnabled = false;
var fps = 16;
var border = 200; // mouse border

const FINGER_COLORS = {
    thumb: "#ff6b6b",
    indexFinger: "#feca57",
    middleFinger: "#48dbfb",
    ringFinger: "#1dd1a1",
    pinky: "#5f27cd"
};

/* Setting up the constraint */
var facingMode = "user"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
var constraints = {
    audio: false,
    video: {
        facingMode: facingMode
    }
};

/* Stream it to video element */
camera();
function camera() {
    if (!cameraAvailable) {
        console.log("camera")
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            cameraAvailable = true;
            video.srcObject = stream;
        }).catch(function (err) {
            cameraAvailable = false;
            if (modelIsLoaded) {
                if (err.name === "NotAllowedError") {
                    document.getElementById("loadingText").innerText = "Waiting for camera permission";
                }
            }
            setTimeout(camera, 1000);
        });
    }
}

window.onload = function () {
    timerCallback();
}

function timerCallback() {
    if (isReady()) {
        setResolution();
        ctx1.drawImage(video, 0, 0, c1.width, c1.height);
        setBorder();
        if (aiEnabled) {
            lockCheck();
            ai();
        }
    }
    setTimeout(timerCallback, fps);
}

function isReady() {
    if (modelIsLoaded && cameraAvailable) {
        document.getElementById("loadingText").style.display = "none";
        document.getElementById("ai").disabled = false;
        return true;
    } else {
        return false;
    }
}

function setResolution() {
    if (window.screen.width < video.videoWidth) {
        c1.width = window.screen.width * 0.9;
        let factor = c1.width / video.videoWidth;
        c1.height = video.videoHeight * factor;
    } else if (window.screen.height < video.videoHeight) {
        c1.height = window.screen.height * 0.50;
        let factor = c1.height / video.videoHeight;
        c1.width = video.videoWidth * factor;
    }
    else {
        c1.width = video.videoWidth;
        c1.height = video.videoHeight;
    }
};

function toggleAi() {
    let enabled = document.getElementById("ai").checked;
    aiEnabled = enabled;
    if (enabled) {
        c1.requestPointerLock();
    } else {
        setFakeMouse(0, 0); // hide mouse
    }
}

function lockCheck() {
    if (!/Mobi|Android/i.test(navigator.userAgent)) {
        if (document.pointerLockElement !== c1) {
            document.getElementById("ai").checked = false;
            toggleAi();
        }
    }
}

function changeFps() {
    fps = 1000 / document.getElementById("fps").value;
}

function changeBorder() {
    border = document.getElementById("border").value;
}

function setFakeMouse(x, y) {
    let cMouse = document.getElementById("mouse");
    let ctxMouse = cMouse.getContext("2d");
    cMouse.width = window.innerWidth;
    cMouse.height = window.innerHeight;
    x = cMouse.width * x;
    x = cMouse.width - x; // mirror
    y = cMouse.height * y;
    // console.log("x: " + x + " - y: " + y);
    let img = new Image;
    img.src = "pointer.png";
    ctxMouse.drawImage(img, x, y, img.width * 0.5, img.height * 0.5);
}

// draw mouse border
function setBorder() {
    ctx1.beginPath();
    ctx1.strokeStyle = "#f1c40f";
    ctx1.lineWidth = 2;
    ctx1.setLineDash([8, 6]);
    ctx1.rect(border / 2, border / 2, c1.width - border, c1.height - border);
    ctx1.stroke();
    ctx1.setLineDash([]);
    ctx1.beginPath();
}

function drawFinger(points, color) {
    if (!points || points.length === 0) {
        return;
    }
    ctx1.beginPath();
    ctx1.strokeStyle = color;
    ctx1.lineWidth = 3;
    ctx1.lineJoin = "round";
    ctx1.lineCap = "round";
    ctx1.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx1.lineTo(points[i][0], points[i][1]);
    }
    ctx1.stroke();
}

function ai() {
    // Detect hand in the canvas element
    handpose.predict(c1, results => {
        // do something with the results
        console.log(results);
        for (let index = 0; index < results.length; index++) {
            const element = results[index];
            // box
            ctx1.beginPath();
            ctx1.strokeStyle = "#2ecc71";
            ctx1.lineWidth = 2;
            ctx1.rect(element.boundingBox.topLeft[0], element.boundingBox.topLeft[1], element.boundingBox.bottomRight[0] - element.boundingBox.topLeft[0], element.boundingBox.bottomRight[1] - element.boundingBox.topLeft[1]);
            ctx1.stroke();

            drawFinger(element.annotations.thumb, FINGER_COLORS.thumb);
            drawFinger(element.annotations.indexFinger, FINGER_COLORS.indexFinger);
            drawFinger(element.annotations.middleFinger, FINGER_COLORS.middleFinger);
            drawFinger(element.annotations.ringFinger, FINGER_COLORS.ringFinger);
            drawFinger(element.annotations.pinky, FINGER_COLORS.pinky);

            // palmBase
            const palmBase = element.annotations.palmBase;
            const middleFinger = element.annotations.middleFinger;
            // mouse
            let x = (middleFinger[0][0] - border / 2) / (c1.width - border);
            let y = (middleFinger[0][1] - border / 2) / (c1.height - border);
            // create pointer
            if (aiEnabled) { // check again if enabled to prevent mouse override
                setFakeMouse(x, y);
            }
            for (let i = 0; i < palmBase.length; i++) {
                ctx1.beginPath();
                ctx1.strokeStyle = "#54a0ff";
                ctx1.lineWidth = 2;
                const ele = palmBase[i];
                ctx1.arc(ele[0], ele[1], 10, 0, 2 * Math.PI);
                ctx1.stroke();
            }

            // landmarks
            const landmarks = element.landmarks;
            for (let i = 0; i < landmarks.length; i++) {
                ctx1.beginPath();
                ctx1.strokeStyle = "#54a0ff";
                const ele = landmarks[i];
                ctx1.arc(ele[0], ele[1], 3, 0, 2 * Math.PI);
                ctx1.fillStyle = "#54a0ff";
                ctx1.fill();
                ctx1.stroke();
            }
        }
    });
}
