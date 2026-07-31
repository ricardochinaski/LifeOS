import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { HealthLog, WorkoutLog, WorkoutType } from '../../types';
import { GoogleFitSyncModal } from '../integrations/GoogleFitSyncModal';
import {
  HeartPulse, Activity, Plus,
  PhoneCall, Droplets, Clock, Trash2, Edit3, X,
  Weight, Moon, Footprints, Flame, Dumbbell, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';

export const HealthView: React.FC = () => {
  const {
    healthProfile,
    healthLogs,
    workoutLogs,
    updateHealthProfile,
    addHealthLog,
    deleteHealthLog,
    addWorkoutLog,
    deleteWorkoutLog,
    shiftInfo
  } = useLifeOS();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingLogModalOpen, setIsAddingLogModalOpen] = useState(false);
  const [isAddingWorkoutModalOpen, setIsAddingWorkoutModalOpen] = useState(false);
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Health Profile Edit State
  const [editBloodType, setEditBloodType] = useState(healthProfile.bloodType);
  const [editHeightCm, setEditHeightCm] = useState(healthProfile.heightCm);
  const [editWeightKg, setEditWeightKg] = useState(healthProfile.weightKg);
  const [editEmergencyName, setEditEmergencyName] = useState(healthProfile.emergencyContact.name);
  const [editEmergencyKin, setEditEmergencyKin] = useState(healthProfile.emergencyContact.kinship);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(healthProfile.emergencyContact.phone);
  const [editInsurance, setEditInsurance] = useState(healthProfile.emergencyContact.insuranceProvider);
  const [editAltitude, setEditAltitude] = useState(healthProfile.miningAltitudeMeters);

  // New Health Log State
  const [newSystolic, setNewSystolic] = useState<number | ''>(120);
  const [newDiastolic, setNewDiastolic] = useState<number | ''>(80);
  const [newHeartRate, setNewHeartRate] = useState<number | ''>(68);
  const [newSpO2, setNewSpO2] = useState<number | ''>(96);
  const [newWeight, setNewWeight] = useState<number | ''>(healthProfile.weightKg);
  const [newSleepHours, setNewSleepHours] = useState<number | ''>(7.5);
  const [newSleepQuality, setNewSleepQuality] = useState<'excelente' | 'buena' | 'regular' | 'mala'>('buena');
  const [newEnergyLevel, setNewEnergyLevel] = useState<number>(8);
  const [newLocationContext, setNewLocationContext] = useState<'rest_home' | 'mine_camp' | 'transit'>(
    shiftInfo.phase === 'rest' ? 'rest_home' : 'mine_camp'
  );
  const [newSymptomsInput, setNewSymptomsInput] = useState<string>('');
  const [newNotesInput, setNewNotesInput] = useState<string>('');

  // New Workout Log State
  const [newWorkoutType, setNewWorkoutType] = useState<WorkoutType>('strength');
  const [newWorkoutDuration, setNewWorkoutDuration] = useState<number | ''>(45);
  const [newWorkoutExercises, setNewWorkoutExercises] = useState<{ name: string; sets: number; reps: string; weightKg?: number }[]>([{ name: '', sets: 3, reps: '10-12', weightKg: undefined }]);
  const [newWorkoutCalories, setNewWorkoutCalories] = useState<number | ''>('');
  const [newWorkoutNotes, setNewWorkoutNotes] = useState<string>('');
  const [newWorkoutLocation, setNewWorkoutLocation] = useState<'rest_home' | 'mine_camp' | 'transit'>('rest_home');

  // Calculate BMI
  const heightInMeters = healthProfile.heightCm / 100;
  const bmi = heightInMeters > 0 ? (healthProfile.weightKg / (heightInMeters * heightInMeters)).toFixed(1) : '0';
  const bmiVal = parseFloat(bmi);

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Bajo peso', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (val < 25) return { label: 'Peso Normal (Saludable)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (val < 30) return { label: 'Sobrepeso leve', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Obesidad', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const bmiInfo = getBmiCategory(bmiVal);
  const latestLog = healthLogs.length > 0 ? healthLogs[0] : null;

  const getWorkoutTypeIcon = (type: WorkoutType) => {
    switch (type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />;
      case 'cardio': return <Activity className="w-4 h-4" />;
      case 'hiit': return <Flame className="w-4 h-4" />;
      case 'yoga': return <HeartPulse className="w-4 h-4" />;
      case 'mobility': return <Footprints className="w-4 h-4" />;
      case 'sports': return <Activity className="w-4 h-4" />;
      default: return <Dumbbell className="w-4 h-4" />;
    }
  };

  const getWorkoutTypeColor = (type: WorkoutType) => {
    switch (type) {
      case 'strength': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cardio': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'hiit': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'yoga': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'mobility': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'sports': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getWorkoutTypeLabel = (type: WorkoutType) => {
    switch (type) {
      case 'strength': return 'Fuerza';
      case 'cardio': return 'Cardio';
      case 'hiit': return 'HIIT';
      case 'yoga': return 'Yoga / Movilidad';
      case 'mobility': return 'Movilidad';
      case 'sports': return 'Deportes';
      default: return 'Otro';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateHealthProfile({
      bloodType: editBloodType,
      heightCm: Number(editHeightCm),
      weightKg: Number(editWeightKg),
      allergies: [],
      chronicConditions: [],
      miningAltitudeMeters: Number(editAltitude),
      emergencyContact: {
        name: editEmergencyName,
        kinship: editEmergencyKin,
        phone: editEmergencyPhone,
        insuranceProvider: editInsurance,
      },
    });
    setIsEditingProfile(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const symptoms = newSymptomsInput
      ? newSymptomsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    addHealthLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bloodPressureSys: newSystolic !== '' ? Number(newSystolic) : undefined,
      bloodPressureDia: newDiastolic !== '' ? Number(newDiastolic) : undefined,
      heartRateBpm: newHeartRate !== '' ? Number(newHeartRate) : undefined,
      spO2Pct: newSpO2 !== '' ? Number(newSpO2) : undefined,
      weightKg: newWeight !== '' ? Number(newWeight) : undefined,
      sleepHours: newSleepHours !== '' ? Number(newSleepHours) : undefined,
      sleepQuality: newSleepQuality,
      energyLevel: newEnergyLevel,
      locationContext: newLocationContext,
      altitudeSymptoms: symptoms,
      notes: newNotesInput,
    });

    setIsAddingLogModalOpen(false);
    setNewSymptomsInput('');
    setNewNotesInput('');
  };

  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const validExercises = newWorkoutExercises.filter(ex => ex.name.trim() && ex.sets > 0);
    if (validExercises.length === 0) return;

    addWorkoutLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: newWorkoutType,
      durationMinutes: Number(newWorkoutDuration) || 0,
      exercises: validExercises,
      caloriesBurned: newWorkoutCalories !== '' ? Number(newWorkoutCalories) : undefined,
      notes: newWorkoutNotes,
      locationContext: newWorkoutLocation,
    });

    setIsAddingWorkoutModalOpen(false);
    setNewWorkoutExercises([{ name: '', sets: 3, reps: '10-12', weightKg: undefined }]);
    setNewWorkoutNotes('');
    setNewWorkoutCalories('');
  };

  const addExerciseRow = () => {
    setNewWorkoutExercises(prev => [...prev, { name: '', sets: 3, reps: '10-12', weightKg: undefined }]);
  };

  const removeExerciseRow = (index: number) => {
    setNewWorkoutExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: string | number) => {
    setNewWorkoutExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Salud y Biometría</span>
            <h1 className="text-2xl font-black text-white">Ficha Médica</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control biométrico, peso, pasos y sincronización con Google Fit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFitModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Sincronizar con Google Fit</span>
          </button>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>{isEditingProfile ? 'Cerrar Edición' : 'Editar Ficha'}</span>
          </button>

          <button
            onClick={() => setIsAddingLogModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Constantes</span>
          </button>
        </div>
      </div>

      {/* Edit Profile */}
      {isEditingProfile && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/40 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Editar Ficha Médica
            </h3>
            <button type="button" onClick={() => setIsEditingProfile(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">Grupo Sanguíneo</label>
              <input type="text" value={editBloodType} onChange={(e) => setEditBloodType(e.target.value)} placeholder="Ej. O Rh+" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Estatura (cm)</label>
              <input type="number" value={editHeightCm} onChange={(e) => setEditHeightCm(Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Peso (kg)</label>
              <input type="number" step="0.1" value={editWeightKg} onChange={(e) => setEditWeightKg(Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Altitud Faena (msnm)</label>
              <input type="number" value={editAltitude} onChange={(e) => setEditAltitude(Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300">Contacto Emergencia</label>
              <input type="text" value={editEmergencyName} onChange={(e) => setEditEmergencyName(e.target.value)} placeholder="Nombre completo" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Parentesco</label>
              <input type="text" value={editEmergencyKin} onChange={(e) => setEditEmergencyKin(e.target.value)} placeholder="Ej. Cónyuge" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Teléfono</label>
              <input type="text" value={editEmergencyPhone} onChange={(e) => setEditEmergencyPhone(e.target.value)} placeholder="+56 9..." className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Previsión / Isapre</label>
              <input type="text" value={editInsurance} onChange={(e) => setEditInsurance(e.target.value)} placeholder="Ej. Banmédica + ACHS" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg">Guardar</button>
          </div>
        </form>
      )}

      {/* Biometrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Grupo Sanguíneo</span>
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400"><HeartPulse className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-white">{healthProfile.bloodType}</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">IMC</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Activity className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{bmi}</span>
            <span className="text-xs text-slate-400">({healthProfile.weightKg} kg / {healthProfile.heightCm} cm)</span>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${bmiInfo.color}`}>{bmiInfo.label}</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">SpO2 Reciente</span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400"><Droplets className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-indigo-400">{latestLog?.spO2Pct ? `${latestLog.spO2Pct}%` : '97%'}</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Contacto Emergencia</span>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><PhoneCall className="w-4 h-4" /></span>
          </div>
          <div className="text-sm font-bold text-white truncate">{healthProfile.emergencyContact.name}</div>
          <p className="text-[11px] text-slate-400">{healthProfile.emergencyContact.kinship} · <span className="font-mono text-emerald-400">{healthProfile.emergencyContact.phone}</span></p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Peso</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Weight className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-white">{latestLog?.weightKg ?? healthProfile.weightKg} kg</div>
          <p className="text-[11px] text-slate-400">{latestLog?.weightKg ? `Registrado ${latestLog.date}` : 'Peso actual de ficha'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Sueño</span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400"><Moon className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-indigo-400">{latestLog?.sleepHours ? `${latestLog.sleepHours} hrs` : '--'}</div>
          <p className="text-[11px] text-slate-400">{latestLog?.sleepQuality ? `Calidad ${latestLog.sleepQuality} · ${latestLog.date}` : 'Sin datos de sueño'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Pasos</span>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><Footprints className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-amber-400">{latestLog?.steps ? latestLog.steps.toLocaleString() : '--'}</div>
          <p className="text-[11px] text-slate-400">{latestLog?.steps ? `Último registro ${latestLog.date}` : 'Sin datos de pasos'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Calorías</span>
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400"><Flame className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-rose-400">{latestLog?.calories ? `${latestLog.calories.toLocaleString()} kcal` : '--'}</div>
          <p className="text-[11px] text-slate-400">{latestLog?.calories ? `Registrado ${latestLog.date}` : 'Sin datos de calorías'}</p>
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white">Historial de Constantes ({healthLogs.length})</h2>
          <button onClick={() => setIsAddingLogModalOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all">+ Nuevo</button>
        </div>

        <div className="space-y-3">
          {healthLogs.map((log) => (
            <div key={log.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-800 text-slate-300"><Activity className="w-5 h-5 text-indigo-400" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.date} {log.time ? `· ${log.time}` : ''}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${log.locationContext === 'mine_camp' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                      {log.locationContext === 'mine_camp' ? 'Faena ⛏️' : 'Descanso 🌿'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-300">
                    {log.bloodPressureSys && <span>P.A: <strong className="text-white">{log.bloodPressureSys}/{log.bloodPressureDia} mmHg</strong></span>}
                    {log.spO2Pct && <span>SpO2: <strong className="text-indigo-400">{log.spO2Pct}%</strong></span>}
                    {log.heartRateBpm && <span>Pulso: <strong className="text-rose-400">{log.heartRateBpm} bpm</strong></span>}
                    {log.sleepHours && <span>Sueño: <strong className="text-emerald-400">{log.sleepHours} hrs</strong></span>}
                  </div>
                  {log.notes && <p className="text-xs text-slate-400 italic mt-1">{log.notes}</p>}
                </div>
              </div>
              <button onClick={() => deleteHealthLog(log.id)} className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Workout Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Entrenamientos ({workoutLogs.length})</h2>
          </div>
          <button onClick={() => setIsAddingWorkoutModalOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all">+ Entrenamiento</button>
        </div>

        <div className="space-y-3">
          {workoutLogs.map((log) => (
            <div key={log.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${getWorkoutTypeColor(log.type)}`}>
                    {getWorkoutTypeIcon(log.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.date} {log.time ? `· ${log.time}` : ''}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${getWorkoutTypeColor(log.type)}`}>
                        {getWorkoutTypeLabel(log.type)}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-800 text-slate-400 border-slate-700">
                        {log.durationMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedWorkout(expandedWorkout === log.id ? null : log.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title={expandedWorkout === log.id ? 'Colapsar' : 'Expandir'}
                  >
                    {expandedWorkout === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteWorkoutLog(log.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                {log.exercises.length > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700">
                    {log.exercises.length} ejercicios
                  </span>
                )}
                {log.caloriesBurned && <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">{log.caloriesBurned} kcal</span>}
                {log.locationContext && <span className={`px-2 py-1 rounded-lg ${log.locationContext === 'mine_camp' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                  {log.locationContext === 'mine_camp' ? 'Faena ⛏️' : 'Descanso 🌿'}
                </span>}
              </div>

              {expandedWorkout === log.id && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  {log.exercises.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <p className="text-xs font-bold text-white">{ex.name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-slate-300">
                        <span>Series: <strong className="text-white">{ex.sets}</strong></span>
                        <span>Reps: <strong className="text-white">{ex.reps}</strong></span>
                        {ex.weightKg && <span>Peso: <strong className="text-amber-400">{ex.weightKg} kg</strong></span>}
                        {ex.rpe && <span>RPE: <strong className="text-rose-400">{ex.rpe}/10</strong></span>}
                      </div>
                    </div>
                  ))}
                  {log.notes && <p className="text-xs text-slate-400 italic">{log.notes}</p>}
                </div>
              )}
            </div>
          ))}
          {workoutLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No hay entrenamientos registrados. Agrega tu primera sesión de fuerza, cardio o yoga.
            </div>
          )}
        </div>
      </div>

      {/* Add Health Log Modal */}
      {isAddingLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><HeartPulse className="w-5 h-5 text-emerald-400" /> Nuevo Registro</h2>
              <button onClick={() => setIsAddingLogModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Contexto</label>
                  <select value={newLocationContext} onChange={(e) => setNewLocationContext(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white">
                    <option value="mine_camp">⛏️ Campamento Minero</option>
                    <option value="rest_home">🌿 Casa / Descanso</option>
                    <option value="transit">🚌 En Tránsito</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">SpO2 (%)</label>
                  <input type="number" value={newSpO2} onChange={(e) => setNewSpO2(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">P.A. Sistólica</label>
                  <input type="number" value={newSystolic} onChange={(e) => setNewSystolic(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">P.A. Diastólica</label>
                  <input type="number" value={newDiastolic} onChange={(e) => setNewDiastolic(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Pulso (bpm)</label>
                  <input type="number" value={newHeartRate} onChange={(e) => setNewHeartRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Sueño (hrs)</label>
                  <input type="number" step="0.5" value={newSleepHours} onChange={(e) => setNewSleepHours(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Calidad</label>
                  <select value={newSleepQuality} onChange={(e) => setNewSleepQuality(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white">
                    <option value="excelente">Excelente ✨</option>
                    <option value="buena">Buena 👍</option>
                    <option value="regular">Regular 😐</option>
                    <option value="mala">Mala 💤</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Síntomas de Altura (separados por coma)</label>
                <input type="text" value={newSymptomsInput} onChange={(e) => setNewSymptomsInput(e.target.value)} placeholder="Ej. Cefalea leve, Sequedad nasal" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Notas</label>
                <input type="text" value={newNotesInput} onChange={(e) => setNewNotesInput(e.target.value)} placeholder="Ej. Buena recuperación tras turno" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddingLogModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Workout Log Modal */}
      {isAddingWorkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><Dumbbell className="w-5 h-5 text-amber-400" /> Nuevo Entrenamiento</h2>
              <button onClick={() => setIsAddingWorkoutModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddWorkout} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Tipo</label>
                  <select value={newWorkoutType} onChange={(e) => setNewWorkoutType(e.target.value as WorkoutType)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white">
                    <option value="strength">🏋️ Fuerza</option>
                    <option value="cardio">🏃 Cardio</option>
                    <option value="hiit">🔥 HIIT</option>
                    <option value="yoga">🧘 Yoga</option>
                    <option value="mobility">🤸 Movilidad</option>
                    <option value="sports">⚽ Deportes</option>
                    <option value="other">📦 Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Duración (min)</label>
                  <input type="number" min="1" value={newWorkoutDuration} onChange={(e) => setNewWorkoutDuration(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Contexto</label>
                <select value={newWorkoutLocation} onChange={(e) => setNewWorkoutLocation(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white">
                  <option value="rest_home">🌿 Casa / Descanso</option>
                  <option value="mine_camp">⛏️ Campamento Minero</option>
                  <option value="transit">🚌 En Tránsito</option>
                </select>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">Ejercicios</label>
                  <button type="button" onClick={addExerciseRow} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Agregar ejercicio</button>
                </div>
                <div className="space-y-2">
                  {newWorkoutExercises.map((ex, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input type="text" value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} placeholder="Ej. Press banca, Sentadilla" className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="1" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', Number(e.target.value))} placeholder="Series" className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono text-center" required />
                      </div>
                      <div className="col-span-3">
                        <input type="text" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} placeholder="Reps (ej. 10-12)" className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" step="0.5" min="0" value={ex.weightKg || ''} onChange={(e) => updateExercise(idx, 'weightKg', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="Peso kg" className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono text-center" />
                      </div>
                      {newWorkoutExercises.length > 1 && (
                        <button type="button" onClick={() => removeExerciseRow(idx)} className="col-span-auto p-2 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-500 hover:text-rose-400 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Calorías (opcional)</label>
                  <input type="number" min="0" value={newWorkoutCalories} onChange={(e) => setNewWorkoutCalories(e.target.value === '' ? '' : Number(e.target.value))} placeholder="ej. 350" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Peso corporal (opcional)</label>
                  <input type="number" step="0.1" min="0" value={newWeight} onChange={(e) => setNewWeight(e.target.value === '' ? '' : Number(e.target.value))} placeholder="ej. 75.5" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Notas</label>
                <input type="text" value={newWorkoutNotes} onChange={(e) => setNewWorkoutNotes(e.target.value)} placeholder="Ej. Buena sesión, progresión de peso" className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddingWorkoutModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg">Guardar Entrenamiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GoogleFitSyncModal isOpen={isFitModalOpen} onClose={() => setIsFitModalOpen(false)} />
    </div>
  );
};
