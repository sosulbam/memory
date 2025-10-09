import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// --- 👇 아래 로그들을 추가해주세요 ---
console.log("1. index.js 파일 실행 시작");

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log("2. React root 생성 완료");

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("3. App 컴포넌트 렌더링 시도");
// --- 👆 여기까지 ---

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();