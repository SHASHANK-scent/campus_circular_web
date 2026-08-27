import { Navigate } from 'react-router-dom'
import { AdminTabs } from '../components/AdminTabs'
import { Badge, PageTitle } from '../components/Layout'
import { useApp } from '../store/AppStore'

export const Admin = () => {
  const { state } = useApp()
  if (!state.isAdmin) return <Navigate to="/admin/login" replace />
  return (
    <>
      <PageTitle eyebrow="Moderation and stewardship" title="Admin console">
        <Badge tone="green">Signed in as admin</Badge>
      </PageTitle>
      <AdminTabs />
    </>
  )
}
