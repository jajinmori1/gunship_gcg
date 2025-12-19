import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// 억 단위 변환 함수
const toEok = (value) => value ? (value / 100000000).toFixed(2).replace(/\.?0+$/, '') : '';
const fromEok = (value) => value ? Math.round(parseFloat(value) * 100000000) : 0;

export default function Settings() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    nickname: userProfile?.nickname || '',
    totalPower: toEok(userProfile?.totalPower),
    firstLinePower: toEok(userProfile?.firstLinePower),
    secondLinePower: toEok(userProfile?.secondLinePower)
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccess(false);
  };

  // 닉네임 중복 체크
  const checkNicknameDuplicate = async (nickname) => {
    const snapshot = await getDocs(collection(db, 'users'));
    
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

      // 닉네임이 변경된 경우에만 중복 체크
      if (formData.nickname.trim() !== userProfile?.nickname) {
        const isDuplicate = await checkNicknameDuplicate(formData.nickname.trim());
        if (isDuplicate) {
          setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
          setLoading(false);
          return;
        }
      }
      
      await updateUserProfile(currentUser.uid, {
        nickname: formData.nickname.trim(),
        totalPower: fromEok(formData.totalPower),
        firstLinePower: fromEok(formData.firstLinePower),
        secondLinePower: fromEok(formData.secondLinePower)
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">개인 설정</h1>
        <p className="text-gray-400">내 프로필 정보를 수정합니다</p>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-600">
          <div className="w-16 h-16 bg-steel-500/30 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10 text-steel-400" />
          </div>
          <div>
            <p className="text-white text-lg font-medium">{userProfile?.nickname || '닉네임 없음'}</p>
            <p className="text-gray-400 text-sm">{currentUser?.email}</p>
            {userProfile?.role === 'admin' && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded-full text-xs">
                관리자
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/20 border border-success/50 text-success px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              저장되었습니다!
            </div>
          )}

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
            <p className="text-gray-500 text-sm mt-1">
              = {formData.totalPower ? fromEok(formData.totalPower).toLocaleString() : '-'}
            </p>
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
            <p className="text-gray-500 text-sm mt-1">
              = {formData.firstLinePower ? fromEok(formData.firstLinePower).toLocaleString() : '-'}
            </p>
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
            <p className="text-gray-500 text-sm mt-1">
              = {formData.secondLinePower ? fromEok(formData.secondLinePower).toLocaleString() : '-'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
        </form>
      </div>

      {/* 계정 정보 */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
        <h2 className="text-lg font-semibold text-white mb-4">계정 정보</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">이메일</span>
            <span className="text-white">{currentUser?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">가입일</span>
            <span className="text-white">
              {userProfile?.createdAt?.toDate?.().toLocaleDateString('ko-KR') || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">마지막 수정</span>
            <span className="text-white">
              {userProfile?.updatedAt?.toDate?.().toLocaleDateString('ko-KR') || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

