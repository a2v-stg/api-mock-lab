import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { Server, Plus, Eye, EyeOff, Settings, Activity, Trash2, Edit, Copy, Check, Menu, X, Radio, LogIn, LogOut, Beaker, FlaskConical, Users, Share2, Globe, Lock, BarChart3, Shield, Zap } from 'lucide-react'
import axios from 'axios'

// Placeholder definitions for autocomplete
const PLACEHOLDER_LIST = [
  { value: '{{uuid}}', label: 'UUID', description: 'Generate unique ID', category: 'IDs' },
  { value: '{{guid}}', label: 'GUID', description: 'Generate GUID (same as UUID)', category: 'IDs' },
  { value: '{{timestamp}}', label: 'Timestamp (Unix ms)', description: 'Unix timestamp in milliseconds', category: 'Time' },
  { value: '{{timestamp_iso}}', label: 'Timestamp (ISO)', description: 'ISO 8601 timestamp', category: 'Time' },
  { value: '{{timestamp_unix}}', label: 'Timestamp (Unix s)', description: 'Unix timestamp in seconds', category: 'Time' },
  { value: '{{date}}', label: 'Date', description: 'Current date (YYYY-MM-DD)', category: 'Time' },
  { value: '{{datetime}}', label: 'DateTime', description: 'Current datetime', category: 'Time' },
  { value: '{{time}}', label: 'Time', description: 'Current time (HH:MM:SS)', category: 'Time' },
  { value: '{{random_name}}', label: 'Random Name', description: 'Random full name', category: 'Personal' },
  { value: '{{random_first_name}}', label: 'Random First Name', description: 'Random first name', category: 'Personal' },
  { value: '{{random_last_name}}', label: 'Random Last Name', description: 'Random last name', category: 'Personal' },
  { value: '{{random_email}}', label: 'Random Email', description: 'Random email address', category: 'Personal' },
  { value: '{{random_username}}', label: 'Random Username', description: 'Random username', category: 'Personal' },
  { value: '{{random_int:1:100}}', label: 'Random Integer', description: 'Random integer (edit range)', category: 'Numbers' },
  { value: '{{random_float:0:100}}', label: 'Random Float', description: 'Random decimal (edit range)', category: 'Numbers' },
  { value: '{{random}}', label: 'Random (0-1000)', description: 'Random number 0-1000', category: 'Numbers' },
  { value: '{{random_string:10}}', label: 'Random String', description: 'Random string (edit length)', category: 'Strings' },
  { value: '{{random_hex:16}}', label: 'Random Hex', description: 'Random hex string (edit length)', category: 'Strings' },
  { value: '{{random_alphanumeric:10}}', label: 'Random Alphanumeric', description: 'Random alphanumeric (edit length)', category: 'Strings' },
  { value: '{{random_bool}}', label: 'Random Boolean', description: 'Random true/false', category: 'Other' },
  { value: '{{random_boolean}}', label: 'Random Boolean', description: 'Random true/false', category: 'Other' },
]

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
// Reset Password Page
function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const query = useQuery()
  const token = query.get('token') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!token) {
      setError('Missing reset token in URL')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword })
      setMessage('Password has been reset. You can now log in.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showNavLinks={false} />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-sm text-gray-600 mb-6">Set a new password for your account.</p>
          {!token && (
            <div className="mb-4 text-sm text-red-600">Missing or invalid reset token.</div>
          )}
          {message && <div className="mb-4 text-sm text-green-600">{message}</div>}
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label className="block mb-3">
              <span className="block text-sm text-gray-700 mb-1">New Password</span>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-12 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter new password"
                  disabled={!token || submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>
            <label className="block mb-6">
              <span className="block text-sm text-gray-700 mb-1">Confirm Password</span>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-12 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Re-enter new password"
                  disabled={!token || submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={!token || submitting}
              className={`w-full px-4 py-2 rounded-md text-white ${submitting ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Placeholder Autocomplete Component
function PlaceholderTextarea({ value, onChange, placeholder, rows = 6, className = '' }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredPlaceholders, setFilteredPlaceholders] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef(null)

  // Detect {{ typing and show suggestions
  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    
    onChange(e)
    setCursorPosition(cursorPos)

    // Check if user just typed {{
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const lastTwoBrackets = textBeforeCursor.lastIndexOf('{{')
    
    if (lastTwoBrackets !== -1) {
      const searchText = textBeforeCursor.substring(lastTwoBrackets + 2)
      
      // Only show if no closing }} yet
      const hasClosing = searchText.includes('}}')
      
      if (!hasClosing) {
        // Filter placeholders
        const filtered = PLACEHOLDER_LIST.filter(p =>
          p.value.toLowerCase().includes(searchText.toLowerCase()) ||
          p.label.toLowerCase().includes(searchText.toLowerCase())
        )
        
        if (filtered.length > 0) {
          setFilteredPlaceholders(filtered)
          setSelectedIndex(0)
          setShowSuggestions(true)
        } else {
          setShowSuggestions(false)
        }
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredPlaceholders.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredPlaceholders.length) % filteredPlaceholders.length)
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault()
      insertPlaceholder(filteredPlaceholders[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const currentValue = textarea.value
    const cursorPos = textarea.selectionStart
    
    // Find the {{ before cursor
    const textBeforeCursor = currentValue.substring(0, cursorPos)
    const lastBrackets = textBeforeCursor.lastIndexOf('{{')
    
    if (lastBrackets !== -1) {
      // Replace from {{ to cursor with the full placeholder
      const before = currentValue.substring(0, lastBrackets)
      const after = currentValue.substring(cursorPos)
      const newValue = before + placeholder.value + after
      
      // Create synthetic event
      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: lastBrackets + placeholder.value.length
        }
      }
      
      onChange(syntheticEvent)
      setShowSuggestions(false)
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = lastBrackets + placeholder.value.length
        textarea.focus()
      }, 0)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      
      {/* Autocomplete Dropdown */}
      {showSuggestions && filteredPlaceholders.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-auto">
          <div className="sticky top-0 bg-blue-50 px-3 py-2 border-b border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Placeholder Suggestions
          </div>
          {filteredPlaceholders.map((item, index) => (
            <div
              key={item.value}
              onClick={() => insertPlaceholder(item)}
              className={`px-3 py-2 cursor-pointer transition ${
                index === selectedIndex
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-600">
                  {item.value}
                </code>
              </div>
            </div>
          ))}
          <div className="sticky bottom-0 bg-gray-50 px-3 py-1.5 border-t border-gray-200 text-xs text-gray-600 text-center">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}
    </div>
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
                  My Collections
                </Link>
                {auth.user.is_admin && (
                  <Link to="/admin" className="text-sm opacity-90 hover:opacity-100 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="text-sm opacity-90">
                  Hello, <span className="font-semibold">{auth.user.username}</span>
                  {auth.user.is_admin && <span className="ml-2 px-2 py-0.5 rounded bg-yellow-400 text-yellow-900 text-xs font-bold">ADMIN</span>}
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
            A powerful, real-time API mocking service with multi-collection support, 
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Collection</h3>
            <p className="text-gray-600">
              Each collection gets a unique base path and API key. 
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
                  <h4 className="font-bold text-gray-900 mb-1">Create a Collection</h4>
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
              <span>🎲 Dynamic placeholders (UUID, timestamps, random data)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>🔔 Async callbacks with configurable delays</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>✅ JSON Schema request validation</span>
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
              <span>User authentication & multi-entity support</span>
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
            {auth?.user ? 'Go to My Collections' : 'Get Started - Create Account'}
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
  const [showPassword, setShowPassword] = useState(false)
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  className="w-full pr-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
  const [isPublic, setIsPublic] = useState(false)
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
      await api.post('/admin/entities', { 
        name: newEntityName,
        is_public: isPublic 
      })
      setNewEntityName('')
      setIsPublic(false)
      setShowCreateModal(false)
      loadEntities()
    } catch (error) {
      alert('Error creating collection: ' + (error.response?.data?.detail || error.message))
    }
  }

  const deleteEntity = async (id) => {
    if (!confirm('Are you sure you want to delete this collection? All endpoints and logs will be deleted.')) return
    
    try {
      await api.delete(`/admin/entities/${id}`)
      loadEntities()
    } catch (error) {
      alert('Error deleting collection: ' + error.message)
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
              <h1 className="text-3xl font-bold text-gray-800">My Collections</h1>
              <p className="text-gray-600 mt-1">Manage your API mock collections</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Collection
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
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No collections yet</h3>
              <p className="text-gray-500 mb-6">Create your first collection to start mocking APIs</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Your First Collection
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Collections ({entities.length})</h2>
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
              <h2 className="text-2xl font-bold text-gray-800">Create New Collection</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewEntityName('')
                  setIsPublic(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={createEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Name
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
                  This will create a base URL: <code className="bg-gray-100 px-2 py-1 rounded">/api/your-collection-name</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Make this collection public (visible to everyone)
                </label>
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
  const auth = useAuth()
  const isOwner = auth.user && entity.owner_id === auth.user.id

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-800">{entity.name}</h3>
            {entity.is_public && (
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">
                PUBLIC
              </span>
            )}
            {!isOwner && (
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                SHARED
              </span>
            )}
          </div>
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
            Explore APIs
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(entity.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedLogIndex, setSelectedLogIndex] = useState(-1)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false)
  const ws = useRef(null)
  const navigate = useNavigate()
  const auth = useAuth()
  const isOwner = auth.user && entity && entity.owner_id === auth.user.id
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedBaseUrl(true)
    setTimeout(() => setCopiedBaseUrl(false), 2000)
  }

  useEffect(() => {
    loadEntity()
    loadEndpoints()
    loadLogs()
    loadUsers()
    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [entityId])

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = localStorage.getItem('auth_token')
    // Include token as query parameter for authentication
    const wsUrl = token 
      ? `${wsProtocol}//${window.location.hostname}:8001/ws/logs/${entityId}?token=${token}`
      : `${wsProtocol}//${window.location.hostname}:8001/ws/logs/${entityId}`
    
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

  const togglePublic = async () => {
    try {
      await api.put(`/admin/entities/${entityId}`, {
        is_public: !entity.is_public
      })
      loadEntity()
    } catch (error) {
      alert('Error updating collection visibility: ' + (error.response?.data?.detail || error.message))
    }
  }

  const shareEntity = async () => {
    if (!selectedUserId) {
      alert('Please select a user to share with')
      return
    }

    try {
      await api.post(`/admin/entities/${entityId}/share`, {
        user_id: parseInt(selectedUserId)
      })
      setSelectedUserId('')
      alert('Collection shared successfully!')
      loadEntity()
    } catch (error) {
      alert('Error sharing collection: ' + (error.response?.data?.detail || error.message))
    }
  }

  const unshareEntity = async (userId) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return

    try {
      await api.delete(`/admin/entities/${entityId}/share/${userId}`)
      alert('Access revoked successfully!')
      loadEntity()
    } catch (error) {
      alert('Error revoking access: ' + (error.response?.data?.detail || error.message))
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">
                    Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin.replace('3000', '8001')}{entity.base_path}</code>
                  </p>
                  <button
                    onClick={() => copyToClipboard(window.location.origin.replace('3000', '8001') + entity.base_path)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Copy Base URL"
                  >
                    {copiedBaseUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <button
                    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition"
                  >
                    <Share2 className="w-5 h-5" />
                    {showSettingsPanel ? 'Hide' : 'Settings & Share'}
                  </button>
                )}
                <button
                  onClick={() => setShowEndpointPanel(!showEndpointPanel)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
                >
                  <Settings className="w-5 h-5" />
                  {showEndpointPanel ? 'Hide' : 'Manage'} API Endpoints
                </button>
                <button
                  onClick={() => navigate('/entities')}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition"
                >
                  ← Back to Collections
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
                    baseUrl={window.location.origin.replace('3000', '8001') + entity.base_path}
                    onEdit={setEditingEndpoint}
                    onDelete={deleteEndpoint}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side Panel - Settings & Sharing */}
      {showSettingsPanel && isOwner && (
        <div className="w-96 bg-white shadow-xl border-l border-gray-200 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Collection Settings</h3>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Visibility Settings */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {entity.is_public ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-600" />}
                Visibility
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Public Collection</p>
                    <p className="text-xs text-gray-500">Anyone can view and use this collection</p>
                  </div>
                  <button
                    onClick={togglePublic}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      entity.is_public ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        entity.is_public ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className={`text-xs px-3 py-2 rounded ${
                  entity.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  {entity.is_public 
                    ? '✓ This collection is publicly accessible' 
                    : '🔒 This collection is private'}
                </div>
              </div>
            </div>

            {/* Share with Users */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Share with Users
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {users.filter(u => u.id !== auth.user.id).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={shareEntity}
                    disabled={!selectedUserId}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm"
                  >
                    Share
                  </button>
                </div>
                
                {/* List of shared users (from entity.users if available) */}
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Shared with:</p>
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    {entity.users && entity.users.length > 0 ? (
                      <div className="space-y-2">
                        {entity.users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                            <span>{user.username}</span>
                            <button
                              onClick={() => unshareEntity(user.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center">Not shared with anyone yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function EndpointCard({ endpoint, basePath, baseUrl, onEdit, onDelete }) {
  const [scenarios, setScenarios] = useState([])
  const [activeScenario, setActiveScenario] = useState(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const copyEndpointUrl = (url) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

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

  const setScenarioMode = async (mode) => {
    try {
      await api.put(`/admin/endpoints/${endpoint.id}`, { scenario_selection_mode: mode })
      window.location.reload()
    } catch (error) {
      alert('Error updating scenario mode: ' + (error.response?.data?.detail || error.message))
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
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-600 break-all flex-1">{baseUrl}{endpoint.path}</code>
          <button
            onClick={() => copyEndpointUrl(baseUrl + endpoint.path)}
            className="text-blue-600 hover:text-blue-700 flex-shrink-0"
            title="Copy Full URL"
          >
            {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Advanced Features Indicators */}
      {(endpoint.callback_enabled || endpoint.schema_validation_enabled) && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {endpoint.callback_enabled && (
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold flex items-center gap-1" title="Async callbacks enabled">
              🔔 Callbacks
            </span>
          )}
          {endpoint.schema_validation_enabled && (
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1" title="Request validation enabled">
              ✅ Validation
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1" title="Supports dynamic placeholders">
            🎲 Placeholders
          </span>
        </div>
      )}
      
      {/* Scenarios Switcher */}
      {scenarios.length > 0 && (
        <div className="mb-2">
          <label className="block text-xs text-gray-600 mb-1">Active Scenario:</label>
          <select
            value={(endpoint.scenario_selection_mode === 'random' && 'random') || (endpoint.scenario_selection_mode === 'weighted' && 'weighted') || String(endpoint.active_scenario_index || 0)}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'random' || val === 'weighted') {
                setScenarioMode(val)
              } else {
                switchScenario(parseInt(val))
              }
            }}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            {scenarios.map((scenario, index) => (
              <option key={index} value={String(index)}>
                {scenario.name} ({scenario.response_code})
              </option>
            ))}
            <option value="random">Randomize (any scenario)</option>
            <option value="weighted">Weighted mix (configure in Edit)</option>
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
  const [currentStep, setCurrentStep] = useState(1) // 1 = Config, 2 = Scenarios
  
  const [formData, setFormData] = useState(() => {
    if (endpoint) {
      // Parse response_scenarios if it's a string
      const scenarios = typeof endpoint.response_scenarios === 'string'
        ? JSON.parse(endpoint.response_scenarios)
        : endpoint.response_scenarios || []
      
      // Debug logging
      console.log('Loading endpoint for editing:', {
        id: endpoint.id,
        callback_enabled: endpoint.callback_enabled,
        callback_url: endpoint.callback_url,
        schema_validation_enabled: endpoint.schema_validation_enabled
      })
      
      return {
        name: endpoint.name || '',
        method: endpoint.method || 'GET',
        path: endpoint.path || '/',
        is_active: endpoint.is_active !== undefined ? endpoint.is_active : true,
        response_scenarios: scenarios,
        active_scenario_index: endpoint.active_scenario_index || 0,
        scenario_selection_mode: endpoint.scenario_selection_mode || 'fixed',
        scenario_weights: (() => {
          try {
            const w = endpoint.scenario_weights ? JSON.parse(endpoint.scenario_weights) : []
            return Array.isArray(w) ? w : []
          } catch { return [] }
        })(),
        // Legacy fields (for backward compatibility)
        response_code: 200,
        response_body: '{}',
        response_headers: {},
        delay_ms: 0,
        // Advanced features - use explicit boolean check
        callback_enabled: endpoint.callback_enabled === true,
        callback_url: endpoint.callback_url || '',
        callback_method: endpoint.callback_method || 'POST',
        callback_delay_ms: endpoint.callback_delay_ms || 0,
        callback_extract_from_request: endpoint.callback_extract_from_request === true,
        callback_extract_field: endpoint.callback_extract_field || '',
        callback_payload: endpoint.callback_payload || '',
        schema_validation_enabled: endpoint.schema_validation_enabled === true,
        request_schema: endpoint.request_schema || '',
      }
    }
    
    return {
      name: '',
      method: 'GET',
      path: '/',
      is_active: true,
      response_scenarios: [],
      active_scenario_index: 0,
      scenario_selection_mode: 'fixed',
      scenario_weights: [],
      // Legacy fields
      response_code: 200,
      response_body: '{}',
      response_headers: {},
      delay_ms: 0,
      // Advanced features
      callback_enabled: false,
      callback_url: '',
      callback_method: 'POST',
      callback_delay_ms: 0,
      callback_extract_from_request: false,
      callback_extract_field: '',
      callback_payload: '',
      schema_validation_enabled: false,
      request_schema: '',
    }
  })
  
  const [currentScenario, setCurrentScenario] = useState({
    name: '',
    response_code: 200,
    response_body: '{\n  "message": "Success"\n}',
    response_headers: {},
    delay_ms: 0
  })
  
  const [editingScenarioIndex, setEditingScenarioIndex] = useState(null)

  const goToStep = (step) => {
    // Validate Step 1 before moving to Step 2
    if (step === 2 && currentStep === 1) {
      if (!formData.name.trim()) {
        alert('Please enter an endpoint name')
        return
      }
      if (!formData.path.trim()) {
        alert('Please enter an endpoint path')
        return
      }
    }
    setCurrentStep(step)
  }

  const addScenario = () => {
    if (!currentScenario.name.trim()) {
      alert('Please enter a scenario name')
      return
    }
    
    try {
      JSON.parse(currentScenario.response_body)
      
      if (editingScenarioIndex !== null) {
        // Update existing scenario
        const newScenarios = [...formData.response_scenarios]
        newScenarios[editingScenarioIndex] = currentScenario
        setFormData({
          ...formData,
          response_scenarios: newScenarios
        })
        setEditingScenarioIndex(null)
      } else {
        // Add new scenario
        const nextScenarios = [...formData.response_scenarios, currentScenario]
        const nextWeights = (() => {
          const w = [...(formData.scenario_weights || [])]
          if (formData.scenario_selection_mode === 'weighted') {
            while (w.length < nextScenarios.length) w.push(1)
          }
          return w
        })()
        setFormData({
          ...formData,
          response_scenarios: nextScenarios,
          scenario_weights: nextWeights
        })
      }
      
      // Reset form
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
  
  const editScenario = (index) => {
    setCurrentScenario(formData.response_scenarios[index])
    setEditingScenarioIndex(index)
  }
  
  const cancelEditScenario = () => {
    setCurrentScenario({
      name: '',
      response_code: 200,
      response_body: '{\n  "message": "Success"\n}',
      response_headers: {},
      delay_ms: 0
    })
    setEditingScenarioIndex(null)
  }

  const removeScenario = (index) => {
    const newScenarios = formData.response_scenarios.filter((_, i) => i !== index)
    const newWeights = (formData.scenario_weights || []).filter((_, i) => i !== index)
    setFormData({
      ...formData,
      response_scenarios: newScenarios,
      active_scenario_index: Math.min(formData.active_scenario_index || 0, Math.max(0, newScenarios.length - 1)),
      scenario_weights: newWeights
    })
    
    // Clear edit state if we're deleting the scenario being edited
    if (editingScenarioIndex === index) {
      cancelEditScenario()
    } else if (editingScenarioIndex !== null && editingScenarioIndex > index) {
      setEditingScenarioIndex(editingScenarioIndex - 1)
    }
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
        scenario_selection_mode: formData.scenario_selection_mode,
        scenario_weights: formData.scenario_selection_mode === 'weighted' ? formData.scenario_weights : null,
        // Legacy fields (using first scenario or defaults)
        response_code: formData.response_scenarios[0]?.response_code || 200,
        response_body: formData.response_scenarios[0]?.response_body || '{}',
        response_headers: formData.response_scenarios[0]?.response_headers || {},
        delay_ms: 0,
        // Advanced features - Callback configuration
        callback_enabled: formData.callback_enabled,
        callback_url: formData.callback_url || null,
        callback_method: formData.callback_method,
        callback_delay_ms: formData.callback_delay_ms,
        callback_extract_from_request: formData.callback_extract_from_request,
        callback_extract_field: formData.callback_extract_field || null,
        callback_payload: formData.callback_payload || null,
        // Advanced features - Schema validation
        schema_validation_enabled: formData.schema_validation_enabled,
        request_schema: formData.request_schema || null,
      }
      
      console.log('Submitting endpoint data:', {
        callback_enabled: submitData.callback_enabled,
        callback_url: submitData.callback_url,
        schema_validation_enabled: submitData.schema_validation_enabled
      })
      
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
      console.error('Submit error:', error)
    }
  }

  return (
    <div className="bg-white">
      {/* Modal Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">
              {endpoint && endpoint.id ? 'Edit' : 'Create'} Mock Endpoint
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
              <div className={`px-3 py-1 rounded ${currentStep === 1 ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10'}`}>
                Step 1: Configuration
              </div>
              <span>→</span>
              <div className={`px-3 py-1 rounded ${currentStep === 2 ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10'}`}>
                Step 2: Scenarios
              </div>
            </div>
          </div>
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
        {/* Step 1: Configuration */}
        {currentStep === 1 && (
          <>
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

        {/* Advanced Features Section */}
        <div className="space-y-4 border-t pt-6">
          <h4 className="font-semibold text-gray-800 pb-2 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Features
          </h4>
          
          {/* Dynamic Placeholders Helper */}
          <details className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-blue-900 flex items-center gap-2">
              🎲 Dynamic Placeholders - Click to see available placeholders
            </summary>
            <div className="mt-3 text-sm space-y-2">
              <p className="text-blue-800">Use placeholders in your response body to generate dynamic values on each request:</p>
              <div className="bg-white rounded p-3 space-y-1 font-mono text-xs">
                <div><span className="text-purple-600">{`{{uuid}}`}</span> - Generate UUID</div>
                <div><span className="text-purple-600">{`{{timestamp_iso}}`}</span> - ISO timestamp</div>
                <div><span className="text-purple-600">{`{{timestamp}}`}</span> - Unix timestamp (ms)</div>
                <div><span className="text-purple-600">{`{{date}}`}</span> - Current date (YYYY-MM-DD)</div>
                <div><span className="text-purple-600">{`{{random_name}}`}</span> - Random full name</div>
                <div><span className="text-purple-600">{`{{random_email}}`}</span> - Random email</div>
                <div><span className="text-purple-600">{`{{random_int:1:100}}`}</span> - Random integer (1-100)</div>
                <div><span className="text-purple-600">{`{{random_float:10:100}}`}</span> - Random float</div>
                <div><span className="text-purple-600">{`{{random_string:10}}`}</span> - Random string (10 chars)</div>
                <div><span className="text-purple-600">{`{{random_bool}}`}</span> - Random boolean</div>
              </div>
              <p className="text-xs text-blue-700 mt-2">📚 See full documentation for complete list of placeholders</p>
            </div>
          </details>

          {/* Schema Validation - Progressive Disclosure */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.schema_validation_enabled}
                onChange={(e) => setFormData({ ...formData, schema_validation_enabled: e.target.checked })}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div>
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  ✅ Enable Request Schema Validation
                </div>
                <div className="text-xs text-gray-600">Validate incoming requests against a JSON schema</div>
              </div>
            </label>
            
            {formData.schema_validation_enabled && (
              <div className="pl-8 pt-2 space-y-2 border-l-4 border-green-500">
                <label className="block text-sm font-medium text-gray-700">
                  JSON Schema
                </label>
                <textarea
                  value={formData.request_schema}
                  onChange={(e) => setFormData({ ...formData, request_schema: e.target.value })}
                  placeholder={`{\n  "type": "object",\n  "required": ["email", "name"],\n  "properties": {\n    "email": {"type": "string", "format": "email"},\n    "name": {"type": "string", "minLength": 3}\n  }\n}`}
                  rows="8"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono bg-white"
                />
                <p className="text-xs text-green-700">
                  💡 Invalid requests will receive a 400 error with validation details
                </p>
              </div>
            )}
          </div>

          {/* Async Callbacks - Progressive Disclosure */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.callback_enabled}
                onChange={(e) => setFormData({ ...formData, callback_enabled: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  🔔 Enable Async Callbacks
                </div>
                <div className="text-xs text-gray-600">Send HTTP callbacks to external URLs after processing</div>
              </div>
            </label>

            {formData.callback_enabled && (
              <div className="pl-8 pt-2 space-y-3 border-l-4 border-orange-500">
                {/* Callback URL Configuration */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="callback_extract"
                      checked={formData.callback_extract_from_request}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        callback_extract_from_request: e.target.checked,
                        callback_url: e.target.checked ? '' : formData.callback_url 
                      })}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">Extract callback URL from request body</span>
                  </label>

                  {formData.callback_extract_from_request ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        JSON field path to extract URL from
                      </label>
                      <input
                        type="text"
                        value={formData.callback_extract_field}
                        onChange={(e) => setFormData({ ...formData, callback_extract_field: e.target.value })}
                        placeholder='e.g., "callback_url" or "meta.webhook.url"'
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Supports nested paths with dots. Example: {"{"} "callback_url": "https://..." {"}"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Static callback URL
                      </label>
                      <input
                        type="url"
                        value={formData.callback_url}
                        onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                        placeholder="https://your-app.com/webhook"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HTTP Method
                    </label>
                    <select
                      value={formData.callback_method}
                      onChange={(e) => setFormData({ ...formData, callback_method: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={formData.callback_delay_ms}
                      onChange={(e) => setFormData({ ...formData, callback_delay_ms: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Callback Payload - NEW */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Callback Payload (Optional) - Type <code className="bg-blue-100 text-blue-800 px-1 rounded">{`{{`}</code> for autocomplete!
                  </label>
                  <PlaceholderTextarea
                    value={formData.callback_payload}
                    onChange={(e) => setFormData({ ...formData, callback_payload: e.target.value })}
                    placeholder={`{\n  "order_id": "{{uuid}}",\n  "status": "completed",\n  "timestamp": "{{timestamp_iso}}"\n}`}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Leave empty to use default payload (request + response). Type {`{{`} for placeholder suggestions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

            {/* Step 1 Navigation */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                Next: Configure Scenarios
                <span>→</span>
              </button>
            </div>
          </>
        )}

        {/* Step 2: Response Scenarios */}
        {currentStep === 2 && (
          <>
            {/* Response Scenarios Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2">Response Scenarios</h4>
              <p className="text-sm text-gray-600">Add multiple response scenarios and switch between them dynamically</p>

              {/* Scenario selection behavior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selection Mode</label>
                  <select
                    value={formData.scenario_selection_mode}
                    onChange={(e) => {
                      const mode = e.target.value
                      setFormData({ ...formData, scenario_selection_mode: mode })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed (use active scenario)</option>
                    <option value="random">Random (each request picks any)</option>
                    <option value="weighted">Weighted (configure weights)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Random/Weighted ignore the active scenario selection.</p>
                </div>
                {formData.scenario_selection_mode === 'weighted' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weights</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.response_scenarios.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{s.name}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={(formData.scenario_weights && formData.scenario_weights[i] !== undefined) ? formData.scenario_weights[i] : 1}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value || '0'))
                              const weights = [...(formData.scenario_weights || [])]
                              while (weights.length < formData.response_scenarios.length) weights.push(1)
                              weights[i] = val
                              setFormData({ ...formData, scenario_weights: weights })
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Weights are relative; they will be normalized automatically.</p>
                  </div>
                )}
              </div>
              
              {/* Add/Edit scenario */}
              <div className={`p-4 rounded-lg border-2 space-y-3 ${
                editingScenarioIndex !== null 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-gray-50 border-dashed border-gray-300'
              }`}>
                <h5 className="font-medium text-sm text-gray-700">
                  {editingScenarioIndex !== null ? 'Edit Scenario' : 'Add New Scenario'}
                </h5>
                
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
                  <label className="block text-xs text-gray-600 mb-1">
                    Response Body (JSON) - Type <code className="bg-blue-100 text-blue-800 px-1 rounded">{`{{`}</code> for autocomplete!
                  </label>
                  <PlaceholderTextarea
                    value={currentScenario.response_body}
                    onChange={(e) => setCurrentScenario({ ...currentScenario, response_body: e.target.value })}
                    placeholder='{"message": "Success", "id": "{{uuid}}"}'
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Tip: Type {`{{`} to see placeholder suggestions. Use ↑↓ to navigate, Enter to select
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addScenario}
                    disabled={!currentScenario.name}
                    className={`flex-1 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 ${
                      editingScenarioIndex !== null 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {editingScenarioIndex !== null ? (
                      <>
                        <Check className="w-4 h-4" />
                        Update Scenario
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Scenario
                      </>
                    )}
                  </button>
                  {editingScenarioIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEditScenario}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List of scenarios */}
              {formData.response_scenarios && formData.response_scenarios.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Configured Scenarios ({formData.response_scenarios.length}):</p>
                  {formData.response_scenarios.map((scenario, index) => (
                    <div key={index} className={`p-3 rounded-lg border transition ${
                      editingScenarioIndex === index 
                        ? 'bg-blue-50 border-blue-400 border-2' 
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}>
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
                            {editingScenarioIndex === index && (
                              <span className="text-xs text-blue-600 font-semibold">Editing...</span>
                            )}
                          </div>
                          <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-20">
                            {scenario.response_body}
                          </pre>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => editScenario(index)}
                            disabled={editingScenarioIndex !== null}
                            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                            title="Edit scenario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeScenario(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete scenario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

            {/* Step 2 Navigation */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium flex items-center gap-2"
              >
                <span>←</span>
                Back to Configuration
              </button>
              <button
                type="submit"
                disabled={formData.response_scenarios.length === 0}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {endpoint && endpoint.id ? 'Update Endpoint' : 'Create Endpoint'}
              </button>
            </div>
          </>
        )}
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

// Admin Dashboard
function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, users, collections
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetInfo, setResetInfo] = useState(null) // { token, expires_at, resetUrl, username }
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    // Check if user is admin
    if (!auth.user?.is_admin) {
      alert('Admin access required')
      navigate('/entities')
      return
    }
    
    loadDashboardData()
  }, [auth.user, navigate])

  const loadDashboardData = async () => {
    try {
      const [statsRes, usersRes, collectionsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/users'),
        api.get('/admin/dashboard/collections')
      ])
      
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setCollections(collectionsRes.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      if (error.response?.status === 403) {
        alert('Admin access required')
        navigate('/entities')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar showNavLinks={false} />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showNavLinks={false} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">System overview and management</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/entities')}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition"
            >
              ← Back to Collections
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'users'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Users ({users.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'collections'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Collections ({collections.length})
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.total_users}
                icon={<Users className="w-8 h-8" />}
                color="blue"
                subtitle={`${stats.admin_users} admin(s)`}
              />
              <StatCard
                title="Collections"
                value={stats.total_collections}
                icon={<Server className="w-8 h-8" />}
                color="green"
                subtitle={`${stats.public_collections} public, ${stats.private_collections} private`}
              />
              <StatCard
                title="Mock Endpoints"
                value={stats.total_endpoints}
                icon={<Settings className="w-8 h-8" />}
                color="purple"
              />
              <StatCard
                title="Total Requests"
                value={stats.total_requests}
                icon={<Activity className="w-8 h-8" />}
                color="orange"
                subtitle={`${stats.requests_today} today`}
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Today</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.requests_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">This Week</span>
                    <span className="text-2xl font-bold text-green-600">{stats.requests_this_week}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">All Time</span>
                    <span className="text-2xl font-bold text-purple-600">{stats.total_requests}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Endpoints per Collection</span>
                    <span className="text-xl font-bold text-gray-800">
                      {stats.total_collections > 0 ? (stats.total_endpoints / stats.total_collections).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Collections per User</span>
                    <span className="text-xl font-bold text-gray-800">
                      {stats.total_users > 0 ? (stats.total_collections / stats.total_users).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Requests per Collection</span>
                    <span className="text-xl font-bold text-gray-800">
                      {stats.total_collections > 0 ? (stats.total_requests / stats.total_collections).toFixed(0) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections Owned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections Shared</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoints</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_admin ? (
                          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.collections_owned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.collections_shared}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.total_endpoints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.total_requests}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex gap-2">
                          {user.is_admin ? (
                            <button
                              className="px-3 py-1 rounded border border-gray-300 hover:border-gray-400 text-gray-700"
                              onClick={async () => {
                                try {
                                  await api.post(`/admin/users/${user.id}/remove-admin`)
                                  setUsers((prev) => prev.map(u => u.id === user.id ? { ...u, is_admin: false } : u))
                                } catch (e) {
                                  alert('Failed to remove admin: ' + (e.response?.data?.detail || e.message))
                                }
                              }}
                            >
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              className="px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                              onClick={async () => {
                                try {
                                  await api.post(`/admin/users/${user.id}/make-admin`)
                                  setUsers((prev) => prev.map(u => u.id === user.id ? { ...u, is_admin: true } : u))
                                } catch (e) {
                                  alert('Failed to make admin: ' + (e.response?.data?.detail || e.message))
                                }
                              }}
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                            onClick={async () => {
                              try {
                                const res = await api.post(`/admin/users/${user.id}/reset-password`)
                                const { reset_token, expires_at } = res.data
                                const resetUrl = `${window.location.origin}/reset-password?token=${encodeURIComponent(reset_token)}`
                                setResetInfo({ token: reset_token, expires_at, resetUrl, username: user.username })
                                setResetModalOpen(true)
                              } catch (e) {
                                alert('Failed to reset password: ' + (e.response?.data?.detail || e.message))
                              }
                            }}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoints</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Request</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{collection.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {collection.base_path}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {collection.owner_username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {collection.is_public ? (
                          <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold flex items-center gap-1 w-fit">
                            <Globe className="w-3 h-3" />
                            PUBLIC
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" />
                            PRIVATE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {collection.endpoint_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {collection.request_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {collection.last_request_at 
                          ? new Date(collection.last_request_at).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(collection.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {resetModalOpen && resetInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setResetModalOpen(false)} />
            <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Password Reset Link</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setResetModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">User</div>
                  <div className="font-medium text-gray-900">{resetInfo.username}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Reset URL</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={resetInfo.resetUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 bg-gray-50"
                    />
                    <button
                      className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                      onClick={async () => { try { await navigator.clipboard.writeText(resetInfo.resetUrl) } catch {} }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Token</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={resetInfo.token}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 bg-gray-50"
                    />
                    <button
                      className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                      onClick={async () => { try { await navigator.clipboard.writeText(resetInfo.token) } catch {} }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Expires: {new Date(resetInfo.expires_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:border-gray-400"
                  onClick={() => setResetModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
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
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
