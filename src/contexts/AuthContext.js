// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

/**
 * 사용자 로그인 상태(인증 토큰)를 전역으로 관리하고 제공하는 컨텍스트입니다.
 */
export const AuthCtx = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('token');
      setToken(currentToken);
      if (currentToken) {
        try {
          // 토큰의 payload 부분을 디코딩하여 사용자 정보 설정
          setUser(JSON.parse(atob(currentToken.split('.')[1])));
        } catch (error) {
          console.error("Failed to parse token from localStorage", error);
          setUser(null);
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
      }
    };

    handleStorageChange(); // 초기 로드
    window.addEventListener('storage', handleStorageChange); // 스토리지 변경 감지

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // 페이지 이동은 외부에서 처리
  };

  return (
    <AuthCtx.Provider value={{ user, token, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
