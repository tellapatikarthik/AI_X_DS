import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";

const Students = () => {
  const students = [
    { id: 1, name: "Alice Johnson", grade: "A", attendance: 95, email: "alice.j@school.edu", status: "Active" },
    { id: 2, name: "Bob Smith", grade: "B+", attendance: 88, email: "bob.s@school.edu", status: "Active" },
    { id: 3, name: "Carol Williams", grade: "A-", attendance: 92, email: "carol.w@school.edu", status: "Active" },
    { id: 4, name: "David Brown", grade: "B", attendance: 85, email: "david.b@school.edu", status: "Active" },
    { id: 5, name: "Emma Davis", grade: "A+", attendance: 98, email: "emma.d@school.edu", status: "Active" },
    { id: 6, name: "Frank Miller", grade: "C+", attendance: 78, email: "frank.m@school.edu", status: "Warning" },
    { id: 7, name: "Grace Wilson", grade: "A", attendance: 94, email: "grace.w@school.edu", status: "Active" },
    { id: 8, name: "Henry Moore", grade: "B-", attendance: 82, email: "henry.m@school.edu", status: "Active" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Warning":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-success font-semibold";
    if (grade.startsWith("B")) return "text-primary font-semibold";
    if (grade.startsWith("C")) return "text-warning font-semibold";
    return "text-destructive font-semibold";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Student Management
          </h1>
          <p className="text-muted-foreground">Manage and monitor student information and performance</p>
        </div>

        {/* Actions Bar */}
        <Card className="p-6 mb-6 shadow-md border-0">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students by name or email..." 
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="hero" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </Card>

        {/* Students Table */}
        <Card className="shadow-md border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Grade</TableHead>
                  <TableHead className="font-semibold">Attendance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">#{student.id}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className={getGradeColor(student.grade)}>{student.grade}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-gradient-accent transition-all"
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="p-6 shadow-md border-0">
            <h3 className="text-sm text-muted-foreground mb-2">Total Students</h3>
            <p className="text-3xl font-bold">1,245</p>
          </Card>
          <Card className="p-6 shadow-md border-0">
            <h3 className="text-sm text-muted-foreground mb-2">Active Students</h3>
            <p className="text-3xl font-bold text-success">1,180</p>
          </Card>
          <Card className="p-6 shadow-md border-0">
            <h3 className="text-sm text-muted-foreground mb-2">Needs Attention</h3>
            <p className="text-3xl font-bold text-warning">65</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Students;
