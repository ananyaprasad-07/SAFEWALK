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


// ================= VARIABLES =================

let tapSequence = [];
let pressStart = 0;
let lastTapTime = 0;
let sosActive = false;

const emergencyBtn = document.getElementById("emergencyBtn");
const stopBtn = document.getElementById("stopBtn");
const feedback = document.getElementById("feedback");


// ================= MOBILE TOUCH =================

emergencyBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pressStart = Date.now();
});

emergencyBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    let duration = Date.now() - pressStart;
    handleTap(duration);
});


// ================= DESKTOP =================

emergencyBtn.addEventListener("mousedown", () => {
    pressStart = Date.now();
});

emergencyBtn.addEventListener("mouseup", () => {
    let duration = Date.now() - pressStart;
    handleTap(duration);
});


// ================= HANDLE TAP =================

function handleTap(duration) {

    if (sosActive) return;  // prevent re-trigger

    const now = Date.now();

    // Reset if gap between taps > 2 seconds
    if (now - lastTapTime > 2000) {
        tapSequence = [];
    }

    lastTapTime = now;

    // Accept only SHORT presses
    if (duration < 300) {
        tapSequence.push("short");
        feedback.innerText = `Short Press ${tapSequence.length}/3`;
    } else {
        feedback.innerText = "Only short taps allowed. Resetting...";
        tapSequence = [];
        return;
    }

    if (tapSequence.length === 3) {
        activateSOS();
        tapSequence = [];
        feedback.innerText = "";
    }
}


// ================= ACTIVATE SOS =================

function activateSOS() {

    sosActive = true;

    alert("🚨 SOS Activated!");

    playAlarm();
    triggerFakeCall();

    stopBtn.style.display = "block";

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function(position) {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Send latitude and longitude so server receives expected keys
            fetch('/send_sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon })
            })
            .then(res => res.json())
            .then(data => {
                if (data.wa_link) {
                    window.open(data.wa_link, '_blank');
                } else if (data.error) {
                    alert('Error sending SOS: ' + data.error);
                }
            })
            .catch(err => console.error('SOS request failed', err));

        }, function() {
            alert("Unable to get location");
        });

    } else {
        alert("Geolocation not supported");
    }
}


// ================= STOP SOS =================

stopBtn.addEventListener("click", stopSOS);

function stopSOS() {

    const alarm = document.getElementById("alarmSound");
    const ringtone = document.getElementById("ringtoneSound");

    alarm.pause();
    alarm.currentTime = 0;

    ringtone.pause();
    ringtone.currentTime = 0;

    stopBtn.style.display = "none";
    sosActive = false;

    alert("SOS Stopped");
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