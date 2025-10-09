import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom'
import { Server, Plus, Eye, Settings, Activity, Trash2, Edit, Copy, Check, Menu, X, Radio, LogIn, LogOut, Beaker, FlaskConical } from 'lucide-react'
import axios from 'axios'

// Auth Context
const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

// API client
const api = axios.create({
  baseURL: '',
})

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Components
function Navbar({ showNavLinks = false }) {
  const auth = useAuth()
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold hover:opacity-90 transition">
            <FlaskConical className="w-8 h-8" />
            <span>Mock-Lab</span>
          </Link>
          <div className="flex items-center gap-4">
            {auth?.user ? (
              <>
                <Link to="/entities" className="text-sm opacity-90 hover:opacity-100 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition">
                  My Entities
                </Link>
                <div className="text-sm opacity-90">
                  Hello, <span className="font-semibold">{auth.user.username}</span>
                </div>
                <button
                  onClick={auth.logout}
                  className="text-sm opacity-90 hover:opacity-100 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : showNavLinks ? (
              <Link to="/login" className="text-sm opacity-90 hover:opacity-100 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            ) : (
              <div className="text-sm opacity-90">Real-time API Monitoring</div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const handleGetStarted = () => {
    if (auth?.user) {
      navigate('/entities')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar showNavLinks={true} />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
            <FlaskConical className="w-20 h-20 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Mock-Lab
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A powerful, real-time API mocking service with multi-entity support, 
            dynamic response scenarios, and live traffic monitoring.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Monitoring</h3>
            <p className="text-gray-600">
              Watch API requests flow in real-time with WebSocket-powered updates. 
              See every request and response as they happen.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dynamic Scenarios</h3>
            <p className="text-gray-600">
              Configure multiple response scenarios (200, 404, 429, 500) and switch 
              between them instantly without restarting.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Entity</h3>
            <p className="text-gray-600">
              Each entity gets a unique base path and API key. 
              Perfect for testing multiple projects simultaneously.
            </p>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Start Guide
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Create a Entity</h4>
                  <p className="text-sm text-gray-600">
                    Give your project a name. You'll get a unique base URL and API key.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Configure Mock Endpoints</h4>
                  <p className="text-sm text-gray-600">
                    Create endpoints with multiple response scenarios. Add 200, 404, 429, 500 responses all at once.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Monitor Traffic</h4>
                  <p className="text-sm text-gray-600">
                    See live API requests in the traffic monitor. Click any request to see full details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Switch Scenarios</h4>
                  <p className="text-sm text-gray-600">
                    Use the dropdown to switch between response scenarios. Test error handling instantly!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm">
              <div className="mb-4 text-gray-400"># Create a request</div>
              <div className="mb-2">$ curl http://localhost:8001/api/my-app/users/123</div>
              <div className="text-gray-500 mb-4">{"{"}"id": 123, "name": "John"{"}"}</div>
              
              <div className="mb-4 text-gray-400 mt-6"># Switch to 404 scenario in UI</div>
              <div className="mb-2">$ curl http://localhost:8001/api/my-app/users/123</div>
              <div className="text-red-400">{"{"}"error": "Not found"{"}"}</div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>WebSocket real-time updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Multiple response scenarios per endpoint</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Per-scenario delay configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Dynamic scenario switching</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Request/response filtering</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Color-coded routes and status codes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Path parameter support (/users/{"{id}"})</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>No-code UI configuration</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            {auth?.user ? 'Go to My Entities' : 'Get Started - Create Account'}
          </button>
          <p className="text-sm text-gray-600 mt-4">
            {auth?.user ? 'Start creating mock endpoints' : 'No credit card required • Free forever • Start mocking in seconds'}
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const auth = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/auth/login', credentials)
      auth.login(response.data.user, response.data.token)
      navigate('/entities')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <Navbar showNavLinks={true} />
      
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <LogIn className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const auth = useAuth()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Register user
      await api.post('/auth/register', formData)
      
      // Auto-login after registration
      const loginResponse = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password
      })
      
      auth.login(loginResponse.data.user, loginResponse.data.token)
      navigate('/entities')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <Navbar showNavLinks={true} />
      
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <FlaskConical className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-2">Get started with Mock-Lab</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      navigate('/login')
    }
  }, [auth.user, auth.loading, navigate])

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return auth.user ? children : null
}

function EntitiesPage() {
  const [entities, setEntities] = useState([])
  const [newEntityName, setNewEntityName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    loadEntities()
  }, [])

  const loadEntities = async () => {
    try {
      const response = await api.get('/admin/entities')
      setEntities(Array.isArray(response.data) ? response.data : [])
      setError(null)
    } catch (error) {
      console.error('Error loading entities:', error)
      setEntities([])
      setError('Failed to connect to backend. Make sure the backend server is running on port 8001.')
    } finally {
      setLoading(false)
    }
  }

  const createEntity = async (e) => {
    e.preventDefault()
    if (!newEntityName.trim()) return
    
    try {
      await api.post('/admin/entities', { name: newEntityName })
      setNewEntityName('')
      setShowCreateModal(false)
      loadEntities()
    } catch (error) {
      alert('Error creating entity: ' + (error.response?.data?.detail || error.message))
    }
  }

  const deleteEntity = async (id) => {
    if (!confirm('Are you sure you want to delete this entity? All endpoints and logs will be deleted.')) return
    
    try {
      await api.delete(`/admin/entities/${id}`)
      loadEntities()
    } catch (error) {
      alert('Error deleting entity: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showNavLinks={false} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Entities</h1>
              <p className="text-gray-600 mt-1">Manage your API mock entities</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Entity
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="text-red-600 font-semibold">⚠️ Error</div>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Start the backend with: <code className="bg-red-100 px-2 py-1 rounded">./start-backend.sh</code> or{' '}
              <code className="bg-red-100 px-2 py-1 rounded">uvicorn backend.main:app --reload --port 8001</code>
            </p>
          </div>
        )}

        {/* Entities List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {entities.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No entities yet</h3>
              <p className="text-gray-500 mb-6">Create your first entity to start mocking APIs</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Your First Entity
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Entities ({entities.length})</h2>
              <div className="grid gap-4">
                {entities.map((entity) => (
                  <EntityCard key={entity.id} entity={entity} onDelete={deleteEntity} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Entity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Entity</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewEntityName('')
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={createEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Name
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="e.g., my-app, user-service, payment-api"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will create a base URL: <code className="bg-gray-100 px-2 py-1 rounded">/api/your-entity-name</code>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewEntityName('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EntityCard({ entity, onDelete }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800">{entity.name}</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Base Path:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{entity.base_path}</code>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">API Key:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{entity.api_key}</code>
              <button
                onClick={() => copyToClipboard(entity.api_key)}
                className="text-blue-600 hover:text-blue-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/entity/${entity.id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
          >
            <Activity className="w-4 h-4" />
            Explore
          </button>
          <button
            onClick={() => onDelete(entity.id)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function EntityDetail() {
  const { entityId } = useParams()
  const [entity, setEntity] = useState(null)
  const [endpoints, setEndpoints] = useState([])
  const [logs, setLogs] = useState([])
  const [showEndpointPanel, setShowEndpointPanel] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedLogIndex, setSelectedLogIndex] = useState(-1)
  const ws = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadEntity()
    loadEndpoints()
    loadLogs()
    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [entityId])

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8001/ws/logs/${entityId}`
    
    ws.current = new WebSocket(wsUrl)
    
    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_log') {
        setLogs(prevLogs => [data.log, ...prevLogs])
        // Auto-select first log if none selected
        setSelectedLogIndex(prev => prev === -1 ? 0 : prev)
      }
    }
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
          connectWebSocket()
        }
      }, 3000)
    }
  }

  const loadEntity = async () => {
    try {
      const response = await api.get(`/admin/entities/${entityId}`)
      setEntity(response.data)
    } catch (error) {
      console.error('Error loading entity:', error)
      navigate('/entities')
    }
  }

  const loadEndpoints = async () => {
    try {
      const response = await api.get(`/admin/entities/${entityId}/endpoints`)
      setEndpoints(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading endpoints:', error)
      setEndpoints([])
    }
  }

  const loadLogs = async () => {
    try {
      const response = await api.get(`/admin/entities/${entityId}/logs?limit=100`)
      setLogs(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading logs:', error)
      setLogs([])
    }
  }

  const deleteEndpoint = async (id) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return
    
    try {
      await api.delete(`/admin/endpoints/${id}`)
      loadEndpoints()
    } catch (error) {
      alert('Error deleting endpoint: ' + error.message)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return
    
    try {
      await api.delete(`/admin/entities/${entityId}/logs`)
      setLogs([])
    } catch (error) {
      alert('Error clearing logs: ' + error.message)
    }
  }

  if (!entity) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar showNavLinks={false} />
      
      {/* Content Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - Traffic Monitor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white shadow-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-800">{entity.name}</h2>
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'LIVE' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin.replace('3000', '8001')}{entity.base_path}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndpointPanel(!showEndpointPanel)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
                >
                  <Settings className="w-5 h-5" />
                  {showEndpointPanel ? 'Hide' : 'Manage'} Endpoints
                </button>
                <button
                  onClick={() => navigate('/entities')}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition"
                >
                  ← Back to Entities
                </button>
              </div>
            </div>
          </div>

        {/* Traffic Monitor - Two Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Request List */}
          <div className="w-1/2 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Request List</h3>
                  <p className="text-xs text-gray-600 mt-1">{logs.length} request(s) logged</p>
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="bg-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Search Filter */}
              {logs.length > 0 && (
                <input
                  type="text"
                  placeholder="Filter by method, path, or status..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              {logs.length === 0 ? (
                <div className="text-center py-16 text-gray-500 px-4">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No requests yet</p>
                  <p className="text-xs mt-1">Waiting for API calls...</p>
                </div>
              ) : (
                (() => {
                  const filteredLogs = logs.filter((log, index) => {
                    if (!searchFilter) return true
                    const searchLower = searchFilter.toLowerCase()
                    return (
                      log.method.toLowerCase().includes(searchLower) ||
                      log.path.toLowerCase().includes(searchLower) ||
                      log.response_code.toString().includes(searchLower)
                    )
                  })
                  
                  return filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No matching requests</p>
                    </div>
                  ) : (
                    <>
                      {searchFilter && (
                        <div className="px-4 py-2 text-xs text-gray-600 bg-blue-50 border-b border-blue-100">
                          Showing {filteredLogs.length} of {logs.length} requests
                        </div>
                      )}
                      <div className="p-2">
                        {filteredLogs.map((log, index) => (
                          <LogListItem 
                            key={log.id} 
                            log={log} 
                            isSelected={selectedLogIndex === logs.indexOf(log)}
                            onClick={() => setSelectedLogIndex(logs.indexOf(log))}
                          />
                        ))}
                      </div>
                    </>
                  )
                })()
              )}
            </div>
          </div>

          {/* Right Panel - Request Details */}
          <div className="w-1/2 bg-white flex flex-col">
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Request Details</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {selectedLogIndex === -1 || !logs[selectedLogIndex] ? (
                <div className="text-center py-16 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a request from the left panel</p>
                </div>
              ) : (
                <LogDetailView log={logs[selectedLogIndex]} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay - Endpoint Form */}
      {editingEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <EndpointForm
              entityId={entityId}
              endpoint={editingEndpoint.id ? editingEndpoint : null}
              onSave={() => {
                setEditingEndpoint(null)
                loadEndpoints()
              }}
              onCancel={() => setEditingEndpoint(null)}
            />
          </div>
        </div>
      )}

      {/* Side Panel - Endpoints List */}
      {showEndpointPanel && (
        <div className="w-96 bg-white shadow-xl border-l border-gray-200 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Mock Endpoints</h3>
              <button
                onClick={() => setShowEndpointPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <button
              onClick={() => setEditingEndpoint({})}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              Create Endpoint
            </button>

            {endpoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No endpoints yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <EndpointCard
                    key={endpoint.id}
                    endpoint={endpoint}
                    basePath={entity.base_path}
                    onEdit={setEditingEndpoint}
                    onDelete={deleteEndpoint}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function EndpointCard({ endpoint, basePath, onEdit, onDelete }) {
  const [scenarios, setScenarios] = useState([])
  const [activeScenario, setActiveScenario] = useState(null)

  useEffect(() => {
    const parsedScenarios = typeof endpoint.response_scenarios === 'string'
      ? JSON.parse(endpoint.response_scenarios || '[]')
      : endpoint.response_scenarios || []
    setScenarios(parsedScenarios)
    if (parsedScenarios.length > 0 && endpoint.active_scenario_index !== undefined) {
      setActiveScenario(parsedScenarios[endpoint.active_scenario_index])
    }
  }, [endpoint])

  const switchScenario = async (index) => {
    try {
      await api.post(`/admin/endpoints/${endpoint.id}/switch-scenario/${index}`)
      const parsedScenarios = typeof endpoint.response_scenarios === 'string'
        ? JSON.parse(endpoint.response_scenarios || '[]')
        : endpoint.response_scenarios || []
      setActiveScenario(parsedScenarios[index])
      // Reload parent to update endpoint display
      window.location.reload()
    } catch (error) {
      alert('Error switching scenario: ' + error.message)
    }
  }

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800',
  }

  const statusColors = {
    200: 'bg-green-100 text-green-800',
    201: 'bg-green-100 text-green-800',
    400: 'bg-orange-100 text-orange-800',
    401: 'bg-orange-100 text-orange-800',
    403: 'bg-orange-100 text-orange-800',
    404: 'bg-orange-100 text-orange-800',
    429: 'bg-yellow-100 text-yellow-800',
    500: 'bg-red-100 text-red-800',
    502: 'bg-red-100 text-red-800',
    503: 'bg-red-100 text-red-800',
  }

  // Determine which response code to display (scenario or legacy)
  const displayCode = activeScenario ? activeScenario.response_code : endpoint.response_code

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition text-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${methodColors[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[displayCode] || 'bg-gray-100 text-gray-800'}`}>
            {displayCode}
          </span>
        </div>
        {!endpoint.is_active && (
          <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-xs font-semibold">
            INACTIVE
          </span>
        )}
      </div>
      <h4 className="font-semibold text-gray-800 mb-1">{endpoint.name}</h4>
      <code className="text-xs text-gray-600 block mb-2">{endpoint.path}</code>
      
      {/* Scenarios Switcher */}
      {scenarios.length > 0 && (
        <div className="mb-2">
          <label className="block text-xs text-gray-600 mb-1">Active Scenario:</label>
          <select
            value={endpoint.active_scenario_index || 0}
            onChange={(e) => switchScenario(parseInt(e.target.value))}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            {scenarios.map((scenario, index) => (
              <option key={index} value={index}>
                {scenario.name} ({scenario.response_code})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-1">
        <button
          onClick={() => onEdit(endpoint)}
          className="flex-1 text-blue-600 hover:bg-blue-50 p-1 rounded text-xs transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(endpoint.id)}
          className="flex-1 text-red-600 hover:bg-red-50 p-1 rounded text-xs transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function EndpointForm({ entityId, endpoint, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => {
    if (endpoint) {
      // Parse response_scenarios if it's a string
      const scenarios = typeof endpoint.response_scenarios === 'string'
        ? JSON.parse(endpoint.response_scenarios)
        : endpoint.response_scenarios || []
      
      return {
        name: endpoint.name || '',
        method: endpoint.method || 'GET',
        path: endpoint.path || '/',
        is_active: endpoint.is_active !== undefined ? endpoint.is_active : true,
        response_scenarios: scenarios,
        active_scenario_index: endpoint.active_scenario_index || 0,
        // Legacy fields (for backward compatibility)
        response_code: 200,
        response_body: '{}',
        response_headers: {},
        delay_ms: 0,
      }
    }
    
    return {
      name: '',
      method: 'GET',
      path: '/',
      is_active: true,
      response_scenarios: [],
      active_scenario_index: 0,
      // Legacy fields
      response_code: 200,
      response_body: '{}',
      response_headers: {},
      delay_ms: 0,
    }
  })
  
  const [currentScenario, setCurrentScenario] = useState({
    name: '',
    response_code: 200,
    response_body: '{\n  "message": "Success"\n}',
    response_headers: {},
    delay_ms: 0
  })

  const addScenario = () => {
    if (!currentScenario.name.trim()) {
      alert('Please enter a scenario name')
      return
    }
    
    try {
      JSON.parse(currentScenario.response_body)
      setFormData({
        ...formData,
        response_scenarios: [...formData.response_scenarios, currentScenario]
      })
      setCurrentScenario({
        name: '',
        response_code: 200,
        response_body: '{\n  "message": "Success"\n}',
        response_headers: {},
        delay_ms: 0
      })
    } catch (error) {
      alert('Invalid JSON in response body')
    }
  }

  const removeScenario = (index) => {
    const newScenarios = formData.response_scenarios.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      response_scenarios: newScenarios,
      active_scenario_index: Math.min(formData.active_scenario_index || 0, Math.max(0, newScenarios.length - 1))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.response_scenarios.length === 0) {
      alert('Please add at least one response scenario')
      return
    }
    
    try {
      // Prepare data
      const submitData = {
        name: formData.name,
        method: formData.method,
        path: formData.path,
        is_active: formData.is_active,
        response_scenarios: formData.response_scenarios,
        active_scenario_index: formData.active_scenario_index,
        // Legacy fields (using first scenario or defaults)
        response_code: formData.response_scenarios[0]?.response_code || 200,
        response_body: formData.response_scenarios[0]?.response_body || '{}',
        response_headers: formData.response_scenarios[0]?.response_headers || {},
        delay_ms: 0,
      }
      
      if (endpoint && endpoint.id) {
        // Update
        await api.put(`/admin/endpoints/${endpoint.id}`, submitData)
      } else {
        // Create
        await api.post(`/admin/entities/${entityId}/endpoints`, submitData)
      }
      onSave()
    } catch (error) {
      alert('Error saving endpoint: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <div className="bg-white">
      {/* Modal Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">
            {endpoint && endpoint.id ? 'Edit' : 'Create'} Mock Endpoint
          </h3>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Modal Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Get User by ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Path</label>
              <input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/users/{id}"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Endpoint is active
            </label>
          </div>
        </div>

        {/* Response Scenarios Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Response Scenarios</h4>
          <p className="text-sm text-gray-600">Add multiple response scenarios and switch between them dynamically</p>
          
          {/* Add new scenario */}
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 space-y-3">
            <h5 className="font-medium text-sm text-gray-700">Add New Scenario</h5>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, name: e.target.value })}
                  placeholder="Scenario name (e.g., Success, Rate Limited)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={currentScenario.response_code}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, response_code: parseInt(e.target.value) })}
                  placeholder="Status"
                  min="100"
                  max="599"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Delay (ms) - for 503/504 scenarios</label>
              <input
                type="number"
                value={currentScenario.delay_ms}
                onChange={(e) => setCurrentScenario({ ...currentScenario, delay_ms: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Response Body (JSON)</label>
              <textarea
                value={currentScenario.response_body}
                onChange={(e) => setCurrentScenario({ ...currentScenario, response_body: e.target.value })}
                placeholder='{"message": "response"}'
                rows="4"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            
            <button
              type="button"
              onClick={addScenario}
              disabled={!currentScenario.name}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Scenario
            </button>
          </div>

          {/* List of scenarios */}
          {formData.response_scenarios && formData.response_scenarios.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Configured Scenarios ({formData.response_scenarios.length}):</p>
              {formData.response_scenarios.map((scenario, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-300 hover:border-blue-400 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{scenario.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          scenario.response_code >= 200 && scenario.response_code < 300 ? 'bg-green-100 text-green-800' :
                          scenario.response_code >= 400 && scenario.response_code < 500 ? 'bg-orange-100 text-orange-800' :
                          scenario.response_code >= 500 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {scenario.response_code}
                        </span>
                        {scenario.delay_ms > 0 && (
                          <span className="text-xs text-gray-500">⏱ {scenario.delay_ms}ms</span>
                        )}
                      </div>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-20">
                        {scenario.response_body}
                      </pre>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScenario(index)}
                      className="text-red-600 hover:text-red-700 ml-2 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">No scenarios added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add at least one scenario to create the endpoint</p>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={formData.response_scenarios.length === 0}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {endpoint && endpoint.id ? 'Update Endpoint' : 'Create Endpoint'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// Compact list item for left panel
function LogListItem({ log, isSelected, onClick }) {
  const [timeAgo, setTimeAgo] = useState('')
  
  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800',
  }

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return 'text-green-600'
    if (code >= 400 && code < 500) return 'text-orange-600'
    if (code >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  // Generate color for route based on path
  const getColorForPath = (path) => {
    let hash = 0
    for (let i = 0; i < path.length; i++) {
      hash = path.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 60%, 65%)`
  }

  // Format time ago
  const formatTimeAgo = () => {
    const secondsAgo = Math.floor((Date.now() - new Date(log.timestamp)) / 1000)
    if (secondsAgo < 5) return 'Just now'
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    const mins = Math.floor(secondsAgo / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    return `${hours}h ago`
  }

  // Update time ago every second
  useEffect(() => {
    setTimeAgo(formatTimeAgo())
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo())
    }, 1000)
    return () => clearInterval(interval)
  }, [log.timestamp])

  const borderColor = getColorForPath(log.path)

  return (
    <div 
      className={`mb-2 p-2 border rounded cursor-pointer transition ${
        isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      style={{ borderLeft: `6px solid ${borderColor}` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${methodColors[log.method]}`}>
            {log.method}
          </span>
          <span className={`font-semibold text-xs ${getStatusColor(log.response_code)}`}>
            {log.response_code}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-normal">
          {timeAgo}
        </span>
      </div>
      <code className="text-xs text-gray-700 block truncate">{log.path}</code>
    </div>
  )
}

// Detail view for right panel
function LogDetailView({ log }) {
  const [showRequestHeaders, setShowRequestHeaders] = useState(false)
  const [showRequestBody, setShowRequestBody] = useState(true) // Open by default
  const [showResponseHeaders, setShowResponseHeaders] = useState(false)
  const [showResponseBody, setShowResponseBody] = useState(false)
  
  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800',
  }

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return 'bg-green-100 text-green-800'
    if (code >= 400 && code < 500) return 'bg-orange-100 text-orange-800'
    if (code >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const ToggleSection = ({ title, isOpen, onToggle, children, hasContent = true }) => {
    if (!hasContent) return null
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
        >
          <h5 className="font-semibold text-sm text-gray-700">{title}</h5>
          <span className="text-gray-500 text-sm">
            {isOpen ? '▼' : '▶'}
          </span>
        </button>
        {isOpen && (
          <div className="p-3 bg-white">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${methodColors[log.method]}`}>
            {log.method}
          </span>
          <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(log.response_code)}`}>
            {log.response_code}
          </span>
        </div>
        <code className="text-base font-medium text-gray-800 block break-all">{log.path}</code>
        <p className="text-xs text-gray-500 mt-2">{new Date(log.timestamp).toLocaleString()}</p>
      </div>

      {/* URL */}
      <div>
        <h5 className="font-semibold text-sm text-gray-700 mb-2">URL</h5>
        <code className="block p-3 bg-gray-50 rounded text-sm break-all">{log.path}</code>
      </div>

      {/* Query Parameters */}
      {log.query_params && log.query_params !== '{}' && (
        <div>
          <h5 className="font-semibold text-sm text-gray-700 mb-2">Query Parameters</h5>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
            {JSON.stringify(JSON.parse(log.query_params), null, 2)}
          </pre>
        </div>
      )}

      {/* Request Headers - Collapsible */}
      <ToggleSection 
        title="Request Headers" 
        isOpen={showRequestHeaders} 
        onToggle={() => setShowRequestHeaders(!showRequestHeaders)}
        hasContent={log.request_headers && log.request_headers !== '{}'}
      >
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
          {JSON.stringify(JSON.parse(log.request_headers), null, 2)}
        </pre>
      </ToggleSection>

      {/* Request Body - Collapsible (Open by default) */}
      <ToggleSection 
        title="Request Body" 
        isOpen={showRequestBody} 
        onToggle={() => setShowRequestBody(!showRequestBody)}
        hasContent={log.request_body}
      >
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-96">
          {log.request_body}
        </pre>
      </ToggleSection>

      {/* Response Headers - Collapsible */}
      <ToggleSection 
        title="Response Headers" 
        isOpen={showResponseHeaders} 
        onToggle={() => setShowResponseHeaders(!showResponseHeaders)}
        hasContent={true} // Always show as we might have custom headers
      >
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
          {JSON.stringify(
            log.response_headers ? JSON.parse(log.response_headers) : {}, 
            null, 
            2
          )}
        </pre>
      </ToggleSection>

      {/* Response Body - Collapsible */}
      <ToggleSection 
        title="Response Body" 
        isOpen={showResponseBody} 
        onToggle={() => setShowResponseBody(!showResponseBody)}
        hasContent={true}
      >
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-96">
          {log.response_body}
        </pre>
      </ToggleSection>
    </div>
  )
}

// Main App
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Redirects for old /auth/* URLs */}
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/auth/register" element={<Navigate to="/register" replace />} />
          
          <Route path="/entities" element={
            <ProtectedRoute>
              <EntitiesPage />
            </ProtectedRoute>
          } />
          <Route path="/entity/:entityId" element={
            <ProtectedRoute>
              <EntityDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
