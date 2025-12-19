import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// 억 단위 변환 함수
const toEok = (value) => value ? (value / 100000000).toFixed(2).replace(/\.?0+$/, '') : '';
const fromEok = (value) => value ? Math.round(parseFloat(value) * 100000000) : 0;

export default function ProfileSetup() {
  const { currentUser, updateUserProfile, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nickname: userProfile?.nickname || '',
    totalPower: toEok(userProfile?.totalPower),
    firstLinePower: toEok(userProfile?.firstLinePower),
    secondLinePower: toEok(userProfile?.secondLinePower)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 닉네임 중복 체크
  const checkNicknameDuplicate = async (nickname) => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.some(doc => {
      const data = doc.data();
      // 본인은 제외
      if (doc.id === currentUser.uid) return false;
      return data.nickname?.toLowerCase() === nickname.toLowerCase();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // 닉네임 중복 체크
      const isDuplicate = await checkNicknameDuplicate(formData.nickname.trim());
      if (isDuplicate) {
        setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
        setLoading(false);
        return;
      }
      
      await updateUserProfile(currentUser.uid, {
        email: currentUser.email,
        nickname: formData.nickname.trim(),
        totalPower: fromEok(formData.totalPower),
        firstLinePower: fromEok(formData.firstLinePower),
        secondLinePower: fromEok(formData.secondLinePower)
      });
      
      navigate('/');
    } catch (err) {
      setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            프로필 설정
          </h1>
          <p className="text-gray-400">
            연합 활동에 필요한 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-navy-800 rounded-2xl p-8 shadow-xl border border-navy-600">
          {error && (
            <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label className="block text-gray-300 text-lg font-medium mb-2">
                게임 닉네임 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="게임에서 사용하는 닉네임"
                className="w-full bg-navy-700 border border-navy-600 rounded-xl px-4 py-3 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                required
              />
            </div>

            {/* 총 전투력 */}
            <div>
              <label className="block text-gray-300 text-lg font-medium mb-2">
                총 전투력 <span className="text-gold-400 text-sm">(억 단위)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="totalPower"
                  value={formData.totalPower}
                  onChange={handleChange}
                  placeholder="예: 1.5"
                  className="w-full bg-navy-700 border border-navy-600 rounded-xl px-4 py-3 pr-12 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">억</span>
              </div>
            </div>

            {/* 1진 전투력 */}
            <div>
              <label className="block text-gray-300 text-lg font-medium mb-2">
                1진 전투력 <span className="text-gold-400 text-sm">(억 단위)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="firstLinePower"
                  value={formData.firstLinePower}
                  onChange={handleChange}
                  placeholder="예: 0.5"
                  className="w-full bg-navy-700 border border-navy-600 rounded-xl px-4 py-3 pr-12 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">억</span>
              </div>
            </div>

            {/* 2진 전투력 */}
            <div>
              <label className="block text-gray-300 text-lg font-medium mb-2">
                2진 전투력 <span className="text-gold-400 text-sm">(억 단위)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="secondLinePower"
                  value={formData.secondLinePower}
                  onChange={handleChange}
                  placeholder="예: 0.4"
                  className="w-full bg-navy-700 border border-navy-600 rounded-xl px-4 py-3 pr-12 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">억</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? '저장 중...' : '저장하고 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

