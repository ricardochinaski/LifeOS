import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { HealthLog, OccupationalExam } from '../../types';
import { AiWorkoutPlanner } from './AiWorkoutPlanner';
import { XiaomiFitnessSyncModal } from './XiaomiFitnessSyncModal';
import { GoogleFitSyncModal } from '../integrations/GoogleFitSyncModal';
import {
  HeartPulse, Activity, ShieldCheck, Plus,
  FileText, PhoneCall, UserCheck, Droplets, Moon,
  Sparkles, Clock, Trash2, Edit3, X, ChevronRight,
  TrendingUp, Thermometer, ShieldAlert, MapPin, Coffee, Pickaxe, Info, Dumbbell, Watch
} from 'lucide-react';

export const HealthView: React.FC = () => {
  const {
    healthProfile,
    healthLogs,
    updateHealthProfile,
    addHealthLog,
    deleteHealthLog,
    shiftInfo
  } = useLifeOS();

  const [activeTabSection, setActiveTabSection] = useState<'overview' | 'workout' | 'exams' | 'recommendations' | 'history'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingLogModalOpen, setIsAddingLogModalOpen] = useState(false);
  const [isXiaomiModalOpen, setIsXiaomiModalOpen] = useState(false);
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);

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

  // Calculate BMI (IMC)
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

  // Latest log stats
  const latestLog = healthLogs.length > 0 ? healthLogs[0] : null;

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in text-white">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Modulo de Salud Ocupacional & Biometría
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Altitud: {healthProfile.miningAltitudeMeters} msnm
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Ficha Médica & Salud 14x14</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de perfil biométrico, exámenes preocupacionales y constantes vitales para trabajo en minería.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFitModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Google Fit API</span>
          </button>

          <button
            onClick={() => setIsXiaomiModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Watch className="w-4 h-4 text-orange-400" />
            <span>Xiaomi Mi Fitness</span>
          </button>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>{isEditingProfile ? 'Cerrar Edición' : 'Editar Ficha Médica'}</span>
          </button>

          <button
            onClick={() => setIsAddingLogModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Constantes Vitales</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs within Health */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTabSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'overview'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ficha General & Biometría</span>
        </button>

        <button
          onClick={() => setActiveTabSection('workout')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'workout'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span>Rutina de Ejercicios IA</span>
        </button>

        <button
          onClick={() => setActiveTabSection('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'exams'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Exámenes Ocupacionales ({healthProfile.occupationalExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSection('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'recommendations'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Recomendaciones 14x14 & Aclimatación</span>
        </button>

        <button
          onClick={() => setActiveTabSection('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'history'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial de Constantes ({healthLogs.length})</span>
        </button>
      </div>

      {/* Edit Health Profile Drawer / Form if active */}
      {isEditingProfile && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/40 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Editar Ficha Médica y Perfil de Salud
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">Grupo Sanguíneo</label>
              <input
                type="text"
                value={editBloodType}
                onChange={(e) => setEditBloodType(e.target.value)}
                placeholder="Ej. O Rh+"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Estatura (cm)</label>
              <input
                type="number"
                value={editHeightCm}
                onChange={(e) => setEditHeightCm(Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Peso Actual (kg)</label>
              <input
                type="number"
                step="0.1"
                value={editWeightKg}
                onChange={(e) => setEditWeightKg(Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Altitud Faena (msnm)</label>
              <input
                type="number"
                value={editAltitude}
                onChange={(e) => setEditAltitude(Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300">Contacto de Emergencia</label>
              <input
                type="text"
                value={editEmergencyName}
                onChange={(e) => setEditEmergencyName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Parentesco</label>
              <input
                type="text"
                value={editEmergencyKin}
                onChange={(e) => setEditEmergencyKin(e.target.value)}
                placeholder="Ej. Cónyuge"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Teléfono Emergencia</label>
              <input
                type="text"
                value={editEmergencyPhone}
                onChange={(e) => setEditEmergencyPhone(e.target.value)}
                placeholder="+56 9..."
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Previsión / Isapre / Mutual</label>
              <input
                type="text"
                value={editInsurance}
                onChange={(e) => setEditInsurance(e.target.value)}
                placeholder="Ej. Banmédica + ACHS"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
            >
              Guardar Ficha Médica
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: OVERVIEW & BIOMETRICS */}
      {activeTabSection === 'overview' && (
        <div className="space-y-6">
          {/* Biometrics Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blood Type & Vitals */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Grupo Sanguíneo</span>
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <HeartPulse className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-white">{healthProfile.bloodType}</div>
              <p className="text-[11px] text-slate-400">Donante universal / Compatible en emergencias de faena.</p>
            </div>

            {/* Height, Weight & BMI */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Masa Corporal (IMC)</span>
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{bmi}</span>
                <span className="text-xs text-slate-400 font-medium">({healthProfile.weightKg} kg / {healthProfile.heightCm} cm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${bmiInfo.color}`}>
                  {bmiInfo.label}
                </span>
              </div>
            </div>

            {/* Latest SpO2 Oxygen saturation */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Saturación SpO2 Reciente</span>
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Droplets className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-400">
                  {latestLog?.spO2Pct ? `${latestLog.spO2Pct}%` : '97%'}
                </span>
                <span className="text-xs text-slate-400">
                  ({latestLog?.locationContext === 'mine_camp' ? 'En Faena 3.800m' : 'En Descanso / Casa'})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {latestLog?.spO2Pct && latestLog.spO2Pct < 92
                  ? '⚠️ Rango adaptativo en altura. Hidratación intensiva recomendada.'
                  : '✓ Rango óptimo oxigenación celular.'}
              </p>
            </div>

            {/* Emergency Contact & Insurance */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Contacto Emergencia</span>
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <PhoneCall className="w-4 h-4" />
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate">{healthProfile.emergencyContact.name}</div>
              <p className="text-[11px] text-slate-400">
                {healthProfile.emergencyContact.kinship} · <span className="font-mono text-emerald-400">{healthProfile.emergencyContact.phone}</span>
              </p>
              <p className="text-[10px] text-slate-500 truncate">{healthProfile.emergencyContact.insuranceProvider}</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OCCUPATIONAL EXAMS */}
      {activeTabSection === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Batería de Exámenes Ocupacionales de Faena</h2>
              <p className="text-xs text-slate-400">Certificación de Altura Física y exámenes preocupacionales periódicos</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Vigencia General: Al día
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthProfile.occupationalExams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{exam.title}</h3>
                      <p className="text-xs text-slate-400">{exam.institution || 'Mutual de Seguridad / ACHS'}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                    exam.status === 'valid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {exam.status === 'valid' ? 'Vigente ✓' : 'Renovar Pronto ⏳'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Emisión:</span>
                    <span className="font-mono text-slate-300">{exam.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vencimiento:</span>
                    <span className="font-mono text-slate-300">{exam.expiryDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: RECOMMENDATIONS & 14X14 MINING PROTOCOL */}
      {activeTabSection === 'recommendations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-800/60 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Protocolo de Salud y Adaptación para Rotación Minera 14x14</h2>
                <p className="text-xs text-slate-300">
                  Fase Actual: <span className="font-bold text-indigo-300">Día {shiftInfo.dayInPhase} de {shiftInfo.totalPhaseDays} ({shiftInfo.phase === 'rest' ? 'Descanso 🌿' : 'Faena Minera ⛏️'})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pillar 1: Aclimatación & Oxigenación */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Droplets className="w-4 h-4" />
                  <span>1. Hidratación & Aclimatación</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  En altitudes superiores a 3.000m, la humedad ambiental cae drásticamente. Consume mínimo <strong className="text-white">3.5 Litros de agua diarios</strong> para mitigar sequedad de mucosas y cefalea.
                </p>
              </div>

              {/* Pillar 2: Sueño & Ritmo Circadiano */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Moon className="w-4 h-4" />
                  <span>2. Higiene del Sueño en Campamento</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Asegura oscuridad total en tu habitación de campamento y tapones auditivos. La presión de oxígeno reducida genera microsueños nocturnos; mantén horarios estrictos de acostada.
                </p>
              </div>

              {/* Pillar 3: Transición Faena / Descanso */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>3. Transición de Bajada a Descanso</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Los primeros 3 días de descanso son para compensar deuda acumulada de oxígeno y fatiga física. Dedica tiempo a actividad cardiovascular moderada al nivel del mar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: AI WORKOUT PLANNER */}
      {activeTabSection === 'workout' && <AiWorkoutPlanner />}

      {/* SECTION 4: HISTORY OF VITALS & LOGS */}
      {activeTabSection === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-base font-bold text-white">Registro de Constantes Vitales</h2>
            <button
              onClick={() => setIsAddingLogModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
            >
              + Nuevo Registro
            </button>
          </div>

          <div className="space-y-3">
            {healthLogs.map((log) => (
              <div
                key={log.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-slate-800 text-slate-300">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.date} {log.time ? `· ${log.time}` : ''}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                        log.locationContext === 'mine_camp'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {log.locationContext === 'mine_camp' ? 'Campamento Minero ⛏️' : 'Casa / Descanso 🌿'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-300">
                      {log.bloodPressureSys && (
                        <span>P.A: <strong className="text-white">{log.bloodPressureSys}/{log.bloodPressureDia} mmHg</strong></span>
                      )}
                      {log.spO2Pct && (
                        <span>SpO2: <strong className="text-indigo-400">{log.spO2Pct}%</strong></span>
                      )}
                      {log.heartRateBpm && (
                        <span>Pulso: <strong className="text-rose-400">{log.heartRateBpm} bpm</strong></span>
                      )}
                      {log.sleepHours && (
                        <span>Sueño: <strong className="text-emerald-400">{log.sleepHours} hrs</strong></span>
                      )}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-400 italic mt-1">{log.notes}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteHealthLog(log.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW HEALTH LOG MODAL */}
      {isAddingLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-400" />
                Nuevo Registro de Constantes Vitales
              </h2>
              <button
                onClick={() => setIsAddingLogModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Contexto Ubicación</label>
                  <select
                    value={newLocationContext}
                    onChange={(e) => setNewLocationContext(e.target.value as any)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                  >
                    <option value="mine_camp">⛏️ Campamento Minero</option>
                    <option value="rest_home">🌿 Casa / Descanso</option>
                    <option value="transit">🚌 En Tránsito / Traslado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Saturación SpO2 (%)</label>
                  <input
                    type="number"
                    value={newSpO2}
                    onChange={(e) => setNewSpO2(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 96"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">P.A. Sistólica</label>
                  <input
                    type="number"
                    value={newSystolic}
                    onChange={(e) => setNewSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="120"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">P.A. Diastólica</label>
                  <input
                    type="number"
                    value={newDiastolic}
                    onChange={(e) => setNewDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="80"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Pulso (bpm)</label>
                  <input
                    type="number"
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="68"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Horas de Sueño</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSleepHours}
                    onChange={(e) => setNewSleepHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="7.5"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Calidad de Sueño</label>
                  <select
                    value={newSleepQuality}
                    onChange={(e) => setNewSleepQuality(e.target.value as any)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                  >
                    <option value="excelente">Excelente ✨</option>
                    <option value="buena">Buena 👍</option>
                    <option value="regular">Regular 😐</option>
                    <option value="mala">Mala 💤</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Síntomas de Altura (separados por coma)</label>
                <input
                  type="text"
                  value={newSymptomsInput}
                  onChange={(e) => setNewSymptomsInput(e.target.value)}
                  placeholder="Ej. Cefalea leve, Sequedad nasal"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Notas / Observaciones</label>
                <input
                  type="text"
                  value={newNotesInput}
                  onChange={(e) => setNewNotesInput(e.target.value)}
                  placeholder="Ej. Sensación de buena recuperación tras turno"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Guardar Constantes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Xiaomi Mi Fitness Sync Modal */}
      <XiaomiFitnessSyncModal
        isOpen={isXiaomiModalOpen}
        onClose={() => setIsXiaomiModalOpen(false)}
      />

      {/* Google Fit Sync Modal */}
      <GoogleFitSyncModal
        isOpen={isFitModalOpen}
        onClose={() => setIsFitModalOpen(false)}
      />
    </div>
  );
};
