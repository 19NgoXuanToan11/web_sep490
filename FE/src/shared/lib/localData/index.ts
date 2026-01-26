export type * from './types'
export * from './fixtures'

export {
    storage,
    userPreferences,
    type UserPreferences,
    simulateLatency,
    simulateError,
} from './storage'

export {
    formatDate as formatDateSimple,
    formatDateTime as formatDateTimeSimple,
    formatTime,
    isToday,
    addHours,
    addDays,
} from './storage'
