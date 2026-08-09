from pathlib import Path


def add_import(path: Path, line: str) -> None:
    text = path.read_text()
    if line in text:
        return
    path.write_text(line + '\n' + text)


def replace_required(path: Path, old: str, new: str, min_count: int = 1) -> None:
    text = path.read_text()
    count = text.count(old)
    if count < min_count:
        raise SystemExit(f'{path}: expected at least {min_count} occurrences of {old!r}, found {count}')
    path.write_text(text.replace(old, new))


# Google Calendar shift events: date-only arithmetic with no UTC conversion.
calendar_sync = Path('src/lib/calendarSync.ts')
add_import(calendar_sync, "import { addDaysToDateOnly } from './dateOnly';")
text = calendar_sync.read_text()
old = """    const date = new Date(shiftConfig.anchorDate + 'T00:00:00');
    date.setDate(date.getDate() + i);

    const dateStr = date.toISOString().split('T')[0];
"""
new = """    const dateStr = addDaysToDateOnly(shiftConfig.anchorDate, i);
"""
if old not in text:
    raise SystemExit('calendarSync date loop not found')
calendar_sync.write_text(text.replace(old, new, 1))

# Simple files where every matched expression means "today on this device".
simple_today_files = [
    Path('src/components/finances/FinancesView.tsx'),
    Path('src/components/common/VoiceCommandModal.tsx'),
    Path('src/components/dashboard/DashboardView.tsx'),
    Path('src/components/tasks/TasksView.tsx'),
    Path('src/components/health/HealthView.tsx'),
    Path('src/components/health/XiaomiFitnessSyncModal.tsx'),
    Path('src/components/integrations/GoogleFitSyncModal.tsx'),
]
for path in simple_today_files:
    add_import(path, "import { todayLocalDate } from '../../lib/dateOnly';")
    replace_required(path, "new Date().toISOString().split('T')[0]", 'todayLocalDate()')

# Habits use both today's local date and arbitrary local Date objects.
habits = Path('src/components/habits/HabitsView.tsx')
add_import(habits, "import { formatLocalDate, todayLocalDate } from '../../lib/dateOnly';")
replace_required(habits, "new Date().toISOString().split('T')[0]", 'todayLocalDate()')
replace_required(
    habits,
    "new Date(target.getFullYear(), target.getMonth(), d).toISOString().split('T')[0]",
    "formatLocalDate(new Date(target.getFullYear(), target.getMonth(), d))",
)
replace_required(habits, "d.toISOString().split('T')[0]", 'formatLocalDate(d)', min_count=2)

# Calendar month cells must retain the local calendar day used to construct them.
calendar_view = Path('src/components/calendar/CalendarView.tsx')
add_import(calendar_view, "import { formatLocalDate, todayLocalDate } from '../../lib/dateOnly';")
replace_required(calendar_view, "new Date().toISOString().split('T')[0]", 'todayLocalDate()')
replace_required(
    calendar_view,
    "new Date(year, month, d).toISOString().split('T')[0]",
    "formatLocalDate(new Date(year, month, d))",
)

# Seed relative dates are local calendar dates, not UTC dates.
seed = Path('src/data/seedData.ts')
add_import(seed, "import { formatLocalDate } from '../lib/dateOnly';")
replace_required(seed, "d.toISOString().split('T')[0]", 'formatLocalDate(d)')

# Ensure the migration actually removed the known trap everywhere under src.
remaining = []
for path in Path('src').rglob('*'):
    if path.suffix not in {'.ts', '.tsx'}:
        continue
    text = path.read_text()
    if "toISOString().split('T')[0]" in text:
        remaining.append(str(path))
if remaining:
    raise SystemExit('UTC date-only conversions remain: ' + ', '.join(remaining))

Path('scripts/phase2_dates_patch.py').unlink(missing_ok=True)
Path('.github/workflows/phase2-dates.yml').unlink(missing_ok=True)
