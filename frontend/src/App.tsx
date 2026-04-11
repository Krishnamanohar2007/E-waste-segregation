import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import PredictPage from './pages/PredictPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ConfusionInsightsPage from './pages/ConfusionInsightsPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/predict" replace />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/confusion" element={<ConfusionInsightsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
