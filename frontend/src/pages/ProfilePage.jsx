import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) return toast.error('Name must be at least 2 characters');
    setNameLoading(true);
    try {
      const { data } = await usersAPI.updateProfile({ name: name.trim() });
      updateUser(data.user);
      toast.success('Name updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'Required';
    if (!passwords.newPassword) errors.newPassword = 'Required';
    else if (passwords.newPassword.length < 8) errors.newPassword = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.newPassword)) {
      errors.newPassword = 'Must include uppercase, lowercase, and number';
    }
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwLoading(true);
    try {
      await authAPI.updatePassword(passwords);
      toast.success('Password updated!');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.avatarInitials || user?.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
        Profile Settings
      </h1>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 32px' }}>Manage your account information</p>

      {/* Avatar */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', padding: '24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>{user?.email}</div>
          <span style={{
            display: 'inline-block', marginTop: '4px',
            padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            background: user?.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.1)',
            color: user?.role === 'admin' ? '#a5b4fc' : '#86efac',
            border: `1px solid ${user?.role === 'admin' ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.2)'}`,
          }}>
            {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
          </span>
        </div>
      </div>

      {/* Update Name */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', padding: '24px', marginBottom: '20px',
      }}>
        <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
          Update Name
        </h2>
        <form onSubmit={handleUpdateName}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your full name"
            />
          </div>
          <button
            type="submit"
            disabled={nameLoading || name === user?.name}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '13px', fontWeight: 600,
              cursor: nameLoading ? 'not-allowed' : 'pointer',
              opacity: (nameLoading || name === user?.name) ? 0.6 : 1,
            }}
          >{nameLoading ? 'Saving...' : 'Save Name'}</button>
        </form>
      </div>

      {/* Update Password */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', padding: '24px',
      }}>
        <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
          Change Password
        </h2>
        <form onSubmit={handleUpdatePassword}>
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Your current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 chars with upper, lower, number' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>{label}</label>
              <input
                type="password"
                value={passwords[key]}
                onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                placeholder={placeholder}
                style={{ ...inputStyle, borderColor: pwErrors[key] ? '#ef4444' : '#334155' }}
              />
              {pwErrors[key] && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{pwErrors[key]}</p>}
            </div>
          ))}
          <button
            type="submit"
            disabled={pwLoading}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '13px', fontWeight: 600,
              cursor: pwLoading ? 'not-allowed' : 'pointer',
              opacity: pwLoading ? 0.6 : 1,
            }}
          >{pwLoading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>

      {/* Account info */}
      <div style={{
        marginTop: '20px', padding: '16px 20px',
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px',
      }}>
        <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, margin: '0 0 10px' }}>Account Details</h3>
        {[
          { label: 'Email', value: user?.email },
          { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
          { label: 'Last login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '6px 0', borderBottom: '1px solid #0f172a',
          }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
