import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// 참가 상태: 'yes' = 참가, 'no' = 불참, 'late' = 뜨접, null = 미응답
const PARTICIPATION_STATUS = {
  yes: { label: '참가', color: 'bg-success', textColor: 'text-success', bgLight: 'bg-success/20', icon: CheckCircleIcon },
  no: { label: '불참', color: 'bg-gray-500', textColor: 'text-gray-400', bgLight: 'bg-gray-500/20', icon: XCircleIcon },
  late: { label: '뜨접', color: 'bg-orange-500', textColor: 'text-orange-400', bgLight: 'bg-orange-500/20', icon: ClockIcon },
  pending: { label: '미응답', color: 'bg-warning', textColor: 'text-warning', bgLight: 'bg-warning/20', icon: QuestionMarkCircleIcon }
};

export default function WorldWar() {
  const { userProfile, isAdmin } = useAuth();
  const [wars, setWars] = useState([]);
  const [members, setMembers] = useState([]);
  const [participations, setParticipations] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newWarDate, setNewWarDate] = useState('');
  const [newWarTitle, setNewWarTitle] = useState('');
  const [newWarOpponent, setNewWarOpponent] = useState('');
  const [creating, setCreating] = useState(false);
  
  // 뜨접 사유 모달
  const [showLateModal, setShowLateModal] = useState(false);
  const [lateWarId, setLateWarId] = useState(null);
  const [lateReason, setLateReason] = useState('');

  // 참가 현황 상세 모달
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalData, setStatusModalData] = useState({ warId: null, status: null, title: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 세계대전 목록 가져오기
      const warsQuery = query(
        collection(db, 'worldWars'),
        orderBy('startDate', 'desc')
      );
      const warsSnapshot = await getDocs(warsQuery);
      const warsData = warsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWars(warsData);

      // 회원 목록 가져오기
      const membersSnapshot = await getDocs(collection(db, 'users'));
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);

      // 참가 기록 가져오기
      const participationsSnapshot = await getDocs(collection(db, 'participations'));
      const participationsMap = {};
      participationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.warId}_${data.memberId}`;
        participationsMap[key] = { id: doc.id, ...data };
      });
      setParticipations(participationsMap);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  // 새 세계대전 생성
  async function handleCreateWar(e) {
    e.preventDefault();
    if (!newWarDate || !newWarTitle) return;

    try {
      setCreating(true);
      await addDoc(collection(db, 'worldWars'), {
        startDate: Timestamp.fromDate(new Date(newWarDate)),
        title: newWarTitle,
        opponent: newWarOpponent,
        status: 'upcoming',
        createdAt: serverTimestamp()
      });
      
      setNewWarDate('');
      setNewWarTitle('');
      setNewWarOpponent('');
      setShowCreateForm(false);
      await fetchData();
    } catch (error) {
      console.error('세계대전 생성 오류:', error);
    } finally {
      setCreating(false);
    }
  }

  // 세계대전 삭제
  async function handleDeleteWar(warId) {
    if (!confirm('이 세계대전을 삭제하시겠습니까?\n참가 기록도 함께 삭제됩니다.')) return;

    try {
      // 해당 세계대전의 참가 기록도 삭제
      const participationsToDelete = Object.entries(participations)
        .filter(([key]) => key.startsWith(warId))
        .map(([, value]) => value.id);
      
      for (const pId of participationsToDelete) {
        await deleteDoc(doc(db, 'participations', pId));
      }
      
      await deleteDoc(doc(db, 'worldWars', warId));
      await fetchData();
    } catch (error) {
      console.error('세계대전 삭제 오류:', error);
    }
  }

  // 참가 여부 등록/수정
  async function handleParticipation(warId, status, reason = '') {
    if (!userProfile?.id) return;

    try {
      const key = `${warId}_${userProfile.id}`;
      const existing = participations[key];

      const data = {
        status,
        reason: status === 'late' ? reason : '',
        updatedAt: serverTimestamp()
      };

      if (existing) {
        await updateDoc(doc(db, 'participations', existing.id), data);
      } else {
        await addDoc(collection(db, 'participations'), {
          warId,
          memberId: userProfile.id,
          ...data,
          registeredAt: serverTimestamp()
        });
      }

      await fetchData();
    } catch (error) {
      console.error('참가 등록 오류:', error);
    }
  }

  // 뜨접 버튼 클릭
  function handleLateClick(warId) {
    setLateWarId(warId);
    setLateReason('');
    setShowLateModal(true);
  }

  // 뜨접 사유 제출
  async function handleLateSubmit() {
    if (!lateReason.trim()) {
      alert('뜨접 사유를 입력해주세요.');
      return;
    }
    await handleParticipation(lateWarId, 'late', lateReason);
    setShowLateModal(false);
    setLateWarId(null);
    setLateReason('');
  }

  // 참가 현황 상세 모달 열기
  function openStatusModal(warId, status, warTitle) {
    setStatusModalData({ warId, status, title: warTitle });
    setShowStatusModal(true);
  }

  // 특정 상태의 회원 목록 가져오기
  function getMembersByStatus(warId, status) {
    return members.filter(member => {
      const key = `${warId}_${member.id}`;
      const p = participations[key];
      
      if (status === 'pending') {
        return !p || !p.status;
      }
      return p?.status === status;
    }).map(member => {
      const key = `${warId}_${member.id}`;
      const p = participations[key];
      return {
        ...member,
        reason: p?.reason || ''
      };
    });
  }

  // 참가 현황 계산
  function getParticipationStats(warId) {
    let yes = 0, no = 0, late = 0;
    members.forEach(member => {
      const key = `${warId}_${member.id}`;
      const p = participations[key];
      if (p?.status === 'yes') yes++;
      else if (p?.status === 'no') no++;
      else if (p?.status === 'late') late++;
    });
    return { yes, no, late, pending: members.length - yes - no - late };
  }

  // 내 참가 여부 확인
  function getMyParticipation(warId) {
    if (!userProfile?.id) return null;
    const key = `${warId}_${userProfile.id}`;
    return participations[key];
  }

  // 날짜 포맷팅
  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // 최근 5개와 이전 기록 분리
  const recentWars = wars.slice(0, 5);
  const olderWars = wars.slice(5);

  if (loading) {
    return <LoadingSpinner message="세계대전 정보 로딩 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">세계대전</h1>
          <p className="text-gray-400">참가 여부를 등록하고 이력을 확인하세요</p>
        </div>

        {isAdmin() && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium px-4 py-3 rounded-xl transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            새 세계대전 등록
          </button>
        )}
      </div>

      {/* 새 세계대전 생성 폼 */}
      {showCreateForm && isAdmin() && (
        <form onSubmit={handleCreateWar} className="bg-navy-800 rounded-xl p-6 border border-navy-600">
          <h3 className="text-lg font-semibold text-white mb-4">새 세계대전 등록</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">타이틀</label>
              <input
                type="text"
                value={newWarTitle}
                onChange={(e) => setNewWarTitle(e.target.value)}
                placeholder="예: 시즌25 4주차"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">상대 서버</label>
              <input
                type="text"
                value={newWarOpponent}
                onChange={(e) => setNewWarOpponent(e.target.value)}
                placeholder="예: 서버123"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">시작 날짜</label>
              <input
                type="date"
                value={newWarDate}
                onChange={(e) => setNewWarDate(e.target.value)}
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={creating}
              className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {creating ? '등록 중...' : '등록'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="bg-navy-600 hover:bg-navy-500 text-white px-6 py-2 rounded-lg"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 뜨접 사유 모달 */}
      {showLateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-navy-800 rounded-2xl p-6 w-full max-w-md border border-navy-600">
            <h3 className="text-xl font-semibold text-white mb-4">뜨접 사유 입력</h3>
            <textarea
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              placeholder="뜨접 사유를 입력해주세요... (예: 저녁 약속으로 9시 이후 참가)"
              rows={3}
              className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleLateSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                뜨접 등록
              </button>
              <button
                onClick={() => setShowLateModal(false)}
                className="px-6 bg-navy-600 hover:bg-navy-500 text-white py-3 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 참가 현황 상세 모달 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-navy-800 rounded-2xl w-full max-w-md max-h-[80vh] border border-navy-600 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-navy-600">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {PARTICIPATION_STATUS[statusModalData.status]?.label} 목록
                </h3>
                <p className="text-gray-400 text-sm">{statusModalData.title}</p>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const membersList = getMembersByStatus(statusModalData.warId, statusModalData.status);
                const statusInfo = PARTICIPATION_STATUS[statusModalData.status];
                
                if (membersList.length === 0) {
                  return (
                    <p className="text-gray-500 text-center py-8">
                      {statusInfo?.label} 인원이 없습니다.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {membersList.map((member, index) => (
                      <div 
                        key={member.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${statusInfo?.bgLight}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusInfo?.color} text-white font-medium text-sm`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${statusInfo?.textColor}`}>
                            {member.nickname}
                          </p>
                          {statusModalData.status === 'late' && member.reason && (
                            <p className="text-gray-400 text-sm mt-1">
                              사유: {member.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-navy-600">
              <p className="text-center text-gray-400 text-sm">
                총 {getMembersByStatus(statusModalData.warId, statusModalData.status).length}명
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 세계대전 목록 */}
      {recentWars.length > 0 ? (
        <div className="space-y-4">
          {recentWars.map((war) => {
            const stats = getParticipationStats(war.id);
            const myParticipation = getMyParticipation(war.id);
            const myStatus = myParticipation?.status;
            const isUpcoming = war.status === 'upcoming';
            const warTitle = war.title || `시즌 ${war.season}`;

            return (
              <div key={war.id} className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-6 h-6 text-gold-500" />
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {warTitle}
                        </p>
                        <p className="text-gray-400">
                          {formatDate(war.startDate)}
                          {war.opponent && <span className="ml-2">vs {war.opponent}</span>}
                        </p>
                      </div>
                      {isUpcoming && (
                        <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm">
                          예정
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 참가 버튼 */}
                      {isUpcoming && (
                        <>
                          <button
                            onClick={() => handleParticipation(war.id, 'yes')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              myStatus === 'yes'
                                ? 'bg-success text-white'
                                : 'bg-navy-600 text-gray-300 hover:bg-success/20 hover:text-success'
                            }`}
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                            참가
                          </button>
                          <button
                            onClick={() => handleLateClick(war.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              myStatus === 'late'
                                ? 'bg-orange-500 text-white'
                                : 'bg-navy-600 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400'
                            }`}
                          >
                            <ClockIcon className="w-5 h-5" />
                            뜨접
                          </button>
                          <button
                            onClick={() => handleParticipation(war.id, 'no')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              myStatus === 'no'
                                ? 'bg-gray-500 text-white'
                                : 'bg-navy-600 text-gray-300 hover:bg-gray-500/20 hover:text-gray-300'
                            }`}
                          >
                            <XCircleIcon className="w-5 h-5" />
                            불참
                          </button>
                        </>
                      )}

                      {/* 삭제 버튼 (관리자만) */}
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteWar(war.id)}
                          className="p-2 text-gray-400 hover:text-danger transition-colors ml-2"
                          title="삭제"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 내 뜨접 사유 표시 */}
                  {myStatus === 'late' && myParticipation?.reason && (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <p className="text-orange-400 text-sm">
                        <span className="font-medium">내 뜨접 사유:</span> {myParticipation.reason}
                      </p>
                    </div>
                  )}

                  {/* 참가 현황 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">참가 현황</span>
                      <span className="text-gray-300">
                        {stats.yes + stats.no + stats.late} / {members.length}명 응답
                      </span>
                    </div>
                    <div className="h-3 bg-navy-700 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-success transition-all"
                        style={{ width: `${(stats.yes / members.length) * 100}%` }}
                      />
                      <div 
                        className="bg-orange-500 transition-all"
                        style={{ width: `${(stats.late / members.length) * 100}%` }}
                      />
                      <div 
                        className="bg-gray-500 transition-all"
                        style={{ width: `${(stats.no / members.length) * 100}%` }}
                      />
                      <div 
                        className="bg-warning transition-all"
                        style={{ width: `${(stats.pending / members.length) * 100}%` }}
                      />
                    </div>
                    {/* 클릭 가능한 참가 현황 */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        onClick={() => openStatusModal(war.id, 'yes', warTitle)}
                        className="flex items-center gap-1 text-success hover:bg-success/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        참가 {stats.yes}
                      </button>
                      <button
                        onClick={() => openStatusModal(war.id, 'late', warTitle)}
                        className="flex items-center gap-1 text-orange-400 hover:bg-orange-500/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ClockIcon className="w-4 h-4" />
                        뜨접 {stats.late}
                      </button>
                      <button
                        onClick={() => openStatusModal(war.id, 'no', warTitle)}
                        className="flex items-center gap-1 text-gray-400 hover:bg-gray-500/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        불참 {stats.no}
                      </button>
                      <button
                        onClick={() => openStatusModal(war.id, 'pending', warTitle)}
                        className="flex items-center gap-1 text-warning hover:bg-warning/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <QuestionMarkCircleIcon className="w-4 h-4" />
                        미응답 {stats.pending}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl p-12 border border-navy-600 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">등록된 세계대전이 없습니다.</p>
          {isAdmin() && (
            <p className="text-gray-500 mt-2">위의 버튼을 눌러 새 세계대전을 등록하세요.</p>
          )}
        </div>
      )}

      {/* 이전 기록 */}
      {olderWars.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            {showHistory ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            이전 기록 보기 ({olderWars.length}개)
          </button>

          {showHistory && (
            <div className="space-y-3">
              {olderWars.map((war) => {
                const stats = getParticipationStats(war.id);
                const warTitle = war.title || `시즌 ${war.season}`;
                return (
                  <div key={war.id} className="bg-navy-800/50 rounded-lg p-4 border border-navy-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white">{warTitle}</span>
                        <span className="text-gray-500 ml-3">{formatDate(war.startDate)}</span>
                        {war.opponent && <span className="text-gray-500 ml-2">vs {war.opponent}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <button
                          onClick={() => openStatusModal(war.id, 'yes', warTitle)}
                          className="text-success hover:underline"
                        >
                          참가 {stats.yes}
                        </button>
                        <button
                          onClick={() => openStatusModal(war.id, 'late', warTitle)}
                          className="text-orange-400 hover:underline"
                        >
                          뜨접 {stats.late}
                        </button>
                        <button
                          onClick={() => openStatusModal(war.id, 'no', warTitle)}
                          className="text-gray-400 hover:underline"
                        >
                          불참 {stats.no}
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDeleteWar(war.id)}
                            className="p-1 text-gray-500 hover:text-danger transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 참가 이력 히트맵 */}
      {wars.length > 0 && members.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
          <div className="p-4 border-b border-navy-600">
            <h3 className="text-lg font-semibold text-white">참가 이력</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium sticky left-0 bg-navy-700 z-10">
                    회원
                  </th>
                  {recentWars.map(war => (
                    <th key={war.id} className="px-4 py-3 text-center text-gray-400 font-medium whitespace-nowrap">
                      {war.title || `S${war.season}`}
                      <br />
                      <span className="text-xs">{formatDate(war.startDate)}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-gray-400 font-medium">
                    참가율
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-600">
                {members.map(member => {
                  let participated = 0;
                  let total = recentWars.length;

                  return (
                    <tr key={member.id} className="hover:bg-navy-700/30">
                      <td className="px-4 py-3 text-white sticky left-0 bg-navy-800 z-10">
                        {member.nickname}
                      </td>
                      {recentWars.map(war => {
                        const key = `${war.id}_${member.id}`;
                        const p = participations[key];
                        
                        if (p?.status === 'yes' || p?.status === 'late') participated++;

                        return (
                          <td key={war.id} className="px-4 py-3 text-center">
                            {p?.status === 'yes' ? (
                              <span className="inline-flex w-8 h-8 items-center justify-center bg-success/20 text-success rounded-lg" title="참가">
                                O
                              </span>
                            ) : p?.status === 'late' ? (
                              <span className="inline-flex w-8 h-8 items-center justify-center bg-orange-500/20 text-orange-400 rounded-lg" title={p.reason || '뜨접'}>
                                △
                              </span>
                            ) : p?.status === 'no' ? (
                              <span className="inline-flex w-8 h-8 items-center justify-center bg-gray-500/20 text-gray-400 rounded-lg" title="불참">
                                X
                              </span>
                            ) : (
                              <span className="inline-flex w-8 h-8 items-center justify-center bg-warning/20 text-warning rounded-lg" title="미응답">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${
                          participated / total >= 0.8 ? 'text-success' :
                          participated / total >= 0.5 ? 'text-warning' :
                          'text-danger'
                        }`}>
                          {total > 0 ? Math.round((participated / total) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
