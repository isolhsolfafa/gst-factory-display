import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklyChart from './components/WeeklyChart';
import MonthlyChart from './components/MonthlyChart';
import SummaryTable from './components/SummaryTable';
import DefectChart from './components/DefectChart';
import DefectMetrics from './components/DefectMetrics';
import KpiMetrics from './components/KpiMetrics';
import './App.css';

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
      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM 형식
        const [weeklyResponse, factoryResponse, infoResponse] = await Promise.all([
          axios.get('https://pda-api-extract.up.railway.app/api/weekly_production'),
          axios.get('https://pda-api-extract.up.railway.app/api/factory'),
          axios.get(`https://pda-api-extract.up.railway.app/api/info?mode=monthly&month=${currentMonth}`)
        ]);
        setDashboardData({
          weekly_production: weeklyResponse.data || [],
          monthly_production: factoryResponse.data.monthly_production || [],
          summary_table: infoResponse.data.summary_table || [],
          weekly_production_message: factoryResponse.data.weekly_production_message || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('API Error:', err);
        setError('데이터를 불러오는 데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // 1시간(3600초)마다 새로고침
    const intervalId = setInterval(() => window.location.reload(), 3600000);

    // 스크롤 위치 저장
    const handleScroll = () => {
      localStorage.setItem('scrollPosition', window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // 새로고침 후 스크롤 위치 복원
    const savedPosition = localStorage.getItem('scrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) return <div style={{ fontSize: '48px', color: 'white' }}>로딩 중...</div>;
  if (error) return <div style={{ fontSize: '48px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ background: '#1a1a1a', color: 'white', padding: '20px', fontSize: '24px', minHeight: '100vh' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
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

const App = () => (
  <FactoryMonitorDashboard />
);

export default App;
