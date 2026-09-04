#!/data/data/com.termux/files/usr/bin/bash
# ===================================================
#     Ahmed Reaction Studio - Android Termux Launcher
# ===================================================

set -e

echo ""
echo "==================================================="
echo "    Ahmed Reaction Studio - Android Termux"
echo "==================================================="
echo ""

# Ensure Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo ">> Node.js not detected. Installing via pkg..."
    pkg update -y
    pkg install -y nodejs
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo ">> Installing studio dependencies..."
    npm install
fi

# Detect Local Wi-Fi IP address
WIFI_IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || true)
if [ -z "$WIFI_IP" ]; then
    WIFI_IP="localhost"
fi

echo "==================================================="
echo "  [OK] Ahmed Reaction Studio is ready!"
echo ""
echo "  Open on this Android Phone in Mobile Chrome:"
echo "  --> http://localhost:3000"
echo ""
echo "  Or open on any PC / Tablet on same Wi-Fi:"
echo "  --> http://$WIFI_IP:3000"
echo "==================================================="

# Attempt to launch default Chrome browser
termux-open-url http://localhost:3000 2>/dev/null || true

# Start Vite server bound to 0.0.0.0
npm run dev -- --host 0.0.0.0 --port 3000
