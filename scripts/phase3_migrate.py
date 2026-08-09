from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


context_path = Path("src/context/LifeOSContext.tsx")
context = context_path.read_text(encoding="utf-8")

context = replace_once(
    context,
    """import {\n  diffStoredCollections, getLocalOnlyEntities, isSyncCollectionName, mergeRemoteWithLocalOnly,\n  normalizeStoredCollection, parseSyncBase, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,\n  type SyncCollectionName, type SyncDataset,\n} from '../lib/syncEngine';\n""",
    """import {\n  diffStoredCollections, getLocalOnlyEntities, isSyncCollectionName, mergeRemoteWithLocalOnly,\n  normalizeStoredCollection, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,\n  type SyncCollectionName, type SyncDataset,\n} from '../lib/syncEngine';\nimport {\n  CURATED_CONTENT_KEY, STORAGE_KEY, isPlainRecord, mergeMissingSeeds, persistSnapshotIfChanged,\n  readStoredRecord, readSyncBase, removeUndefinedFields, updateSyncBasePart,\n} from '../lib/lifeosPersistence';\n""",
    "sync/persistence imports",
)

context = replace_once(
    context,
    """const STORAGE_KEY = 'lifeos_local_v1';\nconst CURATED_CONTENT_KEY = 'lifeos_curated_content_2026_07_29';\nconst SYNC_BASE_KEY_PREFIX = 'lifeos_sync_base_v2_';\n\nconst isPlainRecord = (value: unknown): value is Record<string, unknown> =>\n  Boolean(value) && typeof value === 'object' && !Array.isArray(value);\n\nconst readStoredRecord = (raw: string | null): Record<string, unknown> => {\n  if (!raw) return {};\n  try {\n    const parsed: unknown = JSON.parse(raw);\n    return isPlainRecord(parsed) ? parsed : {};\n  } catch {\n    return {};\n  }\n};\n\nconst syncBaseKey = (uid: string) => `${SYNC_BASE_KEY_PREFIX}${uid}`;\nconst readSyncBase = (uid: string): Record<string, unknown> | null =>\n  parseSyncBase(localStorage.getItem(syncBaseKey(uid)));\n\nconst updateSyncBasePart = (uid: string, key: string, value: unknown) => {\n  const base = readSyncBase(uid) || {};\n  localStorage.setItem(syncBaseKey(uid), JSON.stringify({ ...base, [key]: value }));\n};\n\n""",
    "",
    "local persistence helper block",
)

context = replace_once(
    context,
    """const removeUndefinedFields = (value: any): any => {\n  if (Array.isArray(value)) {\n    return value.map(removeUndefinedFields);\n  }\n\n  if (value && typeof value === 'object') {\n    return Object.fromEntries(\n      Object.entries(value)\n        .filter(([, entryValue]) => entryValue !== undefined)\n        .map(([key, entryValue]) => [key, removeUndefinedFields(entryValue)])\n    );\n  }\n\n  return value;\n};\n\n""",
    "",
    "removeUndefinedFields local helper",
)

context = replace_once(
    context,
    """const mergeMissingSeeds = <T extends { id: string }>(current: T[] | undefined, seeds: T[]) => {\n  const base = Array.isArray(current) ? current : [];\n  const existing = new Set(base.map((item) => item.id));\n  return [...base, ...seeds.filter((item) => !existing.has(item.id))];\n};\n\n""",
    "",
    "mergeMissingSeeds local helper",
)

context = replace_once(
    context,
    """      const serialized = JSON.stringify(dataToSave);\n      if (serialized !== lastPersistedSnapshot.current) {\n        localStorage.setItem(STORAGE_KEY, serialized);\n        lastPersistedSnapshot.current = serialized;\n      }\n""",
    """      lastPersistedSnapshot.current = persistSnapshotIfChanged(\n        dataToSave,\n        lastPersistedSnapshot.current,\n      );\n""",
    "local snapshot persistence",
)

context_path.write_text(context, encoding="utf-8")

library_path = Path("src/components/library/LibraryView.tsx")
library = library_path.read_text(encoding="utf-8")
library = replace_once(
    library,
    """    const targetPage = Math.max(\n      linkedBook.currentPage + 1,\n      Math.min(linkedBook.totalPages, parseInt(groupTargetPage, 10) || linkedBook.totalPages),\n    );\n""",
    """    const targetPage = Math.min(\n      linkedBook.totalPages,\n      Math.max(linkedBook.currentPage, parseInt(groupTargetPage, 10) || linkedBook.totalPages),\n    );\n""",
    "reading group target-page clamp",
)
library_path.write_text(library, encoding="utf-8")

print("Phase 3 migration applied successfully")
