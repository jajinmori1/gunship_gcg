import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Members() {
  const { isAdmin, userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'totalPower', direction: 'desc' });

  async function fetchMembers() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 전투력 기준 정렬
      membersData.sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0));
      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error('회원 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  // 검색 필터
  useEffect(() => {
    const filtered = members.filter(member =>
      member.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 정렬 적용
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
    
    setFilteredMembers(sorted);
  }, [searchTerm, members, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // 회원 삭제
  async function handleDeleteMember(member) {
    if (member.id === userProfile?.id) {
      alert('자기 자신은 삭제할 수 없습니다.');
      return;
    }
    
    if (member.role === 'admin') {
      alert('관리자는 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`"${member.nickname}" 회원을 삭제하시겠습니까?\n참가 기록도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      // 해당 회원의 참가 기록 삭제
      const participationsSnapshot = await getDocs(collection(db, 'participations'));
      const participationsToDelete = participationsSnapshot.docs.filter(
        doc => doc.data().memberId === member.id
      );
      
      for (const pDoc of participationsToDelete) {
        await deleteDoc(doc(db, 'participations', pDoc.id));
      }

      // 회원 삭제
      await deleteDoc(doc(db, 'users', member.id));
      
      // 목록 새로고침
      await fetchMembers();
    } catch (error) {
      console.error('회원 삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  }

  // 전투력 포맷팅
  const formatPower = (power) => {
    if (!power) return '-';
    return power.toLocaleString();
  };

  // 정렬 아이콘
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-600" />;
    }
    return sortConfig.direction === 'desc' 
      ? <ChevronDownIcon className="w-4 h-4 text-gold-400" />
      : <ChevronUpIcon className="w-4 h-4 text-gold-400" />;
  };

  if (loading) {
    return <LoadingSpinner message="회원 목록 로딩 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">회원 목록</h1>
          <p className="text-gray-400">총 {members.length}명의 연합원</p>
        </div>

        {/* 검색 */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="닉네임 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-navy-800 border border-navy-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-700">
              <tr>
                <th className="px-4 py-4 text-left text-gray-400 font-medium">
                  #
                </th>
                <th className="px-4 py-4 text-left text-gray-400 font-medium">
                  닉네임
                </th>
                <th 
                  className="px-4 py-4 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('totalPower')}
                >
                  <div className="flex items-center justify-end gap-1">
                    총 전투력
                    <SortIcon columnKey="totalPower" />
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('firstLinePower')}
                >
                  <div className="flex items-center justify-end gap-1">
                    1진 전투력
                    <SortIcon columnKey="firstLinePower" />
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('secondLinePower')}
                >
                  <div className="flex items-center justify-end gap-1">
                    2진 전투력
                    <SortIcon columnKey="secondLinePower" />
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-gray-400 font-medium">
                  역할
                </th>
                {isAdmin() && (
                  <th className="px-4 py-4 text-center text-gray-400 font-medium">
                    관리
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-600">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className="hover:bg-navy-700/50 transition-colors"
                  >
                    <td className="px-4 py-4 text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-steel-500/30 rounded-full flex items-center justify-center text-steel-300 font-medium">
                          {member.nickname?.charAt(0) || '?'}
                        </div>
                        <span className="text-white font-medium">
                          {member.nickname || '이름 없음'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-gold-400 font-mono">
                      {formatPower(member.totalPower)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-300 font-mono">
                      {formatPower(member.firstLinePower)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-300 font-mono">
                      {formatPower(member.secondLinePower)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {member.role === 'admin' ? (
                        <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm">
                          관리자
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-steel-500/20 text-steel-300 rounded-full text-sm">
                          멤버
                        </span>
                      )}
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-4 text-center">
                        {member.role !== 'admin' && member.id !== userProfile?.id && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-2 text-gray-400 hover:text-danger transition-colors"
                            title="회원 삭제"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin() ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일용 카드 뷰 */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map((member, index) => (
          <div 
            key={member.id}
            className="bg-navy-800 rounded-xl p-4 border border-navy-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">#{index + 1}</span>
                <div className="w-10 h-10 bg-steel-500/30 rounded-full flex items-center justify-center text-steel-300 font-medium">
                  {member.nickname?.charAt(0) || '?'}
                </div>
                <span className="text-white font-medium">{member.nickname}</span>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded-full text-xs">
                    관리자
                  </span>
                )}
                {isAdmin() && member.role !== 'admin' && member.id !== userProfile?.id && (
                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="p-1 text-gray-400 hover:text-danger transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-500">총 전투력</p>
                <p className="text-gold-400 font-mono">{formatPower(member.totalPower)}</p>
              </div>
              <div>
                <p className="text-gray-500">1진</p>
                <p className="text-gray-300 font-mono">{formatPower(member.firstLinePower)}</p>
              </div>
              <div>
                <p className="text-gray-500">2진</p>
                <p className="text-gray-300 font-mono">{formatPower(member.secondLinePower)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
