import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function StudentRegistration() {
  const [isOpen, setIsOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState("");
  
  const { toast } = useToast();

  const handleRegistration = async () => {
    if (!rollNumber.trim() || !studentName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter both roll number and student name",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('capturing');
    setStatusMessage("Initializing camera to capture face samples...");

    try {
      // Check if face recognition service is available
      const statusResponse = await fetch('http://localhost:5001/status', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (!statusResponse.ok) {
        throw new Error('Face recognition service unavailable');
      }

      const response = await fetch('http://localhost:5001/register-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roll_number: rollNumber.trim(),
          name: studentName.trim()
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for registration
      });

      const result = await response.json();

      if (result.success) {
        setRegistrationStatus('success');
        setStatusMessage(`Successfully registered ${studentName} with ${result.samples_captured} face samples`);
        
        toast({
          title: "Registration Successful!",
          description: `${studentName} (Roll #${rollNumber}) has been registered with facial recognition`,
        });

        // Reset form
        setTimeout(() => {
          setRollNumber("");
          setStudentName("");
          setRegistrationStatus('idle');
          setStatusMessage("");
          setIsOpen(false);
        }, 3000);

      } else {
        setRegistrationStatus('failed');
        setStatusMessage(result.error || "Registration failed");
        
        toast({
          title: "Registration Failed",
          description: result.error || "Unable to capture face samples",
          variant: "destructive"
        });
      }
    } catch (error) {
      setRegistrationStatus('failed');
      setStatusMessage("Face recognition service unavailable. Registering without facial data.");
      
      // Fallback: Register student in Firebase without face data
      try {
        const { database, ref, push, serverTimestamp } = await import("@/lib/firebase");
        
        const studentData = {
          roll_number: rollNumber.trim(),
          name: studentName.trim(),
          created_at: serverTimestamp(),
          face_registered: false
        };
        
        const studentsRef = ref(database, 'students');
        await push(studentsRef, studentData);
        
        setRegistrationStatus('success');
        setStatusMessage(`${studentName} registered successfully. Face recognition can be added later when service is available.`);
        
        toast({
          title: "Student Registered",
          description: "Registration completed without facial recognition. Face data can be added later.",
        });

        setTimeout(() => {
          setRollNumber("");
          setStudentName("");
          setRegistrationStatus('idle');
          setStatusMessage("");
          setIsOpen(false);
        }, 3000);

      } catch (fallbackError) {
        toast({
          title: "Registration Failed",
          description: "Unable to register student. Please check Firebase connection.",
          variant: "destructive"
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const resetForm = () => {
    setRollNumber("");
    setStudentName("");
    setRegistrationStatus('idle');
    setStatusMessage("");
    setIsRegistering(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <i className="fas fa-user-plus mr-2"></i>
          Register New Student
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Student</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            {registrationStatus === 'idle' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="Enter roll number (e.g., 245)"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled={isRegistering}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    disabled={isRegistering}
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Face Recognition Setup</p>
                      <p>After clicking register, your camera will activate to capture face samples for secure attendance verification.</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRegistration}
                  disabled={isRegistering || !rollNumber.trim() || !studentName.trim()}
                  className="w-full"
                >
                  <i className="fas fa-camera mr-2"></i>
                  Start Registration
                </Button>
              </>
            )}

            {registrationStatus !== 'idle' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  {registrationStatus === 'capturing' && (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {registrationStatus === 'success' && (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check-circle text-2xl text-green-600"></i>
                    </div>
                  )}
                  
                  {registrationStatus === 'failed' && (
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-times-circle text-2xl text-red-600"></i>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {registrationStatus === 'capturing' && "Capturing Face Samples"}
                    {registrationStatus === 'success' && "Registration Complete"}
                    {registrationStatus === 'failed' && "Registration Failed"}
                  </h3>
                  <p className="text-sm text-gray-600">{statusMessage}</p>
                </div>
                
                {registrationStatus === 'capturing' && (
                  <div className="text-xs text-gray-500">
                    Please look directly at the camera and keep your face visible
                  </div>
                )}
                
                {registrationStatus === 'failed' && (
                  <Button onClick={handleRegistration} size="sm">
                    <i className="fas fa-redo mr-2"></i>
                    Try Again
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}