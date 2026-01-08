import axios from "axios"
import { tokenStorage, userStorage } from "@/lib/session-storage"
// Read env vars once at module load (Vite injects these at build time)
const { VITE_PERDIX_JWT } = import.meta.env as { VITE_PERDIX_JWT?: string }

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Default timeout (10 seconds)
  headers: {
    // 'Content-Type': 'application/json',
    // 'Accept': 'application/json',
  },
})

// Extended timeout for Perdix queries (30 seconds)
const perdixApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for Perdix queries
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor: Automatically attach JWT token and user/organization IDs to all requests
const requestInterceptor = (config: any) => {
  const token = tokenStorage.get()
  if (token) {
    // Add Authorization header with JWT token
    // Format: "Authorization: JWT <token>" as per your API requirement
    config.headers.Authorization = `JWT ${token}`
  }
  
  // Get user data from session storage (same pattern as Dashboard.tsx: user?.data?.login)
  const user = userStorage.get()
  if (user?.data) {
    // Extract user_id from user.data.login (as used in Dashboard.tsx)
    const userId = user.data.login
    if (userId) {
      config.headers['user_id'] = String(userId)
    }
    
    // Extract organization_id from user.data.userBranches (common pattern) or user.data.organization_id
    const organizationId = user.data.userBranches?.[1]?.branchId
    if (organizationId) {
      config.headers['organization_id'] = String(organizationId)
    }
    const org_type=user.data.org_type
    if (org_type) {
      config.headers['org_type'] = String(org_type)
    }
  }
  
  return config
}

api.interceptors.request.use(requestInterceptor, (error) => {
  return Promise.reject(error)
})

// Apply same interceptor to perdixApi
perdixApi.interceptors.request.use(requestInterceptor, (error) => {
  return Promise.reject(error)
})

// Response interceptor: Handle 401 Unauthorized (token expired/invalid)
const responseInterceptor = {
  onFulfilled: (response: any) => {
    return response
  },
  onRejected: (error: any) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      tokenStorage.remove()
      // Don't redirect during registration or login flows
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath.startsWith('/register')
      if (!isAuthPage && currentPath !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
}

api.interceptors.response.use(responseInterceptor.onFulfilled, responseInterceptor.onRejected)
perdixApi.interceptors.response.use(responseInterceptor.onFulfilled, responseInterceptor.onRejected)

// Generic API functions
export const apiService = {
  // GET request
  get: async <T = any>(endpoint: string, params?: Record<string, any>, config?: { timeout?: number; signal?: AbortSignal }) => {
    const axiosConfig = { 
      params,
      timeout: config?.timeout,
      signal: config?.signal
    }
    const response = await api.get<T>(endpoint, axiosConfig)
    return response.data
  },

  // POST request
  post: async <T = any>(endpoint: string, data?: any, config?: { timeout?: number; signal?: AbortSignal; usePerdixTimeout?: boolean }) => {
    // Use perdixApi for Perdix queries with extended timeout
    const axiosInstance = config?.usePerdixTimeout ? perdixApi : api
    const axiosConfig = {
      timeout: config?.timeout || (config?.usePerdixTimeout ? 30000 : undefined),
      signal: config?.signal
    }
    const response = await axiosInstance.post<T>(endpoint, data, axiosConfig)
    return response.data
  },

  // PUT request
  put: async <T = any>(endpoint: string, data?: any, config?: { timeout?: number; signal?: AbortSignal }) => {
    const axiosConfig = {
      timeout: config?.timeout,
      signal: config?.signal
    }
    const response = await api.put<T>(endpoint, data, axiosConfig)
    return response.data
  },

  // PATCH request
  patch: async <T = any>(endpoint: string, data?: any, config?: { timeout?: number; signal?: AbortSignal }) => {
    const axiosConfig = {
      timeout: config?.timeout,
      signal: config?.signal
    }
    const response = await api.patch<T>(endpoint, data, axiosConfig)
    return response.data
  },

  // DELETE request
  delete: async <T = any>(endpoint: string, config?: { timeout?: number; signal?: AbortSignal }) => {
    const axiosConfig = {
      timeout: config?.timeout,
      signal: config?.signal
    }
    const response = await api.delete<T>(endpoint, axiosConfig)
    return response.data
  },
}


// Perdix API specific service
export const perdixApiService = {
  // Create user with Perdix API
  createUser: async (userData: any) => {
    const perdixJwt = VITE_PERDIX_JWT?.trim()
    if (!perdixJwt) {
      throw new Error("Missing VITE_PERDIX_JWT. Please set it in your .env file.")
    }
    const response = await axios.post('https://uat-lp.perdix.co.in/perdix-server/api/users', userData, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': `JWT ${perdixJwt}`,
        'content-type': 'application/json;charset=UTF-8',
        'origin': 'https://uat-lp.perdix.co.in',
        'page_uri': 'Page/Engine/user.UserMaintanence',
        'priority': 'u=1, i',
        'referer': 'https://uat-lp.perdix.co.in/perdix-client/',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0'
      }
    })
    return response.data
  }
}

// Export the axios instance for custom calls that need direct access
export { api }

// Export the base API service for custom calls
export default apiService
