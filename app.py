from flask import Flask, render_template, request, jsonify
from twilio.rest import Client
import sqlite3

app = Flask(__name__)

# ---------------- TWILIO ----------------
TWILIO_SID = "YOUR_TWILIO_SID"
TWILIO_AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"
TWILIO_PHONE = "YOUR_TWILIO_PHONE"

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
    location = data['location']

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
Live Location: {location}
"""

    client.messages.create(
        body=message,
        from_=TWILIO_PHONE,
        to=contact
    )

    return jsonify({"status": "SOS Sent"})


if __name__ == "__main__":
    app.run(debug=True)