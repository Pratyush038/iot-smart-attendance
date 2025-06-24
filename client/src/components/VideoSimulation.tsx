import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import rvceLogoPath from "@/assets/image_1749634411299.png";

export default function VideoSimulation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("Step 1: Student approaches the proximity sensor...");

  const captions = [
    "Step 1: Student approaches the proximity sensor...",
    "Step 2: Proximity sensor detects student presence",
    "Step 3: Student enters roll number on keypad",
    "Step 4: System triggers face recognition for identity verification",
    "Step 5: Face recognition confirms identity match",
    "Step 6: NeoPixel LED and buzzer provide feedback",
    "Step 7: Attendance data is logged to Firebase in real-time"
  ];

  const playSimulation = () => {
    setIsPlaying(true);
    let captionIndex = 0;
    
    const interval = setInterval(() => {
      captionIndex++;
      if (captionIndex < captions.length) {
        setCurrentCaption(captions[captionIndex]);
      } else {
        setIsPlaying(false);
        setCurrentCaption(captions[0]);
        clearInterval(interval);
      }
    }, 3000);
  };

  const workflowSteps = [
    { step: 1, text: "Student approaches the proximity sensor" },
    { step: 2, text: "Proximity sensor detects student presence" },
    { step: 3, text: "Student enters roll number on keypad" },
    { step: 4, text: "System triggers face recognition for identity verification" },
    { step: 5, text: "Face recognition confirms identity match" },
    { step: 6, text: "NeoPixel LED and buzzer provide feedback" },
    { step: 7, text: "Attendance data is logged to Firebase in real-time" }
  ];

  return (
    <Card className="bg-white mb-8">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <i className="fas fa-play-circle text-blue-600 text-2xl mr-3"></i>
          <h2 className="text-2xl font-semibold text-gray-900">Sensor Workflow Simulation</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Simulated video player */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {/* RVCE institutional background */}
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <img 
                      src={rvceLogoPath} 
                      alt="RVCE Institution Logo" 
                      className="w-32 h-32 mx-auto mb-4 opacity-80"
                    />
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-blue-600 bg-opacity-20 rounded"></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 font-semibold">RVCE Smart Attendance System</p>
                </div>
              </div>
              
              {!isPlaying && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="w-16 h-16 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700"
                    onClick={playSimulation}
                  >
                    <i className="fas fa-play text-xl ml-1"></i>
                  </Button>
                </div>
              )}
              
              {/* Captions overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-75 text-white p-3 rounded text-sm">
                  <p>{currentCaption}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">How It Works</h3>
            <div className="space-y-3">
              {workflowSteps.map((item) => (
                <div key={item.step} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {item.step}
                  </div>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
