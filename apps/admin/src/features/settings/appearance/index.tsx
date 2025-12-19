import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='外观设置'
      desc='自定义管理后台的外观，支持浅色和深色主题。'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
