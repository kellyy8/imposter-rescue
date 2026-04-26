import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GameMap from './components/GameMap';
import Home from './components/Home';
import Mission1 from './components/Mission1';
import Mission2 from './components/Mission2';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameMap />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mission1" element={<Mission1 />} />
        <Route path="/mission2" element={<Mission2 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
