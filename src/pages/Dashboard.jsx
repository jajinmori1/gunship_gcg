import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UsersIcon,
  GlobeAsiaAustraliaIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPower: 0,
    avgPower: 0
  });
  const [upcomingWar, setUpcomingWar] = useState(null);
  const [participation, setParticipation] = useState({
    yes: 0,
    late: 0,
    no: 0,
    pending: 0
  });
  const [myParticipation, setMyParticipation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 회원 통계 가져오기
        const membersSnapshot = await getDocs(collection(db, 'users'));
        const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const totalPower = members.reduce((sum, m) => sum + (m.totalPower || 0), 0);
        
        setStats({
          totalMembers: members.length,
          totalPower,
          avgPower: members.length > 0 ? Math.round(totalPower / members.length) : 0
        });

        // 다가오는 세계대전 가져오기 (모든 세계대전을 가져와서 필터링)
        const warsSnapshot = await getDocs(collection(db, 'worldWars'));
        const allWars = warsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // upcoming 또는 active 상태인 것 중 가장 가까운 것 찾기
        const upcomingWars = allWars
          .filter(w => w.status === 'upcoming' || w.status === 'active')
          .sort((a, b) => {
            const dateA = a.startDate?.toDate?.() || new Date(0);
            const dateB = b.startDate?.toDate?.() || new Date(0);
            return dateA - dateB;
          });
        
        if (upcomingWars.length > 0) {
          const warData = upcomingWars[0];
          setUpcomingWar(warData);

          // 참가 현황 가져오기
          const participationsSnapshot = await getDocs(collection(db, 'participations'));
          
          let yes = 0, late = 0, no = 0;
          participationsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.warId !== warData.id) return;
            
            if (data.status === 'yes') yes++;
            else if (data.status === 'late') late++;
            else if (data.status === 'no') no++;
            
            if (data.memberId === userProfile?.id) {
              setMyParticipation(data);
            }
          });

          setParticipation({
            yes,
            late,
            no,
            pending: members.length - yes - late - no
          });
        }
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userProfile]);

  // 전투력 포맷팅
  const formatPower = (power) => {
    if (power >= 100000000) {
      return `${(power / 100000000).toFixed(1)}억`;
    } else if (power >= 10000) {
      return `${(power / 10000).toFixed(0)}만`;
    }
    return power.toLocaleString();
  };

  // D-day 계산
  const getDday = (date) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = date.toDate ? date.toDate() : new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  if (loading) {
    return <LoadingSpinner message="대시보드 로딩 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
        <h1 className="text-2xl font-bold text-white mb-2">
          안녕하세요, {userProfile?.nickname || '연합원'}님! 👋
        </h1>
        <p className="text-gray-400">
          GameChanGer 연합 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-steel-500/20 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-steel-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">연합원 수</p>
              <p className="text-2xl font-bold text-white">{stats.totalMembers}명</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">총 전투력</p>
              <p className="text-2xl font-bold text-white">{formatPower(stats.totalPower)}</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-steel-500/20 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-steel-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">평균 전투력</p>
              <p className="text-2xl font-bold text-white">{formatPower(stats.avgPower)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 세계대전 정보 */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <GlobeAsiaAustraliaIcon className="w-6 h-6 text-gold-500" />
            다가오는 세계대전
          </h2>
          <Link 
            to="/worldwar" 
            className="text-gold-400 hover:text-gold-300 text-sm"
          >
            전체 보기 →
          </Link>
        </div>

        {upcomingWar ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-lg mb-1">
                  {upcomingWar.title || `시즌 ${upcomingWar.season}`}
                </p>
                <p className="text-gray-400">
                  {upcomingWar.startDate?.toDate?.().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) || '날짜 미정'}
                  {upcomingWar.opponent && <span className="ml-2">vs {upcomingWar.opponent}</span>}
                </p>
              </div>
              <div className="text-3xl font-bold text-gold-500">
                {getDday(upcomingWar.startDate)}
              </div>
            </div>

            {/* 참가 현황 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-success/10 rounded-xl p-4 text-center">
                <CheckCircleIcon className="w-7 h-7 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{participation.yes}</p>
                <p className="text-gray-400 text-sm">참가</p>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 text-center">
                <ClockIcon className="w-7 h-7 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-400">{participation.late}</p>
                <p className="text-gray-400 text-sm">뜨접</p>
              </div>
              <div className="bg-gray-500/10 rounded-xl p-4 text-center">
                <XCircleIcon className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-400">{participation.no}</p>
                <p className="text-gray-400 text-sm">불참</p>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 text-center">
                <QuestionMarkCircleIcon className="w-7 h-7 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{participation.pending}</p>
                <p className="text-gray-400 text-sm">미응답</p>
              </div>
            </div>

            {/* 내 참가 여부 */}
            <div className="bg-navy-700 rounded-xl p-4">
              <p className="text-gray-400 mb-3">내 참가 여부</p>
              <div className="flex gap-3">
                {myParticipation?.status === 'yes' ? (
                  <span className="flex items-center gap-2 text-success text-lg">
                    <CheckCircleIcon className="w-6 h-6" />
                    참가 신청 완료
                  </span>
                ) : myParticipation?.status === 'late' ? (
                  <div>
                    <span className="flex items-center gap-2 text-orange-400 text-lg">
                      <ClockIcon className="w-6 h-6" />
                      뜨접 등록됨
                    </span>
                    {myParticipation.reason && (
                      <p className="text-gray-500 text-sm mt-1">사유: {myParticipation.reason}</p>
                    )}
                  </div>
                ) : myParticipation?.status === 'no' ? (
                  <span className="flex items-center gap-2 text-gray-400 text-lg">
                    <XCircleIcon className="w-6 h-6" />
                    불참 등록됨
                  </span>
                ) : (
                  <Link
                    to="/worldwar"
                    className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-medium px-6 py-3 rounded-xl transition-colors"
                  >
                    참가 여부 등록하기
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <GlobeAsiaAustraliaIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">예정된 세계대전이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/members"
          className="bg-navy-800 hover:bg-navy-700 rounded-xl p-6 border border-navy-600 text-center transition-colors"
        >
          <UsersIcon className="w-10 h-10 text-steel-400 mx-auto mb-3" />
          <p className="text-white font-medium">회원 목록</p>
        </Link>
        <Link
          to="/worldwar"
          className="bg-navy-800 hover:bg-navy-700 rounded-xl p-6 border border-navy-600 text-center transition-colors"
        >
          <GlobeAsiaAustraliaIcon className="w-10 h-10 text-gold-500 mx-auto mb-3" />
          <p className="text-white font-medium">세계대전</p>
        </Link>
        <Link
          to="/teams"
          className="bg-navy-800 hover:bg-navy-700 rounded-xl p-6 border border-navy-600 text-center transition-colors"
        >
          <UsersIcon className="w-10 h-10 text-steel-400 mx-auto mb-3" />
          <p className="text-white font-medium">조편성</p>
        </Link>
        <Link
          to="/settings"
          className="bg-navy-800 hover:bg-navy-700 rounded-xl p-6 border border-navy-600 text-center transition-colors"
        >
          <ChartBarIcon className="w-10 h-10 text-steel-400 mx-auto mb-3" />
          <p className="text-white font-medium">내 정보</p>
        </Link>
      </div>
    </div>
  );
}
