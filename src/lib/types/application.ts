export type Environment = 'live' | 'sandbox'

export interface Application {
  id: string
  name: string
  environment: Environment
  campaignCount: number
  runningCount: number
  disabledCount: number
  expiredCount: number
}
