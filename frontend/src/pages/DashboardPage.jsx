import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../utils/api';
import { Link } from 'react-router-dom';

const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: '12px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '14px',
  }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: '10px',
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '20px', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: color }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksAPI.getStats(),
          tasksAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setStats(statsRes.data.stats);
        setRecentTasks(tasksRes.data.tasks || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#64748b', fontSize: '14px' }}>
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    { icon: '📋', label: 'Total Tasks', value: stats?.total || 0, color: '#f1f5f9', bg: '#1e293b' },
    { icon: '⏳', label: 'In Progress', value: stats?.inProgress || 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { icon: '✅', label: 'Completed', value: stats?.completed || 0, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { icon: '🔴', label: 'High Priority', value: stats?.highPriority || 0, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    { icon: '⚠️', label: 'Overdue', value: stats?.overdue || 0, color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    { icon: '📝', label: 'Todo', value: stats?.todo || 0, color: '#94a3b8', bg: '#0f172a' },
  ];

  const priorityColor = { high: '#f87171', medium: '#fbbf24', low: '#86efac' };
  const statusColor = { todo: '#94a3b8', 'in-progress': '#fbbf24', completed: '#22c55e' };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '26px', fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Completion bar */}
      {stats?.total > 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>Overall Progress</span>
            <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>
              {Math.round((stats.completed / stats.total) * 100)}%
            </span>
          </div>
          <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(stats.completed / stats.total) * 100}%`,
              background: 'linear-gradient(90deg, #6366f1, #22c55e)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Tasks</h2>
          <Link to="/tasks" style={{
            color: '#6366f1', fontSize: '13px', textDecoration: 'none', fontWeight: 500,
          }}>View all →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No tasks yet.</p>
            <Link to="/tasks" style={{
              color: '#6366f1', fontSize: '13px', display: 'inline-block', marginTop: '8px',
            }}>Create your first task →</Link>
          </div>
        ) : (
          <div>
            {recentTasks.map((task, i) => (
              <div key={task._id} style={{
                padding: '14px 20px',
                borderBottom: i < recentTasks.length - 1 ? '1px solid #0f172a' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    color: task.status === 'completed' ? '#64748b' : '#f1f5f9',
                    fontSize: '14px', fontWeight: 500,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{task.title}</div>
                  {task.description && (
                    <div style={{
                      color: '#64748b', fontSize: '12px', marginTop: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{task.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                    background: `${statusColor[task.status]}20`,
                    color: statusColor[task.status],
                    border: `1px solid ${statusColor[task.status]}40`,
                    textTransform: 'capitalize',
                  }}>{task.status}</span>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                    color: priorityColor[task.priority],
                    background: `${priorityColor[task.priority]}20`,
                    border: `1px solid ${priorityColor[task.priority]}40`,
                  }}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div style={{
          marginTop: '20px', padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '14px' }}>🛡️ Admin Access</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Manage all users and platform data</div>
          </div>
          <Link to="/admin" style={{
            padding: '8px 16px', background: 'rgba(99,102,241,0.3)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: '8px', color: '#a5b4fc',
            textDecoration: 'none', fontSize: '13px', fontWeight: 600,
          }}>Open Admin Panel →</Link>
        </div>
      )}
    </div>
  );
}
