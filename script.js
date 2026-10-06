const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
    initLogin();
}

if (registerForm) {
    initRegister();
}

if (!loginForm && !registerForm && document.getElementById("video")) {
    initCamera();
}

async function hashPassword(password) {
    if (window.crypto && crypto.subtle) {
        const data = new TextEncoder().encode(password);
        const hash = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    let hash = 2166136261;

    for (let i = 0; i < password.length; i++) {
        hash ^= password.charCodeAt(i);
        hash +=
            (hash << 1) +
            (hash << 4) +
            (hash << 7) +
            (hash << 8) +
            (hash << 24);
    }

    return String(hash >>> 0);
}

function getLocalUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem("ecamUsers") || "[]"
        );

        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

function saveLocalUsers(users) {
    localStorage.setItem(
        "ecamUsers",
        JSON.stringify(users)
    );
}

function initLogin() {
    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const remember = document.getElementById("remember");
    const message = document.getElementById("loginMessage");

    if (!form) {
        return;
    }

    const rememberedUsername =
        localStorage.getItem("ecamRemembered");

    if (rememberedUsername && usernameInput) {
        usernameInput.value = rememberedUsername;

        if (remember) {
            remember.checked = true;
        }
    }

    if (togglePassword && passwordInput) {
        togglePassword.onclick = () => {
            const visible =
                passwordInput.type === "text";

            passwordInput.type =
                visible ? "password" : "text";

            const icon =
                togglePassword.querySelector("span");

            if (icon) {
                icon.textContent = visible ? "◉" : "◉";
            }
        };
    }

    form.onsubmit = async event => {
        event.preventDefault();

        const username =
            usernameInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        message.textContent = "";
        message.className = "login-message";

        if (!username || !password) {
            message.textContent =
                "Please enter your username and password.";

            message.className =
                "login-message error";

            return;
        }

        const button =
            form.querySelector(".login-button");

        if (button) {
            button.disabled = true;
        }

        try {
            const users = getLocalUsers();

            const user = users.find(
                item =>
                    String(item.username).toLowerCase() ===
                    username.toLowerCase()
            );

            if (!user) {
                throw new Error(
                    "Incorrect username or password."
                );
            }

            const passwordHash =
                await hashPassword(password);

            if (user.passwordHash !== passwordHash) {
                throw new Error(
                    "Incorrect username or password."
                );
            }

            sessionStorage.setItem(
                "ecamLoggedIn",
                "true"
            );

            sessionStorage.setItem(
                "ecamUser",
                user.username
            );

            sessionStorage.setItem(
                "ecamFullName",
                user.fullName || ""
            );

            sessionStorage.setItem(
                "ecamGmail",
                user.gmail || ""
            );

            if (remember && remember.checked) {
                localStorage.setItem(
                    "ecamRemembered",
                    username
                );
            } else {
                localStorage.removeItem(
                    "ecamRemembered"
                );
            }

            message.textContent =
                "Login successful.";

            message.className =
                "login-message success";

            setTimeout(() => {
                location.href = "camera.html";
            }, 250);
        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            message.textContent =
                error.message ||
                "Unable to login.";

            message.className =
                "login-message error";
        } finally {
            if (button) {
                button.disabled = false;
            }
        }
    };
}

function initRegister() {
    const form =
        document.getElementById("registerForm");

    const message =
        document.getElementById("registerMessage");

    if (!form) {
        return;
    }

    form.onsubmit = async event => {
        event.preventDefault();

        const fullName =
            form.querySelector(
                '[name="fullName"]'
            )?.value.trim() || "";

        const username =
            form.querySelector(
                '[name="username"]'
            )?.value.trim() || "";

        const gmail =
            form.querySelector(
                '[name="gmail"]'
            )?.value.trim() || "";

        const password =
            form.querySelector(
                '[name="password"]'
            )?.value || "";

        const confirmPassword =
            form.querySelector(
                '[name="confirmPassword"]'
            )?.value || "";

        if (
            !fullName ||
            !username ||
            !gmail ||
            !password ||
            !confirmPassword
        ) {
            showRegisterMessage(
                message,
                "Please complete all fields.",
                "error"
            );

            return;
        }

        if (
            !/^[A-Za-z0-9_]{3,50}$/.test(username)
        ) {
            showRegisterMessage(
                message,
                "Username must be 3–50 characters and contain only letters, numbers, and underscores.",
                "error"
            );

            return;
        }

        if (
            !/^[^\s@]+@gmail\.com$/i.test(gmail)
        ) {
            showRegisterMessage(
                message,
                "Please enter a valid Gmail address.",
                "error"
            );

            return;
        }

        if (password.length < 6) {
            showRegisterMessage(
                message,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }

        if (password !== confirmPassword) {
            showRegisterMessage(
                message,
                "Passwords do not match.",
                "error"
            );

            return;
        }

        const button =
            form.querySelector(
                'button[type="submit"]'
            );

        if (button) {
            button.disabled = true;
        }

        try {
            const users = getLocalUsers();

            const existingUser =
                users.find(
                    user =>
                        String(user.username).toLowerCase() ===
                        username.toLowerCase()
                );

            if (existingUser) {
                throw new Error(
                    "That username is already registered."
                );
            }

            const existingGmail =
                users.find(
                    user =>
                        String(user.gmail).toLowerCase() ===
                        gmail.toLowerCase()
                );

            if (existingGmail) {
                throw new Error(
                    "That Gmail address is already registered."
                );
            }

            const passwordHash =
                await hashPassword(password);

            users.push({
                id:
                    Date.now().toString() +
                    Math.random()
                        .toString(36)
                        .slice(2),

                fullName,
                username,
                gmail,
                passwordHash,

                createdAt:
                    new Date().toISOString()
            });

            saveLocalUsers(users);

            showRegisterMessage(
                message,
                "Registration successful. Redirecting to login...",
                "success"
            );

            form.reset();

            setTimeout(() => {
                location.href = "index.html";
            }, 1000);
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            showRegisterMessage(
                message,
                error.message ||
                "Registration failed.",
                "error"
            );
        } finally {
            if (button) {
                button.disabled = false;
            }
        }
    };
}

function showRegisterMessage(
    element,
    text,
    type
) {
    if (!element) {
        return;
    }

    element.textContent = text;

    element.className =
        `register-message ${type}`;
}

async function initCamera() {
    if (
        sessionStorage.getItem(
            "ecamLoggedIn"
        ) !== "true"
    ) {
        location.href = "index.html";
        return;
    }

    const video =
        document.getElementById("video");

    const canvas =
        document.getElementById("canvas");

    const captureBtn =
        document.getElementById("captureBtn");

    const statusText =
        document.getElementById("statusText");

    const status =
        document.querySelector(".status");

    const zoom =
        document.getElementById("zoom");

    const zoomValue =
        document.getElementById("zoomValue");

    const zoomBadge =
        document.getElementById("zoomBadge");

    const qualityBadge =
        document.getElementById("qualityBadge");

    const gallery =
        document.getElementById("gallery");

    const dateOverlay =
        document.getElementById("dateOverlay");

    const historyModal =
        document.getElementById("historyModal");

    const historyGrid =
        document.getElementById("historyGrid");

    const historyEmpty =
        document.getElementById("historyEmpty");

    const previewWrap =
        document.getElementById("previewWrap");

    const recordingIndicator =
        document.getElementById(
            "videoRecordingIndicator"
        );

    const captureHint =
        document.getElementById(
            "captureHint"
        );

    if (!video || !canvas || !captureBtn) {
        return;
    }

    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    let stream = null;
    let facingMode = "environment";

    let quality = "iphone";
    let filter = "original";
    let retro = "none";
    let mirror = false;

    let cameraCapabilities = null;
    let cameraTrack = null;
    let cameraReady = false;

    let currentMode = "photo";

    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecordingVideo = false;
    let videoMimeType = "";

    let videoNumber =
        Number(
            localStorage.getItem(
                "ecamVideoNumber"
            ) || 0
        );

    let photoNumber =
        Number(
            localStorage.getItem(
                "ecamPhotoNumber"
            ) || 0
        );

    let adaptiveBrightness = 1;
    let sceneBrightness = 0.5;
    let exposureValue = 0;
    let adaptiveExposureTimer = null;

    let historyObjectUrls = [];

    const username =
        sessionStorage.getItem(
            "ecamUser"
        );

    const filters = {
        original:
            "none",

        cinematic:
            "contrast(1.035) saturate(.96) brightness(1.01)",

        vivid:
            "contrast(1.055) saturate(1.10) brightness(1.01)",

        natural:
            "contrast(1.018) saturate(1.015) brightness(1.005)"
    };

    const qualityProfiles = {
        iphone: {
            contrast: 1.018,
            saturation: 1.045
        },

        natural: {
            contrast: 1.012,
            saturation: 1.015
        },

        vivid: {
            contrast: 1.045,
            saturation: 1.085
        },

        cinematic: {
            contrast: 1.035,
            saturation: 0.955
        }
    };

    function clamp(
        value,
        min,
        max
    ) {
        return Math.min(
            Math.max(
                value,
                min
            ),
            max
        );
    }

    function waitForVideo() {
        return new Promise(resolve => {
            if (
                video.readyState >= 3 &&
                video.videoWidth > 0
            ) {
                resolve();
                return;
            }

            let finished = false;

            const done = () => {
                if (finished) {
                    return;
                }

                finished = true;

                video.removeEventListener(
                    "loadeddata",
                    done
                );

                video.removeEventListener(
                    "canplay",
                    done
                );

                resolve();
            };

            video.addEventListener(
                "loadeddata",
                done
            );

            video.addEventListener(
                "canplay",
                done
            );

            setTimeout(
                done,
                5000
            );
        });
    }

    async function applyBestCameraSettings() {
        if (!cameraTrack) {
            return;
        }

        try {
            cameraCapabilities =
                cameraTrack.getCapabilities();

            const advanced = {};

            if (
                cameraCapabilities.focusMode &&
                cameraCapabilities.focusMode.includes(
                    "continuous"
                )
            ) {
                advanced.focusMode =
                    "continuous";
            }

            if (
                cameraCapabilities.exposureMode &&
                cameraCapabilities.exposureMode.includes(
                    "continuous"
                )
            ) {
                advanced.exposureMode =
                    "continuous";
            }

            if (
                cameraCapabilities.whiteBalanceMode &&
                cameraCapabilities.whiteBalanceMode.includes(
                    "continuous"
                )
            ) {
                advanced.whiteBalanceMode =
                    "continuous";
            }

            if (
                cameraCapabilities.resizeMode &&
                cameraCapabilities.resizeMode.includes(
                    "none"
                )
            ) {
                advanced.resizeMode =
                    "none";
            }

            if (
                cameraCapabilities.zoom
            ) {
                const minimum =
                    cameraCapabilities.zoom.min;

                const maximum =
                    cameraCapabilities.zoom.max;

                advanced.zoom =
                    clamp(
                        1,
                        minimum,
                        maximum
                    );
            }

            if (
                Object.keys(advanced).length
            ) {
                try {
                    await cameraTrack.applyConstraints({
                        advanced: [
                            advanced
                        ]
                    });
                } catch {
                }
            }

            const settings =
                cameraTrack.getSettings();

            console.log(
                "ECam camera settings:",
                settings
            );
        } catch (error) {
            console.log(
                "Advanced camera settings unavailable:",
                error
            );
        }
    }

    async function startCamera() {
        if (isRecordingVideo) {
            stopVideoRecording();
        }

        stopAdaptiveExposure();

        if (stream) {
            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

            stream = null;
        }

        cameraReady = false;
        cameraTrack = null;

        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error(
                    "Camera API is not supported."
                );
            }

            const primaryConstraints = {
                audio: false,

                video: {
                    facingMode: {
                        ideal: facingMode
                    },

                    width: {
                        min: 1280,
                        ideal: 4096,
                        max: 7680
                    },

                    height: {
                        min: 720,
                        ideal: 2160,
                        max: 4320
                    },

                    frameRate: {
                        ideal: 30,
                        min: 24,
                        max: 60
                    }
                }
            };

            try {
                stream =
                    await navigator.mediaDevices.getUserMedia(
                        primaryConstraints
                    );
            } catch {
                stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: false,

                        video: {
                            facingMode: {
                                ideal: facingMode
                            },

                            width: {
                                ideal: 1920,
                                min: 1280
                            },

                            height: {
                                ideal: 1080,
                                min: 720
                            },

                            frameRate: {
                                ideal: 30
                            }
                        }
                    });
            }

            cameraTrack =
                stream.getVideoTracks()[0];

            if (!cameraTrack) {
                throw new Error(
                    "No camera track was created."
                );
            }

            video.srcObject =
                stream;

            await video.play();

            await waitForVideo();

            await applyBestCameraSettings();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        500
                    )
            );

            const settings =
                cameraTrack.getSettings();

            const width =
                settings.width ||
                video.videoWidth;

            const height =
                settings.height ||
                video.videoHeight;

            statusText.textContent =
                `${width}×${height}`;

            if (status) {
                status.classList.add(
                    "ready"
                );

                status.classList.remove(
                    "recording"
                );
            }

            cameraReady = true;

            adaptiveBrightness = 1;
            sceneBrightness = 0.5;

            applyPreview();

            startAdaptiveExposure();
        } catch (error) {
            console.error(
                "Camera error:",
                error
            );

            cameraReady = false;

            statusText.textContent =
                "Camera permission required";

            if (status) {
                status.classList.remove(
                    "ready"
                );
            }

            alert(
                "ECam could not access the camera.\n\n" +
                "Allow camera permission and open ECam through localhost or HTTPS."
            );
        }
    }

    function measureSceneBrightness() {
        if (
            !cameraReady ||
            !video.videoWidth ||
            !video.videoHeight
        ) {
            return 0.5;
        }

        const analysisCanvas =
            measureSceneBrightness.canvas ||
            (measureSceneBrightness.canvas =
                document.createElement("canvas"));

        analysisCanvas.width = 64;
        analysisCanvas.height = 64;

        const context =
            analysisCanvas.getContext(
                "2d",
                {
                    alpha: false,
                    willReadFrequently: true
                }
            );

        context.drawImage(
            video,
            0,
            0,
            64,
            64
        );

        const pixels =
            context.getImageData(
                0,
                0,
                64,
                64
            ).data;

        let total = 0;
        let count = 0;

        for (
            let i = 0;
            i < pixels.length;
            i += 16
        ) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const luminance =
                (
                    0.2126 * r +
                    0.7152 * g +
                    0.0722 * b
                ) / 255;

            total += luminance;
            count++;
        }

        if (!count) {
            return 0.5;
        }

        return total / count;
    }

    async function updateAdaptiveExposure() {
        if (
            !cameraReady ||
            !cameraTrack
        ) {
            return;
        }

        try {
            const measured =
                measureSceneBrightness();

            sceneBrightness =
                sceneBrightness * 0.78 +
                measured * 0.22;

            const brightnessDifference =
                0.48 -
                sceneBrightness;

            adaptiveBrightness =
                clamp(
                    1 +
                    brightnessDifference *
                    0.75,
                    0.88,
                    1.20
                );

            if (
                cameraCapabilities &&
                cameraCapabilities.exposureCompensation
            ) {
                const capability =
                    cameraCapabilities.exposureCompensation;

                const min =
                    capability.min;

                const max =
                    capability.max;

                let target =
                    brightnessDifference *
                    2.2;

                target =
                    clamp(
                        target,
                        min,
                        max
                    );

                if (
                    Math.abs(
                        target -
                        exposureValue
                    ) > 0.18
                ) {
                    exposureValue =
                        target;

                    try {
                        await cameraTrack.applyConstraints({
                            advanced: [
                                {
                                    exposureCompensation:
                                        target
                                }
                            ]
                        });
                    } catch {
                    }
                }
            }

            applyPreview();
        } catch {
        }
    }

    function startAdaptiveExposure() {
        stopAdaptiveExposure();

        updateAdaptiveExposure();

        adaptiveExposureTimer =
            setInterval(
                updateAdaptiveExposure,
                700
            );
    }

    function stopAdaptiveExposure() {
        if (adaptiveExposureTimer) {
            clearInterval(
                adaptiveExposureTimer
            );

            adaptiveExposureTimer = null;
        }
    }

    function buildFilter() {
        const profile =
            qualityProfiles[
                quality
            ] ||
            qualityProfiles.iphone;

        let value =
            filters[filter] ||
            filters.original;

        value +=
            ` contrast(${profile.contrast})`;

        value +=
            ` saturate(${profile.saturation})`;

        value +=
            ` brightness(${adaptiveBrightness.toFixed(3)})`;

        if (retro === "80s") {
            value +=
                " saturate(1.13) contrast(1.04) sepia(.035)";
        }

        if (retro === "90s") {
            value +=
                " sepia(.075) saturate(.94) contrast(1.025)";
        }

        if (retro === "kapi") {
            value +=
                " sepia(.14) saturate(.87) contrast(1.04) brightness(.995)";
        }

        return value;
    }

    function applyPreview() {
        if (!zoom) {
            return;
        }

        const z =
            Number(
                zoom.value || 1
            );

        if (zoomValue) {
            zoomValue.textContent =
                `${z.toFixed(1)}×`;
        }

        if (zoomBadge) {
            zoomBadge.textContent =
                `${z.toFixed(1)}×`;
        }

        video.style.filter =
            buildFilter();

        if (mirror) {
            video.style.transform =
                `scale(${z}) scaleX(-1)`;
        } else {
            video.style.transform =
                `scale(${z})`;
        }
    }

    document
        .querySelectorAll(".quality")
        .forEach(button => {
            button.onclick = () => {
                document
                    .querySelectorAll(".quality")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                quality =
                    button.dataset.quality ||
                    "iphone";

                if (qualityBadge) {
                    qualityBadge.textContent =
                        quality === "iphone"
                            ? "ECam Quality"
                            : quality
                                .charAt(0)
                                .toUpperCase() +
                              quality.slice(1);
                }

                applyPreview();
            };
        });

    document
        .querySelectorAll(".style")
        .forEach(button => {
            button.onclick = () => {
                document
                    .querySelectorAll(".style")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                filter =
                    button.dataset.filter ||
                    "original";

                applyPreview();
            };
        });

    document
        .querySelectorAll(".retro")
        .forEach(button => {
            button.onclick = () => {
                document
                    .querySelectorAll(".retro")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                retro =
                    button.dataset.retro ||
                    "none";

                applyPreview();
            };
        });

    if (zoom) {
        zoom.min = "1";
        zoom.max = "4";
        zoom.step = "0.1";

        if (
            Number(zoom.value) < 1
        ) {
            zoom.value = "1";
        }

        zoom.oninput =
            applyPreview;
    }

    function toggleButton(id) {
        const button =
            document.getElementById(id);

        if (!button) {
            return false;
        }

        const span =
            button.querySelector("span");

        button.classList.toggle(
            "on"
        );

        if (span) {
            span.textContent =
                button.classList.contains(
                    "on"
                )
                    ? "ON"
                    : "OFF";
        }

        return button.classList.contains(
            "on"
        );
    }

    const gridButton =
        document.getElementById(
            "gridBtn"
        );

    if (gridButton) {
        gridButton.onclick = () => {
            const overlay =
                document.getElementById(
                    "gridOverlay"
                );

            if (!overlay) {
                return;
            }

            overlay.classList.toggle(
                "show",
                toggleButton(
                    "gridBtn"
                )
            );
        };
    }

    const dateButton =
        document.getElementById(
            "dateBtn"
        );

    if (dateButton) {
        dateButton.onclick = () => {
            const on =
                toggleButton(
                    "dateBtn"
                );

            if (!dateOverlay) {
                return;
            }

            dateOverlay.classList.toggle(
                "show",
                on
            );

            if (on) {
                dateOverlay.textContent =
                    new Date().toLocaleString();
            }
        };
    }

    const mirrorButton =
        document.getElementById(
            "mirrorBtn"
        );

    if (mirrorButton) {
        mirrorButton.onclick = () => {
            mirror =
                toggleButton(
                    "mirrorBtn"
                );

            applyPreview();
        };
    }

    const flipButton =
        document.getElementById(
            "flipBtn"
        );

    if (flipButton) {
        flipButton.onclick = async () => {
            if (isRecordingVideo) {
                stopVideoRecording();
            }

            facingMode =
                facingMode === "user"
                    ? "environment"
                    : "user";

            await startCamera();
        };
    }

    document
        .querySelectorAll(".mode")
        .forEach(button => {
            button.onclick = () => {
                if (isRecordingVideo) {
                    return;
                }

                document
                    .querySelectorAll(".mode")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                currentMode =
                    button.dataset.mode ||
                    "photo";

                if (captureBtn) {
                    captureBtn.classList.toggle(
                        "video-mode",
                        currentMode === "video"
                    );
                }

                if (captureHint) {
                    captureHint.classList.toggle(
                        "video-mode",
                        currentMode === "video"
                    );

                    captureHint.textContent =
                        currentMode === "video"
                            ? "Click the shutter to start recording"
                            : "ECam is ready";
                }

                if (
                    currentMode === "photo"
                ) {
                    if (recordingIndicator) {
                        recordingIndicator.classList.remove(
                            "show"
                        );
                    }
                }
            };
        });

    function getPhotoZoom() {
        return clamp(
            Number(
                zoom?.value || 1
            ),
            1,
            4
        );
    }

    function drawPhotoFromVideo() {
        if (
            !cameraReady ||
            !video.videoWidth ||
            !video.videoHeight
        ) {
            return null;
        }

        const width =
            video.videoWidth;

        const height =
            video.videoHeight;

        canvas.width =
            width;

        canvas.height =
            height;

        const context =
            canvas.getContext(
                "2d",
                {
                    alpha: false,
                    desynchronized: false
                }
            );

        if (!context) {
            return null;
        }

        context.imageSmoothingEnabled =
            true;

        context.imageSmoothingQuality =
            "high";

        const z =
            getPhotoZoom();

        const sourceWidth =
            width / z;

        const sourceHeight =
            height / z;

        const sourceX =
            (width -
                sourceWidth) /
            2;

        const sourceY =
            (height -
                sourceHeight) /
            2;

        context.save();

        context.filter =
            buildFilter();

        if (mirror) {
            context.translate(
                width,
                0
            );

            context.scale(
                -1,
                1
            );
        }

        context.drawImage(
            video,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            width,
            height
        );

        context.restore();

        addPhotoOverlays(
            context,
            width,
            height
        );

        return canvas;
    }

    function addPhotoOverlays(
        context,
        width,
        height
    ) {
        const dateEnabled =
            dateButton &&
            dateButton.classList.contains(
                "on"
            );

        if (dateEnabled) {
            context.save();

            const fontSize =
                Math.max(
                    18,
                    Math.round(
                        width / 95
                    )
                );

            context.font =
                `${fontSize}px Inter, sans-serif`;

            context.fillStyle =
                "#ffffff";

            context.shadowColor =
                "rgba(0,0,0,.9)";

            context.shadowBlur =
                7;

            context.fillText(
                new Date().toLocaleString(),
                35,
                height - 35
            );

            context.restore();
        }

        if (
            retro === "kapi" ||
            retro === "90s"
        ) {
            context.save();

            context.font =
                `${Math.max(
                    14,
                    Math.round(
                        width / 125
                    )
                )}px monospace`;

            context.fillStyle =
                "#ffffff";

            context.shadowColor =
                "rgba(0,0,0,.85)";

            context.shadowBlur =
                4;

            context.fillText(
                retro === "kapi"
                    ? "KAPI CAM"
                    : "ECAM 90s",
                35,
                45
            );

            context.restore();
        }
    }

    async function captureNativePhoto() {
        if (
            !window.ImageCapture ||
            !cameraTrack
        ) {
            return null;
        }

        if (
            typeof ImageCapture !==
            "function"
        ) {
            return null;
        }

        try {
            const imageCapture =
                new ImageCapture(
                    cameraTrack
                );

            if (
                typeof imageCapture.takePhoto !==
                "function"
            ) {
                return null;
            }

            const blob =
                await imageCapture.takePhoto();

            if (
                !blob ||
                !blob.size
            ) {
                return null;
            }

            return blob;
        } catch (error) {
            console.log(
                "Native still capture unavailable:",
                error
            );

            return null;
        }
    }

    async function processNativePhoto(
        blob
    ) {
        if (
            !blob ||
            !blob.size
        ) {
            return null;
        }

        if (
            typeof createImageBitmap !==
            "function"
        ) {
            return null;
        }

        try {
            const bitmap =
                await createImageBitmap(
                    blob
                );

            const width =
                bitmap.width;

            const height =
                bitmap.height;

            canvas.width =
                width;

            canvas.height =
                height;

            const context =
                canvas.getContext(
                    "2d",
                    {
                        alpha: false,
                        desynchronized: false
                    }
                );

            context.imageSmoothingEnabled =
                true;

            context.imageSmoothingQuality =
                "high";

            context.save();

            context.filter =
                buildFilter();

            context.drawImage(
                bitmap,
                0,
                0,
                width,
                height
            );

            context.restore();

            addPhotoOverlays(
                context,
                width,
                height
            );

            if (
                typeof bitmap.close ===
                "function"
            ) {
                bitmap.close();
            }

            return canvas;
        } catch (error) {
            console.log(
                "Native photo processing unavailable:",
                error
            );

            return null;
        }
    }

    function openPhotoDatabase() {
        return new Promise(
            (resolve, reject) => {
                if (!window.indexedDB) {
                    reject(
                        new Error(
                            "IndexedDB is unavailable."
                        )
                    );

                    return;
                }

                const request =
                    indexedDB.open(
                        "ECamLocalDatabase",
                        1
                    );

                request.onupgradeneeded =
                    event => {
                        const database =
                            event.target.result;

                        if (
                            !database.objectStoreNames.contains(
                                "pictures"
                            )
                        ) {
                            const store =
                                database.createObjectStore(
                                    "pictures",
                                    {
                                        keyPath:
                                            "id",
                                        autoIncrement:
                                            true
                                    }
                                );

                            store.createIndex(
                                "created_at",
                                "created_at"
                            );
                        }
                    };

                request.onsuccess =
                    () =>
                        resolve(
                            request.result
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async function saveLocalPicture(
        blob,
        filename
    ) {
        try {
            const database =
                await openPhotoDatabase();

            return await new Promise(
                (resolve, reject) => {
                    const transaction =
                        database.transaction(
                            "pictures",
                            "readwrite"
                        );

                    const store =
                        transaction.objectStore(
                            "pictures"
                        );

                    const request =
                        store.add({
                            username:
                                username || "",
                            filename,
                            blob,
                            created_at:
                                new Date().toISOString()
                        });

                    request.onsuccess =
                        () => {
                            database.close();
                            resolve(
                                request.result
                            );
                        };

                    request.onerror =
                        () => {
                            database.close();
                            reject(
                                request.error
                            );
                        };
                }
            );
        } catch (error) {
            console.error(
                "Could not save local picture:",
                error
            );

            throw error;
        }
    }

    async function getLocalPictures() {
        try {
            const database =
                await openPhotoDatabase();

            return await new Promise(
                (resolve, reject) => {
                    const transaction =
                        database.transaction(
                            "pictures",
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            "pictures"
                        );

                    const request =
                        store.getAll();

                    request.onsuccess =
                        () => {
                            database.close();

                            const currentUser =
                                username || "";

                            const rows =
                                request.result
                                    .filter(
                                        item =>
                                            String(
                                                item.username ||
                                                ""
                                            ) ===
                                            currentUser
                                    )
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            new Date(
                                                b.created_at
                                            ) -
                                            new Date(
                                                a.created_at
                                            )
                                    );

                            resolve(
                                rows
                            );
                        };

                    request.onerror =
                        () => {
                            database.close();

                            reject(
                                request.error
                            );
                        };
                }
            );
        } catch {
            return [];
        }
    }

    async function deleteLocalPicture(
        id
    ) {
        const database =
            await openPhotoDatabase();

        return await new Promise(
            (resolve, reject) => {
                const transaction =
                    database.transaction(
                        "pictures",
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        "pictures"
                    );

                const request =
                    store.delete(
                        Number(id)
                    );

                request.onsuccess =
                    () => {
                        database.close();
                        resolve();
                    };

                request.onerror =
                    () => {
                        database.close();

                        reject(
                            request.error
                        );
                    };
            }
        );
    }

    function escapeHTML(value) {
        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function revokeHistoryUrls() {
        historyObjectUrls.forEach(
            url => {
                try {
                    URL.revokeObjectURL(
                        url
                    );
                } catch {
                }
            }
        );

        historyObjectUrls = [];
    }

    async function renderHistory() {
        if (!historyGrid || !gallery) {
            return;
        }

        try {
            revokeHistoryUrls();

            const rows =
                await getLocalPictures();

            historyGrid.innerHTML =
                "";

            gallery.innerHTML =
                "";

            if (historyEmpty) {
                historyEmpty.style.display =
                    rows.length
                        ? "none"
                        : "block";
            }

            rows.forEach(row => {
                const imageUrl =
                    URL.createObjectURL(
                        row.blob
                    );

                historyObjectUrls.push(
                    imageUrl
                );

                const filename =
                    row.filename ||
                    "ECam Picture.jpg";

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "history-item";

                item.innerHTML = `
                    <img
                        src="${escapeHTML(imageUrl)}"
                        alt="${escapeHTML(filename)}"
                    >

                    <div class="history-info">
                        <strong>
                            ${escapeHTML(filename)}
                        </strong>

                        <span>
                            ${
                                row.created_at
                                    ? escapeHTML(
                                        new Date(
                                            row.created_at
                                        ).toLocaleString()
                                    )
                                    : ""
                            }
                        </span>

                        <div>
                            <button
                                class="download-old"
                                type="button"
                            >
                                Save Again
                            </button>

                            <button
                                class="delete-old"
                                type="button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                `;

                item
                    .querySelector(
                        ".download-old"
                    )
                    .onclick = () => {
                        const url =
                            URL.createObjectURL(
                                row.blob
                            );

                        const link =
                            document.createElement(
                                "a"
                            );

                        link.href =
                            url;

                        link.download =
                            filename;

                        document.body.appendChild(
                            link
                        );

                        link.click();

                        link.remove();

                        setTimeout(
                            () => {
                                URL.revokeObjectURL(
                                    url
                                );
                            },
                            1000
                        );
                    };

                item
                    .querySelector(
                        ".delete-old"
                    )
                    .onclick = async () => {
                        if (
                            !confirm(
                                `Delete ${filename}?`
                            )
                        ) {
                            return;
                        }

                        const button =
                            item.querySelector(
                                ".delete-old"
                            );

                        button.disabled =
                            true;

                        try {
                            await deleteLocalPicture(
                                row.id
                            );

                            await renderHistory();
                        } catch (error) {
                            console.error(
                                "Delete error:",
                                error
                            );

                            alert(
                                error.message ||
                                "Could not delete picture."
                            );

                            button.disabled =
                                false;
                        }
                    };

                historyGrid.appendChild(
                    item
                );

                if (
                    gallery.children.length <
                    5
                ) {
                    const image =
                        document.createElement(
                            "img"
                        );

                    image.className =
                        "thumb";

                    image.src =
                        imageUrl;

                    image.alt =
                        filename;

                    image.title =
                        filename;

                    gallery.appendChild(
                        image
                    );
                }
            });

            if (!rows.length) {
                gallery.innerHTML =
                    '<div class="empty">No pictures yet.</div>';
            }
        } catch (error) {
            console.error(
                "History error:",
                error
            );

            historyGrid.innerHTML =
                `
                    <div class="empty">
                        Could not load picture history.
                    </div>
                `;

            gallery.innerHTML =
                `
                    <div class="empty">
                        No pictures yet.
                    </div>
                `;
        }
    }

    function openHistory() {
        if (!historyModal) {
            return;
        }

        historyModal.classList.add(
            "show"
        );

        renderHistory();
    }

    const historyButton =
        document.getElementById(
            "historyButton"
        );

    const historyButton2 =
        document.getElementById(
            "historyButton2"
        );

    const galleryButton =
        document.getElementById(
            "galleryBtn"
        );

    const closeHistory =
        document.getElementById(
            "closeHistory"
        );

    if (historyButton) {
        historyButton.onclick =
            openHistory;
    }

    if (historyButton2) {
        historyButton2.onclick =
            openHistory;
    }

    if (galleryButton) {
        galleryButton.onclick =
            openHistory;
    }

    if (closeHistory) {
        closeHistory.onclick = () => {
            historyModal.classList.remove(
                "show"
            );
        };
    }

    if (historyModal) {
        historyModal.onclick =
            event => {
                if (
                    event.target ===
                    historyModal
                ) {
                    historyModal.classList.remove(
                        "show"
                    );
                }
            };
    }

    async function stabilizeCamera() {
        try {
            await waitForVideo();

            if (
                "requestVideoFrameCallback" in
                video
            ) {
                await new Promise(
                    resolve => {
                        video.requestVideoFrameCallback(
                            () => {
                                video.requestVideoFrameCallback(
                                    () => {
                                        resolve();
                                    }
                                );
                            }
                        );
                    }
                );
            } else {
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            250
                        )
                );
            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        120
                    )
            );
        } catch {
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        300
                    )
            );
        }
    }

    function getSupportedVideoMimeType() {
        if (!window.MediaRecorder) {
            return "";
        }

        const types = [
            "video/mp4",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm"
        ];

        for (const type of types) {
            if (
                MediaRecorder.isTypeSupported(
                    type
                )
            ) {
                return type;
            }
        }

        return "";
    }

    function startVideoRecording() {
        if (
            isRecordingVideo ||
            !cameraReady ||
            !stream
        ) {
            return;
        }

        if (!window.MediaRecorder) {
            alert(
                "Video recording is not supported by this browser."
            );

            return;
        }

        const mimeType =
            getSupportedVideoMimeType();

        videoMimeType =
            mimeType ||
            "video/webm";

        recordedChunks = [];

        try {
            mediaRecorder =
                mimeType
                    ? new MediaRecorder(
                        stream,
                        {
                            mimeType
                        }
                    )
                    : new MediaRecorder(
                        stream
                    );
        } catch (error) {
            console.error(
                "MediaRecorder error:",
                error
            );

            alert(
                "ECam could not start video recording."
            );

            return;
        }

        mediaRecorder.ondataavailable =
            event => {
                if (
                    event.data &&
                    event.data.size > 0
                ) {
                    recordedChunks.push(
                        event.data
                    );
                }
            };

        mediaRecorder.onstart =
            () => {
                isRecordingVideo =
                    true;

                captureBtn.classList.add(
                    "video-mode",
                    "recording"
                );

                if (recordingIndicator) {
                    recordingIndicator.classList.add(
                        "show"
                    );
                }

                if (previewWrap) {
                    previewWrap.classList.add(
                        "recording"
                    );
                }

                if (status) {
                    status.classList.add(
                        "recording"
                    );

                    status.classList.remove(
                        "ready"
                    );
                }

                statusText.textContent =
                    "Recording video...";

                if (captureHint) {
                    captureHint.textContent =
                        "Click the shutter again to stop recording";

                    captureHint.classList.add(
                        "video-mode"
                    );
                }

                captureBtn.setAttribute(
                    "aria-label",
                    "Stop recording"
                );
            };

        mediaRecorder.onerror =
            event => {
                console.error(
                    "Video recording error:",
                    event
                );

                stopVideoRecording();
            };

        mediaRecorder.onstop =
            () => {
                const recorderType =
                    mediaRecorder?.mimeType ||
                    videoMimeType ||
                    "video/webm";

                const blob =
                    new Blob(
                        recordedChunks,
                        {
                            type:
                                recorderType
                        }
                    );

                const isMP4 =
                    recorderType
                        .toLowerCase()
                        .includes(
                            "mp4"
                        );

                const extension =
                    isMP4
                        ? "mp4"
                        : "webm";

                videoNumber++;

                localStorage.setItem(
                    "ecamVideoNumber",
                    videoNumber
                );

                const filename =
                    `ECam Video ${String(
                        videoNumber
                    ).padStart(
                        3,
                        "0"
                    )}.${extension}`;

                if (blob.size > 0) {
                    const url =
                        URL.createObjectURL(
                            blob
                        );

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        url;

                    link.download =
                        filename;

                    document.body.appendChild(
                        link
                    );

                    link.click();

                    link.remove();

                    setTimeout(
                        () => {
                            URL.revokeObjectURL(
                                url
                            );
                        },
                        1000
                    );
                }

                isRecordingVideo =
                    false;

                recordedChunks = [];

                captureBtn.classList.remove(
                    "recording"
                );

                captureBtn.classList.add(
                    "video-mode"
                );

                if (recordingIndicator) {
                    recordingIndicator.classList.remove(
                        "show"
                    );
                }

                if (previewWrap) {
                    previewWrap.classList.remove(
                        "recording"
                    );
                }

                if (status) {
                    status.classList.remove(
                        "recording"
                    );

                    status.classList.add(
                        "ready"
                    );
                }

                const settings =
                    cameraTrack?.getSettings();

                statusText.textContent =
                    settings
                        ? `${settings.width || video.videoWidth}×${settings.height || video.videoHeight}`
                        : "Camera ready";

                if (captureHint) {
                    captureHint.textContent =
                        "Click the shutter to start recording";

                    captureHint.classList.add(
                        "video-mode"
                    );
                }

                captureBtn.setAttribute(
                    "aria-label",
                    "Start recording"
                );

                mediaRecorder =
                    null;

                videoMimeType =
                    "";
            };

        try {
            mediaRecorder.start(
                1000
            );
        } catch (error) {
            console.error(
                "Could not start recording:",
                error
            );

            mediaRecorder =
                null;

            recordedChunks = [];

            alert(
                "ECam could not start video recording."
            );
        }
    }

    function stopVideoRecording() {
        if (
            !mediaRecorder ||
            mediaRecorder.state ===
                "inactive"
        ) {
            return;
        }

        try {
            mediaRecorder.stop();
        } catch (error) {
            console.error(
                "Could not stop recording:",
                error
            );
        }
    }

    async function capturePhoto() {
        if (
            !cameraReady ||
            !video.videoWidth
        ) {
            return;
        }

        captureBtn.disabled =
            true;

        try {
            await stabilizeCamera();

            let photoBlob =
                null;

            const dateEnabled =
                dateButton &&
                dateButton.classList.contains(
                    "on"
                );

            const needsCanvasEffects =
                getPhotoZoom() !== 1 ||
                mirror ||
                dateEnabled ||
                retro !== "none";

            if (!needsCanvasEffects) {
                photoBlob =
                    await captureNativePhoto();
            }

            if (!photoBlob) {
                const photoCanvas =
                    drawPhotoFromVideo();

                if (!photoCanvas) {
                    captureBtn.disabled =
                        false;

                    return;
                }

                photoNumber++;

                localStorage.setItem(
                    "ecamPhotoNumber",
                    photoNumber
                );

                const filename =
                    `ECam Picture ${String(
                        photoNumber
                    ).padStart(
                        3,
                        "0"
                    )}.jpg`;

                photoCanvas.toBlob(
                    async blob => {
                        if (!blob) {
                            captureBtn.disabled =
                                false;

                            return;
                        }

                        await finishPhotoSave(
                            blob,
                            filename
                        );
                    },
                    "image/jpeg",
                    1.0
                );

                return;
            }

            const processedCanvas =
                await processNativePhoto(
                    photoBlob
                );

            photoNumber++;

            localStorage.setItem(
                "ecamPhotoNumber",
                photoNumber
            );

            const filename =
                `ECam Picture ${String(
                    photoNumber
                ).padStart(
                    3,
                    "0"
                )}.jpg`;

            if (
                processedCanvas
            ) {
                processedCanvas.toBlob(
                    async blob => {
                        if (!blob) {
                            await finishPhotoSave(
                                photoBlob,
                                filename
                            );

                            return;
                        }

                        await finishPhotoSave(
                            blob,
                            filename
                        );
                    },
                    "image/jpeg",
                    1.0
                );
            } else {
                await finishPhotoSave(
                    photoBlob,
                    filename
                );
            }
        } catch (error) {
            console.error(
                "Photo capture error:",
                error
            );

            captureBtn.disabled =
                false;
        }
    }

    async function finishPhotoSave(
        blob,
        filename
    ) {
        try {
            if (!blob) {
                captureBtn.disabled =
                    false;

                return;
            }

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                url;

            link.download =
                filename;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            try {
                await saveLocalPicture(
                    blob,
                    filename
                );
            } catch (error) {
                console.error(
                    "Local picture save error:",
                    error
                );

                alert(
                    "The picture was downloaded, but local history could not save it.\n\n" +
                    error.message
                );
            }

            await renderHistory();

            setTimeout(
                () => {
                    URL.revokeObjectURL(
                        url
                    );
                },
                1500
            );

            setTimeout(
                () => {
                    captureBtn.disabled =
                        false;
                },
                350
            );
        } catch (error) {
            console.error(
                "Photo save error:",
                error
            );

            captureBtn.disabled =
                false;
        }
    }

    if (captureBtn) {
        captureBtn.onclick =
            async () => {
                if (
                    currentMode ===
                    "video"
                ) {
                    if (
                        isRecordingVideo
                    ) {
                        stopVideoRecording();
                    } else {
                        startVideoRecording();
                    }

                    return;
                }

                if (
                    captureBtn.disabled
                ) {
                    return;
                }

                await capturePhoto();
            };
    }

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {
        logoutButton.onclick =
            async () => {
                if (isRecordingVideo) {
                    stopVideoRecording();

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                100
                            )
                    );
                }

                stopAdaptiveExposure();

                if (stream) {
                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );
                }

                sessionStorage.removeItem(
                    "ecamLoggedIn"
                );

                sessionStorage.removeItem(
                    "ecamUser"
                );

                sessionStorage.removeItem(
                    "ecamFullName"
                );

                sessionStorage.removeItem(
                    "ecamGmail"
                );

                location.href =
                    "index.html";
            };
    }

    window.addEventListener(
        "beforeunload",
        () => {
            stopAdaptiveExposure();

            if (
                mediaRecorder &&
                mediaRecorder.state !==
                    "inactive"
            ) {
                try {
                    mediaRecorder.stop();
                } catch {
                }
            }

            if (stream) {
                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );
            }

            revokeHistoryUrls();
        }
    );

    await startCamera();

    await renderHistory();
}