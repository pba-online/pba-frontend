export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin'
}