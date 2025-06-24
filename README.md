# Smart Attendance System with Facial Recognition

A comprehensive React-based IoT attendance tracking system with Firebase integration that features proximity sensor simulation, digital keypads, facial recognition verification, and real-time attendance monitoring with visual and audio feedback.  
**This project also supports a full hardware-based implementation** using **ESP32**, **proximity sensors**, **NeoPixel LEDs**, and **RV IoT development kits**, making it suitable for both software simulation and real-world deployment.

---

## Features

### Sensor Simulation
- Proximity Sensor Toggle: Simulates student approach detection  
- Digital Keypad: 0-9 number input for roll number entry  
- Visual Feedback: NeoPixel LED simulation (green circle animation)  
- Audio Feedback: Web Audio API buzzer simulation  
- Real-time Validation: Input validation and error handling  

### Facial Recognition Verification
- Two-Step Authentication: Roll number entry followed by face verification  
- Face Registration: Capture and store facial profiles for students  
- Real-time Recognition: Camera-based identity verification  
- Fallback Options: System works with or without the face recognition service  
- Security: Biometric verification prevents attendance fraud  

### Attendance Dashboard
- Live Updates: Real-time attendance data from Firebase  
- Student Statistics: Individual attendance percentages and progress bars  
- Daily Summary: Present count and overall attendance rates  
- Check-in Log: Real-time log of recent student check-ins  

### Video Simulation
- Interactive Demo: Step-by-step workflow explanation  
- Captioned Walkthrough: 7-step process demonstration  
- Visual Workflow: How the sensor system works  

---

## Technology Stack

- Frontend: React 18 + TypeScript + Vite  
- Styling: Tailwind CSS + shadcn/ui components  
- Database: Firebase Realtime Database  
- Authentication: Firebase Anonymous Auth  
- Icons: FontAwesome 6.4.0  
- Audio: Web Audio API for buzzer simulation  
- State Management: React Query (TanStack Query)  

---

## Setup Instructions

### Prerequisites
- Node.js 20+ installed  
- Firebase project with Realtime Database enabled

### 1. Clone and Install

```bash
git clone https://github.com/Pratyush038/iot-smart-attendance
cd iot-smart-attendance
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)  
2. Create a new project or select an existing one  
3. Enable **Realtime Database** in your Firebase project  
4. Go to Project Settings → General → Your apps  
5. Add a web app and copy the configuration values  

### 3. Environment Variables

Create a `.env` file and add the following:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here  
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 4. Firebase Database Rules

```json
{
  "rules": {
    "attendance": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 5. Start Face Recognition Service (Optional)

```bash
python start_face_service.py
# Or manually:
python face_recognition_service.py
```

### 6. Run the Application

```bash
npm run dev
```

Available at `http://localhost:5000`

---

## How to Use

### Option 1: Full Verification

1. Register student and capture face  
2. Toggle proximity sensor to "Active"  
3. Enter roll number on keypad  
4. System opens camera and verifies identity  
5. Attendance recorded only if face matches  
6. LED + buzzer + dashboard update

### Option 2: Basic Check-In (Fallback)

1. Toggle proximity sensor  
2. Enter roll number  
3. System logs attendance without verification  

---

## Monitoring Attendance

- Real-time log updates  
- Individual student stats with color-coded progress  
- Daily summaries of attendance data  

---

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SensorsPanel.tsx
│   │   │   ├── AttendancePanel.tsx
│   │   │   ├── VideoSimulation.tsx
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   └── hooks/
│   └── index.html
├── server/
├── shared/
│   └── schema.ts
└── README.md
```

---

## Audio Requirements

Some browsers require interaction before playing audio. Click anywhere on the screen if the buzzer doesn't work at first.

---

## Security Notes

- Use strict Firebase rules in production  
- All sensitive keys are stored in `.env`  
- Anonymous authentication prevents credential misuse  

---

## Demo Flow

1. Student approaches  
2. Enters roll number  
3. Identity verified (if face module is active)  
4. LED + buzzer feedback  
5. Realtime Firebase sync  
6. Dashboard reflects changes instantly  

---

## Deployment

- Supports Replit deployment  
- Add environment variables via Replit Secrets  
- Works with or without Python facial recognition service  

---

## Data Models

```ts
interface AttendanceRecord {
  timestamp: string;
  roll: string;
  proximity: boolean;
}

interface StudentStats {
  id: number;
  roll: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}
```
