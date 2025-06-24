import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { database, ref, onValue } from "@/lib/firebase";
import type { AttendanceRecord, StudentStats } from "@shared/schema";
import { max } from "drizzle-orm";

interface AttendancePanelProps {
  recentAttendance: AttendanceRecord[];
  studentList: { roll: string; name: string }[];
}

export default function AttendancePanel({ recentAttendance, studentList }: AttendancePanelProps) {
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [presentToday, setPresentToday] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    // Total students from roster
    const totalStudents = studentList.length;

    // Calculate present today (unique roll numbers for today)
    const today = new Date().toDateString();
    const todayAttendance = recentAttendance.filter(record => new Date(record.timestamp).toDateString() === today);
    const uniqueStudentsToday = new Set(todayAttendance.map(record => record.roll));
    setPresentToday(uniqueStudentsToday.size);

    // Calculate student stats (unique per roll, based on roster)
    const todayRolls = new Set(todayAttendance.map(record => record.roll));
    const stats: StudentStats[] = studentList.map((student, idx) => {
      const attendedToday = todayRolls.has(student.roll);
      return {
        id: idx + 1,
        roll: student.roll,
        name: student.name,
        totalClasses: 1,
        attendedClasses: attendedToday ? 1 : 0,
        percentage: attendedToday ? 100 : 0
      };
    });
    setStudentStats(stats);

    // Attendance rate: presentToday / totalStudents * 100, capped at 100
    const rate = totalStudents > 0 ? Math.min(100, Math.round((uniqueStudentsToday.size / totalStudents) * 100)) : 0;
    setAttendanceRate(rate);
  }, [recentAttendance, studentList]);

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-white shadow-lg rounded-2xl border-0">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance Dashboard</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-base text-gray-500 font-medium">Live Updates</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl shadow hover:shadow-md transition-all">
            <div className="text-3xl font-extrabold text-blue-700">{studentList.length}</div>
            <div className="text-base text-gray-700 mt-1">Total Students</div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl shadow hover:shadow-md transition-all">
            <div className="text-3xl font-extrabold text-green-700">{presentToday}</div>
            <div className="text-base text-gray-700 mt-1">Present Today</div>
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl shadow hover:shadow-md transition-all">
            <div className="text-3xl font-extrabold text-orange-600">{attendanceRate}%</div>
            <div className="text-base text-gray-700 mt-1">Attendance Rate</div>
          </div>
        </div>

        {/* Real-time Log */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-clock text-blue-600"></i>
            Real-time Check-in Log
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {recentAttendance.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <i className="fas fa-clock text-2xl mb-2"></i>
                <p>No check-ins yet today</p>
              </div>
            ) : (
              recentAttendance.slice(0, 5).map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border-l-4 border-green-500 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow">
                      <i className="fas fa-check text-white text-base"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">Roll #{record.roll}</p>
                      {record.name && (
                        <p className="text-sm font-medium text-blue-600">{record.name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-600 text-base font-semibold">Checked In</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Attendance Percentages */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-blue-600"></i>
            Student Attendance Records
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {studentStats.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <i className="fas fa-user-slash text-2xl mb-2"></i>
                <p>No student attendance records yet</p>
              </div>
            ) : (
              studentStats.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between py-3 px-2 rounded-xl transition-all hover:bg-blue-50 ${student.percentage === 100 ? 'border border-green-300 bg-green-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-base font-bold text-gray-700">{student.roll}</span>
                    </div>
                    <span className="font-medium text-gray-900 text-lg">{student.name}</span>
                    {student.percentage === 100 && (
                      <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">Perfect</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="w-28 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${getProgressBarColor(student.percentage)} transition-all`}
                        style={{ width: `${student.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right">{student.percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
