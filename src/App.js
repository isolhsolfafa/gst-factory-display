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
        const currentMonth = new Date().toISOString().slice(0, 7);
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

  useEffect(() => {
    logInfo('Setting up auto-refresh and scroll position handling');

    // 1시간(3600초)마다 새로고침
    const intervalId = setInterval(() => {
      logInfo('Auto-refresh triggered');
      window.location.reload();
    }, 3600000);

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

  const toggleFullscreen = () => {
    logInfo('Toggling fullscreen mode');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      logInfo('Entered fullscreen mode');
    } else {
      document.exitFullscreen();
      logInfo('Exited fullscreen mode');
    }
  };

  if (loading) {
    logInfo('Rendering loading state');
    return <div style={{ fontSize: '48px', color: 'black', background: '#ffffff' }}>로딩 중...</div>;
  }
  if (error) {
    logInfo('Rendering error state:', error);
    return <div style={{ fontSize: '48px', color: 'red', background: '#ffffff' }}>{error}</div>;
  }

  logInfo('Rendering dashboard with data:', dashboardData);
  return (
    <div style={{ background: '#ffffff', color: 'black', padding: '20px', fontSize: '24px', minHeight: '100vh' }}>
      <button
        onClick={toggleFullscreen}
        style={{ fontSize: '24px', padding: '10px 20px', background: '#007acc', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        전체화면
      </button>
      <h1 style={{ fontSize: '48px', textAlign: 'center' }}>제조기술1팀 공장 대시보드</h1>
      <p style={{ fontSize: '32px', textAlign: 'center' }}>
        업데이트: {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h2 style={{ fontSize: '36px' }}>주간 생산</h2>
          <WeeklyChart data={dashboardData.weekly_production} />
        </div>
        <div>
          <h2 style={{ fontSize: '36px' }}>월간 생산</h2>
          <MonthlyChart data={dashboardData.monthly_production} />
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '36px' }}>불량 차트</h2>
        <DefectChart />
      </div>
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '36px' }}>요약 테이블</h2>
        <SummaryTable data={dashboardData} />
      </div>
      <div className="bottom-grid">
        <div>
          <h2 style={{ fontSize: '36px' }}>불량 지표</h2>
          <DefectMetrics />
        </div>
        <div>
          <h2 style={{ fontSize: '36px' }}>KPI 지표</h2>
          <KpiMetrics />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  logInfo('Rendering App component');
  return <FactoryMonitorDashboard />;
};

export default App;
