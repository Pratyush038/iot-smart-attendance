# Smart Attendance System with Facial Recognition

A comprehensive React-based IoT attendance tracking system with Firebase integration that features proximity sensor simulation, digital keypads, facial recognition verification, and real-time attendance monitoring with visual and audio feedback.

## Features

### Sensor Simulation
- **Proximity Sensor Toggle**: Simulates student approach detection
- **Digital Keypad**: 0-9 number input for roll number entry
- **Visual Feedback**: NeoPixel LED simulation (green circle animation)
- **Audio Feedback**: Web Audio API buzzer simulation
- **Real-time Validation**: Input validation and error handling

### Facial Recognition Verification
- **Two-Step Authentication**: Roll number entry followed by face verification
- **Face Registration**: Capture and store facial profiles for students
- **Real-time Recognition**: Camera-based identity verification
- **Fallback Options**: System works with or without face recognition service
- **Security**: Biometric verification prevents attendance fraud

### Attendance Dashboard
- **Live Updates**: Real-time attendance data from Firebase
- **Student Statistics**: Individual attendance percentages and progress bars
- **Daily Summary**: Present count and overall attendance rates
- **Check-in Log**: Real-time log of recent student check-ins

### Video Simulation
- **Interactive Demo**: Step-by-step workflow explanation
- **Captioned Walkthrough**: 7-step process demonstration
- **Visual Workflow**: How the sensor system works

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth
- **Icons**: FontAwesome 6.4.0
- **Audio**: Web Audio API for buzzer simulation
- **State Management**: React Query (TanStack Query)

## 🔧 Setup Instructions

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
2. Create a new project or select existing one
3. Enable **Realtime Database** in your Firebase project
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the configuration values

### 3. Environment Variables

Set up the following environment variables:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here  
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 4. Firebase Database Rules

Set up your Firebase Realtime Database rules:

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

For facial verification features:

```bash
python start_face_service.py
```

Or manually:
```bash
python face_recognition_service.py
```

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

**Note**: The system works with or without the face recognition service. If the service is unavailable, attendance will be recorded without facial verification.

## How to Use

### Complete Attendance Process with Facial Recognition

#### Option 1: Full Verification (Recommended)
1. **Register Student**: Click "Register New Student" and capture facial samples
2. **Enable Proximity Sensor**: Toggle the proximity sensor switch to "Active"
3. **Enter Roll Number**: Use the digital keypad to enter the student's roll number
4. **Face Verification**: System automatically opens camera for identity verification
5. **Verification Result**: 
   - ✅ **Verified**: Face matches → Attendance recorded with verification badge
   - ❌ **Failed**: Face doesn't match → No attendance recorded
6. **Feedback**: NeoPixel LED, buzzer, and notifications confirm successful verification

#### Option 2: Basic Check-in (Fallback)
1. **Enable Proximity Sensor**: Toggle the proximity sensor switch to "Active"
2. **Enter Roll Number**: Use the digital keypad to enter a 3-digit roll number
3. **Submit**: Click the green checkmark button (if face service unavailable)
4. **Basic Feedback**: 
   - Green NeoPixel LED lights up and pulses
   - Audio buzzer plays confirmation sound
   - Data logged to Firebase without verification

### Monitoring Attendance

- **Real-time Log**: Check-ins appear immediately in the attendance panel
- **Student Statistics**: View individual attendance percentages with color-coded progress bars
- **Daily Summary**: Monitor present count and overall attendance rates

### Video Demonstration

Click the play button on the video simulation to see a step-by-step walkthrough of the entire sensor workflow process.

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SensorsPanel.tsx      # Proximity sensor & keypad simulation
│   │   │   ├── AttendancePanel.tsx   # Real-time attendance dashboard
│   │   │   ├── VideoSimulation.tsx   # Interactive workflow demo
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── firebase.ts           # Firebase configuration
│   │   │   ├── queryClient.ts        # React Query setup
│   │   │   └── utils.ts              # Utility functions
│   │   ├── pages/
│   │   │   └── Home.tsx              # Main application page
│   │   └── hooks/                    # Custom React hooks
│   └── index.html
├── server/                           # Express server setup
├── shared/
│   └── schema.ts                     # TypeScript types & validation
└── README.md
```

## Core Components

### SensorsPanel Component
- Proximity sensor toggle with visual status indicator
- 3x4 digital keypad with number input (0-9, clear, submit)
- NeoPixel LED simulation with green pulse animation
- Audio buzzer using Web Audio API
- Firebase integration for data submission
- Input validation and error handling

### AttendancePanel Component  
- Real-time Firebase listener for attendance updates
- Student statistics with attendance percentages
- Color-coded progress bars (green >85%, yellow >75%, red <75%)
- Daily attendance summary cards
- Scrollable check-in log with timestamps

### VideoSimulation Component
- Interactive demonstration player
- 7-step captioned walkthrough
- Visual workflow explanation
- Play/pause controls

## Key Features Implemented

✅ **Proximity Sensor Simulation**: Toggle switch with visual status  
✅ **Digital Keypad**: Full 0-9 number input with display  
✅ **NeoPixel LED**: Green circle with pulse animation  
✅ **Audio Buzzer**: Web Audio API beep sound  
✅ **Firebase Integration**: Real-time data sync  
✅ **Attendance Dashboard**: Live statistics and logs  
✅ **Student Percentages**: Individual attendance tracking  
✅ **Video Simulation**: Interactive workflow demo  
✅ **Responsive Design**: Mobile-friendly dual-panel layout  
✅ **Error Handling**: Input validation and Firebase error management  

## Audio Requirements

The buzzer simulation uses the Web Audio API. Users may need to interact with the page first (click anywhere) to enable audio playback due to browser autoplay policies.

## UI/UX Features

- **Clean Design**: Modern card-based layout with Tailwind CSS
- **Real-time Updates**: Live status indicators and animations  
- **Visual Feedback**: Color-coded status indicators and progress bars
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: ARIA labels and keyboard navigation support
- **Error States**: Clear error messages and validation feedback

## Security Notes

- Firebase security rules should be configured for production use
- Environment variables are properly configured for client-side use
- Anonymous authentication is used for simplified access

## Deployment

The application is ready for deployment. All environment variables should be properly configured.

## Data Structure

### Attendance Record
```typescript
interface AttendanceRecord {
  timestamp: string;
  roll: string;
  proximity: boolean;
}
```

### Student Statistics
```typescript
interface StudentStats {
  id: number;
  roll: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}
```

## Demo Flow

1. Student approaches (proximity sensor activates)
2. Student enters roll number on keypad
3. System validates input by matching using Facial Recognition 
4. NeoPixel LED provides visual confirmation
5. Buzzer provides audio feedback
6. Data is logged to Firebase in real-time
7. Attendance dashboard updates instantly

This system provides a complete IoT attendance solution simulation with real-time data synchronization and comprehensive monitoring capabilities.
