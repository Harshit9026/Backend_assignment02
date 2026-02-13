import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';

const priorityColor = { high: '#f87171', medium: '#fbbf24', low: '#86efac' };
const statusColor = { todo: '#94a3b8', 'in-progress': '#fbbf24', completed: '#22c55e' };

const Badge = ({ color, children }) => (
  <span style={{
    fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
    color, background: `${color}20`, border: `1px solid ${color}40`,
    textTransform: 'capitalize',
  }}>{children}</span>
);

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
};

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' };

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task || EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const payload = {
        title: form.title.trim(),
        status: form.status || 'todo',
        priority: form.priority || 'medium',
        ...(form.description && form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.dueDate ? { dueDate: new Date(form.dueDate).toISOString() } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      };
      if (task?._id) {
        const { data } = await tasksAPI.update(task._id, payload);
        onSave(data.task, 'updated');
      } else {
        const { data } = await tasksAPI.create(payload);
        onSave(data.task, 'created');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save task';
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const em = {};
        apiErrors.forEach((e) => { em[e.field] = e.message; });
        setErrors(em);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, margin: 0 }}>
            {task?._id ? '✏️ Edit Task' : '➕ New Task'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title..."
              style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : '#334155' }}
            />
            {errors.title && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.title}</p>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ ...inputStyle }}
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{ ...inputStyle }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Due Date</label>
            <input
              type="datetime-local"
              value={form.dueDate ? form.dueDate.slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              style={{ ...inputStyle }}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>
              Tags <span style={{ color: '#64748b' }}>(comma-separated)</span>
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="frontend, api, urgent"
              style={{ ...inputStyle }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px',
              background: 'transparent', border: '1px solid #334155',
              borderRadius: '8px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.8 : 1,
            }}>{loading ? 'Saving...' : task?._id ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1, limit: 10 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks || []);
      setPagination(data.meta?.pagination || {});
    } catch (e) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSave = (task, action) => {
    setModal(null);
    fetchTasks();
    toast.success(`Task ${action} successfully!`);
  };

  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setDeleteConfirm(null);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const { data } = await tasksAPI.update(task._id, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === task._id ? data.task : t));
      toast.success(`Marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>
            My Tasks
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {pagination.total || 0} total tasks
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '8px',
            color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}
        >+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap',
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '10px', padding: '14px',
      }}>
        <input
          placeholder="🔍 Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          style={{
            ...inputStyle, flex: 1, minWidth: '180px',
            background: '#0f172a', border: '1px solid #334155',
          }}
        />
        {[
          { key: 'status', options: [['', 'All Status'], ['todo', 'Todo'], ['in-progress', 'In Progress'], ['completed', 'Completed']] },
          { key: 'priority', options: [['', 'All Priority'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
        ].map(({ key, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value, page: 1 })}
            style={{ ...inputStyle, width: 'auto', minWidth: '140px', background: '#0f172a' }}
          >
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        {(filters.status || filters.priority || filters.search) && (
          <button
            onClick={() => setFilters({ status: '', priority: '', search: '', page: 1, limit: 10 })}
            style={{
              padding: '10px 14px', background: 'transparent',
              border: '1px solid #334155', borderRadius: '8px',
              color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
            }}
          >Clear</button>
        )}
      </div>

      {/* Task list */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 12px' }}>No tasks found</p>
            <button onClick={() => setModal({})} style={{
              padding: '8px 20px', background: '#6366f1',
              border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '14px', cursor: 'pointer',
            }}>Create Task</button>
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task._id} style={{
              padding: '16px 20px',
              borderBottom: i < tasks.length - 1 ? '1px solid #0f172a' : 'none',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#243044'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleStatusChange(task, task.status === 'completed' ? 'todo' : 'completed')}
                style={{
                  width: '20px', height: '20px',
                  borderRadius: '6px',
                  border: task.status === 'completed' ? 'none' : '2px solid #475569',
                  background: task.status === 'completed' ? '#22c55e' : 'transparent',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '12px',
                }}
              >{task.status === 'completed' ? '✓' : ''}</button>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    color: task.status === 'completed' ? '#475569' : '#f1f5f9',
                    fontSize: '14px', fontWeight: 500,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  }}>{task.title}</span>
                  {task.isOverdue && <span style={{ fontSize: '11px', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '1px 6px', borderRadius: '4px' }}>Overdue</span>}
                </div>
                {task.description && (
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <Badge color={statusColor[task.status]}>{task.status}</Badge>
                  <Badge color={priorityColor[task.priority]}>{task.priority}</Badge>
                  {task.dueDate && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.tags?.map((tag) => (
                    <span key={tag} style={{ fontSize: '11px', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => setModal(task)}
                  style={{
                    padding: '6px 12px', background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '6px', color: '#a5b4fc',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >Edit</button>
                <button
                  onClick={() => setDeleteConfirm(task._id)}
                  style={{
                    padding: '6px 12px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px', color: '#f87171',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={!pagination.hasPrev}
            style={{
              padding: '8px 16px', background: '#1e293b',
              border: '1px solid #334155', borderRadius: '8px',
              color: '#94a3b8', cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
              opacity: pagination.hasPrev ? 1 : 0.4, fontSize: '13px',
            }}
          >← Prev</button>
          <span style={{ padding: '8px 16px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={!pagination.hasNext}
            style={{
              padding: '8px 16px', background: '#1e293b',
              border: '1px solid #334155', borderRadius: '8px',
              color: '#94a3b8', cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
              opacity: pagination.hasNext ? 1 : 0.4, fontSize: '13px',
            }}
          >Next →</button>
        </div>
      )}

      {/* Modals */}
      {modal !== null && (
        <TaskModal
          task={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: '12px', padding: '28px', maxWidth: '360px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>Delete Task?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '10px', background: 'transparent',
                  border: '1px solid #334155', borderRadius: '8px',
                  color: '#94a3b8', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: '10px', background: '#ef4444',
                  border: 'none', borderRadius: '8px',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
