#!/usr/bin/env python3
"""
Face Recognition Service Starter
Starts the facial recognition service for the Smart Attendance System
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import cv2
        import firebase_admin
        import flask
        import numpy
        from PIL import Image
        print("✓ All Python dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Installing missing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", 
                             "opencv-contrib-python", "firebase-admin", 
                             "flask", "flask-cors", "numpy", "Pillow", 
                             "google-cloud-firestore"])
        return True

def check_firebase_config():
    """Check if Firebase configuration file exists"""
    config_files = ["firebase-config.json", "attached_assets/firebase-config_1750395714632.json"]
    
    for config_file in config_files:
        if os.path.exists(config_file):
            print(f"✓ Found Firebase config: {config_file}")
            if config_file != "firebase-config.json":
                # Copy to expected location
                import shutil
                shutil.copy(config_file, "firebase-config.json")
                print("✓ Copied Firebase config to firebase-config.json")
            return True
    
    print("✗ Firebase configuration file not found")
    print("Please ensure firebase-config.json exists in the project root")
    return False

def check_service_running():
    """Check if the service is already running"""
    try:
        response = requests.get("http://localhost:5001/status", timeout=2)
        if response.status_code == 200:
            print("✓ Face recognition service is already running")
            return True
    except:
        pass
    return False

def start_service():
    """Start the face recognition service"""
    print("Starting Face Recognition Service...")
    
    # Check dependencies
    if not check_dependencies():
        return False
    
    # Check Firebase config
    if not check_firebase_config():
        print("Warning: Starting without Firebase config - limited functionality")
    
    # Check if already running
    if check_service_running():
        return True
    
    try:
        # Start the service
        print("Launching face recognition service on port 5001...")
        process = subprocess.Popen([
            sys.executable, "face_recognition_service.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for startup
        time.sleep(3)
        
        # Check if service started successfully
        if check_service_running():
            print("✓ Face recognition service started successfully!")
            print("Service available at: http://localhost:5001")
            print("\nEndpoints:")
            print("  POST /verify-face - Verify student identity")
            print("  POST /register-student - Register new student")
            print("  GET /status - Service status")
            print("\nPress Ctrl+C to stop the service")
            
            # Keep the service running
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\nShutting down face recognition service...")
                process.terminate()
                process.wait()
            
            return True
        else:
            print("✗ Failed to start face recognition service")
            stdout, stderr = process.communicate()
            if stderr:
                print(f"Error: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"✗ Error starting service: {e}")
        return False

if __name__ == "__main__":
    print("=== Smart Attendance System - Face Recognition Service ===")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        # Just check status
        if check_service_running():
            print("Service is running")
            sys.exit(0)
        else:
            print("Service is not running")
            sys.exit(1)
    
    success = start_service()
    sys.exit(0 if success else 1)