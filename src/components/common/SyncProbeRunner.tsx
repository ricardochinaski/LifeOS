import React, { useEffect, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';

const SYNC_PROBE_PARAM = 'syncProbe';
const SYNC_PROBE_VALUE = 'lifeos';

const clearSyncProbeParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(SYNC_PROBE_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export const SyncProbeRunner: React.FC = () => {
  const {
    currentUser,
    isSyncing,
    projects,
    addProject,
    setActiveTab,
    showToast,
  } = useLifeOS();
  const handledRef = useRef(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(SYNC_PROBE_PARAM) === SYNC_PROBE_VALUE;
    if (!requested || !currentUser || isSyncing || handledRef.current) return;

    handledRef.current = true;
    const existing = projects.find((project) => project.name.trim().toLowerCase() === 'lifeos');

    if (!existing) {
      addProject({
        name: 'LifeOS',
        description: 'Proyecto de prueba para validar la sincronización de LifeOS entre dispositivos.',
        areaId: 'area_work',
        color: '#3B82F6',
        icon: 'RefreshCw',
        category: 'app',
        status: 'in_progress',
        progress: 0,
        milestones: [],
        tags: ['LifeOS', 'sync-test'],
      });
      showToast('Prueba de sincronización: proyecto "LifeOS" creado.');
    } else {
      showToast('Prueba de sincronización: el proyecto "LifeOS" ya existe.');
    }

    setActiveTab('tasks');
    clearSyncProbeParam();
  }, [currentUser, isSyncing, projects, addProject, setActiveTab, showToast]);

  return null;
};
