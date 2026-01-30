import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Skills from "./pages/Skills";
import LearningPath from "./pages/LearningPath";
import AIRolePlay from "./pages/AIRoleplay";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import LessonView from "./pages/LessonView";
import BookRecommendations from "./pages/BookRecommendations";
import QuizAssessment from "./pages/QuizAssessment";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentManagement from "./pages/admin/ContentManagement";

import Analytics from "./pages/admin/Analytics";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import TutorDashboard from "./pages/admin/TutorDashboard";

import EditProfile from "./pages/EditProfile";
import Badges from "./pages/Badges";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Community from "./pages/Community";
import Forum from "./pages/Forum";
import Certificate from "./pages/Certificate";


import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Public pages without layout (Login/Register) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Pages with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/forum" element={<Forum />} />
        </Route>

        {/* Learner Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['learner']} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/ai-roleplay" element={<AIRolePlay />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/lesson/:id" element={<LessonView />} />
            <Route path="/books" element={<BookRecommendations />} />
            <Route path="/quiz/:id" element={<QuizAssessment />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/badges" element={<Badges />} />
            {/* Add other learner routes here */}
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<ContentManagement />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>
        </Route>

        {/* Super Admin Route */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/super-dashboard" element={<SuperAdminDashboard />} />
          </Route>
        </Route>

        {/* Tutor Route */}
        <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/tutor-dashboard" element={<TutorDashboard />} />
          </Route>
        </Route>

      </Routes>
    </AuthProvider>
  );
}

export default App;
