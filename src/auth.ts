export interface AccountUser {
  id: string
  username: string
  name: string
  email: string | null
  role: 'admin' | 'operador'
  active: boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string | null
}
