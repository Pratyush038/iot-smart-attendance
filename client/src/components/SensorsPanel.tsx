import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { database, ref, push, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import FaceVerificationModal from "@/components/FaceVerificationModal";
import type { AttendanceRecord } from "@shared/schema";

interface SensorsPanelProps {
  onAttendanceSubmit: (record: AttendanceRecord) => void;
}

export default function SensorsPanel({ onAttendanceSubmit }: SensorsPanelProps) {
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [neopixelActive, setNeopixelActive] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [pendingRollNumber, setPendingRollNumber] = useState("");
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBuzzer = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn("Audio playback failed:", error);
    }
  };

  const showFeedback = () => {
    setNeopixelActive(true);
    setBuzzerActive(true);
    playBuzzer();
    
    setTimeout(() => {
      setNeopixelActive(false);
      setBuzzerActive(false);
    }, 2000);
  };

  const handleKeypadInput = (key: string) => {
    if (!proximityEnabled) {
      toast({
        title: "Sensor Inactive",
        description: "Please enable proximity sensor first!",
        variant: "destructive",
      });
      return;
    }
    
    if (currentInput.length < 3) {
      setCurrentInput(prev => prev + key);
    }
  };

  const clearInput = () => {
    setCurrentInput("");
  };

  const submitAttendance = async () => {
    if (!proximityEnabled) {
      toast({
        title: "Sensor Inactive",
        description: "Please enable proximity sensor first!",
        variant: "destructive",
      });
      return;
    }
    
    if (currentInput.length < 3) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid roll number!",
        variant: "destructive",
      });
      return;
    }
    
    // Step 1: Show face verification modal
    setPendingRollNumber(currentInput);
    setShowFaceVerification(true);
    setIsSubmitting(true);
    
    toast({
      title: "Face Verification Required",
      description: `Please verify your identity for Roll #${currentInput}`,
    });
  };

  const handleVerificationComplete = async (verified: boolean, studentName?: string) => {
    setShowFaceVerification(false);
    
    if (verified) {
      try {
        // --- Duplicate check logic start ---
        const today = new Date().toISOString().split("T")[0];

        const duplicateToday = recentAttendance.some((entry) => {
          return entry.roll === pendingRollNumber &&
                 String(entry.timestamp).split("T")[0] === today;
        });

        if (duplicateToday) {
          toast({
            title: "Duplicate Entry",
            description: `Roll #${pendingRollNumber} already marked present today.`,
            variant: "default",
          });
          setCurrentInput("");
          setIsSubmitting(false);
          setPendingRollNumber("");
          return;
        }
        // --- Duplicate check logic end ---

        const attendanceRecord: AttendanceRecord = {
          timestamp: new Date().toISOString(),
          roll: pendingRollNumber,
          name: studentName,
          proximity: proximityEnabled
        };

        const attendanceRef = ref(database, 'attendance');
        await push(attendanceRef, {
          ...attendanceRecord,
          timestamp: serverTimestamp(),
          verified: true
        });

        showFeedback();
        onAttendanceSubmit(attendanceRecord);

        toast({
          title: "Attendance Verified & Recorded!",
          description: `${studentName || `Roll #${pendingRollNumber}`} - Face verification successful`,
        });

        setCurrentInput("");
      } catch (error) {
        console.error("Failed to submit attendance:", error);
        toast({
          title: "Error",
          description: "Failed to record attendance. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Attendance Not Recorded",
        description: "Face verification failed. Attendance not marked.",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
    setPendingRollNumber("");
  };

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  const displayText = currentInput.padEnd(3, '_').split('').join(' ');

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Sensor Controls</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${proximityEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">{proximityEnabled ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Proximity Sensor */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <i className="fas fa-wifi text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">Proximity Sensor</span>
            </div>
            <Switch
              checked={proximityEnabled}
              onCheckedChange={setProximityEnabled}
            />
          </div>
          <p className="text-sm text-gray-600">Toggle to simulate student approach detection</p>
          <div className="mt-3 flex items-center space-x-2">
            <i className={`fas fa-circle text-xs ${proximityEnabled ? 'text-green-500' : 'text-gray-400'}`}></i>
            <span className="text-sm text-gray-500">
              {proximityEnabled ? 'Sensor Active - Ready for input' : 'Waiting for activation...'}
            </span>
          </div>
        </div>

        {/* Digital Keypad */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-keyboard text-blue-600 mr-2"></i>
            Roll Number Keypad
          </h3>
          
          {/* Display Screen */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-xl text-center min-h-[3rem] flex items-center justify-center">
            <span>{displayText}</span>
          </div>
          
          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-3">
            {keypadButtons.slice(0, 9).map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-12 text-lg font-semibold"
                onClick={() => handleKeypadInput(key)}
                disabled={!proximityEnabled}
              >
                {key}
              </Button>
            ))}
            <Button
              variant="destructive"
              className="h-12"
              onClick={clearInput}
            >
              <i className="fas fa-backspace"></i>
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold"
              onClick={() => handleKeypadInput('0')}
              disabled={!proximityEnabled}
            >
              0
            </Button>
            <Button
              className="h-12 bg-green-600 hover:bg-green-700"
              onClick={submitAttendance}
              disabled={!proximityEnabled || isSubmitting}
            >
              <i className="fas fa-check"></i>
            </Button>
          </div>
        </div>

        {/* Feedback Systems */}
        <div className="grid grid-cols-2 gap-4">
          {/* NeoPixel Simulation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              NeoPixel LED
            </h4>
            <div className="flex justify-center">
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                neopixelActive ? 'border-green-500 bg-green-100' : 'border-gray-300 bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full transition-all duration-300 ${
                  neopixelActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Status: {neopixelActive ? 'Success!' : 'Standby'}
            </p>
          </div>

          {/* Buzzer Simulation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <i className="fas fa-volume-up text-blue-500 mr-2"></i>
              Audio Buzzer
            </h4>
            <div className="flex justify-center">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-300 ${
                buzzerActive ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                <i className={`text-2xl transition-all duration-300 ${
                  buzzerActive ? 'fas fa-volume-up text-green-600 animate-pulse' : 'fas fa-volume-off text-gray-500'
                }`}></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Status: {buzzerActive ? 'Active' : 'Silent'}
            </p>
          </div>
        </div>

        {/* Face Verification Modal */}
        <FaceVerificationModal
          isOpen={showFaceVerification}
          onClose={() => {
            setShowFaceVerification(false);
            setIsSubmitting(false);
            setPendingRollNumber("");
          }}
          rollNumber={pendingRollNumber}
          onVerificationComplete={handleVerificationComplete}
        />
      </CardContent>
    </Card>
  );
}
