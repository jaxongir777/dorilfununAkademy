
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import users from '../../Data/users.js'
import Logo from '../../Assets/Logo.jpg'
import './Login.css'

const readStorage = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const Login = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const enteredUsername = username.trim().toLowerCase()

    if (!enteredUsername || !password) {
      setError('Login va parolni kiriting!')
      return
    }

    // O‘chirilgan o‘quvchilar ID raqamlari
    const deletedStudents = readStorage('deletedStudents').map(String)

    // Avvaldan mavjud foydalanuvchilar
    const defaultUsers = users.filter(user => {
      if (
        user.role === 'student' &&
        deletedStudents.includes(String(user.id))
      ) {
        return false
      }

      return true
    })

    // Admin tomonidan qo‘shilgan o‘quvchilar
    const savedStudents = readStorage('students').filter(student => {
      return !deletedStudents.includes(String(student.id))
    })

    // Admin tomonidan qo‘shilgan ustozlar
    const savedTeachers = readStorage('teachers')

    // Barcha foydalanuvchilarni birlashtirish
    const allUsers = [
      ...defaultUsers,
      ...savedStudents,
      ...savedTeachers
    ]

    // Bir xil ID bo‘lsa, oxirgi saqlangan ma’lumotni olish
    const usersMap = new Map()

    allUsers.forEach(user => {
      if (user && user.id !== undefined) {
        usersMap.set(String(user.id), {
          ...usersMap.get(String(user.id)),
          ...user
        })
      }
    })

    const availableUsers = Array.from(usersMap.values())

    const user = availableUsers.find(item => {
      return (
        item.username?.trim().toLowerCase() === enteredUsername &&
        String(item.password) === password
      )
    })

    if (!user) {
      setError('Login yoki parol noto‘g‘ri!')
      return
    }

    if (user.isFrozen) {
      setError('Hisobingiz muzlatilgan. Administrator bilan bog‘laning.')
      return
    }

    // Kirgan foydalanuvchini saqlash
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Foydalanuvchi roliga qarab sahifaga yo‘naltirish
    if (user.role === 'admin') {
      navigate('/admin')
    } else if (user.role === 'teacher') {
      navigate('/teacher')
    } else if (user.role === 'student') {
      navigate('/student')
    } else {
      setError('Foydalanuvchi roli aniqlanmadi!')
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

          <label htmlFor="username">
            Username
          </label>

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

          <label htmlFor="password">
            Parol
          </label>

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
            <p
              style={{
                color: '#dc2626',
                fontSize: '13px',
                marginTop: '10px'
              }}
            >
              {error}
            </p>
          )}

          <button className="login-submit" type="submit">
            Tizimga kirish
          </button>

        </form>
      </div>
    </main>
  )
}

export default Login
