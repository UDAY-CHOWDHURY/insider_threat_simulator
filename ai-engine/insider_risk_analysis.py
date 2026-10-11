
import os
import time
import hashlib
import requests
import threading
from datetime import datetime
from collections import defaultdict
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from scapy.all import sniff, TCP, IP

# -----------------------------
# LOG FILE
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_LOG_FILE = os.path.join(BASE_DIR, "alerts_log.txt")
LOG_FILE = os.getenv("LOG_FILE", DEFAULT_LOG_FILE)
if not os.path.exists(LOG_FILE) and os.path.exists(DEFAULT_LOG_FILE):
    LOG_FILE = DEFAULT_LOG_FILE

# -----------------------------
# CONFIG
# -----------------------------
WATCH_DIRS = [
    "C:/Users/DELL/Desktop",
    "C:/Users/DELL/Documents",
    "C:/Users/DELL/Downloads",
    "C:/Users/DELL/TestFolder1"
]

ALERT_API = "http://localhost:5000/analyze-event"

# -----------------------------
# PORT SCAN CONFIG
# -----------------------------
PORT_SCAN_THRESHOLD = 5
PORT_SCAN_WINDOW = 5  # seconds
connection_log = defaultdict(list)

# -----------------------------
# HELPER FUNCTIONS
# -----------------------------
def log_alert(alert_payload):
    """Append alert to a log file."""
    try:
        with open(LOG_FILE, "a") as f:
            f.write(
                f"{datetime.now()} | {alert_payload['description']} | Risk: {alert_payload['riskScore']} | Severity: {alert_payload['severity']}\n"
            )
    except Exception as e:
        print(f"[{datetime.now()}] Failed to write to log file: {e}")


def file_hash(filepath):
    """Return SHA256 hash of file or None if missing."""
    if not os.path.isfile(filepath):
        return None
    try:
        with open(filepath, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        print(f"[{datetime.now()}] Could not hash {filepath}: {e}")
        return None


def send_alert(action, filepath, risk=90, location=None):
    """Send alert to Node backend."""
    description = f"{filepath} {action}"

    if location and action == "MOVE":
        description = f"{filepath} MOVED to {location}"

    if action == "PORT_SCAN":
        description = f"Port scan detected from {filepath}"

    alert_payload = {
        "id": f"FILE-{int(time.time())}",
        "user": "system",
        "host": "local-machine",
        "time": str(datetime.now()),
        "riskScore": risk,
        "severity": "Critical" if risk >= 90 else "High",
        "description": description
    }

    log_alert(alert_payload)

    try:
        res = requests.post(ALERT_API, json=alert_payload)
        print(f"[{datetime.now()}] Alert sent:", res.json())
    except Exception as e:
        print(f"[{datetime.now()}] Failed to send alert:", e)


# -----------------------------
# PORT SCAN DETECTION USING SCAPY
# -----------------------------
def process_packet(pkt):
    """Process incoming TCP SYN packets to detect port scans."""
    if TCP in pkt and pkt[TCP].flags == "S":  # SYN packet
        src_ip = pkt[IP].src
        dst_port = pkt[TCP].dport
        current_time = time.time()

        connection_log[src_ip].append((dst_port, current_time))

        # Keep only recent attempts within the PORT_SCAN_WINDOW
        connection_log[src_ip] = [
            (p, t) for p, t in connection_log[src_ip] if current_time - t <= PORT_SCAN_WINDOW
        ]

        # Count unique ports
        unique_ports = set(p for p, _ in connection_log[src_ip])

        if len(unique_ports) >= PORT_SCAN_THRESHOLD:
            print(f"[{datetime.now()}] 🚨 PORT SCAN DETECTED from {src_ip}")
            send_alert("PORT_SCAN", src_ip, risk=100)
            connection_log[src_ip] = []  # reset after alert

def detect_port_scan():
    """Start sniffing TCP packets on all interfaces."""
    print(f"[{datetime.now()}] Port Scan Detector Started")
    sniff(filter="tcp", prn=process_packet, store=False)


# -----------------------------
# FILE SYSTEM EVENT HANDLER
# -----------------------------
class MonitorHandler(FileSystemEventHandler):
    def __init__(self):
        self.files_exist = set()
        self.mod_times = {}

    def on_created(self, event):
        if not event.is_directory:
            filepath = event.src_path
            if filepath not in self.files_exist:
                self.files_exist.add(filepath)
                self.mod_times[filepath] = os.path.getmtime(filepath)
                print(f"[{datetime.now()}] ⚠️ File CREATED: {filepath}")
                send_alert("CREATION", filepath, risk=80)

    def on_deleted(self, event):
        if not event.is_directory:
            filepath = event.src_path
            if filepath in self.files_exist:
                self.files_exist.remove(filepath)
                self.mod_times.pop(filepath, None)
                print(f"[{datetime.now()}] 🚨 File DELETED: {filepath}")
                send_alert("DELETION", filepath, risk=100)

    def on_modified(self, event):
        if not event.is_directory:
            filepath = event.src_path
            if filepath in self.files_exist:
                mtime = os.path.getmtime(filepath)
                last_mtime = self.mod_times.get(filepath)
                if last_mtime != mtime:
                    print(f"[{datetime.now()}] ⚠️ File MODIFIED: {filepath}")
                    send_alert("MODIFICATION", filepath, risk=95)
                    self.mod_times[filepath] = mtime

    def on_moved(self, event):
        if not event.is_directory:
            src = event.src_path
            dest = event.dest_path
            if src in self.files_exist:
                self.files_exist.remove(src)
                self.files_exist.add(dest)
                self.mod_times[dest] = self.mod_times.pop(src, None)
                print(f"[{datetime.now()}] ⚠️ File MOVED: {src} → {dest}")
                send_alert("MOVE", src, risk=90, location=dest)


# -----------------------------
# RUN OBSERVER AND PORT SCAN THREAD
# -----------------------------
if __name__ == "__main__":
    event_handler = MonitorHandler()
    observer = Observer()

    for folder in WATCH_DIRS:
        if os.path.exists(folder):
            observer.schedule(event_handler, folder, recursive=True)
            print(f"[{datetime.now()}] Monitoring folder: {folder}")

    observer.start()

    # Start Port Scan Detection Thread
    port_thread = threading.Thread(target=detect_port_scan)
    port_thread.daemon = True
    port_thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()