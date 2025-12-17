import { useParams } from '@tanstack/react-router'

export function ActivityDetailPage() {
  const { id } = useParams({ from: '/_authenticated/activities/$id' })

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">活动详情</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>活动ID: {id}</p>
        <p className="text-muted-foreground mt-2">
          活动详情页面正在开发中...
        </p>
      </div>
    </div>
  )
}