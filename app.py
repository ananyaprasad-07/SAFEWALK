from flask import Flask, render_template, request, jsonify
from twilio.rest import Client
import sqlite3
import os
from urllib.parse import quote
import re

app = Flask(__name__)

# ---------------- TWILIO ----------------
# Read Twilio credentials from environment variables in development/production.
# If not set, `client` will be None and the app will return a clear error instead
# of raising an exception from the Twilio SDK.
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE")

client = None
if TWILIO_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE:
    client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

# ---------------- DATABASE ----------------
def init_db():
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            emergency_contact TEXT,
            address TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ---------------- ROUTES ----------------

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/save_user', methods=['POST'])
def save_user():
    data = request.get_json()

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute("DELETE FROM user")  # keep only latest user
    c.execute("INSERT INTO user (name, emergency_contact, address) VALUES (?, ?, ?)",
              (data['name'], data['contact'], data['address']))

    conn.commit()
    conn.close()

    return jsonify({"status": "User Saved"})

@app.route('/send_sos', methods=['POST'])
def send_sos():
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not latitude or not longitude:
        return jsonify({"error": "Location not provided"}), 400

    # Generate Google Maps Link
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("SELECT name, emergency_contact FROM user LIMIT 1")
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "No user saved"}), 400

    name, contact = user

    message = f"""
🚨 EMERGENCY ALERT 🚨
Name: {name}

Live Location:
{maps_link}
"""

    # Sanitize the stored contact and build a WhatsApp wa.me link.
    # Expecting `contact` to include country code (e.g. +1234567890 or 1234567890).
    phone_digits = re.sub(r"\D", "", contact or "")
    if phone_digits.startswith("0"):
        # don't strip country code automatically; assume correct format, but keep this fallback
        phone_digits = phone_digits.lstrip("0")

    encoded = quote(message)
    wa_link = f"https://wa.me/{phone_digits}?text={encoded}"

    return jsonify({"status": "WA Link Generated", "wa_link": wa_link})


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)