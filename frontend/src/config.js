// Selects local server in dev mode or deployed host in production.
const DEV_URL = 'http://localhost:8000'
const PROD_URL = 'https://mirror-backend-jnw6.onrender.com'

export const BASE_URL = import.meta.env.VITE_BASE_URL || (import.meta.env.DEV ? DEV_URL : PROD_URL)
export const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`
