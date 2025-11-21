#!/bin/bash

##############################################################################
# Velocity Smart-Traffic Testbed - Startup Script
# 
# This script checks prerequisites and starts the Velocity server
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "============================================================"
echo "  Velocity Smart-Traffic Testbed"
echo "  Startup Script"
echo "============================================================"
echo -e "${NC}"

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo -e "${RED}✗ Python not found. Please install Python 3.10+${NC}"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python version: $PYTHON_VERSION${NC}"

# Check if we're in the right directory
if [ ! -f "server.py" ]; then
    echo -e "${RED}✗ server.py not found. Please run this script from the velocity-python directory.${NC}"
    exit 1
fi

# Check if requirements are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! $PYTHON_CMD -c "import flask, flask_socketio, eventlet" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Dependencies not installed or incomplete.${NC}"
    echo -e "${YELLOW}Installing dependencies from requirements.txt...${NC}"
    
    if [ -f "requirements.txt" ]; then
        $PYTHON_CMD -m pip install -r requirements.txt
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ requirements.txt not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Dependencies OK${NC}"
fi

# Get local IP address
echo -e "${YELLOW}Detecting local IP address...${NC}"
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "unknown")
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "unknown")
fi

echo -e "${GREEN}✓ Local IP: $LOCAL_IP${NC}"

# Display access information
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}Starting Velocity server...${NC}"
echo ""
echo -e "Access URLs:"
echo -e "  ${YELLOW}Localhost:${NC}"
echo -e "    Vehicle: http://localhost:5000/vehicle.html"
echo -e "    Signal:  http://localhost:5000/signal.html"
echo -e "    Status:  http://localhost:5000/status"
echo ""
if [ "$LOCAL_IP" != "unknown" ]; then
    echo -e "  ${YELLOW}LAN (for mobile devices):${NC}"
    echo -e "    Vehicle: http://$LOCAL_IP:5000/vehicle.html"
    echo -e "    Signal:  http://$LOCAL_IP:5000/signal.html"
fi
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Start the server
exec $PYTHON_CMD server.py


