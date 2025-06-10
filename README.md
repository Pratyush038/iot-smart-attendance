# Smart Attendance System

A React-based IoT attendance tracking system with Firebase integration that simulates proximity sensors, digital keypads, and provides real-time attendance monitoring with visual and audio feedback.

## 🚀 Features

### Sensor Simulation
- **Proximity Sensor Toggle**: Simulates student approach detection
- **Digital Keypad**: 0-9 number input for roll number entry
- **Visual Feedback**: NeoPixel LED simulation (green circle animation)
- **Audio Feedback**: Web Audio API buzzer simulation
- **Real-time Validation**: Input validation and error handling

### Attendance Dashboard
- **Live Updates**: Real-time attendance data from Firebase
- **Student Statistics**: Individual attendance percentages and progress bars
- **Daily Summary**: Present count and overall attendance rates
- **Check-in Log**: Real-time log of recent student check-ins

### Video Simulation
- **Interactive Demo**: Step-by-step workflow explanation
- **Captioned Walkthrough**: 7-step process demonstration
- **Visual Workflow**: How the sensor system works

## 🛠️ Technology Stack

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
git clone <repository-url>
cd smart-attendance-system
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable **Realtime Database** in your Firebase project
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the configuration values

### 3. Environment Variables

Set up the following environment variables in Replit:

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

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 How to Use

### Simulating Student Check-in

1. **Enable Proximity Sensor**: Toggle the proximity sensor switch to "Active"
2. **Enter Roll Number**: Use the digital keypad to enter a 3-digit roll number
3. **Submit**: Click the green checkmark button
4. **Observe Feedback**: 
   - Green NeoPixel LED lights up and pulses
   - Audio buzzer plays confirmation sound
   - Success notification appears
   - Data is instantly logged to Firebase

### Monitoring Attendance

- **Real-time Log**: Check-ins appear immediately in the attendance panel
- **Student Statistics**: View individual attendance percentages with color-coded progress bars
- **Daily Summary**: Monitor present count and overall attendance rates

### Video Demonstration

Click the play button on the video simulation to see a step-by-step walkthrough of the entire sensor workflow process.

## 🏗️ Project Structure

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

## 🔋 Core Components

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

## 🎯 Key Features Implemented

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

## 🔊 Audio Requirements

The buzzer simulation uses the Web Audio API. Users may need to interact with the page first (click anywhere) to enable audio playback due to browser autoplay policies.

## 🎨 UI/UX Features

- **Clean Design**: Modern card-based layout with Tailwind CSS
- **Real-time Updates**: Live status indicators and animations  
- **Visual Feedback**: Color-coded status indicators and progress bars
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: ARIA labels and keyboard navigation support
- **Error States**: Clear error messages and validation feedback

## 🔒 Security Notes

- Firebase security rules should be configured for production use
- Environment variables are properly configured for client-side use
- Anonymous authentication is used for simplified access

## 🚀 Deployment

The application is ready for deployment on Replit. All environment variables should be properly configured in the Replit secrets manager.

## 📊 Data Structure

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

## 🎬 Demo Flow

1. Student approaches (proximity sensor activates)
2. Student enters roll number on keypad
3. System validates input
4. NeoPixel LED provides visual confirmation
5. Buzzer provides audio feedback
6. Data is logged to Firebase in real-time
7. Attendance dashboard updates instantly

This system provides a complete IoT attendance solution simulation with real-time data synchronization and comprehensive monitoring capabilities.