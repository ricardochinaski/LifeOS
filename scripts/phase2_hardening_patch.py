from pathlib import Path

path = Path('src/context/LifeOSContext.tsx')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
    "  normalizeStoredCollection, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,\n",
    "  normalizeStoredCollection, parseSyncBase, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,\n",
    'import parseSyncBase',
)

replace_once(
    """const readSyncBase = (uid: string): Record<string, unknown> | null => {
  const raw = localStorage.getItem(syncBaseKey(uid));
  if (!raw) return null;
  return readStoredRecord(raw);
};
""",
    """const readSyncBase = (uid: string): Record<string, unknown> | null =>
  parseSyncBase(localStorage.getItem(syncBaseKey(uid)));
""",
    'strict sync baseline parsing',
)

replace_once(
    """        const mergedData = mergeRemoteWithLocalOnly(remoteData, localData);
        setterMap[colName](mergedData);
        updateSyncBasePart(uid, colName, mergedData);
        counts[colName] = mergedData.length;
""",
    """        const mergedData = mergeRemoteWithLocalOnly(remoteData, localData);
        setterMap[colName](mergedData);
        if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
          updateSyncBasePart(uid, colName, mergedData);
        }
        counts[colName] = mergedData.length;
""",
    'remote collection baseline guard',
)

replace_once(
    """        if (snap.exists()) {
          const value = snap.data();
          apply(value);
          updateSyncBasePart(uid, localKey, value);
          return;
        }
""",
    """        if (snap.exists()) {
          const value = snap.data();
          apply(value);
          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
            updateSyncBasePart(uid, localKey, value);
          }
          return;
        }
""",
    'remote config baseline guard',
)

replace_once(
    """          const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setterMap[colName](data);
          updateSyncBasePart(uid, colName, data);
""",
    """          const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setterMap[colName](data);
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            updateSyncBasePart(uid, colName, data);
          }
""",
    'listener collection baseline guard',
)

for key in ('shiftConfig', 'healthProfile', 'appSettings'):
    old = f"          updateSyncBasePart(uid, '{key}', value);"
    new = f"          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) updateSyncBasePart(uid, '{key}', value);"
    replace_once(old, new, f'{key} listener baseline guard')

replace_once(
    "  const writeToFirestore = async (uid: string, sub: string, id: string, data: any) => {\n",
    "  const writeToFirestore = async (uid: string, sub: string, id: string, data: any, throwOnError = false) => {\n",
    'write helper strict option',
)

replace_once(
    """      if (stateKey) setSyncState(prev => ({ ...prev, [stateKey]: 'error' }));
      showToast(`No se pudo sincronizar ${sub}. Revisa la consola.`);
    }
  };
""",
    """      if (stateKey) setSyncState(prev => ({ ...prev, [stateKey]: 'error' }));
      showToast(`No se pudo sincronizar ${sub}. Revisa la consola.`);
      if (throwOnError) throw e;
    }
  };
""",
    'write helper error propagation',
)

replace_once(
    "          allWrites.push(writeToFirestore(uid, colName, item.id, item));\n",
    "          allWrites.push(writeToFirestore(uid, colName, item.id, item, true));\n",
    'manual sync strict writes',
)

path.write_text(text)
Path('scripts/phase2_hardening_patch.py').unlink(missing_ok=True)
Path('.github/workflows/phase2-hardening.yml').unlink(missing_ok=True)
