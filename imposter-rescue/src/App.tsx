import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GameMap from './components/GameMap';
import HomeDashboard from './components/Home';
import Mission1 from './components/Mission1';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameMap />} />
        <Route path="/home" element={<HomeDashboard />} />
        <Route path="/mission1" element={<Mission1 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;