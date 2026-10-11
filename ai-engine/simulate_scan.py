import socket
import time

target_ip = "127.0.0.1"  # localhost
ports_to_scan = range(5000, 5015)  # 15 ports
delay = 0.05  # seconds between connections

for port in ports_to_scan:
    try:
        s = socket.socket()
        s.settimeout(0.05)
        s.connect((target_ip, port))
        s.close()
    except:
        pass
    time.sleep(delay)
input("Press Enter to exit...") 