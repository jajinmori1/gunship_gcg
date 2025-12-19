import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Login() {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 경우 대시보드로 이동
  if (currentUser) {
    navigate('/');
    return null;
  }

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            GameChanGer
          </h1>
          <p className="text-gray-400 text-lg">
            건쉽배틀토탈워페어 연합 관리 시스템
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-navy-800 rounded-2xl p-8 shadow-xl border border-navy-600">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            로그인
          </h2>

          {error && (
            <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </button>

          <p className="text-gray-500 text-sm text-center mt-6">
            로그인하면 연합 관리 기능을 이용할 수 있습니다
          </p>
        </div>

        {/* 푸터 */}
        <p className="text-gray-600 text-sm text-center mt-8">
          © 2024 GameChanGer. All rights reserved.
        </p>
      </div>
    </div>
  );
}

