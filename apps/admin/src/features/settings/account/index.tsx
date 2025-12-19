import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='账户设置'
      desc='更新您的账户设置，包括语言和时区偏好。'
    >
      <AccountForm />
    </ContentSection>
  )
}
