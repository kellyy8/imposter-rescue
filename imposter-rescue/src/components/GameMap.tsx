import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, FlaskConical, Briefcase, Music, PersonStanding } from 'lucide-react';

const screenStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'linear-gradient(135deg, #a7c3dc 0%, #96c2a6 50%, #dab9d5 100%)',
};

const mapAreaStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '70rem',
  height: '76vh',
  minHeight: '540px',
};

const pinStyle: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
};

const pinButtonStyle: CSSProperties = {
  width: '5rem',
  height: '5rem',
  borderRadius: '9999px',
  border: '4px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle: CSSProperties = {
  color: '#e2e8f0',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
};

const GameMap = () => {
  const nodes = [
    {
      id: 1,
      label: 'Home',
      icon: <Home size={28} />,
      color: '#3b82f6',
      x: 50,
      y: 16,
    },
    {
      id: 2,
      label: 'Mission 1',
      icon: <Music size={28} />,
      color: '#10b981',
      x: 76,
      y: 30,
    },
    {
      id: 3,
      label: 'Mission 2',
      icon: <FlaskConical size={28} />,
      color: '#f59e0b',
      x: 76,
      y: 70,
    },
    {
      id: 4,
      label: 'Mission 3',
      icon: <Briefcase size={28} />,
      color: '#a855f7',
      x: 50,
      y: 84,
    },
    {
      id: 5,
      label: 'Mission 4',
      icon: <PersonStanding size={28} />,
      color: '#f43f5e',
      x: 24,
      y: 70,
    },
    {
      id: 6,
      label: 'Store',
      icon: <ShoppingBag size={28} />,
      color: '#f97316',
      x: 24,
      y: 30,
    },
  ];

  return (
    <div style={screenStyle}>
      <div style={mapAreaStyle}>
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ ...pinStyle, left: `${node.x}%`, top: `${node.y}%` }}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              style={{ ...pinButtonStyle, backgroundColor: node.color }}
            >
              {node.icon}
            </motion.button>
            <span style={labelStyle}>
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GameMap;