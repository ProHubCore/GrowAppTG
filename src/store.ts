import type { AppState, DayRecord, NewTaskInput, Task } from './types'

const STORAGE_KEY = 'rezhim-todo-v3-clean'
const LEGACY_KEYS = ['rezhim-todo-v2', 'rezhim-todo-mvp-v1']

export const localDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const now = () => new Date().toISOString()
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

const minimumTasks = (): Task[] => [
  createTask({
    title: '10 минут движения',
    why: 'Поддержать состояние тела без требования идеальной тренировки.',
    doneDefinition: 'Я двигался не меньше 10 минут.',
    nextStep: 'Встать и выбрать: прогулка, разминка или короткая тренировка.',
    obstacle: 'Будет казаться, что 10 минут ничего не меняют.',
    ifThen: 'Если не хочется тренироваться, делаю только 10 минут и имею право остановиться.',
    duration: 10,
    confidence: 5,
    category: 'body',
    kind: 'minimum',
    scheduledDate: localDate(),
    repeat: 'daily',
  }),
  createTask({
    title: 'Один честный фокус',
    why: 'Сохранить движение даже в слабый день.',
    doneDefinition: 'Есть минимум одна фокус-сессия от 10 минут.',
    nextStep: 'Выбрать одну задачу и начать с самого маленького шага.',
    obstacle: 'Захочется сначала ещё что-нибудь спланировать.',
    ifThen: 'Если тянет планировать, ставлю 10 минут и открываю первый нужный файл.',
    duration: 10,
    confidence: 5,
    category: 'project',
    kind: 'minimum',
    scheduledDate: localDate(),
    repeat: 'daily',
  }),
]

export const defaultDay = (date = localDate(), energy: AppState['energy'] = 'normal'): DayRecord => ({
  date,
  energy,
  plannedTasks: 0,
  completedTasks: 0,
  missionCompleted: false,
  focusMinutes: 0,
  reflection: '',
  obstacle: '',
  tomorrowMission: '',
  closed: false,
})

export const defaultState = (): AppState => ({
  version: 2,
  onboardingComplete: false,
  profile: {
    name: '',
    primaryGoal: '',
    goalWhy: '',
    weeklyTargetDays: 5,
  },
  tasks: minimumTasks(),
  sessions: [],
  days: { [localDate()]: defaultDay() },
  xp: 0,
  energy: 'normal',
  activeTab: 'today',
  haptics: true,
  sound: false,
  compactMode: false,
  lastDate: localDate(),
  dayClosed: false,
  tomorrowMission: '',
})

export const createTask = (input: NewTaskInput): Task => ({
  id: uid(),
  title: input.title.trim(),
  why: input.why?.trim(),
  doneDefinition: input.doneDefinition?.trim(),
  nextStep: input.nextStep?.trim(),
  obstacle: input.obstacle?.trim(),
  ifThen: input.ifThen?.trim(),
  duration: Math.max(5, Math.min(240, Number(input.duration) || 25)),
  confidence: Math.max(1, Math.min(5, Number(input.confidence) || 3)),
  category: input.category,
  kind: input.kind,
  completed: false,
  createdAt: now(),
  scheduledDate: input.scheduledDate || localDate(),
  dueDate: input.dueDate || undefined,
  repeat: input.repeat || 'none',
  actualMinutes: 0,
  focusBlocks: 0,
  xp: input.kind === 'mission' ? 120 : input.kind === 'minimum' ? 20 : input.kind === 'inbox' ? 0 : 55,
})

const cloneForDate = (task: Task, date: string): Task => ({
  ...task,
  id: uid(),
  scheduledDate: date,
  completed: false,
  completedAt: undefined,
  actualMinutes: 0,
  focusBlocks: 0,
  createdAt: now(),
})

const shouldRepeat = (task: Task, today: string) => {
  if (task.repeat === 'none' || !task.completedAt) return false
  const current = new Date(`${today}T12:00:00`)
  const completed = new Date(task.completedAt)
  if (localDate(completed) === today) return false
  if (task.repeat === 'daily') return true
  if (task.repeat === 'weekdays') return current.getDay() >= 1 && current.getDay() <= 5
  if (task.repeat === 'weekly') {
    const source = new Date(`${task.scheduledDate}T12:00:00`)
    return source.getDay() === current.getDay()
  }
  return false
}

const normalizeForNewDay = (state: AppState): AppState => {
  const today = localDate()
  if (!state.days[today]) state.days[today] = defaultDay(today, state.energy)

  if (state.lastDate !== today) {
    const repeated: Task[] = []
    for (const task of state.tasks) {
      if (shouldRepeat(task, today)) repeated.push(cloneForDate(task, today))
    }

    if (state.tomorrowMission.trim()) {
      state.tasks.forEach((task) => {
        if (task.kind === 'mission' && !task.completed) task.kind = 'extra'
      })
      repeated.unshift(createTask({
        title: state.tomorrowMission,
        why: state.profile.goalWhy,
        doneDefinition: 'Результат сформулирован перед стартом.',
        nextStep: 'Определить один физически понятный первый шаг.',
        obstacle: 'Задача останется слишком общей.',
        ifThen: 'Если не понимаю, с чего начать, уменьшаю шаг до 5 минут.',
        duration: 45,
        confidence: 3,
        category: 'project',
        kind: 'mission',
        scheduledDate: today,
        repeat: 'none',
      }))
    }

    state.tasks.push(...repeated)
    state.lastDate = today
    state.energy = 'normal'
    state.dayClosed = false
    state.tomorrowMission = ''
  }

  state.days[today].energy = state.energy
  return state
}

const clearLegacyDemoState = () => {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      clearLegacyDemoState()
      return normalizeForNewDay(defaultState())
    }
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = defaultState()
    const state: AppState = {
      ...base,
      ...parsed,
      version: 2,
      profile: { ...base.profile, ...(parsed.profile || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : base.tasks,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      days: parsed.days || base.days,
    }
    return normalizeForNewDay(state)
  } catch {
    return defaultState()
  }
}

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Приложение остаётся рабочим в памяти, даже если браузер запретил storage.
  }
}

export const resetState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    clearLegacyDemoState()
  } catch {
    // ignore
  }
  return defaultState()
}

export const exportState = (state: AppState) => JSON.stringify(state, null, 2)

export const importState = (raw: string): AppState => {
  const parsed = JSON.parse(raw) as AppState
  if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.tasks) || !parsed.profile) {
    throw new Error('Неподдерживаемый формат резервной копии')
  }
  return normalizeForNewDay(parsed)
}
