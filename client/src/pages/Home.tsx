import { useState, useEffect } from "react";
import { database, ref, onValue } from "@/lib/firebase";
import VideoSimulation from "@/components/VideoSimulation";
import SensorsPanel from "@/components/SensorsPanel";
import AttendancePanel from "@/components/AttendancePanel";
import CentralNotification from "@/components/CentralNotification";
import type { AttendanceRecord } from "@shared/schema";

export default function Home() {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [latestEntry, setLatestEntry] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    // Listen for real-time attendance updates from Firebase
    const attendanceRef = ref(database, 'attendance');
    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const attendanceArray: AttendanceRecord[] = Object.values(data)
          .map((record: any) => ({
            timestamp: record.timestamp || new Date().toISOString(),
            roll: record.roll,
            name: record.name,
            proximity: record.proximity
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Check for new entries (trigger central notification)
        if (attendanceArray.length > 0) {
          const newest = attendanceArray[0];
          if (!latestEntry || newest.timestamp !== latestEntry.timestamp) {
            setLatestEntry(newest);
          }
        }
        
        setRecentAttendance(attendanceArray);
      }
    });

    return () => unsubscribe();
  }, [latestEntry]);

  const handleAttendanceSubmit = (record: AttendanceRecord) => {
    // Update local state immediately for better UX
    setRecentAttendance(prev => [record, ...prev]);
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
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Firebase Connected</span>
              </div>
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
        {/* Video Simulation Section */}
        <VideoSimulation />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Sensors Control */}
          <SensorsPanel onAttendanceSubmit={handleAttendanceSubmit} />

          {/* Right Panel: Attendance Data */}
          <AttendancePanel recentAttendance={recentAttendance} />
        </div>
      </main>
    </div>
  );
}
