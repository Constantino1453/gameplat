import DiceRoller from './components/DiceRoller';
import CardSystem from './components/CardSystem';

export default function App() {
  return (
    <div style={s.page}>
      {/* 侧边掷骰（可折叠） */}
      <DiceRoller />

      {/* 主体：卡牌系统 */}
      <main style={s.main}>
        <h1 style={s.title}>🎴 GamePlat</h1>
        <CardSystem />
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    marginBottom: 20,
    color: '#1a1a2e',
  },
};
