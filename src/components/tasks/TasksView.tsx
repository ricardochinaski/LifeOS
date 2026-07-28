import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { Task, ViewMode, Priority, TaskStatus } from '../../types';
import {
  CheckSquare, Plus, List, LayoutGrid, Calendar as CalendarIcon,
  Filter, Clock, CheckCircle2, Circle, Trash2, Edit3, ChevronDown,
  ChevronRight, Tag, Sparkles, FolderPlus, AlertCircle
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    areas,
    addTask,
    toggleTaskStatus,
    deleteTask,
    updateTask,
    addProject,
    openQuickCapture
  } = useLifeOS();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('p3');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTaskArea, setNewTaskArea] = useState<string>('area_work');
  const [newTaskProject, setNewTaskProject] = useState<string>('');

  // New project modal state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjArea, setNewProjArea] = useState('area_work');

  // Editing task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('p3');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskArea, setEditTaskArea] = useState('');
  const [editTaskProject, setEditTaskProject] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo');

  const startEditingTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskArea(task.areaId || 'area_work');
    setEditTaskProject(task.projectId || '');
    setEditTaskStatus(task.status);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;

    updateTask(editingTask.id, {
      title: editTaskTitle,
      description: editTaskDesc,
      priority: editTaskPriority,
      dueDate: editTaskDueDate,
      areaId: editTaskArea,
      projectId: editTaskProject || undefined,
      status: editTaskStatus
    });

    setEditingTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedAreaFilter !== 'all' && t.areaId !== selectedAreaFilter) return false;
    if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) return false;
    if (selectedProjectFilter !== 'all' && t.projectId !== selectedProjectFilter) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'todo',
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      areaId: newTaskArea,
      projectId: newTaskProject || undefined,
      subtasks: [],
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddingTask(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    addProject({
      name: newProjName,
      description: newProjDesc,
      areaId: newProjArea,
      color: '#3B82F6',
      icon: 'Rocket',
    });

    setNewProjName('');
    setNewProjDesc('');
    setIsAddingProject(false);
  };

  const kanbanColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'Por Hacer', color: 'border-slate-300 dark:border-slate-700' },
    { status: 'in_progress', label: 'En Proceso', color: 'border-blue-400 dark:border-blue-600' },
    { status: 'completed', label: 'Completadas', color: 'border-emerald-500 dark:border-emerald-600' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Top Controls & Header */}
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

        {/* View Mode & Add Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddingProject(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Area & Priority Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Áreas:</span>
        <button
          onClick={() => setSelectedAreaFilter('all')}
          className={`px-3 py-1.5 rounded-xl border font-medium transition-all ${
            selectedAreaFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Todas las áreas
        </button>
        {areas.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAreaFilter(a.id)}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-all ${
              selectedAreaFilter === a.id
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {a.name}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Prioridad:</span>
        {['all', 'p1', 'p2', 'p3', 'p4'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriorityFilter(p)}
            className={`px-2.5 py-1 rounded-lg border uppercase text-[10px] font-bold transition-all ${
              selectedPriorityFilter === p
                ? 'bg-slate-800 text-amber-400 border-slate-700'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {p === 'all' ? 'Todas' : p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Create Task Form Dropdown */}
      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nueva Tarea</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Título de la tarea"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <textarea
            placeholder="Descripción u observaciones opcionales"
            rows={2}
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridad:</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="p1">P1 - Urgente e Importante</option>
                <option value="p2">P2 - Alta Prioridad</option>
                <option value="p3">P3 - Media Prioridad</option>
                <option value="p4">P4 - Baja / Sin Fecha</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Área:</label>
              <select
                value={newTaskArea}
                onChange={(e) => setNewTaskArea(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Proyecto (Opcional):</label>
              <select
                value={newTaskProject}
                onChange={(e) => setNewTaskProject(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Sin Proyecto Vincular</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      )}

      {/* New Project Modal */}
      {isAddingProject && (
        <form onSubmit={handleCreateProject} className="p-5 rounded-3xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nuevo Proyecto</h3>
          <input
            type="text"
            placeholder="Nombre del proyecto (Ej: Lanzamiento Web)"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            required
          />
          <textarea
            placeholder="Objetivo o descripción corta"
            value={newProjDesc}
            onChange={(e) => setNewProjDesc(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingProject(false)}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
            >
              Crear Proyecto
            </button>
          </div>
        </form>
      )}

      {/* VIEW MODE 1: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {filteredTasks.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No se encontraron tareas con los filtros seleccionados.</p>
          ) : (
            filteredTasks.map((t) => {
              const proj = projects.find((p) => p.id === t.projectId);
              const area = areas.find((a) => a.id === t.areaId);

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    t.status === 'completed'
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTaskStatus(t.id)}
                      className={`mt-0.5 transition-colors ${
                        t.status === 'completed' ? 'text-emerald-500' : 'text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div>
                      <p className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          t.priority === 'p2' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {t.priority.toUpperCase()}
                        </span>

                        {area && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {area.name}
                          </span>
                        )}

                        {proj && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            📁 {proj.name}
                          </span>
                        )}

                        {t.dueDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      onClick={() => startEditingTask(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar tarea"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => {
              if (col.status === 'todo') return t.status === 'todo';
              if (col.status === 'in_progress') return t.status === 'in_progress';
              return t.status === 'completed';
            });

            return (
              <div key={col.status} className="p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 min-h-[400px]">
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.color}`}>
                  <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    {col.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <p className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {t.title}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {t.priority.toUpperCase()}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                        <span className="text-slate-400 font-mono">{t.dueDate || 'Hoy'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingTask(t)}
                            className="text-slate-400 hover:text-amber-500 p-1"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleTaskStatus(t.id)}
                            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                          >
                            {t.status === 'completed' ? 'Reabrir' : 'Completar ✓'}
                          </button>
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

      {/* VIEW MODE 3: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <span>Vista de Cronograma y Fechas Límite</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['Hoy', 'Mañana', 'Esta Semana', 'Próximas Fechas'].map((bucket, idx) => {
              return (
                <div key={bucket} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    {bucket}
                  </span>
                  <div className="space-y-2">
                    {filteredTasks.slice(idx * 2, idx * 2 + 2).map((t) => (
                      <div key={t.id} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{t.title}</p>
                        <p className="text-[10px] text-slate-400 pt-0.5">{t.dueDate || 'Sin fecha'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <form
            onSubmit={handleUpdateTask}
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>Editar Tarea</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título:</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción / Observaciones:</label>
                <textarea
                  rows={3}
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Estado:</label>
                  <select
                    value={editTaskStatus}
                    onChange={(e) => setEditTaskStatus(e.target.value as TaskStatus)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="todo">Por Hacer</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridad:</label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value as Priority)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="p1">P1 - Urgente e Importante</option>
                    <option value="p2">P2 - Alta Prioridad</option>
                    <option value="p3">P3 - Media Prioridad</option>
                    <option value="p4">P4 - Baja / Sin Fecha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Límite:</label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Área:</label>
                  <select
                    value={editTaskArea}
                    onChange={(e) => setEditTaskArea(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Proyecto:</label>
                  <select
                    value={editTaskProject}
                    onChange={(e) => setEditTaskProject(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Sin Proyecto Vincular</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
