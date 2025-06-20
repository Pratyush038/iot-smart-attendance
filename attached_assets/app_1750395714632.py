import cv2
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
import os


class SimpleFaceAttendanceSystem:
    def __init__(self, firebase_config_path):
        """Initialize the Simple Face Attendance System with Firebase configuration"""
        # Initialize Firebase
        if not firebase_admin._apps:
            os.environ["GOOGLE_CLOUD_PROJECT"] = "smart-attendance-system-038"

            cred = credentials.Certificate(firebase_config_path)
            creds = service_account.Credentials.from_service_account_file(firebase_config_path)
            firebase_admin.initialize_app(cred, {
                'projectId': 'smart-attendance-system-038',
                'storageBucket': 'smart-attendance-system-038.appspot.com'
            })
            print("Firebase initialized with project ID: smart-attendance-system-038")
        self.db = gcp_firestore.Client(project="smart-attendance-system-038", credentials=creds)
        self.bucket = storage.bucket()
        
        # Initialize face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize recognizer
        self.face_recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        # Student data storage
        self.known_faces = {}  # {roll_number: face_data}
        self.known_names = {}  # {roll_number: name}
        self.label_to_roll = {}  # {label: roll_number}
        self.roll_to_label = {}  # {roll_number: label}
        self.next_label = 0
        
        # Load existing face data from Firebase
        self.load_face_data_from_firebase()
        
    def load_face_data_from_firebase(self):
        """Load face data and student info from Firebase"""
        try:
            students_ref = self.db.collection('students')
            docs = students_ref.stream()
            
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
                
                if 'face_data' in student_data:
                    # Decode face data
                    face_bytes = base64.b64decode(student_data['face_data'])
                    face_images = pickle.loads(face_bytes)
                    
                    # Assign label
                    label = self.next_label
                    self.label_to_roll[label] = roll_number
                    self.roll_to_label[roll_number] = label
                    self.known_names[roll_number] = name
                    self.next_label += 1
                    
                    # Add to training data
                    for face_img in face_images:
                        faces_data.append(face_img)
                        labels_data.append(label)
            
            # Train the recognizer if we have data
            if faces_data:
                self.face_recognizer.train(faces_data, np.array(labels_data))
                print(f"Loaded and trained with {len(faces_data)} face samples from {len(self.known_names)} students")
            else:
                print("No face data found in Firebase")
                
        except Exception as e:
            print(f"Error loading face data from Firebase: {e}")
    
    def capture_face_samples(self, num_samples=10):
        """Capture multiple face samples for better recognition"""
        cap = cv2.VideoCapture(0)
        face_samples = []
        sample_count = 0
        
        print(f"Capturing {num_samples} face samples...")
        print("Position your face in the camera. Samples will be captured automatically.")
        print("Press ESC to cancel")
        
        while sample_count < num_samples:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(50, 50))
            
            for (x, y, w, h) in faces:
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Extract and resize face
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                # Add some variation to samples
                if sample_count % 3 == 0:
                    face_roi = cv2.equalizeHist(face_roi)  # Histogram equalization
                
                face_samples.append(face_roi)
                sample_count += 1
                
                cv2.putText(frame, f"Sample {sample_count}/{num_samples}", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if sample_count >= num_samples:
                    break
                
                # Small delay between samples
                cv2.waitKey(200)
            
            cv2.imshow('Face Capture - Collecting Samples', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27:  # ESC key
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        if len(face_samples) < 5:
            print("Insufficient face samples captured. Need at least 5 samples.")
            return None
        
        print(f"Successfully captured {len(face_samples)} face samples")
        return face_samples
    
    def create_new_profile(self, roll_number, name):
        """Create a new student profile with face samples"""
        try:
            # Check if roll number already exists
            existing_student = self.db.collection('students').document(roll_number).get()
            if existing_student.exists:
                print(f"Student with roll number {roll_number} already exists!")
                return False
            
            print(f"Creating profile for {name} (Roll: {roll_number})")
            
            # Capture face samples
            face_samples = self.capture_face_samples()
            
            if face_samples is None:
                print("Failed to capture face samples. Profile not created.")
                return False
            
            # Convert face samples to base64 for storage
            face_bytes = pickle.dumps(face_samples)
            face_base64 = base64.b64encode(face_bytes).decode('utf-8')
            
            # Save student data to Firebase
            student_data = {
                'roll_number': roll_number,
                'name': name,
                'face_data': face_base64,
                'created_at': datetime.now(),
                'total_attendance': 0,
                'sample_count': len(face_samples)
            }
            
            self.db.collection('students').document(roll_number).set(student_data)
            
            # Save a sample image to Firebase Storage
            if face_samples:
                self.save_sample_image_to_storage(face_samples[0], f"student_photos/{roll_number}.jpg")
            
            # Reload and retrain the system
            self.load_face_data_from_firebase()
            
            print(f"Profile created successfully for {name} with {len(face_samples)} face samples!")
            return True
            
        except Exception as e:
            print(f"Error creating profile: {e}")
            return False
    
    def save_sample_image_to_storage(self, face_image, path):
        """Save a sample face image to Firebase Storage"""
        try:
            # Convert grayscale to RGB for storage
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
            image = Image.fromarray(face_rgb)
            
            # Save to bytes buffer
            buffer = BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(path)
            blob.upload_from_file(buffer, content_type='image/jpeg')
            
            print(f"Sample image saved to Firebase Storage: {path}")
            
        except Exception as e:
            print(f"Error saving sample image: {e}")
    
    def recognize_face_and_mark_attendance(self, roll_number):
        """Recognize face from webcam and mark attendance"""
        if not self.known_names:
            print("No student profiles found. Please create profiles first.")
            return False
        
        # Check if roll number exists
        if roll_number not in self.known_names:
            print(f"Roll number {roll_number} not found in database!")
            return False
        
        cap = cv2.VideoCapture(0)
        attendance_marked = False
        recognition_attempts = 0
        max_attempts = 50  # Maximum frames to try recognition
        
        print(f"Please position your face in the camera for roll number: {roll_number}")
        print("Press ESC to cancel")
        
        while not attendance_marked and recognition_attempts < max_attempts:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(50, 50))
            
            for (x, y, w, h) in faces:
                # Extract face region
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                # Recognize face
                try:
                    label, confidence = self.face_recognizer.predict(face_roi)
                    
                    # Lower confidence value means better match
                    if confidence < 80:  # Adjust threshold as needed
                        predicted_roll = self.label_to_roll.get(label, "Unknown")
                        predicted_name = self.known_names.get(predicted_roll, "Unknown")
                        
                        # Check if predicted roll matches entered roll
                        if predicted_roll == roll_number:
                            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                            cv2.putText(frame, f"APPROVED: {predicted_name}", 
                                       (x, y-40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                            cv2.putText(frame, f"Confidence: {100-confidence:.1f}%", 
                                       (x, y-15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                            
                            # Mark attendance
                            self.mark_attendance(roll_number, predicted_name)
                            attendance_marked = True
                            print(f"✅ ATTENDANCE APPROVED for {predicted_name} (Roll: {roll_number})")
                            break
                        else:
                            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                            cv2.putText(frame, f"REJECTED: {predicted_name}", 
                                       (x, y-40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                            cv2.putText(frame, f"Expected: {self.known_names[roll_number]}", 
                                       (x, y-15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                            print(f"❌ REJECTED: Face matches {predicted_name} but expected {self.known_names[roll_number]}")
                    else:
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                        cv2.putText(frame, "REJECTED: Unknown Face", 
                                   (x, y-15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        print(f"❌ REJECTED: Unknown face (confidence: {confidence:.1f})")
                        
                except Exception as e:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                    cv2.putText(frame, "RECOGNITION ERROR", 
                               (x, y-15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    print(f"Recognition error: {e}")
            
            recognition_attempts += 1
            cv2.putText(frame, f"Attempt: {recognition_attempts}/{max_attempts}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.imshow('Face Recognition Attendance - Press ESC to exit', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27:  # ESC key
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        if not attendance_marked and recognition_attempts >= max_attempts:
            print("❌ ATTENDANCE REJECTED: Could not recognize face after maximum attempts")
        
        return attendance_marked
    
    def mark_attendance(self, roll_number, name):
        """Mark attendance in Firebase"""
        try:
            # Check if already marked today
            today = datetime.now().strftime('%Y-%m-%d')
            existing_attendance = self.db.collection('attendance')\
                .where('roll_number', '==', roll_number)\
                .where('date', '==', today)\
                .limit(1).stream()
            
            if len(list(existing_attendance)) > 0:
                print(f"Attendance already marked for {name} today!")
                return False
            
            # Create attendance record
            attendance_data = {
                'roll_number': roll_number,
                'name': name,
                'timestamp': datetime.now(),
                'date': today,
                'time': datetime.now().strftime('%H:%M:%S'),
                'status': 'present'
            }
            
            # Add to attendance collection
            self.db.collection('attendance').add(attendance_data)
            
            # Update student's total attendance count
            student_ref = self.db.collection('students').document(roll_number)
            student_ref.update({
                'total_attendance': gcp_firestore.Increment(1),
                'last_attendance': gcp_firestore.SERVER_TIMESTAMP
            })
            
            print(f"Attendance marked successfully for {name} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True
            
        except Exception as e:
            print(f"Error marking attendance: {e}")
            return False
    
    def list_all_students(self):
        """List all registered students"""
        try:
            print("\n=== REGISTERED STUDENTS ===")
            students_ref = self.db.collection('students')
            docs = students_ref.stream()
            
            count = 0
            for doc in docs:
                student_data = doc.to_dict()
                print(f"Roll: {student_data['roll_number']} | Name: {student_data['name']} | "
                      f"Attendance: {student_data.get('total_attendance', 0)} | "
                      f"Samples: {student_data.get('sample_count', 0)}")
                count += 1
            
            print(f"\nTotal students registered: {count}")
            
        except Exception as e:
            print(f"Error listing students: {e}")
    
    def get_attendance_report(self, date=None):
        """Get attendance report for a specific date"""
        try:
            if date is None:
                date = datetime.now().strftime('%Y-%m-%d')
            
            print(f"\n=== ATTENDANCE REPORT FOR {date} ===")
            
            attendance_ref = self.db.collection('attendance').where('date', '==', date)
            docs = attendance_ref.stream()
            
            attendance_list = []
            for doc in docs:
                attendance_data = doc.to_dict()
                attendance_list.append(attendance_data)
            
            # Sort by time
            attendance_list.sort(key=lambda x: x['time'])
            
            for attendance in attendance_list:
                print(f"{attendance['time']} | Roll: {attendance['roll_number']} | Name: {attendance['name']}")
            
            print(f"\nTotal attendance for {date}: {len(attendance_list)}")
            
        except Exception as e:
            print(f"Error getting attendance report: {e}")

def main():
    """Main function to run the Simple Face Attendance System"""
    firebase_config_path = "firebase-config.json"
    
    try:
        print("Initializing Face Attendance System...")
        attendance_system = SimpleFaceAttendanceSystem(firebase_config_path)
        
        while True:
            print("\n" + "="*50)
            print("SIMPLE FACE RECOGNITION ATTENDANCE SYSTEM")
            print("="*50)
            print("1. Create New Student Profile")
            print("2. Mark Attendance (Face Recognition)")
            print("3. List All Students")
            print("4. View Today's Attendance Report")
            print("5. View Attendance Report for Specific Date")
            print("6. Exit")
            print("-"*50)
            
            choice = input("Enter your choice (1-6): ").strip()
            
            if choice == '1':
                print("\n--- CREATE NEW STUDENT PROFILE ---")
                roll_number = input("Enter Roll Number: ").strip()
                name = input("Enter Student Name: ").strip()
                
                if roll_number and name:
                    attendance_system.create_new_profile(roll_number, name)
                else:
                    print("Please enter valid roll number and name!")
            
            elif choice == '2':
                print("\n--- MARK ATTENDANCE ---")
                roll_number = input("Enter your Roll Number: ").strip()
                
                if roll_number:
                    attendance_system.recognize_face_and_mark_attendance(roll_number)
                else:
                    print("Please enter a valid roll number!")
            
            elif choice == '3':
                attendance_system.list_all_students()
            
            elif choice == '4':
                attendance_system.get_attendance_report()
            
            elif choice == '5':
                date = input("Enter date (YYYY-MM-DD): ").strip()
                attendance_system.get_attendance_report(date)
            
            elif choice == '6':
                print("Thank you for using Simple Face Recognition Attendance System!")
                break
            
            else:
                print("Invalid choice! Please enter 1-6.")
    
    except FileNotFoundError:
        print(f"Firebase configuration file '{firebase_config_path}' not found!")
        print("Please download the service account key from Firebase Console.")
    except Exception as e:
        print(f"Error initializing system: {e}")

if __name__ == "__main__":
    main()