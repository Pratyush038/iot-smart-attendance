# Facial Recognition Attendance System Setup

This guide will help you set up the facial recognition verification feature for your Smart Attendance System.

## 🔧 Prerequisites

1. **Webcam/Camera**: A working webcam connected to your computer
2. **Firebase Project**: Your existing Firebase project with Realtime Database
3. **Python Environment**: Python 3.11+ installed
4. **Firebase Service Account**: Downloaded from Firebase Console

## 📋 Setup Steps

### 1. Firebase Service Account Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `smart-attendance-system-038`
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `firebase-config.json` in your project root

### 2. Start the Face Recognition Service

The Python dependencies are already installed. Start the service:

```bash
python face_recognition_service.py
```

The service will run on `http://localhost:5001` with endpoints:
- `POST /verify-face` - Verify student identity
- `POST /register-student` - Register new student with face samples
- `GET /status` - Check service status

### 3. Register Students with Facial Recognition

1. Click **"Register New Student"** in the web app header
2. Enter roll number and student name
3. Click **"Start Registration"**
4. Camera will activate automatically
5. Keep your face visible and centered for 10-15 seconds
6. System captures multiple face samples automatically
7. Registration complete when you see the success message

### 4. Test Attendance with Face Verification

1. Enable proximity sensor in the web app
2. Enter a registered student's roll number on the keypad
3. Click the green checkmark button
4. **Face Verification Modal** appears automatically
5. Position face in front of camera
6. System verifies identity within 15 seconds
7. If verified: Attendance marked with verification status
8. If failed: Attendance not recorded

## 🎯 How It Works

### Two-Step Verification Process

1. **Step 1: Roll Number Entry**
   - Student enters roll number via keypad
   - System validates input format

2. **Step 2: Face Verification**
   - Camera activates automatically
   - Face detection and recognition runs
   - Compares detected face with stored profile
   - Verifies identity matches the entered roll number

### Verification Results

- **✅ Verified**: Face matches roll number → Attendance recorded
- **❌ Not Verified**: Face doesn't match → No attendance recorded
- **⏱️ Timeout**: No face detected in 15 seconds → Option to skip or retry

### Database Structure

Firebase stores student data in collections:

```
students/
  {roll_number}/
    - roll_number: "245"
    - name: "Sarah Johnson"
    - face_data: {base64_encoded_face_samples}
    - created_at: timestamp
    - total_attendance: number
    - sample_count: number

attendance/
  {auto_id}/
    - roll: "245"
    - name: "Sarah Johnson"
    - timestamp: server_timestamp
    - proximity: true
    - verified: true  ← Face verification status
```

## 🔍 Verification Logic

The system uses LBPH (Local Binary Pattern Histogram) face recognition:

1. **Face Detection**: Haar Cascade classifier detects faces
2. **Face Extraction**: Crops and normalizes face region to 100x100 pixels
3. **Recognition**: LBPH recognizer compares with trained models
4. **Confidence Threshold**: Accepts matches with confidence > 20 (80% accuracy)
5. **Identity Verification**: Ensures detected face matches entered roll number

## 🛠️ Troubleshooting

### Camera Issues
- **Error**: "Could not access camera"
- **Solution**: Check camera permissions and ensure no other app is using it

### Service Connection Issues
- **Error**: "Unable to connect to face recognition service"
- **Solution**: Ensure Python service is running on port 5001

### Recognition Issues
- **Error**: "Could not recognize face"
- **Solutions**:
  - Ensure good lighting
  - Position face clearly in camera view
  - Register with more diverse face angles
  - Check if student profile exists

### Firebase Issues
- **Error**: Firebase connection errors
- **Solution**: Verify `firebase-config.json` is correct and in project root

## 📊 System Features

### Smart Fallbacks
- If face service unavailable: Attendance marked without verification
- If camera fails: Option to skip verification
- If timeout occurs: Option to retry or skip

### Security Features
- Face data encrypted and stored securely in Firebase
- Local face recognition processing
- No face images transmitted over network
- Attendance marked only after successful verification

### User Experience
- Automated camera activation
- Real-time verification feedback
- Clear success/failure indicators
- Progress bars and countdown timers
- Option to retry or skip verification

## 🔄 Integration Flow

```
Student Entry → Roll Number Input → Face Verification → Attendance Recording
     ↓               ↓                    ↓                    ↓
 Proximity      Keypad Entry      Camera Activation    Firebase Update
  Sensor         Validation       Face Recognition     Verified Status
```

The system maintains the original sensor simulation while adding biometric verification for enhanced security and accuracy.

## 📈 Monitoring

The web app displays:
- Real-time verification status
- Student registration count
- Face service connection status
- Attendance records with verification flags

Students can be registered and verified through both the web interface and direct Python service calls, ensuring flexibility for different deployment scenarios.