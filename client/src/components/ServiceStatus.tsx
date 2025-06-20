import { useState, useEffect } from "react";

export default function ServiceStatus() {
  const [faceServiceStatus, setFaceServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const response = await fetch('http://localhost:5001/status', {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          setFaceServiceStatus('online');
        } else {
          setFaceServiceStatus('offline');
        }
      } catch (error) {
        setFaceServiceStatus('offline');
      }
    };

    checkServiceStatus();
    const interval = setInterval(checkServiceStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Firebase Connected</span>
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        {faceServiceStatus === 'checking' && (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-600">Face Service Checking...</span>
          </>
        )}
        {faceServiceStatus === 'online' && (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600">Face Recognition Online</span>
          </>
        )}
        {faceServiceStatus === 'offline' && (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-600">Face Service Offline</span>
          </>
        )}
      </div>
    </div>
  );
}