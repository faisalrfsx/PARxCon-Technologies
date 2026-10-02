import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Task, TaskPriority, TaskStatus, Client } from '../types/index.js';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'PENDING' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        api.tasks.getAll(statusFilter),
        api.clients.getAll(),
      ]);
      setTasks(tasksRes.tasks);
      setClients(clientsRes.clients);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tasks.create(formData);
      setAddModalOpen(false);
      setFormData({
        title: '',
        description: '',
        clientId: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.tasks.update(task.id, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.clientName && t.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            <span>Task Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize operational items, client deliverables, and priority action deadlines.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {(['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                priorityFilter === pr
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title, client..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No tasks found matching criteria.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = !isCompleted && task.dueDate && task.dueDate < todayStr;
            const isDueToday = !isCompleted && task.dueDate && task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-600'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                      <StatusBadge status={task.priority} type="priority" />
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {task.clientName && (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {task.clientName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isDueToday
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          {isOverdue && ' (Overdue)'}
                          {isDueToday && ' (Today)'}
                        </span>
                      )}
                      <span>Assigned: {task.assignedToName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <StatusBadge status={task.status} type="task" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New Operational Task"
        subtitle="Assign tasks, set priority, and schedule due date"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Audit Bitwarden API credentials for client"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed instructions or acceptance criteria..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Client (Optional)
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">None / Internal Ops</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
