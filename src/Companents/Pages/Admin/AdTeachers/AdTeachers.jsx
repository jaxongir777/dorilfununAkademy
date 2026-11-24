import React, { useCallback, useEffect, useState } from 'react'
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  X,
  Users,
  BookOpen,
  Phone,
  User,
  Eye,
  EyeOff
} from 'lucide-react'
import { getTeachers, saveUser, deleteUser } from '../../../Utils/api.js'
import './AdTeachers.css'

const emptyForm = {
  name: '',
  username: '',
  password: '',
  phone: '',
  subject: ''
}

const AdTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  const loadTeachers = useCallback(async () => {
    try {
      const list = await getTeachers()
      setTeachers(list)

      // Vaqtincha: Grupps.jsx hali localStorage'dan o'qiydi
      localStorage.setItem('teachers', JSON.stringify(list))
      window.dispatchEvent(new Event('academyDataUpdated'))
    } catch (err) {
      console.error(err)
      setError('Ustozlarni yuklab bo‘lmadi. Internetni tekshiring.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

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
      password: '',
      phone: teacher.phone || '',
      subject: teacher.subject || ''
    })
    setError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(emptyForm)
    setEditingTeacher(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const name = form.name.trim()
    const username = form.username.trim()
    const password = form.password.trim()
    const phone = form.phone.trim()
    const subject = form.subject.trim()

    if (!name || !username || !subject) {
      setError('Majburiy maydonlarni to‘ldiring!')
      return
    }

    if (!editingTeacher && !password) {
      setError('Yangi ustoz uchun parol kiriting!')
      return
    }

    if (password && password.length < 4) {
      setError('Parol kamida 4 ta belgidan iborat bo‘lsin.')
      return
    }

    setSaving(true)

    try {
      await saveUser({
        id: editingTeacher?.id ?? null,
        role: 'teacher',
        name,
        username,
        password,
        phone,
        subject,
        isFrozen: editingTeacher?.isFrozen || false,
        points: 0,
        missedLessons: 0
      })

      await loadTeachers()
      closeModal()
    } catch (err) {
      console.error(err)

      if (String(err.message).includes('academy_users_username_key')) {
        setError('Bu login band. Boshqa login kiriting!')
      } else {
        setError('Saqlab bo‘lmadi. Qayta urinib ko‘ring.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (teacher) => {
    const confirmed = window.confirm(
      `${teacher.name} ismli ustozni o‘chirmoqchimisiz?`
    )
    if (!confirmed) return

    try {
      await deleteUser(teacher.id)
      await loadTeachers()
    } catch (err) {
      console.error(err)
      alert('O‘chirib bo‘lmadi. Qayta urinib ko‘ring.')
    }
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
        {loading ? (
          <div className="ad-teachers-empty">
            <h3>Yuklanmoqda...</h3>
          </div>
        ) : filteredTeachers.length > 0 ? (
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
                  onClick={() => handleDelete(teacher)}
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
        <div className="ad-teachers-overlay" onClick={closeModal}>
          <div
            className="ad-teachers-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="ad-teachers-modal-top">
              <div>
                <h3>{editingTeacher ? 'Ustozni tahrirlash' : 'Yangi ustoz qo‘shish'}</h3>
                <p>Ustoz ma’lumotlarini kiriting</p>
              </div>

              <button type="button" onClick={closeModal}>
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
                Parol {editingTeacher ? '' : '*'}
                <div className="ad-teachers-password">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingTeacher
                        ? 'O‘zgartirmasangiz, eski parol qoladi'
                        : 'Parol kiriting'
                    }
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
                  onClick={closeModal}
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="ad-teachers-save"
                  disabled={saving}
                >
                  {saving
                    ? 'Saqlanmoqda...'
                    : editingTeacher ? 'Saqlash' : 'Ustoz qo‘shish'}
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