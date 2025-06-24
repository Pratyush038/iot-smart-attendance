import cv2
import cv2.face
import numpy as np
import firebase_admin
from google.cloud import firestore as gcp_firestore
from firebase_admin import credentials, firestore, storage
import pickle
import os
from google.oauth2 import service_account
from datetime import datetime
import json
import base64
from io import BytesIO
from PIL import Image
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

# Load .env variables
from dotenv import load_dotenv
load_dotenv()

print("DEBUG: FIREBASE_CONFIG_PATH =", os.getenv("FIREBASE_CONFIG_PATH"))
print("DEBUG: File exists?", os.path.exists(os.getenv("FIREBASE_CONFIG_PATH", "")))

class FaceVerificationService:
    def __init__(self, firebase_config_path = os.getenv("FIREBASE_CONFIG_PATH", "firebase-config.json")):
        """Initialize the Face Verification Service"""
        # Initialize Firebase
        if not firebase_admin._apps:
            os.environ["GOOGLE_CLOUD_PROJECT"] = os.getenv("GOOGLE_CLOUD_PROJECT", "smart-attendance-system-038")
            
            if os.path.exists(firebase_config_path):
                print("DEBUG: Attempting to initialize Firebase with config at:", firebase_config_path)
                cred = credentials.Certificate(firebase_config_path)
                creds = service_account.Credentials.from_service_account_file(firebase_config_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': 'smart-attendance-system-038',
                    'storageBucket': 'smart-attendance-system-038.appspot.com'
                })
                print("Firebase initialized with project ID: smart-attendance-system-038")
                print("✅ Firebase initialized — proceeding to load encodings")
                self.db = gcp_firestore.Client(project="smart-attendance-system-038", credentials=creds)
                self.bucket = storage.bucket()
            else:
                print("Warning: Firebase config not found, using default Firebase from web app")
                self.db = None
                self.bucket = None
        
        # Initialize face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize recognizer
        self.face_recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        # Student data storage
        self.known_faces = {}
        self.known_names = {}
        self.label_to_roll = {}
        self.roll_to_label = {}
        self.next_label = 0
        
        # Load existing face data if Firebase is available
        if self.db:
            print("🔄 Loading known face encodings from Firebase...")
            self.load_face_data_from_firebase()
        
        # Camera setup
        self.cap = None
        self.verification_result = None
        self.verification_in_progress = False
        
    def load_face_data_from_firebase(self):
        """Load face data from Firebase"""
        try:
            print("📡 Connecting to Firebase Firestore to load student face data...")
            students_ref = self.db.collection('students')
            try:
                print("⏳ Fetching documents from Firestore...")
                start_time = time.time()
                docs = list(students_ref.stream())
                elapsed = time.time() - start_time
                print(f"✅ Retrieved {len(docs)} documents in {elapsed:.2f} seconds")
            except Exception as e:
                print(f"❌ Error streaming documents from Firestore: {e}")
                return False
            
            self.known_faces = {}
            self.known_names = {}
            self.label_to_roll = {}
            self.roll_to_label = {}
            self.next_label = 0
            
            faces_data = []
            labels_data = []
            
            for doc in docs:
                student_data = doc.to_dict()
                roll_number = student_data['roll_number']
                name = student_data['name']
                print(f"📁 Found student: {roll_number} ({name}) — Face data present? {'face_data' in student_data}")
                
                if 'face_data' in student_data:
                    face_bytes = base64.b64decode(student_data['face_data'])
                    face_images = pickle.loads(face_bytes)
                    
                    label = self.next_label
                    self.label_to_roll[label] = roll_number
                    self.roll_to_label[roll_number] = label
                    self.known_names[roll_number] = name
                    self.next_label += 1
                    
                    for face_img in face_images:
                        faces_data.append(face_img)
                        labels_data.append(label)
            
            if faces_data:
                self.face_recognizer.train(faces_data, np.array(labels_data))
                print(f"Loaded {len(faces_data)} face samples from {len(self.known_names)} students")
                return True
            else:
                print("No face data found")
                return False
                
        except Exception as e:
            print(f"Error loading face data: {e}")
            return False
    
    def verify_face_for_roll(self, roll_number, timeout_seconds=15):
        """Verify face matches the given roll number"""
        if not self.known_names:
            return {"success": False, "error": "No student profiles found"}
        
        if roll_number not in self.known_names:
            return {"success": False, "error": f"Roll number {roll_number} not found"}
        
        self.verification_result = None
        self.verification_in_progress = True
        
        # Start camera
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            return {"success": False, "error": "Could not access camera"}
        
        start_time = time.time()
        attempts = 0
        max_attempts = timeout_seconds * 10  # 10 FPS
        
        while self.verification_in_progress and attempts < max_attempts:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(50, 50))
            
            for (x, y, w, h) in faces:
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                try:
                    label, confidence = self.face_recognizer.predict(face_roi)
                    
                    if confidence < 80:  # Recognition threshold
                        predicted_roll = self.label_to_roll.get(label, "Unknown")
                        predicted_name = self.known_names.get(predicted_roll, "Unknown")
                        
                        if predicted_roll == roll_number:
                            self.verification_result = {
                                "success": True,
                                "verified": True,
                                "roll_number": roll_number,
                                "name": predicted_name,
                                "confidence": 100 - confidence
                            }
                            self.verification_in_progress = False
                            break
                        else:
                            self.verification_result = {
                                "success": True,
                                "verified": False,
                                "expected_roll": roll_number,
                                "detected_roll": predicted_roll,
                                "detected_name": predicted_name,
                                "reason": "Face does not match roll number"
                            }
                            self.verification_in_progress = False
                            break
                    
                except Exception as e:
                    print(f"Recognition error: {e}")
            
            attempts += 1
            time.sleep(0.1)  # 10 FPS
        
        # Cleanup
        if self.cap:
            self.cap.release()
            cv2.destroyAllWindows()
        
        if self.verification_result is None:
            return {"success": False, "error": "Could not detect or recognize face within timeout"}
        
        return self.verification_result
    
    def capture_face_samples_for_new_student(self, roll_number, name, num_samples=50):
        """Capture face samples for a new student"""
        cap = cv2.VideoCapture(0)
        face_samples = []
        sample_count = 0
        
        print(f"Capturing {num_samples} face samples for {name} (Roll: {roll_number})")
        
        while sample_count < num_samples:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(50, 50))
            
            for (x, y, w, h) in faces:
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                if sample_count % 3 == 0:
                    face_roi = cv2.equalizeHist(face_roi)
                
                face_samples.append(face_roi)
                sample_count += 1
                
                if sample_count >= num_samples:
                    break
                
                time.sleep(0.2)
        
        cap.release()
        cv2.destroyAllWindows()
        
        if len(face_samples) < 5:
            return {"success": False, "error": "Insufficient face samples captured"}
        
        # Save to Firebase if available
        if self.db:
            try:
                face_bytes = pickle.dumps(face_samples)
                face_base64 = base64.b64encode(face_bytes).decode('utf-8')
                
                student_data = {
                    'roll_number': roll_number,
                    'name': name,
                    'face_data': face_base64,
                    'created_at': datetime.now(),
                    'total_attendance': 0,
                    'sample_count': len(face_samples)
                }
                
                self.db.collection('students').document(roll_number).set(student_data)
                self.load_face_data_from_firebase()
                
                return {"success": True, "samples_captured": len(face_samples)}
                
            except Exception as e:
                return {"success": False, "error": f"Failed to save to Firebase: {e}"}
        
        return {"success": True, "samples_captured": len(face_samples)}

# Flask API
app = Flask(__name__)
CORS(app)

face_service = FaceVerificationService()

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """API endpoint to verify face for a roll number"""
    data = request.json
    roll_number = data.get('roll_number')
    
    if not roll_number:
        return jsonify({"success": False, "error": "Roll number required"}), 400
    
    result = face_service.verify_face_for_roll(roll_number)
    return jsonify(result)

@app.route('/register-student', methods=['POST'])
def register_student():
    """API endpoint to register a new student with face samples"""
    data = request.json
    roll_number = data.get('roll_number')
    name = data.get('name')
    
    if not roll_number or not name:
        return jsonify({"success": False, "error": "Roll number and name required"}), 400
    
    result = face_service.capture_face_samples_for_new_student(roll_number, name)
    return jsonify(result)

@app.route('/status', methods=['GET'])
def status():
    """Check service status"""
    return jsonify({
        "status": "running",
        "students_loaded": len(face_service.known_names),
        "firebase_connected": face_service.db is not None
    })

if __name__ == '__main__':
    print("Starting Face Recognition Service...")
    print("Available endpoints:")
    print("  POST /verify-face - Verify face for roll number")
    print("  POST /register-student - Register new student")
    print("  GET /status - Service status")
    app.run(host='0.0.0.0', port=5001, debug=False)