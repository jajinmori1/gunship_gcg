import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  GlobeAsiaAustraliaIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/', label: '대시보드', icon: HomeIcon },
  { path: '/members', label: '회원 목록', icon: UsersIcon },
  { path: '/worldwar', label: '세계대전', icon: GlobeAsiaAustraliaIcon },
  { path: '/teams', label: '조편성', icon: UserGroupIcon },
  { path: '/settings', label: '설정', icon: Cog6ToothIcon },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <nav className="bg-navy-800 border-b border-navy-600 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-gold-500 text-2xl font-bold">⚔️</span>
            <span className="text-white text-lg font-semibold hidden sm:block">
              GameChanGer
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base transition-colors ${
                    isActive
                      ? 'bg-navy-600 text-gold-400'
                      : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 사용자 정보 & 로그아웃 */}
          <div className="hidden md:flex items-center gap-4">
            {userProfile && (
              <span className="text-gray-300 text-sm">
                {userProfile.nickname || '닉네임 없음'}
                {userProfile.role === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 bg-gold-500 text-navy-900 text-xs rounded-full font-medium">
                    관리자
                  </span>
                )}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="text-sm">로그아웃</span>
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-navy-600">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors ${
                    isActive
                      ? 'bg-navy-600 text-gold-400'
                      : 'text-gray-300 hover:bg-navy-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-navy-600 px-4">
              {userProfile && (
                <div className="text-gray-300 mb-3">
                  {userProfile.nickname || '닉네임 없음'}
                  {userProfile.role === 'admin' && (
                    <span className="ml-2 px-2 py-0.5 bg-gold-500 text-navy-900 text-xs rounded-full font-medium">
                      관리자
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

