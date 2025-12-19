import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined); // null = 프로필 없음, undefined = 아직 로딩 중
  const [loading, setLoading] = useState(true);

  // 구글 로그인
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      throw error;
    }
  }

  // 로그아웃
  async function logout() {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  }

  // 사용자 프로필 가져오기
  async function fetchUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      return null;
    }
  }

  // 사용자 프로필 생성/업데이트
  async function updateUserProfile(uid, data) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          ...data,
          role: 'member', // 기본 역할
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      const updatedProfile = await fetchUserProfile(uid);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      throw error;
    }
  }

  // 관리자 여부 확인
  function isAdmin() {
    return userProfile?.role === 'admin';
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserProfile(undefined); // 로딩 시작
      
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile); // null이면 프로필 없음, 객체면 프로필 있음
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    loginWithGoogle,
    logout,
    updateUserProfile,
    fetchUserProfile,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

