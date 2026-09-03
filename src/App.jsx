import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import MyPage from "./pages/MyPage.jsx";
import LetterView from "./pages/LetterView.jsx";
import Settings from "./pages/Settings.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.jsx";
import AdminTestMode from "./pages/admin/AdminTestMode.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth" element={<AuthCallback />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/letter/:day" element={<LetterView />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
      <Route path="/admin/test" element={<AdminTestMode />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
