import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const StatusBadge = ({ active }) => (
  <span style={{
    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
    color: active ? '#22c55e' : '#64748b',
    border: `1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)'}`,
  }}>{active ? '● Active' : '○ Inactive'}</span>
);

const RoleBadge = ({ role }) => (
  <span style={{
    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.1)',
    color: role === 'admin' ? '#a5b4fc' : '#94a3b8',
    border: `1px solid ${role === 'admin' ? 'rgba(99,102,241,0.3)' : 'rgba(148,163,184,0.2)'}`,
    textTransform: 'capitalize',
  }}>{role === 'admin' ? '🛡️ Admin' : '👤 User'}</span>
);

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', role: '', isActive: '' });
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(params),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPagination(usersRes.data.meta?.pagination || {});
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoading((p) => ({ ...p, [user._id]: true }));
    try {
      await adminAPI.updateUser(user._id, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, role: newRole } : u));
      toast.success(`${user.name}'s role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading((p) => ({ ...p, [user._id]: false }));
    }
  };

  const handleToggleActive = async (user) => {
    setActionLoading((p) => ({ ...p, [`active_${user._id}`]: true }));
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading((p) => ({ ...p, [`active_${user._id}`]: false }));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name} and all their tasks? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success(`${user.name} deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const inputStyle = {
    padding: '8px 12px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: '8px',
    color: '#f1f5f9', fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>
          🛡️ Admin Panel
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Platform management and oversight</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '14px', marginBottom: '28px',
        }}>
          {[
            { label: 'Total Users', value: stats.users?.total || 0, color: '#f1f5f9', icon: '👥' },
            { label: 'Active Users', value: stats.users?.active || 0, color: '#22c55e', icon: '✅' },
            { label: 'Total Tasks', value: stats.tasks?.total || 0, color: '#60a5fa', icon: '📋' },
            { label: 'Completed', value: stats.tasks?.completed || 0, color: '#a3e635', icon: '🏆' },
            { label: 'In Progress', value: stats.tasks?.inProgress || 0, color: '#fbbf24', icon: '⏳' },
            { label: 'Admins', value: stats.users?.admins || 0, color: '#a5b4fc', icon: '🛡️' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* User Management Table */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #334155',
          display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: 0, flex: 1 }}>
            User Management
          </h2>
          <input
            placeholder="🔍 Search users..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{ ...inputStyle, width: '200px' }}
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
            style={inputStyle}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No users found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 20px', color: '#64748b', fontSize: '12px',
                      fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user._id} style={{
                    borderTop: i > 0 ? '1px solid #0f172a' : 'none',
                  }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          borderRadius: '8px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white',
                          flexShrink: 0,
                        }}>
                          {user.avatarInitials || user.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 500 }}>{user.name}</div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoading[user._id]}
                          style={{
                            padding: '5px 10px',
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '6px', color: '#a5b4fc',
                            fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                          title={`Make ${user.role === 'admin' ? 'User' : 'Admin'}`}
                        >
                          {actionLoading[user._id] ? '...' : user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoading[`active_${user._id}`]}
                          style={{
                            padding: '5px 10px',
                            background: user.isActive ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)',
                            border: `1px solid ${user.isActive ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)'}`,
                            borderRadius: '6px',
                            color: user.isActive ? '#fbbf24' : '#22c55e',
                            fontSize: '11px', cursor: 'pointer',
                          }}
                        >
                          {actionLoading[`active_${user._id}`] ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          style={{
                            padding: '5px 10px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px', color: '#f87171',
                            fontSize: '11px', cursor: 'pointer',
                          }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid #334155',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>
              Showing {users.length} of {pagination.total} users
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={!pagination.hasPrev}
                style={{
                  padding: '6px 14px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: '6px',
                  color: '#94a3b8', fontSize: '13px',
                  cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasPrev ? 1 : 0.4,
                }}
              >← Prev</button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={!pagination.hasNext}
                style={{
                  padding: '6px 14px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: '6px',
                  color: '#94a3b8', fontSize: '13px',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNext ? 1 : 0.4,
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
