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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import LessonView from "./pages/LessonView";
import BookRecommendations from "./pages/BookRecommendations";
import QuizAssessment from "./pages/QuizAssessment";
import BecomeTutor from "./pages/BecomeTutor";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentManagement from "./pages/admin/ContentManagement";
import CourseCreate from "./pages/admin/CourseCreate";
import CourseDetail from "./pages/admin/CourseDetail";
import TutorApplications from "./pages/admin/TutorApplications";

import Analytics from "./pages/admin/Analytics";
import TutorDashboard from "./pages/admin/TutorDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminProfile from "./pages/admin/AdminProfile";

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

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

        <Route element={<ProtectedRoute allowedRoles={["learner", "admin", "tutor"]} />}>
            <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/certificate/:courseId?" element={<Certificate />} />
            <Route path="/ai-roleplay" element={<AIRolePlay />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/lesson/:id" element={<LessonView />} />
            <Route path="/books" element={<BookRecommendations />} />
            <Route path="/quiz/:id" element={<QuizAssessment />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/become-tutor" element={<BecomeTutor />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/tutor-applications" element={<TutorApplications />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin", "tutor"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/content" element={<ContentManagement />} />
            <Route path="/admin/courses/new" element={<CourseCreate />} />
            <Route path="/admin/courses/:id" element={<CourseDetail />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["tutor"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/tutor-dashboard" element={<TutorDashboard />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
