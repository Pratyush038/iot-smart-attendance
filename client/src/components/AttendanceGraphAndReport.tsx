import React from "react";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import {
  PieChart,
  Pie,
  Cell
} from "recharts";

// Generate dummy attendance data for 5 students over 3 months (weekdays only)
const students = [
  { roll: "1", name: "Pratyush" },
  { roll: "2", name: "Prateek" },
  { roll: "3", name: "Prajwal" },
  { roll: "4", name: "Prakhar" },
  { roll: "5", name: "Aditya" },
];

const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 3);
startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7)); // go to previous Monday
const endDate = new Date();

// Generate all weekdays between startDate and endDate
function getWeekdaysBetween(start: Date, end: Date) {
  const days = [];
  let d = new Date(start);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}
const allWeekdays = getWeekdaysBetween(startDate, endDate);

// Assign unique attendance rates for each student
const rates = [0.95, 0.8, 0.6, 0.4, 0.9];

// Generate random attendance for each student for each weekday
function generateAttendance() {
  return students.map((student, idx) => {
    const attendance = allWeekdays.map((date, i) => {
      const present = Math.random() < rates[idx];
      return { date: date.toISOString().slice(0, 10), present };
    });
    return { ...student, attendance };
  });
}
const attendanceData = generateAttendance();

// Prepare data for chart: for each date, show cumulative attendance % for each student
const chartData = allWeekdays.map((date, i) => {
  const entry: any = { date: date.toISOString().slice(0, 10) };
  attendanceData.forEach((student) => {
    const attended = student.attendance.slice(0, i + 1).filter((a) => a.present).length;
    const percent = Math.round((attended / (i + 1)) * 100);
    entry[student.name] = percent;
  });
  return entry;
});

// Prepare data for report: attendance % for each student
const reportData = attendanceData.map((student) => {
  const total = student.attendance.length;
  const present = student.attendance.filter((a) => a.present).length;
  return {
    ...student,
    percentage: Math.round((present / total) * 100),
    present,
    total,
  };
});

export default function AttendanceGraphAndReport() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">IoT Class Attendance (Last 3 Months)</h2>
      <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {reportData.map((row, idx) => {
          const COLORS = ["#2563eb", "#22c55e", "#f59e42", "#ef4444", "#a21caf"];
          const pieData = [
            { name: "Attended", value: row.present },
            { name: "Missed", value: row.total - row.present },
          ];
          return (
            <div key={row.roll} className="flex flex-col items-center bg-gray-50 rounded-xl p-6 shadow">
              <PieChart width={180} height={180}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell key="attended" fill={COLORS[idx % COLORS.length]} />
                  <Cell key="missed" fill="#e5e7eb" />
                </Pie>
                <text
                  x={90}
                  y={90}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-bold text-xl"
                  fill="#111827"
                >
                  {row.percentage}%
                </text>
              </PieChart>
              <div className="mt-4 text-lg font-semibold text-gray-900">{row.name}</div>
              <div className="text-sm text-gray-500">{row.present} / {row.total} classes</div>
            </div>
          );
        })}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Attendance Report</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Days Present</TableHead>
              <TableHead>Total Days</TableHead>
              <TableHead>Attendance %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((row) => (
              <TableRow key={row.roll}>
                <TableCell>{row.roll}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.present}</TableCell>
                <TableCell>{row.total}</TableCell>
                <TableCell>
                  <span className={`font-bold ${row.percentage >= 85 ? "text-green-600" : row.percentage >= 60 ? "text-yellow-600" : "text-red-600"}`}>{row.percentage}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 