import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, GraduationCap, Award, BookOpen, Target } from "lucide-react";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  // Sample data for charts
  const performanceData = [
    { month: "Jan", average: 75, target: 80 },
    { month: "Feb", average: 78, target: 80 },
    { month: "Mar", average: 82, target: 80 },
    { month: "Apr", average: 85, target: 80 },
    { month: "May", average: 88, target: 80 },
    { month: "Jun", average: 90, target: 80 },
  ];

  const attendanceData = [
    { day: "Mon", attendance: 92 },
    { day: "Tue", attendance: 88 },
    { day: "Wed", attendance: 95 },
    { day: "Thu", attendance: 90 },
    { day: "Fri", attendance: 85 },
  ];

  const gradeDistribution = [
    { grade: "A", count: 45 },
    { grade: "B", count: 65 },
    { grade: "C", count: 40 },
    { grade: "D", count: 15 },
    { grade: "F", count: 5 },
  ];

  const subjectPerformance = [
    { subject: "Math", score: 85 },
    { subject: "Science", score: 78 },
    { subject: "English", score: 92 },
    { subject: "History", score: 88 },
    { subject: "Arts", score: 95 },
  ];

  const COLORS = ["hsl(245, 60%, 55%)", "hsl(180, 65%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

  const kpiCards = [
    { title: "Total Students", value: "1,245", icon: Users, trend: "+12%", color: "primary" },
    { title: "Average Score", value: "85.5%", icon: Target, trend: "+5%", color: "success" },
    { title: "Attendance Rate", value: "92%", icon: BookOpen, trend: "+3%", color: "accent" },
    { title: "Top Performers", value: "156", icon: Award, trend: "+8%", color: "warning" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time insights into student performance and engagement</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="p-6 shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-bold mb-2">{kpi.value}</h3>
                  <p className="text-sm text-success font-medium">{kpi.trend} from last month</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-${kpi.color} shadow-md`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Trend */}
          <Card className="p-6 shadow-md border-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Performance Trend</h3>
              <p className="text-sm text-muted-foreground">Monthly average scores vs target</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(245, 60%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(245, 60%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="average" stroke="hsl(245, 60%, 55%)" fill="url(#colorAverage)" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="hsl(180, 65%, 50%)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Weekly Attendance */}
          <Card className="p-6 shadow-md border-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Weekly Attendance</h3>
              <p className="text-sm text-muted-foreground">Daily attendance percentage</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Bar dataKey="attendance" fill="hsl(180, 65%, 50%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Grade Distribution */}
          <Card className="p-6 shadow-md border-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Grade Distribution</h3>
              <p className="text-sm text-muted-foreground">Current semester grades</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percent }) => `${grade}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Subject Performance */}
          <Card className="p-6 shadow-md border-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Subject Performance</h3>
              <p className="text-sm text-muted-foreground">Average scores by subject</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="subject" type="category" stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Bar dataKey="score" fill="hsl(245, 60%, 55%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
