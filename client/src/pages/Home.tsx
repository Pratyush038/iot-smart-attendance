import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { database, ref, onValue } from "@/lib/firebase";
import { get, child } from "firebase/database";
import VideoSimulation from "@/components/VideoSimulation";
import SensorsPanel from "@/components/SensorsPanel";
import CentralNotification from "@/components/CentralNotification";
import StudentRegistration from "@/components/StudentRegistration";
import ServiceStatus from "@/components/ServiceStatus";
import type { AttendanceRecord } from "@shared/schema";
import AttendanceGraphAndReport from "@/components/AttendanceGraphAndReport";

const AttendancePanel = lazy(() => import("@/components/AttendancePanel"));

export default function Home() {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [latestEntry, setLatestEntry] = useState<AttendanceRecord | null>(null);
  const [lastProcessedKey, setLastProcessedKey] = useState<string | null>(null);
  // Face verification state
  const [rollNumber, setRollNumber] = useState("");
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [studentList, setStudentList] = useState<{ roll: string; name: string }[]>([]);

  useEffect(() => {
    // Listen for real-time attendance updates from Firebase
    const attendanceRef = ref(database, 'attendance');
    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataEntries = Object.entries(data);
        const attendanceArray: AttendanceRecord[] = dataEntries
          .map(([key, record]: [string, any]) => ({
            key,
            timestamp: record.timestamp || new Date().toISOString(),
            roll: record.roll,
            name: record.name,
            proximity: record.proximity
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Check for new entries by comparing the latest key
        if (attendanceArray.length > 0) {
          const newest = attendanceArray[0];
          if (newest.key && newest.key !== lastProcessedKey) {
            setLatestEntry(newest);
            setLastProcessedKey(newest.key || "");
          }
        }
        
        setRecentAttendance(attendanceArray);
      }
    });

    return () => unsubscribe();
  }, [lastProcessedKey]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setCameraError(message);
      }
    };

    startCamera();
  }, []);

  useEffect(() => {
    const studentsRef = ref(database, "students");
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rollMap = new Map();
        Object.values(data)
          .filter((value: any) => value.roll_number && value.name)
          .forEach((value: any) => {
            rollMap.set(value.roll_number, value.name);
          });
        const list = Array.from(rollMap.entries()).map(([roll, name]) => ({ roll, name })).sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
        setStudentList(list);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAttendanceSubmit = (record: AttendanceRecord) => {
    const today = new Date().toISOString().split("T")[0];
    const alreadyMarked = recentAttendance.some((entry) => {
      return (
        entry.roll === record.roll &&
        String(entry.timestamp).split("T")[0] === today
      );
    });

    if (!alreadyMarked) {
      const newRecord = {
        key: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        roll: record.roll,
        name: record.name,
        proximity: true
      };
      setRecentAttendance(prev => [newRecord, ...prev]);
      setLatestEntry(newRecord);
      setLastProcessedKey(newRecord.key);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-microchip text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Smart Attendance System</h1>
                <p className="text-sm text-gray-500">Sensor Simulation & Real-time Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ServiceStatus />
              <StudentRegistration />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <i className="fas fa-cog mr-2"></i>Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Central Notification */}
      <CentralNotification latestEntry={latestEntry} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Face Verification Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Face Verification</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div>
              <video
                ref={videoRef}
                className="rounded border w-full sm:max-w-xs"
                style={{ maxHeight: "200px" }}
                autoPlay
                muted
              />
              {cameraError && (
                <p className="mt-2 text-sm text-red-600">Camera error: {cameraError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter Roll Number"
                className="border px-4 py-2 rounded-md w-full sm:w-auto"
              />
              <button
                onClick={async () => {
                  setVerifying(true);
                  setVerificationResult(null);
                  try {
                    const res = await fetch("http://localhost:5001/verify-face", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roll_number: rollNumber }),
                    });
                    const data = await res.json();
                    if (data.verified) {
                      setVerificationResult(`✅ Verified: ${data.name}`);
                      const today = new Date().toISOString().split("T")[0];
                      const alreadyMarked = recentAttendance.some((entry) => {
                        return (
                          entry.roll === rollNumber &&
                          String(entry.timestamp).split("T")[0] === today
                        );
                      });
                      if (!alreadyMarked) {
                        const newRecord = {
                          key: `temp-${Date.now()}`,
                          timestamp: new Date().toISOString(),
                          roll: rollNumber,
                          name: data.name,
                          proximity: true
                        };
                        setRecentAttendance(prev => [newRecord, ...prev]);
                        setLatestEntry(newRecord);
                        setLastProcessedKey(newRecord.key);
                      }
                    } else {
                      setVerificationResult("❌ Face not matched.");
                    }
                  } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : "Unknown error";
                    setVerificationResult(`❌ Error: ${errorMsg}`);
                  } finally {
                    setVerifying(false);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                disabled={verifying || !rollNumber}
              >
                {verifying ? "Verifying..." : "Verify Face"}
              </button>
            </div>
          </div>
          {verificationResult && (
            <p className="mt-3 text-sm text-gray-700">{verificationResult}</p>
          )}
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Student Roster</h2>
          {studentList.length === 0 ? (
            <p className="text-sm text-gray-500">Loading student list...</p>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-users text-blue-600"></i>
                Student Roster
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {studentList.map((student) => (
                  <div
                    key={student.roll}
                    className="flex items-center gap-4 bg-white rounded-xl p-4 shadow hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shadow-inner">
                      {student.roll}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">{student.name}</div>
                      <div className="text-xs text-gray-500">Roll No: {student.roll}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Simulation Section */}
        <VideoSimulation />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Sensors Control */}
          <SensorsPanel onAttendanceSubmit={handleAttendanceSubmit} />

          {/* Right Panel: Attendance Data */}
          <Suspense fallback={<div className="text-center py-8 text-lg text-gray-400">Loading dashboard...</div>}>
            <AttendancePanel recentAttendance={recentAttendance} studentList={studentList} />
          </Suspense>
        </div>
      </main>
      <AttendanceGraphAndReport />
    </div>
  );
}
