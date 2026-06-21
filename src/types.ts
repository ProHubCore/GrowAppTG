export type AppTab = 'today' | 'map' | 'progress' | 'profile'
export type EnergyLevel = 'low' | 'normal' | 'high'
export type TaskKind = 'mission' | 'extra' | 'minimum' | 'inbox'
export type TaskCategory = 'project' | 'money' | 'body' | 'life'
export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly'
export type FocusOutcome = 'done' | 'progress' | 'continue' | 'abandoned'

export interface Task {
  id: string
  title: string
  why?: string
  doneDefinition?: string
  nextStep?: string
  obstacle?: string
  ifThen?: string
  duration: number
  confidence: number
  category: TaskCategory
  kind: TaskKind
  completed: boolean
  createdAt: string
  scheduledDate: string
  dueDate?: string
  repeat: RepeatRule
  completedAt?: string
  actualMinutes: number
  focusBlocks: number
  xp: number
}

export interface FocusSession {
  id: string
  taskId: string
  date: string
  startedAt: string
  endedAt: string
  plannedMinutes: number
  actualMinutes: number
  outcome: FocusOutcome
}

export interface DayRecord {
  date: string
  energy: EnergyLevel
  plannedTasks: number
  completedTasks: number
  missionCompleted: boolean
  focusMinutes: number
  reflection: string
  obstacle: string
  tomorrowMission: string
  closed: boolean
}

export interface UserProfile {
  name: string
  primaryGoal: string
  goalWhy: string
  weeklyTargetDays: number
}

export interface AppState {
  version: 2
  onboardingComplete: boolean
  profile: UserProfile
  tasks: Task[]
  sessions: FocusSession[]
  days: Record<string, DayRecord>
  xp: number
  energy: EnergyLevel
  activeTab: AppTab
  haptics: boolean
  sound: boolean
  compactMode: boolean
  lastDate: string
  dayClosed: boolean
  tomorrowMission: string
}

export interface NewTaskInput {
  title: string
  why?: string
  doneDefinition?: string
  nextStep?: string
  obstacle?: string
  ifThen?: string
  duration: number
  confidence: number
  category: TaskCategory
  kind: TaskKind
  scheduledDate: string
  dueDate?: string
  repeat: RepeatRule
}
