import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import ScholarshipsManager from './screens/ScholarshipsManager';
import SoldiersManager from './screens/SoldiersManager';
import Layout from './components/Layout';
import NotFound from './screens/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/scholarship-list" replace />} />
          <Route path="/scholarship-list" element={<ScholarshipsManager />} />
          <Route path="/candidate-list" element={<SoldiersManager />} />
          <Route path="/soldiers" element={<SoldiersManager />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
