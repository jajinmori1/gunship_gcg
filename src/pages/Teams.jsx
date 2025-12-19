import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const ROLES = [
  { id: 'attack_leader', label: '공격조장', color: 'bg-red-500/20 text-red-400' },
  { id: 'defense_leader', label: '방어조장', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'attacker', label: '공격원', color: 'bg-red-500/10 text-red-300' },
  { id: 'defender', label: '방어원', color: 'bg-blue-500/10 text-blue-300' },
  { id: 'support', label: '지원', color: 'bg-green-500/20 text-green-400' },
];

export default function Teams() {
  const { userProfile, isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [wars, setWars] = useState([]);
  const [selectedWar, setSelectedWar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    teamName: '',
    tactics: '',
    memberRoles: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedWar) {
      fetchTeams(selectedWar.id);
    }
  }, [selectedWar]);

  async function fetchInitialData() {
    try {
      // 회원 목록
      const membersSnapshot = await getDocs(collection(db, 'users'));
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);

      // 세계대전 목록
      const warsSnapshot = await getDocs(collection(db, 'worldWars'));
      const warsData = warsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.startDate?.seconds - a.startDate?.seconds);
      setWars(warsData);

      // 가장 최근 세계대전 선택
      if (warsData.length > 0) {
        setSelectedWar(warsData[0]);
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams(warId) {
    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('warId', '==', warId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);
    } catch (error) {
      console.error('조편성 로딩 오류:', error);
    }
  }

  // 조 생성/수정
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.teamName || !selectedWar) return;

    try {
      const teamData = {
        warId: selectedWar.id,
        teamName: formData.teamName,
        tactics: formData.tactics,
        memberRoles: formData.memberRoles,
        updatedAt: serverTimestamp()
      };

      if (editingTeam) {
        await updateDoc(doc(db, 'teams', editingTeam.id), teamData);
      } else {
        teamData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'teams'), teamData);
      }

      resetForm();
      fetchTeams(selectedWar.id);
    } catch (error) {
      console.error('조 저장 오류:', error);
    }
  }

  // 조 삭제
  async function handleDeleteTeam(teamId) {
    if (!confirm('이 조를 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'teams', teamId));
      fetchTeams(selectedWar.id);
    } catch (error) {
      console.error('조 삭제 오류:', error);
    }
  }

  // 수정 모드
  function handleEditTeam(team) {
    setEditingTeam(team);
    setFormData({
      teamName: team.teamName,
      tactics: team.tactics || '',
      memberRoles: team.memberRoles || []
    });
    setShowCreateForm(true);
  }

  // 멤버 추가/제거
  function toggleMember(memberId) {
    setFormData(prev => {
      const existing = prev.memberRoles.find(mr => mr.memberId === memberId);
      if (existing) {
        return {
          ...prev,
          memberRoles: prev.memberRoles.filter(mr => mr.memberId !== memberId)
        };
      }
      return {
        ...prev,
        memberRoles: [...prev.memberRoles, { memberId, role: 'attacker' }]
      };
    });
  }

  // 역할 변경
  function changeRole(memberId, role) {
    setFormData(prev => ({
      ...prev,
      memberRoles: prev.memberRoles.map(mr => 
        mr.memberId === memberId ? { ...mr, role } : mr
      )
    }));
  }

  // 폼 초기화
  function resetForm() {
    setShowCreateForm(false);
    setEditingTeam(null);
    setFormData({ teamName: '', tactics: '', memberRoles: [] });
  }

  // 조별 전투력 계산
  function getTeamPower(team) {
    return team.memberRoles?.reduce((sum, mr) => {
      const member = members.find(m => m.id === mr.memberId);
      return sum + (member?.totalPower || 0);
    }, 0) || 0;
  }

  // 역할 라벨 가져오기
  function getRoleInfo(roleId) {
    return ROLES.find(r => r.id === roleId) || { label: '미정', color: 'bg-gray-500/20 text-gray-400' };
  }

  // 전투력 포맷팅
  function formatPower(power) {
    if (power >= 100000000) return `${(power / 100000000).toFixed(1)}억`;
    if (power >= 10000) return `${Math.round(power / 10000)}만`;
    return power.toLocaleString();
  }

  if (loading) {
    return <LoadingSpinner message="조편성 정보 로딩 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">조편성</h1>
          <p className="text-gray-400">세계대전 조 구성 및 역할 배정</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 세계대전 선택 */}
          <div className="relative">
            <select
              value={selectedWar?.id || ''}
              onChange={(e) => {
                const war = wars.find(w => w.id === e.target.value);
                setSelectedWar(war);
              }}
              className="appearance-none bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-gold-500"
            >
              {wars.map(war => (
                <option key={war.id} value={war.id}>
                  시즌 {war.season}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {isAdmin() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              조 생성
            </button>
          )}
        </div>
      </div>

      {/* 조 생성/수정 폼 */}
      {showCreateForm && isAdmin() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-navy-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-navy-600">
              <h3 className="text-xl font-semibold text-white">
                {editingTeam ? '조 수정' : '새 조 생성'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 조 이름 */}
              <div>
                <label className="block text-gray-300 mb-2">조 이름</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="예: 1조, A조"
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              {/* 멤버 선택 */}
              <div>
                <label className="block text-gray-300 mb-2">멤버 선택</label>
                <div className="bg-navy-700 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {members.map(member => {
                    const isSelected = formData.memberRoles.some(mr => mr.memberId === member.id);
                    const memberRole = formData.memberRoles.find(mr => mr.memberId === member.id);

                    return (
                      <div 
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isSelected ? 'bg-navy-600' : 'hover:bg-navy-600/50'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(member.id)}
                            className="w-5 h-5 rounded border-navy-500 text-gold-500 focus:ring-gold-500"
                          />
                          <span className="text-white">{member.nickname}</span>
                          <span className="text-gray-500 text-sm">
                            {formatPower(member.totalPower)}
                          </span>
                        </label>

                        {isSelected && (
                          <select
                            value={memberRole?.role || 'attacker'}
                            onChange={(e) => changeRole(member.id, e.target.value)}
                            className="bg-navy-800 border border-navy-500 rounded px-2 py-1 text-sm text-white"
                          >
                            {ROLES.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  선택된 멤버: {formData.memberRoles.length}명
                </p>
              </div>

              {/* 전술 메모 */}
              <div>
                <label className="block text-gray-300 mb-2">전술 메모</label>
                <textarea
                  value={formData.tactics}
                  onChange={(e) => setFormData(prev => ({ ...prev, tactics: e.target.value }))}
                  placeholder="조의 전술이나 특이사항을 기록하세요..."
                  rows={3}
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium py-3 rounded-lg transition-colors"
                >
                  {editingTeam ? '수정 완료' : '조 생성'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-navy-600 hover:bg-navy-500 text-white py-3 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 조 목록 */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map(team => {
            const teamPower = getTeamPower(team);

            return (
              <div key={team.id} className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
                {/* 조 헤더 */}
                <div className="bg-navy-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-6 h-6 text-gold-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{team.teamName}</h3>
                      <p className="text-sm text-gray-400">
                        {team.memberRoles?.length || 0}명 · 전투력 {formatPower(teamPower)}
                      </p>
                    </div>
                  </div>

                  {isAdmin() && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-gray-400 hover:text-danger transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 멤버 목록 */}
                <div className="p-4 space-y-2">
                  {team.memberRoles?.map(mr => {
                    const member = members.find(m => m.id === mr.memberId);
                    const roleInfo = getRoleInfo(mr.role);

                    return (
                      <div 
                        key={mr.memberId}
                        className="flex items-center justify-between py-2 px-3 bg-navy-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-steel-500/30 rounded-full flex items-center justify-center text-steel-300 text-sm font-medium">
                            {member?.nickname?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-white">{member?.nickname || '알 수 없음'}</p>
                            <p className="text-gray-500 text-xs">{formatPower(member?.totalPower)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    );
                  })}

                  {(!team.memberRoles || team.memberRoles.length === 0) && (
                    <p className="text-gray-500 text-center py-4">배정된 멤버가 없습니다</p>
                  )}
                </div>

                {/* 전술 메모 */}
                {team.tactics && (
                  <div className="px-4 pb-4">
                    <div className="bg-navy-700/30 rounded-lg p-3 border-l-2 border-gold-500">
                      <p className="text-gray-400 text-sm mb-1">전술</p>
                      <p className="text-gray-200">{team.tactics}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl p-12 border border-navy-600 text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {selectedWar 
              ? '이 세계대전의 조편성이 없습니다.' 
              : '세계대전을 먼저 선택해주세요.'}
          </p>
          {isAdmin() && selectedWar && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              조 생성하기
            </button>
          )}
        </div>
      )}

      {/* 미배정 멤버 */}
      {teams.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">미배정 멤버</h3>
          <div className="flex flex-wrap gap-2">
            {members
              .filter(member => 
                !teams.some(team => 
                  team.memberRoles?.some(mr => mr.memberId === member.id)
                )
              )
              .map(member => (
                <span
                  key={member.id}
                  className="px-3 py-1 bg-navy-700 text-gray-300 rounded-lg text-sm"
                >
                  {member.nickname}
                </span>
              ))}
            {members.filter(member => 
              !teams.some(team => 
                team.memberRoles?.some(mr => mr.memberId === member.id)
              )
            ).length === 0 && (
              <p className="text-gray-500">모든 멤버가 조에 배정되었습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

