import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { Task, ViewMode, Priority, TaskStatus, RecurrenceRule } from '../../types';
import {
  CheckSquare, Plus, List, LayoutGrid, Calendar as CalendarIcon,
  Filter, Clock, CheckCircle2, Circle, Trash2, Edit3, ChevronDown,
  ChevronRight, Tag, Sparkles, FolderPlus, AlertCircle, Search,
  ArrowUpDown, RotateCcw, GripVertical, X, ChevronLeft, ChevronUp,
  BookOpen, DollarSign, Activity, BarChart3, Target
} from 'lucide-react';

const priorityOrder: Record<Priority, number> = { p1: 1, p2: 2, p3: 3, p4: 4 };

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    areas,
    habits,
    books,
    transactions,
    addTask,
    toggleTaskStatus,
    deleteTask,
    updateTask,
    addProject,
  } = useLifeOS();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('p3');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTaskNotifyAt, setNewTaskNotifyAt] = useState<string>('');
  const [newTaskArea, setNewTaskArea] = useState<string>('area_work');
  const [newTaskProject, setNewTaskProject] = useState<string>('');
  const [newTaskShift, setNewTaskShift] = useState<'all' | 'rest' | 'work'>('all');
  const [newTaskLinkedHabit, setNewTaskLinkedHabit] = useState<string>('');
  const [newTaskLinkedBook, setNewTaskLinkedBook] = useState<string>('');
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] = useState(1);
  const [newTaskRecurrenceEnds, setNewTaskRecurrenceEnds] = useState<number>(0);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjArea, setNewProjArea] = useState('area_work');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('p3');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskNotifyAt, setEditTaskNotifyAt] = useState('');
  const [editTaskArea, setEditTaskArea] = useState('');
  const [editTaskProject, setEditTaskProject] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo');
  const [editTaskShift, setEditTaskShift] = useState<'all' | 'rest' | 'work'>('all');
  const [editTaskLinkedHabit, setEditTaskLinkedHabit] = useState<string>('');
  const [editTaskLinkedBook, setEditTaskLinkedBook] = useState<string>('');

  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [newSubtaskInput, setNewSubtaskInput] = useState<Record<string, string>>({});
  const [newSubtaskEditInput, setNewSubtaskEditInput] = useState<Record<string, string>>({});

  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  const formRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingTask && editModalRef.current && !editModalRef.current.contains(e.target as Node)) {
        setEditingTask(null);
      }
    };
    if (editingTask) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingTask]);

  const startEditingTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskNotifyAt(task.notifyAt || '');
    setEditTaskArea(task.areaId || 'area_work');
    setEditTaskProject(task.projectId || '');
    setEditTaskStatus(task.status);
    setEditTaskShift(task.shiftContext || 'all');
    setEditTaskLinkedHabit(task.linkedHabitId || '');
    setEditTaskLinkedBook(task.linkedBookId || '');
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;
    updateTask({
      ...editingTask,
      title: editTaskTitle,
      description: editTaskDesc || undefined,
      priority: editTaskPriority,
      dueDate: editTaskDueDate || undefined,
      areaId: editTaskArea,
      projectId: editTaskProject || undefined,
      status: editTaskStatus,
      notifyAt: editTaskNotifyAt || undefined,
      shiftContext: editTaskShift,
      linkedHabitId: editTaskLinkedHabit || undefined,
      linkedBookId: editTaskLinkedBook || undefined,
    });
    setEditingTask(null);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask({ ...task, subtasks: updatedSubtasks });
  };

  const addSubtask = (taskId: string) => {
    const val = newSubtaskInput[taskId]?.trim();
    if (!val) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSub = { id: `sub_${Date.now()}`, title: val, completed: false };
    updateTask({ ...task, subtasks: [...task.subtasks, newSub] });
    setNewSubtaskInput((prev) => ({ ...prev, [taskId]: '' }));
    setExpandedSubtasks((prev) => new Set(prev).add(taskId));
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask({ ...task, subtasks: task.subtasks.filter((st) => st.id !== subtaskId) });
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    if (selectedAreaFilter !== 'all') result = result.filter((t) => t.areaId === selectedAreaFilter);
    if (selectedPriorityFilter !== 'all') result = result.filter((t) => t.priority === selectedPriorityFilter);
    if (selectedProjectFilter !== 'all') result = result.filter((t) => t.projectId === selectedProjectFilter);
    if (selectedShiftFilter !== 'all') result = result.filter((t) => (t.shiftContext || 'all') === selectedShiftFilter || t.shiftContext === undefined || t.shiftContext === 'all');
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      else if (sortBy === 'dueDate') cmp = (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
      else if (sortBy === 'createdAt') cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      else cmp = a.title.localeCompare(b.title);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [tasks, searchQuery, selectedAreaFilter, selectedPriorityFilter, selectedProjectFilter, selectedShiftFilter, sortBy, sortAsc]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const overdue = tasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed').length;
    const dueToday = tasks.filter((t) => t.dueDate === new Date().toISOString().split('T')[0] && t.status !== 'completed').length;
    return { total, completed, inProgress, todo, overdue, dueToday, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  const kanbanColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'Por Hacer', color: 'border-slate-300 dark:border-slate-600' },
    { status: 'in_progress', label: 'En Proceso', color: 'border-blue-400 dark:border-blue-500' },
    { status: 'completed', label: 'Completadas', color: 'border-emerald-500 dark:border-emerald-600' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    let recurrence: RecurrenceRule | undefined;
    if (newTaskRecurrenceType !== 'none') {
      recurrence = { type: newTaskRecurrenceType, interval: newTaskRecurrenceInterval };
      if (newTaskRecurrenceEnds > 0) recurrence.endsAfter = newTaskRecurrenceEnds;
    }
    addTask({
      title: newTaskTitle,
      description: newTaskDesc || undefined,
      status: 'todo',
      priority: newTaskPriority,
      dueDate: newTaskDueDate || undefined,
      areaId: newTaskArea,
      projectId: newTaskProject || undefined,
      subtasks: [],
      notifyAt: newTaskNotifyAt || undefined,
      shiftContext: newTaskShift,
      linkedHabitId: newTaskLinkedHabit || undefined,
      linkedBookId: newTaskLinkedBook || undefined,
      recurrence,
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskNotifyAt('');
    setNewTaskLinkedHabit('');
    setNewTaskLinkedBook('');
    setNewTaskRecurrenceType('none');
    setNewTaskRecurrenceInterval(1);
    setNewTaskRecurrenceEnds(0);
    setIsAddingTask(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    addProject({ name: newProjName, description: newProjDesc, areaId: newProjArea, color: '#3B82F6', icon: 'Rocket' });
    setNewProjName('');
    setNewProjDesc('');
    setIsAddingProject(false);
  };

  const handleDeleteWithConfirm = () => {
    if (deleteConfirmTask) {
      deleteTask(deleteConfirmTask.id);
      setDeleteConfirmTask(null);
    }
  };

  const advanceStatus = (task: Task) => {
    const next: Record<TaskStatus, TaskStatus | null> = { todo: 'in_progress', in_progress: 'completed', completed: null };
    const nextStatus = next[task.status];
    if (nextStatus) updateTask({ ...task, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : task.completedAt });
  };

  const regressStatus = (task: Task) => {
    const prev: Record<TaskStatus, TaskStatus | null> = { completed: 'in_progress', in_progress: 'todo', todo: null };
    const prevStatus = prev[task.status];
    if (prevStatus) updateTask({ ...task, status: prevStatus, completedAt: prevStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined });
  };

  const renderTaskCard = (t: Task, compact = false) => {
    const proj = projects.find((p) => p.id === t.projectId);
    const area = areas.find((a) => a.id === t.areaId);
    const linkedHabit = t.linkedHabitId ? habits.find((h) => h.id === t.linkedHabitId) : null;
    const linkedBook = t.linkedBookId ? books.find((b) => b.id === t.linkedBookId) : null;
    const isExpanded = expandedSubtasks.has(t.id);

    return (
      <div key={t.id} className={`p-4 rounded-2xl border transition-all ${t.status === 'completed' ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:shadow-sm'} ${!compact ? 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3' : ''}`}>
        <div className={`flex items-start gap-3 ${compact ? '' : 'flex-1'}`}>
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <button onClick={() => toggleTaskStatus(t.id)} className={`transition-colors ${t.status === 'completed' ? 'text-emerald-500' : 'text-slate-400 hover:text-amber-500'}`}>
              {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" /> : <Circle className="w-5 h-5" />}
            </button>
            {t.status !== 'completed' && (
              <button onClick={() => advanceStatus(t)} className="text-[9px] text-slate-400 hover:text-blue-500 font-bold" title="Avanzar estado">
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
            {t.status !== 'todo' && (
              <button onClick={() => regressStatus(t)} className="text-[9px] text-slate-400 hover:text-amber-500 font-bold" title="Retroceder estado">
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-xs font-bold truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                {t.title}
              </p>
              {t.recurrence && <RotateCcw className="w-3 h-3 text-blue-400 shrink-0" title={`Cada ${t.recurrence.interval} ${t.recurrence.type}`} />}
              {t.shiftContext && t.shiftContext !== 'all' && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${t.shiftContext === 'work' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'}`}>
                  {t.shiftContext === 'work' ? '⛏️ Faena' : '🏠 Descanso'}
                </span>
              )}
            </div>
            {t.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : t.priority === 'p2' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                {t.priority.toUpperCase()}
              </span>
              {area && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{area.name}</span>}
              {proj && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{proj.name}</span>}
              {t.dueDate && (
                <span className={`text-[10px] flex items-center gap-1 font-mono ${t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  <Clock className="w-3 h-3" />
                  {t.dueDate}
                </span>
              )}
              {linkedHabit && <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center gap-1"><Activity className="w-2.5 h-2.5" />{linkedHabit.title}</span>}
              {linkedBook && <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />{linkedBook.title}</span>}
              {t.linkedTransactionId && <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />Transacción</span>}
              {t.completedCount && t.completedCount > 0 ? <span className="text-[9px] text-slate-400 font-mono">#{t.completedCount}</span> : null}
            </div>
            {t.subtasks.length > 0 && (
              <div className="pt-2">
                <button onClick={() => { const s = new Set(expandedSubtasks); isExpanded ? s.delete(t.id) : s.add(t.id); setExpandedSubtasks(s); }} className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-semibold">
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Subtareas ({t.subtasks.filter((st) => st.completed).length}/{t.subtasks.length})
                </button>
                {isExpanded && (
                  <div className="pt-2 space-y-1 pl-1">
                    {t.subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 group">
                        <button onClick={() => toggleSubtask(t.id, st.id)} className={`shrink-0 ${st.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-amber-500'}`}>
                          {st.completed ? <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" /> : <Circle className="w-3.5 h-3.5" />}
                        </button>
                        <span className={`text-[11px] ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                        <button onClick={() => removeSubtask(t.id, st.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 pt-1">
                      <input type="text" value={newSubtaskEditInput[t.id] || ''} onChange={(e) => setNewSubtaskEditInput((prev) => ({ ...prev, [t.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { setNewSubtaskInput((prev) => ({ ...prev, [t.id]: newSubtaskEditInput[t.id] || '' })); addSubtask(t.id); } }} placeholder="+ Subtarea" className="flex-1 p-1 text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      <button onClick={() => { setNewSubtaskInput((prev) => ({ ...prev, [t.id]: newSubtaskEditInput[t.id] || '' })); addSubtask(t.id); }} className="p-1 rounded text-[10px] text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 font-bold">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {t.subtasks.length === 0 && (
              <button onClick={() => { const s = new Set(expandedSubtasks); s.add(t.id); setExpandedSubtasks(s); setNewSubtaskEditInput((prev) => ({ ...prev, [t.id]: '' })); }} className="text-[10px] text-slate-400 hover:text-amber-500 pt-1 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Subtarea
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 self-end sm:self-center mt-2 sm:mt-0">
          <button onClick={() => startEditingTask(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar tarea">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteConfirmTask(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Eliminar tarea">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderCalendarGrid = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const monthName = firstDay.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    const today = new Date().toISOString().split('T')[0];
    const tasksByDate: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
        tasksByDate[t.dueDate].push(t);
      }
    });
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="text-sm font-bold capitalize text-slate-900 dark:text-white">{monthName}</h3>
          <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
            <div key={d} className="p-2 text-[10px] font-bold text-slate-400 text-center bg-slate-50 dark:bg-slate-900">{d}</div>
          ))}
          {days.map((d, i) => {
            const dateStr = d ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
            const dayTasks = dateStr ? tasksByDate[dateStr] || [] : [];
            const isToday = dateStr === today;
            return (
              <div key={i} className={`min-h-[70px] p-1.5 text-xs bg-white dark:bg-slate-800 ${isToday ? 'ring-2 ring-amber-400 ring-inset' : ''}`}>
                {d && <span className={`text-[10px] font-semibold ${isToday ? 'text-amber-500' : 'text-slate-500'}`}>{d}</span>}
                <div className="space-y-0.5 mt-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className={`text-[8px] px-1 py-0.5 rounded truncate font-medium ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 line-through' : t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <span className="text-[8px] text-slate-400 font-semibold">+{dayTasks.length - 3} más</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tareas y Proyectos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestión modular con prioridades P1-P4 y Kanban</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            {(['list', 'kanban', 'calendar'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${viewMode === mode ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                {mode === 'list' ? <List className="w-4 h-4" /> : mode === 'kanban' ? <LayoutGrid className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                <span className="hidden sm:inline">{mode === 'list' ? 'Lista' : mode === 'kanban' ? 'Kanban' : 'Calendario'}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setIsAddingProject(true)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4" /><span>Nuevo Proyecto</span>
          </button>
          <button onClick={() => setIsAddingTask(!isAddingTask)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /><span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {viewMode !== 'calendar' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Total</p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-amber-500">{stats.todo}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Pendientes</p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-blue-500">{stats.inProgress}</p>
            <p className="text-[10px] text-slate-400 font-semibold">En Proceso</p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-emerald-500">{stats.completed}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Completadas</p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-red-500">{stats.overdue}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Vencidas</p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-lg font-bold text-indigo-500">{stats.completionRate}%</p>
            <p className="text-[10px] text-slate-400 font-semibold">Completitud</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar tareas..." className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="p-1.5 text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <option value="createdAt">Creación</option>
            <option value="dueDate">Fecha límite</option>
            <option value="priority">Prioridad</option>
            <option value="title">Nombre</option>
          </select>
          <button onClick={() => setSortAsc(!sortAsc)} className={`p-1.5 rounded-lg border ${sortAsc ? 'bg-amber-100 border-amber-300 dark:bg-amber-950 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'} text-slate-500`}>
            {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {viewMode !== 'calendar' && (
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Áreas:</span>
          <button onClick={() => setSelectedAreaFilter('all')} className={`px-3 py-1.5 rounded-xl border font-medium transition-all ${selectedAreaFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>Todas</button>
          {areas.map((a) => (
            <button key={a.id} onClick={() => setSelectedAreaFilter(a.id)} className={`px-3 py-1.5 rounded-xl border font-medium transition-all ${selectedAreaFilter === a.id ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{a.name}</button>
          ))}
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">P:</span>
          {(['all', 'p1', 'p2', 'p3', 'p4'] as const).map((p) => (
            <button key={p} onClick={() => setSelectedPriorityFilter(p)} className={`px-2.5 py-1 rounded-lg border uppercase text-[10px] font-bold transition-all ${selectedPriorityFilter === p ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{p === 'all' ? 'Todas' : p.toUpperCase()}</button>
          ))}
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Turno:</span>
          {(['all', 'work', 'rest'] as const).map((s) => (
            <button key={s} onClick={() => setSelectedShiftFilter(s)} className={`px-2.5 py-1 rounded-lg border uppercase text-[10px] font-bold transition-all ${selectedShiftFilter === s ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
              {s === 'all' ? 'Todos' : s === 'work' ? '⛏️ Faena' : '🏠 Descanso'}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Proyecto:</span>
          <select value={selectedProjectFilter} onChange={(e) => setSelectedProjectFilter(e.target.value)} className="p-1.5 text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <option value="all">Todos</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
      )}

      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nueva Tarea</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Título de la tarea *" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 col-span-2" required />
            <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="time" value={newTaskNotifyAt} onChange={(e) => setNewTaskNotifyAt(e.target.value)} className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" title="Notificación programada" />
            <select value={newTaskShift} onChange={(e) => setNewTaskShift(e.target.value as any)} className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="all">Todos los turnos</option>
              <option value="work">⛏️ Solo Faena</option>
              <option value="rest">🏠 Solo Descanso</option>
            </select>
          </div>
          <textarea placeholder="Descripción u observaciones opcionales" rows={2} value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridad:</label>
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="p1">P1 - Urgente</option>
                <option value="p2">P2 - Alta</option>
                <option value="p3">P3 - Media</option>
                <option value="p4">P4 - Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Área:</label>
              <select value={newTaskArea} onChange={(e) => setNewTaskArea(e.target.value)} className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Proyecto:</label>
              <select value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="">Sin Proyecto</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vincular:</label>
              <select value={newTaskLinkedHabit} onChange={(e) => setNewTaskLinkedHabit(e.target.value)} className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-1">
                <option value="">Sin hábito</option>
                {habits.map((h) => (<option key={h.id} value={h.id}>{h.title}</option>))}
              </select>
              <select value={newTaskLinkedBook} onChange={(e) => setNewTaskLinkedBook(e.target.value)} className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="">Sin libro</option>
                {books.map((b) => (<option key={b.id} value={b.id}>{b.title}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Repetir (Opcional):</label>
            <div className="flex items-center gap-2 mt-1">
              <select value={newTaskRecurrenceType} onChange={(e) => setNewTaskRecurrenceType(e.target.value as any)} className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="none">No repetir</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
              {newTaskRecurrenceType !== 'none' && (
                <>
                  <span className="text-[10px] text-slate-500">Cada</span>
                  <input type="number" min={1} value={newTaskRecurrenceInterval} onChange={(e) => setNewTaskRecurrenceInterval(Number(e.target.value))} className="w-16 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <span className="text-[10px] text-slate-500">{newTaskRecurrenceType === 'daily' ? 'día(s)' : newTaskRecurrenceType === 'weekly' ? 'semana(s)' : 'mes(es)'}</span>
                  <span className="text-[10px] text-slate-500 ml-2">Termina tras</span>
                  <input type="number" min={0} value={newTaskRecurrenceEnds} onChange={(e) => setNewTaskRecurrenceEnds(Number(e.target.value))} placeholder="∞" className="w-16 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" title="0 = sin límite" />
                  <span className="text-[10px] text-slate-500">ocurrencias</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddingTask(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">Guardar Tarea</button>
          </div>
        </form>
      )}

      {isAddingProject && (
        <form onSubmit={handleCreateProject} className="p-5 rounded-3xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nuevo Proyecto</h3>
          <input type="text" placeholder="Nombre del proyecto" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
          <textarea placeholder="Objetivo o descripción corta" value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddingProject(false)} className="px-3 py-1.5 text-xs rounded-lg text-slate-500">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Crear Proyecto</button>
          </div>
        </form>
      )}

      {viewMode === 'list' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {filteredAndSortedTasks.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No se encontraron tareas con los filtros seleccionados.</p>
          ) : (
            filteredAndSortedTasks.map((t) => renderTaskCard(t))
          )}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kanbanColumns.map((col) => {
            const colTasks = filteredAndSortedTasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 min-h-[400px]">
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.color}`}>
                  <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div key={t.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <p className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{t.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{t.priority.toUpperCase()}</span>
                      </div>
                      {t.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>}
                      {t.subtasks.length > 0 && (
                        <p className="text-[10px] text-slate-400">{t.subtasks.filter((st) => st.completed).length}/{t.subtasks.length} subtareas</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                        <span className="text-slate-400 font-mono">{t.dueDate || '—'}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => regressStatus(t)} disabled={t.status === 'todo'} className={`p-1 ${t.status === 'todo' ? 'text-slate-300' : 'text-slate-400 hover:text-amber-500'}`} title="Retroceder"><ChevronLeft className="w-3 h-3" /></button>
                          <button onClick={() => advanceStatus(t)} disabled={t.status === 'completed'} className={`p-1 ${t.status === 'completed' ? 'text-slate-300' : 'text-slate-400 hover:text-blue-500'}`} title="Avanzar"><ChevronRight className="w-3 h-3" /></button>
                          <button onClick={() => startEditingTask(t)} className="text-slate-400 hover:text-amber-500 p-1" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteConfirmTask(t)} className="text-slate-400 hover:text-red-500 p-1" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {renderCalendarGrid()}
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <form ref={editModalRef} onSubmit={handleUpdateTask} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-amber-500" /><span>Editar Tarea</span></h3>
              <button type="button" onClick={() => setEditingTask(null)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título:</label>
                <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción:</label>
                <textarea rows={3} value={editTaskDesc} onChange={(e) => setEditTaskDesc(e.target.value)} className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Estado:</label>
                  <select value={editTaskStatus} onChange={(e) => setEditTaskStatus(e.target.value as TaskStatus)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="todo">Por Hacer</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridad:</label>
                  <select value={editTaskPriority} onChange={(e) => setEditTaskPriority(e.target.value as Priority)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="p1">P1 - Urgente</option>
                    <option value="p2">P2 - Alta</option>
                    <option value="p3">P3 - Media</option>
                    <option value="p4">P4 - Baja</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Límite:</label>
                  <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Alarma:</label>
                  <input type="time" value={editTaskNotifyAt} onChange={(e) => setEditTaskNotifyAt(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Turno:</label>
                  <select value={editTaskShift} onChange={(e) => setEditTaskShift(e.target.value as any)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="all">Todos</option>
                    <option value="work">⛏️ Faena</option>
                    <option value="rest">🏠 Descanso</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Área:</label>
                  <select value={editTaskArea} onChange={(e) => setEditTaskArea(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Proyecto:</label>
                  <select value={editTaskProject} onChange={(e) => setEditTaskProject(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="">Sin Proyecto</option>
                    {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Vincular:</label>
                  <select value={editTaskLinkedHabit} onChange={(e) => setEditTaskLinkedHabit(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-1">
                    <option value="">Sin hábito</option>
                    {habits.map((h) => (<option key={h.id} value={h.id}>{h.title}</option>))}
                  </select>
                  <select value={editTaskLinkedBook} onChange={(e) => setEditTaskLinkedBook(e.target.value)} className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="">Sin libro</option>
                    {books.map((b) => (<option key={b.id} value={b.id}>{b.title}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setDeleteConfirmTask(null)}>
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950 text-red-500"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eliminar Tarea</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">¿Estás seguro de eliminar <strong>"{deleteConfirmTask.title}"</strong>?</p>
            {deleteConfirmTask.subtasks.length > 0 && <p className="text-[10px] text-amber-600">También se eliminarán sus {deleteConfirmTask.subtasks.length} subtareas.</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmTask(null)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={handleDeleteWithConfirm} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
