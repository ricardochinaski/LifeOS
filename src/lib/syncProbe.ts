import { auth, collection, db, doc, getDocs, onAuthStateChanged, setDoc } from './firebase';

const SYNC_PROBE_PARAM = 'syncProbe';
const SYNC_PROBE_VALUE = 'lifeos';
const SYNC_PROBE_PROJECT_ID = 'proj_lifeos_sync_probe_2026_08_09';

const shouldRunSyncProbe = () =>
  new URLSearchParams(window.location.search).get(SYNC_PROBE_PARAM) === SYNC_PROBE_VALUE;

const clearSyncProbeParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(SYNC_PROBE_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

if (shouldRunSyncProbe()) {
  let unsubscribe: (() => void) | undefined;

  unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      const projectsSnapshot = await getDocs(collection(db, 'users', user.uid, 'projects'));
      const existing = projectsSnapshot.docs.find((item) => item.data()?.name === 'LifeOS');

      if (!existing) {
        await setDoc(doc(db, 'users', user.uid, 'projects', SYNC_PROBE_PROJECT_ID), {
          id: SYNC_PROBE_PROJECT_ID,
          name: 'LifeOS',
          description: 'Proyecto de prueba para validar la sincronización de LifeOS entre dispositivos.',
          areaId: 'area_work',
          color: '#3B82F6',
          icon: 'RefreshCw',
          createdAt: new Date().toISOString().split('T')[0],
          category: 'app',
          status: 'in_progress',
          progress: 0,
          milestones: [],
          tags: ['LifeOS', 'sync-test'],
        });
      }

      localStorage.setItem(
        'lifeos_sync_probe_result',
        JSON.stringify({
          status: existing ? 'existing' : 'created',
          projectId: existing?.id ?? SYNC_PROBE_PROJECT_ID,
          completedAt: new Date().toISOString(),
        }),
      );
      clearSyncProbeParam();
    } catch (error) {
      console.error('LifeOS sync probe failed:', error);
      localStorage.setItem(
        'lifeos_sync_probe_result',
        JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        }),
      );
    } finally {
      unsubscribe?.();
    }
  });
}
