// ================= SAVE USER DETAILS =================

function saveUser() {
    const name = document.getElementById("name").value;
    const contact = document.getElementById("contact").value;
    const address = document.getElementById("address").value;

    fetch('/save_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            contact: contact,
            address: address
        })
    })
    .then(res => res.json())
    .then(data => alert("User Details Saved!"));
}


// ================= TAP PATTERN LOGIC =================

let tapSequence = [];
let pressStart = 0;

const emergencyBtn = document.getElementById("emergencyBtn");
const feedback = document.getElementById("feedback");

// Mobile Touch
emergencyBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pressStart = Date.now();
});

emergencyBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    let duration = Date.now() - pressStart;
    handleTap(duration);
});

// Desktop Mouse
emergencyBtn.addEventListener("mousedown", () => {
    pressStart = Date.now();
});

emergencyBtn.addEventListener("mouseup", () => {
    let duration = Date.now() - pressStart;
    handleTap(duration);
});


// ================= HANDLE TAP =================

function handleTap(duration) {

    // Only accept SHORT presses
    if (duration < 300) {
        tapSequence.push("short");
        feedback.innerText = `Short Press ${tapSequence.length}/3`;
    } else {
        // If long press → reset
        feedback.innerText = "Only short taps allowed. Resetting...";
        tapSequence = [];
        return;
    }

    checkPattern();
}


// ================= CHECK PATTERN =================

function checkPattern() {

    if (tapSequence.length === 3) {

        activateSOS();   // No need to compare now

        tapSequence = [];
        feedback.innerText = "";
    }
}


// ================= ACTIVATE SOS =================

function activateSOS() {

    alert("🚨 SOS Activated!");

    playAlarm();
    triggerFakeCall();

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function(position) {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locationLink = `https://maps.google.com/?q=${lat},${lon}`;

            fetch('/send_sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: locationLink })
            });

        }, function() {
            alert("Unable to get location");
        });

    } else {
        alert("Geolocation not supported");
    }
}


// ================= ALARM =================

function playAlarm() {
    const alarm = document.getElementById("alarmSound");
    alarm.loop = true;
    alarm.play();
}


// ================= FAKE CALL =================

function triggerFakeCall() {

    const ringtone = document.getElementById("ringtoneSound");
    ringtone.play();

    alert("Incoming Call: Mom 📞");

    setTimeout(() => {
        ringtone.pause();
        ringtone.currentTime = 0;
    }, 10000);
}
// Touch support (mobile)
emergencyBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();   // 🔥 Prevent text selection
    pressStart = Date.now();
});

emergencyBtn.addEventListener("touchend", (e) => {
    e.preventDefault();   // 🔥 Prevent default mobile behavior
    let duration = Date.now() - pressStart;
    handleTap(duration);
});