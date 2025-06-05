import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklyChart from './components/WeeklyChart';
import MonthlyChart from './components/MonthlyChart';
import SummaryTable from './components/SummaryTable';
import DefectChart from './components/DefectChart';
import DefectMetrics from './components/DefectMetrics';
import KpiMetrics from './components/KpiMetrics';
import './App.css';

// 로깅 유틸리티 함수
const logInfo = (message, data = '') => {
  console.log(`[INFO] ${message}`, data);
};

const logError = (message, error = '') => {
  console.error(`[ERROR] ${message}`, error);
};

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
const FactoryMonitorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    weekly_production: [],
    monthly_production: [],
    summary_table: [],
    weekly_production_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      logInfo('Starting data fetch process');
      let weeklyData = [];
      let factoryData = { monthly_production: [], weekly_production_message: '' };
      let infoData = { summary_table: [] };
      let errorMessages = [];

      try {
        const currentMonth = getCurrentMonth();
        logInfo('Current month for API query:', currentMonth);

        // Weekly Production
        try {
          logInfo('Fetching weekly production data...');
          const weeklyResponse = await axios.get('https://pda-api-extract.up.railway.app/api/weekly_production');
          logInfo('Weekly production response:', weeklyResponse.data);
          weeklyData = weeklyResponse.data || [];
        } catch (weeklyErr) {
          logError('Weekly Production Error:', weeklyErr);
          let errorMessage = '주간 생산 데이터를 불러오는 데 실패했습니다.';
          if (weeklyErr.response) {
            errorMessage += ` (상태 코드: ${weeklyErr.response.status}, 엔드포인트: ${weeklyErr.config.url})`;
          } else if (weeklyErr.request) {
            errorMessage += ' (서버 응답 없음 - CORS 문제 가능성)';
          } else {
            errorMessage += ` (${weeklyErr.message})`;
          }
          errorMessages.push(errorMessage);
        }

        // Factory
        try {
          logInfo('Fetching factory data...');
          const factoryResponse = await axios.get('https://pda-api-extract.up.railway.app/api/factory');
          logInfo('Factory response:', factoryResponse.data);
          factoryData = factoryResponse.data || { monthly_production: [], weekly_production_message: '' };
        } catch (factoryErr) {
          logError('Factory Error:', factoryErr);
          let errorMessage = '공장 데이터를 불러오는 데 실패했습니다.';
          if (factoryErr.response) {
            errorMessage += ` (상태 코드: ${factoryErr.response.status}, 엔드포인트: ${factoryErr.config.url})`;
          } else if (factoryErr.request) {
            errorMessage += ' (서버 응답 없음 - CORS 문제 가능성)';
          } else {
            errorMessage += ` (${factoryErr.message})`;
          }
          errorMessages.push(errorMessage);
        }

        // Info
        try {
          logInfo('Fetching info data...');
          const infoResponse = await axios.get(`https://pda-api-extract.up.railway.app/api/info?mode=monthly&month=${currentMonth}`);
          logInfo('Info response:', infoResponse.data);
          infoData = infoResponse.data || { summary_table: [] };
        } catch (infoErr) {
          logError('Info Error:', infoErr);
          let errorMessage = '정보 데이터를 불러오는 데 실패했습니다.';
          if (infoErr.response) {
            errorMessage += ` (상태 코드: ${infoErr.response.status}, 엔드포인트: ${infoErr.config.url})`;
          } else if (infoErr.request) {
            errorMessage += ' (서버 응답 없음 - CORS 문제 가능성)';
          } else {
            errorMessage += ` (${infoErr.message})`;
          }
          errorMessages.push(errorMessage);
        }

        const newData = {
          weekly_production: weeklyData,
          monthly_production: factoryData.monthly_production || [],
          summary_table: infoData.summary_table || [],
          weekly_production_message: factoryData.weekly_production_message || ''
        };
        setDashboardData(newData);
        logInfo('Dashboard data updated:', newData);

        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
          logError('Combined error messages:', errorMessages.join('\n'));
        }

        setLoading(false);
        logInfo('Loading state set to false');
      } catch (err) {
        logError('Unexpected Error:', err);
        setError('알 수 없는 오류가 발생했습니다.');
        setLoading(false);
        logInfo('Loading state set to false after unexpected error');
      }
    };

    logInfo('Fetching data on component mount');
    fetchData();
  }, []);

  // 30분 새로고침 및 위치 고정 추가
  useEffect(() => {
    logInfo('Setting up auto-refresh and scroll position handling');

    // 30분(1800초)마다 새로고침
    const intervalId = setInterval(() => {
      logInfo('Auto-refresh triggered');
      window.location.reload();
    }, 1800000);

    // 스크롤 위치 저장
    const handleScroll = () => {
      const position = window.scrollY;
      localStorage.setItem('scrollPosition', position);
      logInfo('Scroll position saved:', position);
    };
    window.addEventListener('scroll', handleScroll);
    logInfo('Scroll event listener added');

    // 새로고침 후 스크롤 위치 복원
    const savedPosition = localStorage.getItem('scrollPosition');
    if (savedPosition) {
      logInfo('Restoring scroll position:', savedPosition);
      window.scrollTo(0, parseInt(savedPosition));
    } else {
      logInfo('No saved scroll position found');
    }

    return () => {
      logInfo('Cleaning up auto-refresh and scroll listener');
      clearInterval(intervalId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const currentTime = formatDateTime(new Date());

  return (
    <div>
      <div className="header">
        <img src="https://rainbow-haupia-cd8290.netlify.app/GST_banner.jpg" alt="Build up GST Banner" />
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

const App = () => {
  useEffect(() => {
    logInfo('Adding Google Analytics script');
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

  logInfo('Rendering App component');
  return <FactoryMonitorDashboard />;
};

export default App;
