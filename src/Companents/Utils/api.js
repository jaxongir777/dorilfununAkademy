import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../utils/api'
import Logo from '../../Assets/Logo.jpg'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const enteredUsername = username.trim()

    if (!enteredUsername || !password) {
      setError('Login va parolni kiriting!')
      return
    }

    setLoading(true)

    try {
      const user = await login(enteredUsername, password)

      if (!user) {
        setError('Login yoki parol noto‘g‘ri!')
        return
      }

      if (user.isFrozen) {
        setError('Hisobingiz muzlatilgan. Administrator bilan bog‘laning.')
        return
      }

      localStorage.setItem('currentUser', JSON.stringify(user))

      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'teacher') {
        navigate('/teacher')
      } else if (user.role === 'student') {
        navigate('/student')
      } else {
        setError('Foydalanuvchi roli aniqlanmadi!')
      }
    } catch (err) {
      console.error(err)
      setError('Serverga ulanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <img src={Logo} alt="Dorilfunun Academy Logo" />
        </div>

        <h1>Dorilfunun Academy</h1>

        <p className="login-subtitle">
          Ta’lim boshqaruv tizimi
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="username">Username</label>

          <input
            id="username"
            type="text"
            placeholder="Username kiriting"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            autoComplete="username"
          />

          <label htmlFor="password">Parol</label>

          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolingizni kiriting"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Yashirish' : 'Ko‘rsatish'}
            </button>
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '10px' }}>
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>

        </form>
      </div>
    </main>
  )
}

export default Login