
import React, { useEffect, useState } from 'react'
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  X,
  Users,
  BookOpen,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react'
import './AdTeachers.css'

const TEACHERS_KEY = 'teachers'

const readStorage = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const AdTeachers = () => {
  const [teachers, setTeachers] = useState(() => readStorage(TEACHERS_KEY))
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const emptyForm = {
    name: '',
    username: '',
    password: '',
    phone: '',
    subject: ''
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers))
    window.dispatchEvent(new Event('academyDataUpdated'))
  }, [teachers])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const openAddModal = () => {
    setEditingTeacher(null)
    setForm(emptyForm)
    setError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher)
    setForm({
      name: teacher.name || '',
      username: teacher.username || '',
      password: teacher.password || '',
      phone: teacher.phone || '',
      subject: teacher.subject || ''
    })
    setError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const name = form.name.trim()
    const username = form.username.trim()
    const password = form.password.trim()
    const phone = form.phone.trim()
    const subject = form.subject.trim()

    if (!name || !username || !password || !subject) {
      setError('Majburiy maydonlarni to‘ldiring!')
      return
    }

    const staticUsers = readStorage('students')
    const defaultUsers = window.__academyDefaultUsers || []

    const usernameExists = [
      ...teachers.filter(t => String(t.id) !== String(editingTeacher?.id)),
      ...staticUsers,
      ...defaultUsers
    ].some(user => user.username?.trim().toLowerCase() === username.toLowerCase())

    if (usernameExists) {
      setError('Bu login band. Boshqa login kiriting!')
      return
    }

    if (editingTeacher) {
      setTeachers(prev => prev.map(teacher =>
        String(teacher.id) === String(editingTeacher.id)
          ? {
              ...teacher,
              name,
              username,
              password,
              phone,
              subject
            }
          : teacher
      ))
    } else {
      const newTeacher = {
        id: Date.now(),
        role: 'teacher',
        name,
        username,
        password,
        phone,
        subject,
        isFrozen: false
      }

      setTeachers(prev => [...prev, newTeacher])
    }

    setShowModal(false)
    setForm(emptyForm)
    setEditingTeacher(null)
  }

  const deleteTeacher = (id) => {
    const confirmed = window.confirm('Ushbu ustozni o‘chirmoqchimisiz?')
    if (!confirmed) return

    setTeachers(prev => prev.filter(teacher => String(teacher.id) !== String(id)))
  }

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.name} ${teacher.username} ${teacher.subject} ${teacher.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="ad-teachers">
      <div className="ad-teachers-top">
        <div>
          <h2>O‘qituvchilar</h2>
          <p>Markazdagi barcha ustozlarni boshqaring</p>
        </div>

        <button className="ad-teachers-add" onClick={openAddModal}>
          <UserPlus size={19} />
          Ustoz qo‘shish
        </button>
      </div>

      <div className="ad-teachers-stats">
        <div className="ad-teachers-stat">
          <div className="ad-teachers-stat-icon">
            <Users size={23} />
          </div>
          <div>
            <span>Jami ustozlar</span>
            <h3>{teachers.length}</h3>
          </div>
        </div>

        <div className="ad-teachers-stat">
          <div className="ad-teachers-stat-icon">
            <BookOpen size={23} />
          </div>
          <div>
            <span>Fanlar soni</span>
            <h3>{new Set(teachers.map(t => t.subject).filter(Boolean)).size}</h3>
          </div>
        </div>
      </div>

      <div className="ad-teachers-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Ustozni qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="ad-teachers-list">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <div className="ad-teacher-card" key={teacher.id}>
              <div className="ad-teacher-avatar">
                <User size={25} />
              </div>

              <div className="ad-teacher-info">
                <h3>{teacher.name}</h3>
                <p>{teacher.subject || 'Fan ko‘rsatilmagan'}</p>

                <div className="ad-teacher-details">
                  <span>@{teacher.username}</span>
                  {teacher.phone && (
                    <span>
                      <Phone size={14} />
                      {teacher.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="ad-teacher-actions">
                <button
                  className="ad-teacher-edit"
                  onClick={() => openEditModal(teacher)}
                  title="Tahrirlash"
                >
                  <Edit size={17} />
                </button>

                <button
                  className="ad-teacher-delete"
                  onClick={() => deleteTeacher(teacher.id)}
                  title="O‘chirish"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="ad-teachers-empty">
            <Users size={40} />
            <h3>Ustozlar topilmadi</h3>
            <p>Yangi ustoz qo‘shish uchun yuqoridagi tugmani bosing.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="ad-teachers-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ad-teachers-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="ad-teachers-modal-top">
              <div>
                <h3>{editingTeacher ? 'Ustozni tahrirlash' : 'Yangi ustoz qo‘shish'}</h3>
                <p>Ustoz ma’lumotlarini kiriting</p>
              </div>

              <button onClick={() => setShowModal(false)}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Ism va familiya *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masalan: Ali Valiyev"
                />
              </label>

              <label>
                Login *
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Ustoz uchun login"
                />
              </label>

              <label>
                Parol *
                <div className="ad-teachers-password">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Parol kiriting"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label>
                Telefon raqam
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+998 90 123 45 67"
                />
              </label>

              <label>
                Fan *
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Masalan: Ingliz tili"
                />
              </label>

              {error && <p className="ad-teachers-error">{error}</p>}

              <div className="ad-teachers-modal-actions">
                <button
                  type="button"
                  className="ad-teachers-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Bekor qilish
                </button>

                <button type="submit" className="ad-teachers-save">
                  {editingTeacher ? 'Saqlash' : 'Ustoz qo‘shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdTeachers
