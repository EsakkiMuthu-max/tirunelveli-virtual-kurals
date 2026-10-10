import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import CitizenDashboard from "@/pages/CitizenDashboard";
import ReportIssue from "@/pages/ReportIssue";
import MyReports from "@/pages/MyReports";
import OfficerDashboard from "@/pages/OfficerDashboard";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/citizen" element={<CitizenDashboard />} />
        <Route path="/citizen/report" element={<ReportIssue />} />
        <Route path="/citizen/reports" element={<MyReports />} />
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}
