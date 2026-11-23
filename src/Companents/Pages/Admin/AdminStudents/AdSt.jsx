
import React, { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Search,
  GraduationCap,
  Star,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  UserRound,
  KeyRound,
  Filter,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

import users from '../../../Data/users'
import './AdSt.css'

const STUDENTS_KEY = 'students'
const GROUPS_KEY = 'groups'
const DELETED_KEY = 'deletedStudents'

const readStorage = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const getStudents = () => {
  const deletedIds = readStorage(DELETED_KEY).map(String)

  const registeredStudents = users
    .filter(user => user.role === 'student')
    .filter(user => !deletedIds.includes(String(user.id)))
    .map(user => ({
      ...user,
      group: user.group || '',
      points: Number(user.points || 0),
      missedLessons: Number(user.missedLessons || 0),
      isFrozen: Boolean(user.isFrozen)
    }))

  const savedStudents = readStorage(STUDENTS_KEY)
  const studentsMap = new Map()

  registeredStudents.forEach(student => {
    studentsMap.set(String(student.id), student)
  })

  savedStudents.forEach(student => {
    if (!student || student.id === undefined) return
    if (deletedIds.includes(String(student.id))) return

    const id = String(student.id)

    studentsMap.set(id, {
      ...studentsMap.get(id),
      ...student
    })
  })

  return Array.from(studentsMap.values())
}

const emptyForm = {
  name: '',
  username: '',
  password: '',
  group: '',
  groupId: '',
  points: 0,
  missedLessons: 0
}

const AdSt = () => {
  const [students, setStudents] = useState(getStudents)
  const [groups, setGroups] = useState(() => readStorage(GROUPS_KEY))

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
  }, [students])

  useEffect(() => {
    const updateData = () => {
      setGroups(readStorage(GROUPS_KEY))
      setStudents(getStudents())
    }

    window.addEventListener('storage', updateData)
    window.addEventListener('academyDataUpdated', updateData)

    return () => {
      window.removeEventListener('storage', updateData)
      window.removeEventListener('academyDataUpdated', updateData)
    }
  }, [])

  const notifyUpdate = () => {
    window.dispatchEvent(new Event('academyDataUpdated'))
  }

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchText = search.toLowerCase().trim()

      const matchesSearch = [
        student.name,
        student.username,
        student.group
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchText)

      const matchesGroup =
        groupFilter === 'all' ||
        String(student.groupId || '') === groupFilter ||
        (!student.groupId && student.group === groupFilter)

      return matchesSearch && matchesGroup
    })
  }, [students, search, groupFilter])

  const frozenCount = students.filter(student => student.isFrozen).length
  const activeCount = students.length - frozenCount

  const openAddModal = () => {
    setEditingStudent(null)
    setForm(emptyForm)
    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const openEditModal = (student) => {
    setEditingStudent(student)

    setForm({
      name: student.name || '',
      username: student.username || '',
      password: student.password || '',
      group: student.group || '',
      groupId: student.groupId || '',
      points: Number(student.points || 0),
      missedLessons: Number(student.missedLessons || 0)
    })

    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingStudent(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleGroupChange = (groupId) => {
    const selectedGroup = groups.find(
      group => String(group.id) === String(groupId)
    )

    setForm(previous => ({
      ...previous,
      groupId,
      group: selectedGroup?.name || ''
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')

    const name = form.name.trim()
    const username = form.username.trim()
    const password = form.password.trim()

    if (!name || !username) {
      setFormError('Ism va login maydonlarini to‘ldiring.')
      return
    }

    if (!editingStudent && !password) {
      setFormError('Yangi o‘quvchi uchun parol kiriting.')
      return
    }

    if (password && password.length < 4) {
      setFormError('Parol kamida 4 ta belgidan iborat bo‘lsin.')
      return
    }

    const usernameExists = [
      ...users.filter(user => user.role !== 'student'),
      ...students
    ].some(user => {
      const sameUsername =
        user.username?.toLowerCase() === username.toLowerCase()

      const sameStudent =
        editingStudent &&
        String(user.id) === String(editingStudent.id)

      return sameUsername && !sameStudent
    })

    if (usernameExists) {
      setFormError('Bu login boshqa foydalanuvchiga tegishli.')
      return
    }

    const studentData = {
      id: editingStudent?.id || Date.now(),
      role: 'student',
      name,
      username,
      password: password || editingStudent?.password || '',
      group: form.group,
      groupId: form.groupId,
      points: Math.max(0, Number(form.points) || 0),
      missedLessons: Math.max(0, Number(form.missedLessons) || 0),
      isFrozen: editingStudent?.isFrozen || false
    }

    let updatedStudents

    if (editingStudent) {
      updatedStudents = students.map(student =>
        String(student.id) === String(editingStudent.id)
          ? { ...student, ...studentData }
          : student
      )
    } else {
      updatedStudents = [...students, studentData]
    }

    setStudents(updatedStudents)
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))

    const deletedIds = readStorage(DELETED_KEY).filter(
      id => String(id) !== String(studentData.id)
    )
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds))

    notifyUpdate()
    closeModal()
  }

  const deleteStudent = (student) => {
    const confirmed = window.confirm(
      `${student.name} ismli o‘quvchini o‘chirmoqchimisiz?`
    )

    if (!confirmed) return

    const updatedStudents = students.filter(
      item => String(item.id) !== String(student.id)
    )

    const deletedIds = readStorage(DELETED_KEY)

    if (!deletedIds.map(String).includes(String(student.id))) {
      deletedIds.push(student.id)
    }

    setStudents(updatedStudents)

    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds))

    notifyUpdate()
  }

  const toggleFreeze = (student) => {
    const nextFrozenState = !student.isFrozen

    const confirmed = window.confirm(
      nextFrozenState
        ? `${student.name} hisobini muzlatmoqchimisiz?`
        : `${student.name} hisobini qayta faollashtirmoqchimisiz?`
    )

    if (!confirmed) return

    const updatedStudents = students.map(item =>
      String(item.id) === String(student.id)
        ? { ...item, isFrozen: nextFrozenState }
        : item
    )

    setStudents(updatedStudents)
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))

    notifyUpdate()
  }

  return (
    <section className="admin-students">

      {/* HEADER */}
      <div className="admin-students-top">
        <div className="admin-students-heading">
          <span className="admin-students-eyebrow">
            AKADEMIYA BOSHQARUVI
          </span>

          <h2>O‘quvchilar</h2>

          <p>
            O‘quvchilar hisoblari, guruhlari va natijalarini boshqaring.
          </p>
        </div>

        <button
          className="admin-student-add-btn"
          onClick={openAddModal}
        >
          <Plus size={19} />
          <span>O‘quvchi qo‘shish</span>
        </button>
      </div>

      {/* STATISTICS */}
      <div className="admin-students-summary">

        <div className="admin-students-summary-card">
          <div className="admin-summary-icon total">
            <Users size={21} />
          </div>

          <div>
            <span>Jami o‘quvchilar</span>
            <strong>{students.length}</strong>
          </div>
        </div>

        <div className="admin-students-summary-card">
          <div className="admin-summary-icon active">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Faol hisoblar</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="admin-students-summary-card">
          <div className="admin-summary-icon frozen">
            <Lock size={21} />
          </div>

          <div>
            <span>Muzlatilgan hisoblar</span>
            <strong>{frozenCount}</strong>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="admin-students-toolbar">

        <div className="admin-students-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Ism, login yoki guruh bo‘yicha qidirish..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearch('')}
              aria-label="Qidiruvni tozalash"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-students-filter">
          <Filter size={17} />

          <select
            value={groupFilter}
            onChange={event => setGroupFilter(event.target.value)}
          >
            <option value="all">Barcha guruhlar</option>

            {groups.map(group => (
              <option key={group.id} value={String(group.id)}>
                {group.name}
              </option>
            ))}

            <option value="Guruh biriktirilmagan">
              Guruh biriktirilmagan
            </option>
          </select>
        </div>

      </div>

      {/* TABLE */}
      <div className="admin-students-table-card">

        <div className="admin-students-table-heading">
          <div>
            <h3>O‘quvchilar ro‘yxati</h3>
            <p>
              {filteredStudents.length} ta o‘quvchi ko‘rsatilmoqda
            </p>
          </div>

          <div className="admin-students-total">
            <Users size={17} />
            Jami: {students.length}
          </div>
        </div>

        <div className="admin-students-table-wrapper">
          <table className="admin-students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O‘quvchi</th>
                <th>Login</th>
                <th>Guruh</th>
                <th>Ball</th>
                <th>Qoldirilgan dars</th>
                <th>Holati</th>
                <th>Amallar</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>

                    <td className="admin-student-index">
                      {index + 1}
                    </td>

                    <td>
                      <div className="admin-student-name">
                        <div className="admin-student-avatar">
                          {student.name?.charAt(0).toUpperCase() || 'O'}
                        </div>

                        <div className="admin-student-name-info">
                          <strong>{student.name}</strong>
                          <span>
                            ID: {student.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="admin-student-username">
                        {student.username}
                      </span>
                    </td>

                    <td>
                      <span className="admin-student-group">
                        <GraduationCap size={15} />
                        {student.group || 'Biriktirilmagan'}
                      </span>
                    </td>

                    <td>
                      <span className="admin-student-points">
                        <Star size={15} />
                        {Number(student.points || 0)}
                      </span>
                    </td>

                    <td>
                      <span className="admin-student-missed">
                        {Number(student.missedLessons || 0)} ta
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-student-status ${
                          student.isFrozen ? 'frozen' : 'active'
                        }`}
                      >
                        {student.isFrozen ? (
                          <>
                            <Lock size={13} />
                            Muzlatilgan
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            Faol
                          </>
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="admin-student-actions">

                        <button
                          type="button"
                          className="admin-student-action edit"
                          onClick={() => openEditModal(student)}
                          title="Tahrirlash"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className={`admin-student-action ${
                            student.isFrozen ? 'unfreeze' : 'freeze'
                          }`}
                          onClick={() => toggleFreeze(student)}
                          title={
                            student.isFrozen
                              ? 'Hisobni faollashtirish'
                              : 'Hisobni muzlatish'
                          }
                        >
                          {student.isFrozen ? (
                            <Unlock size={16} />
                          ) : (
                            <Lock size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="admin-student-action delete"
                          onClick={() => deleteStudent(student)}
                          title="O‘chirish"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="admin-students-empty">
                    <div>
                      <AlertCircle size={30} />
                      <strong>O‘quvchi topilmadi</strong>
                      <span>
                        Qidiruv yoki guruh filtrini o‘zgartirib ko‘ring.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE STUDENT CARDS */}
        <div className="admin-students-mobile-list">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <article
                className="admin-student-mobile-card"
                key={student.id}
              >
                <div className="admin-mobile-student-top">
                  <div className="admin-student-name">
                    <div className="admin-student-avatar">
                      {student.name?.charAt(0).toUpperCase() || 'O'}
                    </div>

                    <div className="admin-student-name-info">
                      <strong>{student.name}</strong>
                      <span>#{index + 1} · ID: {student.id}</span>
                    </div>
                  </div>

                  <span
                    className={`admin-student-status ${
                      student.isFrozen ? 'frozen' : 'active'
                    }`}
                  >
                    {student.isFrozen ? 'Muzlatilgan' : 'Faol'}
                  </span>
                </div>

                <div className="admin-mobile-student-details">
                  <div>
                    <span>Login</span>
                    <strong>{student.username}</strong>
                  </div>

                  <div>
                    <span>Guruh</span>
                    <strong>{student.group || 'Biriktirilmagan'}</strong>
                  </div>

                  <div>
                    <span>Ball</span>
                    <strong className="mobile-points">
                      <Star size={14} />
                      {Number(student.points || 0)}
                    </strong>
                  </div>

                  <div>
                    <span>Qoldirilgan dars</span>
                    <strong>
                      {Number(student.missedLessons || 0)} ta
                    </strong>
                  </div>
                </div>

                <div className="admin-mobile-student-actions">
                  <button
                    type="button"
                    className="edit"
                    onClick={() => openEditModal(student)}
                  >
                    <Pencil size={15} />
                    Tahrirlash
                  </button>

                  <button
                    type="button"
                    className="freeze"
                    onClick={() => toggleFreeze(student)}
                  >
                    {student.isFrozen ? (
                      <Unlock size={15} />
                    ) : (
                      <Lock size={15} />
                    )}

                    {student.isFrozen ? 'Faollashtirish' : 'Muzlatish'}
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => deleteStudent(student)}
                    aria-label="O‘quvchini o‘chirish"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-students-empty mobile-empty">
              <AlertCircle size={30} />
              <strong>O‘quvchi topilmadi</strong>
              <span>Qidiruvni o‘zgartirib ko‘ring.</span>
            </div>
          )}
        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="admin-student-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="admin-student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-student-modal-title"
          >

            <div className="admin-student-modal-header">
              <div>
                <span className="admin-students-eyebrow">
                  O‘QUVCHI MA’LUMOTLARI
                </span>

                <h3 id="admin-student-modal-title">
                  {editingStudent
                    ? 'O‘quvchini tahrirlash'
                    : 'Yangi o‘quvchi qo‘shish'}
                </h3>

                <p>
                  Kerakli ma’lumotlarni to‘ldiring.
                </p>
              </div>

              <button
                type="button"
                className="admin-student-modal-close"
                onClick={closeModal}
                aria-label="Yopish"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="admin-student-form"
              onSubmit={handleSubmit}
            >

              <label className="admin-student-form-field">
                <span>
                  <UserRound size={15} />
                  O‘quvchining to‘liq ismi
                </span>

                <input
                  type="text"
                  placeholder="Masalan: Jahongir Xikmatov"
                  value={form.name}
                  onChange={event =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                />
              </label>

              <label className="admin-student-form-field">
                <span>
                  <UserRound size={15} />
                  Login
                </span>

                <input
                  type="text"
                  placeholder="O‘quvchi logini"
                  value={form.username}
                  onChange={event =>
                    setForm({ ...form, username: event.target.value })
                  }
                  required
                />
              </label>

              <label className="admin-student-form-field">
                <span>
                  <KeyRound size={15} />
                  Parol
                </span>

                <div className="admin-student-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      editingStudent
                        ? 'O‘zgartirmasangiz, eski parol saqlanadi'
                        : 'Yangi parol kiriting'
                    }
                    value={form.password}
                    onChange={event =>
                      setForm({ ...form, password: event.target.value })
                    }
                    required={!editingStudent}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Parolni ko‘rsatish"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <label className="admin-student-form-field">
                <span>
                  <GraduationCap size={15} />
                  Guruh
                </span>

                <select
                  value={form.groupId || (
                    groups.find(group => group.name === form.group)?.id || ''
                  )}
                  onChange={event => handleGroupChange(event.target.value)}
                >
                  <option value="">Guruh tanlanmagan</option>

                  {groups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              {editingStudent && (
                <div className="admin-student-extra-fields">
                  <label className="admin-student-form-field">
                    <span>
                      <Star size={15} />
                      Jami ball
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={form.points}
                      onChange={event =>
                        setForm({ ...form, points: event.target.value })
                      }
                    />
                  </label>

                  <label className="admin-student-form-field">
                    <span>
                      <CalendarDaysIcon />
                      Qoldirilgan dars
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={form.missedLessons}
                      onChange={event =>
                        setForm({
                          ...form,
                          missedLessons: event.target.value
                        })
                      }
                    />
                  </label>
                </div>
              )}

              {formError && (
                <div className="admin-student-form-error">
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="admin-student-form-actions">
                <button
                  type="button"
                  className="admin-student-cancel-btn"
                  onClick={closeModal}
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="admin-student-save-btn"
                >
                  <CheckCircle2 size={17} />
                  {editingStudent ? 'Saqlash' : 'O‘quvchini qo‘shish'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  )
}

const CalendarDaysIcon = () => (
  <span className="admin-calendar-icon">D</span>
)

export default AdSt
