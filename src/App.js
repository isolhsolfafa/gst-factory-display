import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';
import WeeklyChart from './components/WeeklyChart';
import MonthlyChart from './components/MonthlyChart';
import SummaryTable from './components/SummaryTable';
import DefectChart from './components/DefectChart';
import DefectMetrics from './components/DefectMetrics';
import KpiMetrics from './components/KpiMetrics';
import './App.css';

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (KST)`;
};

const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getCurrentWeek = () => {
  const now = new Date();
  const [year, week] = [now.getFullYear(), getWeekNumber(now)];
  return `${year}년 ${week}주차`;
};

const getWeekNumber = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  return weekNumber;
};

// 공장 대시보드 컴포넌트
const FactoryDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    weekly_production: [],
    monthly_production: [],
    summary_table: [],
    weekly_production_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();  // Automatically redirect to login
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;  // If not authenticated, stop the function

    const fetchData = async () => {
      try {
        const currentMonth = getCurrentMonth();

        // 1. Fetch weekly production data
        const weeklyResponse = await axios.get('/weekly_production.json');
        
        // 2. Fetch factory data (including summary_table)
        const token = await getAccessTokenSilently();
        const headers = { Authorization: `Bearer ${token}` };

        const factoryResponse = await axios.get(`https://pda-api-extract.up.railway.app/api/factory`, { headers });

        setDashboardData({
          weekly_production: weeklyResponse.data || [],
          monthly_production: factoryResponse.data.monthly_production || [],
          summary_table: factoryResponse.data.summary_table || [], // Use factoryResponse for summary_table
          weekly_production_message: factoryResponse.data.weekly_production_message || ''
        });
        setLoading(false);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // 30분마다 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 1800000); // 1,800,000ms = 30분

    return () => clearInterval(interval);
  }, []);
  
  const currentTime = formatDateTime(new Date());

  return (
    <div>
      <div className="header">
        <h1>제조기술1팀 공장 대시보드 - {getCurrentWeek()}</h1>
        <p>실행 시간: {currentTime}</p>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="top-grid">
            <WeeklyChart data={dashboardData.weekly_production} />
            <MonthlyChart data={dashboardData.monthly_production} />
            <DefectChart />
          </div>
          <div className="chart-section summary-section">
            <SummaryTable data={dashboardData} />
          </div>
          <div className="bottom-grid">
            <DefectMetrics />
            <KpiMetrics />
          </div>
        </>
      )}
    </div>
  );
};

// 공장 모니터 전용 App 컴포넌트 (탭 메뉴 없음)
const App = () => {
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-F7HTZVLPLF';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-F7HTZVLPLF');
    `;
    document.head.appendChild(script2);
  }, []);

  return (
    <div>
      {/* 공장 모니터 전용: 탭 메뉴 없이 공장 대시보드만 표시 */}
      <FactoryDashboard />
    </div>
  );
};

// App must be wrapped in Router for useLocation to work, so we export a wrapper
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

const AuthWrapper = () => (
  <Auth0Provider
    domain={process.env.REACT_APP_AUTH0_DOMAIN}
    clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: process.env.REACT_APP_AUTH0_AUDIENCE
    }}
  >
    <AppWithRouter />
  </Auth0Provider>
);

export default AuthWrapper;
