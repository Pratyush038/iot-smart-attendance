import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollNumber: string;
  onVerificationComplete: (verified: boolean, studentName?: string) => void;
}

export default function FaceVerificationModal({ 
  isOpen, 
  onClose, 
  rollNumber, 
  onVerificationComplete 
}: FaceVerificationModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [countdown, setCountdown] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && rollNumber) {
      startVerification();
    }
  }, [isOpen, rollNumber]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verificationStatus === 'verifying' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && verificationStatus === 'verifying') {
      setVerificationStatus('failed');
      setVerificationMessage('Verification timeout. Please try again.');
    }
    return () => clearTimeout(timer);
  }, [countdown, verificationStatus]);

  const startVerification = async () => {
    setVerificationStatus('verifying');
    setVerificationMessage('Initializing camera for face verification...');
    setCountdown(15);

    try {
      // Check if face recognition service is available first
      const statusResponse = await fetch('http://localhost:5001/status', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (!statusResponse.ok) {
        throw new Error('Service unavailable');
      }

      // Call face recognition service
      const response = await fetch('http://localhost:5001/verify-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roll_number: rollNumber
        }),
        signal: AbortSignal.timeout(20000) // 20 second timeout
      });

      const result = await response.json();

      if (result.success && result.verified) {
        setVerificationStatus('success');
        setVerificationMessage(`Face verified successfully! Welcome ${result.name}`);
        
        toast({
          title: "Face Verification Successful!",
          description: `Welcome ${result.name} (Roll #${rollNumber})`,
        });

        setTimeout(() => {
          onVerificationComplete(true, result.name);
        }, 2000);
      } else {
        setVerificationStatus('failed');
        setVerificationMessage(result.error || result.reason || 'Face verification failed');
        
        toast({
          title: "Face Verification Failed",
          description: result.error || result.reason || 'Face does not match roll number',
          variant: "destructive"
        });

        setTimeout(() => {
          onVerificationComplete(false);
        }, 3000);
      }
    } catch (error) {
      setVerificationStatus('failed');
      setVerificationMessage('Unable to connect to face recognition service. Please ensure camera is connected and service is running.');
      
      toast({
        title: "Service Error",
        description: "Face recognition service unavailable. Marking attendance without verification.",
        variant: "destructive"
      });

      // Fall back to marking attendance without face verification after 3 seconds
      setTimeout(() => {
        onVerificationComplete(true, `Student ${rollNumber}`);
      }, 3000);
    }
  };

  const retryVerification = () => {
    startVerification();
  };

  const skipVerification = () => {
    toast({
      title: "Verification Skipped",
      description: "Attendance marked without face verification",
    });
    onVerificationComplete(true, `Student ${rollNumber}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Face Verification Required</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold">Roll Number: {rollNumber}</div>
              
              {/* Verification Status Icon */}
              <div className="flex justify-center">
                {verificationStatus === 'idle' && (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-circle text-3xl text-gray-400"></i>
                  </div>
                )}
                
                {verificationStatus === 'verifying' && (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-camera text-blue-600"></i>
                    </div>
                  </div>
                )}
                
                {verificationStatus === 'success' && (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-check-circle text-3xl text-green-600"></i>
                  </div>
                )}
                
                {verificationStatus === 'failed' && (
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-times-circle text-3xl text-red-600"></i>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{verificationMessage}</p>
                
                {verificationStatus === 'verifying' && (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-blue-600">
                      {countdown} seconds remaining
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(countdown / 15) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Please position your face clearly in front of the camera
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-4">
                {verificationStatus === 'failed' && (
                  <>
                    <Button 
                      onClick={retryVerification}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <i className="fas fa-redo mr-2"></i>
                      Retry
                    </Button>
                    <Button 
                      onClick={skipVerification}
                      variant="outline"
                    >
                      Skip Verification
                    </Button>
                  </>
                )}
                
                {verificationStatus === 'verifying' && (
                  <Button 
                    onClick={skipVerification}
                    variant="outline"
                    size="sm"
                  >
                    Skip Verification
                  </Button>
                )}
                
                {(verificationStatus === 'success' || verificationStatus === 'idle') && (
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}