import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SiteList from './pages/SiteList';
import SiteDetail from './pages/SiteDetail';
import ComparisonView from './pages/ComparisonView';
import ExecutiveReport from './pages/ExecutiveReport';
import Remediations from './pages/Remediations';

import { ExecutiveBrief } from './pages/ExecutiveBrief';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sites" element={<SiteList />} />
            <Route path="/sites/:id" element={<SiteDetail />} />
            <Route path="/sites/:id/report" element={<ExecutiveReport />} />
            <Route path="/remediations" element={<Remediations />} />
            <Route path="/compare" element={<ComparisonView />} />
            <Route path="/compare/:beforeId/:afterId" element={<ComparisonView />} />

            <Route path="/executive-brief" element={<ExecutiveBrief />} />
          </Route>
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
