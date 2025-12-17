import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { RiskAssessmentOverview } from './components/risk-assessment-overview'
import { RiskAssessmentTable } from './components/risk-assessment-table'
import { RiskAssessmentFilters } from './components/risk-assessment-filters'
import { RiskAssessmentStats } from './components/risk-assessment-stats'
import { RiskAssessmentProvider } from './components/risk-assessment-provider'

export function RiskAssessment() {
  return (
    <RiskAssessmentProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>风险评估</h2>
            <p className='text-muted-foreground'>
              监控和管理平台风险，识别潜在威胁和异常行为
            </p>
          </div>
        </div>

        {/* 风险统计概览 */}
        <RiskAssessmentStats />

        {/* 风险评估概览 */}
        <RiskAssessmentOverview />

        {/* 筛选器 */}
        <RiskAssessmentFilters />

        {/* 风险评估表格 */}
        <RiskAssessmentTable />
      </Main>
    </RiskAssessmentProvider>
  )
}

// Export alias for backward compatibility
export { RiskAssessment as RiskManagement }