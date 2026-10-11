
import sys
import json
from datetime import datetime
from collections import defaultdict
import re
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_LOG_FILE = os.path.join(BASE_DIR, "alerts_log.txt")
LOG_FILE = os.getenv("LOG_FILE", DEFAULT_LOG_FILE)
if not os.path.exists(LOG_FILE) and os.path.exists(DEFAULT_LOG_FILE):
    LOG_FILE = DEFAULT_LOG_FILE


# -----------------------------
# PARSE LOG LINE
# -----------------------------
def parse_line(line):
    try:
        parts = line.strip().split("|")

        if len(parts) < 2:
            return None

        # Extract timestamp safely (remove microseconds)
        timestamp_str = parts[0].strip().split(".")[0]
        timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")

        date = str(timestamp.date())

        action_part = parts[1]

        # Extract action (safe regex)
        match = re.search(r'(CREATION|MODIFICATION|DELETION|MOVED)', action_part)
        if not match:
            return None

        action = match.group(1)

        # Clean file path (safe, no destructive replace)
        path = action_part.replace(action, "").replace("to", "").strip()

        return {
            "date": date,
            "file": path,
            "action": action,
            "timestamp": timestamp   # IMPORTANT for ordering
        }

    except:
        return None



def classify(actions):

    if actions == ["CREATION", "MODIFICATION", "DELETION"]:
        return "attack_file_lifecycle_abuse"
    
    if actions.count("DELETION") >= 2:
        return "attack_data_destruction"

    if actions[:2] == ["CREATION", "CREATION"]:
        return "suspicious_bulk_creation"

    if "MOVED" in actions and "DELETION" in actions:
        return "attack_data_tampering"

    # -----------------------------
    # Dynamic Detection Using
    # Median + 3 MAD Method
    # -----------------------------

    # Current activity count
    current_activity = len(actions)

    # Generate activity frequency list
    activity_values = [actions.count(action) for action in set(actions)]

    # Step 1: Calculate Median
    median_value = np.median(activity_values)

    # Step 2: Calculate Absolute Deviations
    deviations = [abs(x - median_value) for x in activity_values]

    # Step 3: Calculate MAD
    mad = np.median(deviations)

    # Step 4: Dynamic Threshold
    threshold = median_value + (3 * mad)


    max_activity = max(activity_values)


    # Step 5: Detect Anomaly
    if max_activity > threshold:
        return "possible_insider_threat"

    return "normal_user_behavior"



# ----------------------------- 
# MAIN PIPELINE
# -----------------------------
if __name__ == "__main__":
    try:
        today = sys.stdin.read().strip()

        grouped = defaultdict(list)

        # -----------------------------
        # READ LOG FILE
        # -----------------------------
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                parsed = parse_line(line)
                if not parsed:
                    continue

                # filter by date from Node
                if parsed["date"] != today:
                    continue

                grouped[parsed["file"]].append((parsed["timestamp"], parsed["action"]))

        results = []

        # -----------------------------
        # BUILD SEQUENCES (SORTED)
        # -----------------------------
        for file, items in grouped.items():

            # sort by time (VERY IMPORTANT FIX)
            items.sort(key=lambda x: x[0])

            actions = [action for _, action in items]

            attack = classify(actions)

            results.append({
                "file": file,
                "sequence": " -> ".join(actions),
                "PREDICTED_ATTACK": attack
            })

        # -----------------------------
        # OUTPUT
        # -----------------------------
        print(json.dumps(results))

    except Exception as e:
        print(json.dumps({
            "error": str(e)
        }))