import { Outlet } from 'react-router-dom'
import { Layout, Card } from 'antd'

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Outlet />
    </Layout>
  )
}