export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '14px',
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>⚡</div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading TaskFlow...</div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
