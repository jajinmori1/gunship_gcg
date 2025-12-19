import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import WorldWar from './pages/WorldWar';
import Teams from './pages/Teams';
import Settings from './pages/Settings';

// 프로필 체크 래퍼
function ProfileCheck({ children }) {
  const { userProfile, loading } = useAuth();

  // 로딩 중이거나, 프로필을 아직 가져오는 중 (undefined)
  if (loading || userProfile === undefined) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 프로필이 없거나 (null) 닉네임이 없으면 프로필 설정 페이지로
  if (userProfile === null || !userProfile.nickname) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={<Login />} />
      
      {/* 프로필 설정 (로그인 필요, 프로필 체크 안함) */}
      <Route
        path="/profile-setup"
        element={
          <PrivateRoute>
            <ProfileSetup />
          </PrivateRoute>
        }
      />

      {/* 보호된 라우트 (프로필 필요) */}
      <Route
        element={
          <PrivateRoute>
            <ProfileCheck>
              <Layout />
            </ProfileCheck>
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/worldwar" element={<WorldWar />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 404 - 대시보드로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename="/gunship_gcg">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
