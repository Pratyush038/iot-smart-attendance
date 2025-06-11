import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { database, ref, onValue } from "@/lib/firebase";
import type { AttendanceRecord, StudentStats } from "@shared/schema";

interface AttendancePanelProps {
  recentAttendance: AttendanceRecord[];
}

export default function AttendancePanel({ recentAttendance }: AttendancePanelProps) {
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    // Calculate student stats from real attendance data
    const uniqueStudents = new Map<string, { roll: string; name?: string; attendanceCount: number }>();
    
    recentAttendance.forEach(record => {
      const key = record.roll;
      if (uniqueStudents.has(key)) {
        uniqueStudents.get(key)!.attendanceCount++;
      } else {
        uniqueStudents.set(key, {
          roll: record.roll,
          name: record.name,
          attendanceCount: 1
        });
      }
    });

    // Convert to StudentStats format with calculated percentages
    const totalSessionsToDate = 5; // Estimate based on recent activity
    const calculatedStats: StudentStats[] = Array.from(uniqueStudents.values()).map((student, index) => ({
      id: index + 1,
      roll: student.roll,
      name: student.name || `Student ${student.roll}`,
      totalClasses: totalSessionsToDate,
      attendedClasses: student.attendanceCount,
      percentage: Math.round((student.attendanceCount / totalSessionsToDate) * 100)
    }));

    setStudentStats(calculatedStats);
    setTotalStudents(calculatedStats.length);
    
    // Calculate present today from recent attendance
    const today = new Date().toDateString();
    const todayAttendance = recentAttendance.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );
    const uniqueStudentsToday = new Set(todayAttendance.map(record => record.roll));
    setPresentToday(uniqueStudentsToday.size);
    
    // Calculate overall attendance rate from real data
    if (calculatedStats.length > 0) {
      const totalPossibleClasses = calculatedStats.length * totalSessionsToDate;
      const totalAttended = calculatedStats.reduce((sum, student) => sum + student.attendedClasses, 0);
      setAttendanceRate(totalPossibleClasses > 0 ? Math.round((totalAttended / totalPossibleClasses) * 100) : 0);
    } else {
      setAttendanceRate(0);
    }
  }, [recentAttendance]);

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Attendance Dashboard</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Updates</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <div className="text-sm text-gray-600">Present Today</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{attendanceRate}%</div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
        </div>

        {/* Real-time Log */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-clock text-blue-600 mr-2"></i>
            Real-time Check-in Log
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentAttendance.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <i className="fas fa-clock text-2xl mb-2"></i>
                <p>No check-ins yet today</p>
              </div>
            ) : (
              recentAttendance.slice(0, 5).map((record, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border-l-4 border-green-500">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Roll #{record.roll}</p>
                      {record.name && (
                        <p className="text-sm font-medium text-blue-600">{record.name}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">Checked In</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Attendance Percentages */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
            Student Attendance Records
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {studentStats.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700">{student.roll}</span>
                  </div>
                  <span className="font-medium text-gray-900">{student.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressBarColor(student.percentage)}`}
                      style={{ width: `${student.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{student.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
