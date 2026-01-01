import type { SeasonSchedule, StaffDevice } from './types'

export const seasonSchedules: SeasonSchedule[] = [
  {
    id: 'sched-1',
    deviceId: 'device-1',
    title: 'Morning Watering',
    recurrenceText: 'Daily at 8:00 AM',
    startTime: '08:00',
    endTime: '08:30',
    moistureThresholdPct: 40,
    enabled: true,
    nextRun: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    status: 'Scheduled',
  },
  {
    id: 'sched-2',
    deviceId: 'device-2',
    title: 'Evening Flush',
    recurrenceText: 'Daily at 20:00 PM',
    startTime: '20:00',
    endTime: '20:15',
    moistureThresholdPct: 30,
    enabled: false,
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    status: 'Scheduled',
  },
]

export const staffDevices: StaffDevice[] = [
  {
    id: 'device-1',
    name: 'Irrigation Pump Alpha',
    zone: 'Zone A',
    status: 'Idle',
    lastAction: new Date(Date.now() - 1000 * 60 * 30).toISOString(), 
    nextSchedule: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    batteryLevel: 85,
    needsMaintenance: false,
    uptimePct: 92.5,
  },
  {
    id: 'device-2',
    name: 'Sprinkler System Beta',
    zone: 'Zone B',
    status: 'Running',
      lastAction: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    nextSchedule: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    batteryLevel: 72,
    needsMaintenance: true,
    uptimePct: 87.3,
  },
  {
    id: 'device-3',
    name: 'Drip Irrigation Gamma',
    zone: 'Zone C',
    status: 'Maintenance',
    lastAction: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    nextSchedule: null,
    batteryLevel: 45,
    needsMaintenance: true,
    uptimePct: 78.9,
  },
]
