
import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Clock,
  GraduationCap,
  UserPlus,
  UserRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import users from '../../../Data/users.js'
import './Grupps.css'

const GROUPS_KEY = 'groups'
const STUDENTS_KEY = 'students'
const TEACHERS_KEY = 'teachers'
const COURSES_KEY = 'courses'

const defaultCourses = [
  'Ingliz tili',
  'Rus tili',
  'Xitoy tili',
  'Pochemuchka'
]

const initialGroup = {
  id: 1,
  name: 'Pre-Intermediate 18:30',
  subject: 'Ingliz tili',
  level: 'Pre-Intermediate',
  time: '18:30',
  teacher: 'Amirsaid Samigjanov'
}

const readStorage = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const getInitialGroups = () => {
  const saved = readStorage(GROUPS_KEY)
  return saved.length ? saved : [initialGroup]
}

const getInitialCourses = () => {
  const saved = readStorage(COURSES_KEY)

  return [...new Set([
    ...defaultCourses,
    ...saved.filter(course => typeof course === 'string')
  ])]
}

const getInitialTeachers = () => {
  const saved = readStorage(TEACHERS_KEY)

  const registered = users
    .filter(user => user.role === 'teacher')
    .map(user => ({
      ...user,
      name: user.name || user.username
    }))

  const map = new Map()

  registered.forEach(teacher => {
    map.set(String(teacher.id), teacher)
  })

  saved.forEach(teacher => {
    if (teacher?.id !== undefined) {
      map.set(String(teacher.id), {
        ...map.get(String(teacher.id)),
        ...teacher
      })
    }
  })

  return Array.from(map.values())
}

const emptyGroupForm = {
  name: '',
  subject: 'Ingliz tili',
  newCourse: '',
  level: 'Beginner',
  time: '',
  teacher: ''
}

const Grupps = () => {
  const [groups, setGroups] = useState(getInitialGroups)
  const [students, setStudents] = useState(() => readStorage(STUDENTS_KEY))
  const [teachers, setTeachers] = useState(getInitialTeachers)
  const [courses, setCourses] = useState(getInitialCourses)

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)

  const [editingGroup, setEditingGroup] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const [form, setForm] = useState(emptyGroupForm)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [studentSearch, setStudentSearch] = useState('')

  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
  }, [groups])

  useEffect(() => {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses))
  }, [courses])

  useEffect(() => {
    const updateData = () => {
      setStudents(readStorage(STUDENTS_KEY))
      setTeachers(getInitialTeachers())
      setGroups(readStorage(GROUPS_KEY))
      setCourses(getInitialCourses())
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

  const getGroupStudents = (group) => {
    return students.filter(student =>
      String(student.groupId || '') === String(group.id) ||
      (!student.groupId && student.group === group.name)
    )
  }

  const filteredGroups = useMemo(() => {
    const value = search.toLowerCase().trim()

    return groups.filter(group =>
      [
        group.name,
        group.subject,
        group.level,
        group.teacher,
        group.time
      ]
        .join(' ')
        .toLowerCase()
        .includes(value)
    )
  }, [groups, search])

  const openAddModal = () => {
    setEditingGroup(null)
    setForm(emptyGroupForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (group) => {
    setEditingGroup(group)

    setForm({
      name: group.name || '',
      subject: group.subject || 'Ingliz tili',
      newCourse: '',
      level: group.level || 'Beginner',
      time: group.time || '',
      teacher: group.teacher || ''
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingGroup(null)
    setForm(emptyGroupForm)
    setError('')
  }

  const handleGroupSubmit = (event) => {
    event.preventDefault()
    setError('')

    const name = form.name.trim()
    const newCourseName = form.newCourse.trim()
    const subject = newCourseName || form.subject

    if (!name || !form.time) {
      setError('Guruh nomi va dars vaqtini kiriting.')
      return
    }

    if (!subject) {
      setError('Kursni tanlang yoki yangi kurs nomini kiriting.')
      return
    }

    const duplicate = groups.some(group =>
      group.name.toLowerCase() === name.toLowerCase() &&
      String(group.id) !== String(editingGroup?.id || '')
    )

    if (duplicate) {
      setError('Bu nomdagi guruh mavjud.')
      return
    }

    // Yangi kurs kiritilgan bo‘lsa, kurslar ro‘yxatiga qo‘shamiz
    if (newCourseName) {
      const updatedCourses = [
        ...new Set([...courses, newCourseName])
      ]

      setCourses(updatedCourses)
      localStorage.setItem(COURSES_KEY, JSON.stringify(updatedCourses))
    }

    const updatedGroup = {
      id: editingGroup?.id || Date.now(),
      name,
      subject,
      level: form.level,
      time: form.time,
      teacher: form.teacher
    }

    let updatedGroups

    if (editingGroup) {
      updatedGroups = groups.map(group =>
        String(group.id) === String(editingGroup.id)
          ? updatedGroup
          : group
      )

      const updatedStudents = students.map(student => {
        const belongsToGroup =
          String(student.groupId || '') === String(editingGroup.id) ||
          (!student.groupId && student.group === editingGroup.name)

        return belongsToGroup
          ? {
              ...student,
              groupId: updatedGroup.id,
              group: updatedGroup.name
            }
          : student
      })

      setStudents(updatedStudents)
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))
    } else {
      updatedGroups = [...groups, updatedGroup]
    }

    setGroups(updatedGroups)
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups))

    notifyUpdate()
    closeModal()
  }

  const deleteGroup = (group) => {
    const confirmed = window.confirm(
      `"${group.name}" guruhini o‘chirmoqchimisiz? Guruhdagi o‘quvchilar guruhdan chiqariladi.`
    )

    if (!confirmed) return

    const updatedGroups = groups.filter(
      item => String(item.id) !== String(group.id)
    )

    const updatedStudents = students.map(student => {
      const belongsToGroup =
        String(student.groupId || '') === String(group.id) ||
        (!student.groupId && student.group === group.name)

      if (!belongsToGroup) return student

      return {
        ...student,
        groupId: '',
        group: ''
      }
    })

    setGroups(updatedGroups)
    setStudents(updatedStudents)

    localStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups))
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))

    notifyUpdate()
  }

  const openStudentsModal = (group) => {
    setSelectedGroup(group)

    const currentStudents = getGroupStudents(group)

    setSelectedStudentIds(
      currentStudents.map(student => String(student.id))
    )

    setStudentSearch('')
    setShowStudentModal(true)
  }

  const closeStudentsModal = () => {
    setShowStudentModal(false)
    setSelectedGroup(null)
    setSelectedStudentIds([])
    setStudentSearch('')
  }

  const toggleStudent = (studentId) => {
    const id = String(studentId)

    setSelectedStudentIds(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    )
  }

  const saveGroupStudents = () => {
    if (!selectedGroup) return

    const updatedStudents = students.map(student => {
      const currentlyInGroup =
        String(student.groupId || '') === String(selectedGroup.id) ||
        (!student.groupId && student.group === selectedGroup.name)

      const shouldBeInGroup = selectedStudentIds.includes(
        String(student.id)
      )

      if (shouldBeInGroup) {
        return {
          ...student,
          groupId: selectedGroup.id,
          group: selectedGroup.name
        }
      }

      if (currentlyInGroup) {
        return {
          ...student,
          groupId: '',
          group: ''
        }
      }

      return student
    })

    setStudents(updatedStudents)
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents))

    notifyUpdate()
    closeStudentsModal()
  }

  const availableStudents = students.filter(student => {
    const value = studentSearch.toLowerCase().trim()

    return `${student.name || ''} ${student.username || ''}`
      .toLowerCase()
      .includes(value)
  })

  const totalStudents = students.length

  const assignedStudents = students.filter(
    student => student.groupId || student.group
  ).length

  return (
    <section className="groups-page">

      <div className="groups-header">
        <div>
          <span className="groups-eyebrow">AKADEMIYA BOSHQARUVI</span>
          <h1>Guruhlar</h1>
          <p>Guruhlar, o‘qituvchilar va o‘quvchilarni boshqaring.</p>
        </div>

        <button
          type="button"
          className="groups-add-btn"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Yangi guruh
        </button>
      </div>

      <div className="groups-stats">

        <div className="groups-stat-card">
          <div className="groups-stat-icon">
            <BookOpen size={23} />
          </div>

          <div>
            <span>Jami guruhlar</span>
            <h2>{groups.length}</h2>
          </div>
        </div>

        <div className="groups-stat-card">
          <div className="groups-stat-icon groups-stat-icon-green">
            <Users size={23} />
          </div>

          <div>
            <span>Guruhlarga biriktirilgan o‘quvchilar</span>
            <h2>{assignedStudents} / {totalStudents}</h2>
          </div>
        </div>

      </div>

      <div className="groups-toolbar">
        <div className="groups-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Guruh, fan yoki o‘qituvchi bo‘yicha qidirish..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="groups-search-clear"
              onClick={() => setSearch('')}
              aria-label="Qidiruvni tozalash"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="groups-grid">

        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const groupStudents = getGroupStudents(group)

            return (
              <article className="group-card" key={group.id}>

                <div className="group-card-top">
                  <div className="group-card-icon">
                    <GraduationCap size={23} />
                  </div>

                  <div className="group-card-actions">
                    <button
                      type="button"
                      onClick={() => openEditModal(group)}
                      title="Guruhni tahrirlash"
                      aria-label="Guruhni tahrirlash"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="group-delete-btn"
                      onClick={() => deleteGroup(group)}
                      title="Guruhni o‘chirish"
                      aria-label="Guruhni o‘chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3>{group.name}</h3>

                <span className="group-level">
                  {group.level || 'Daraja belgilanmagan'}
                </span>

                <div className="group-card-info">
                  <p>
                    <BookOpen size={16} />
                    {group.subject || 'Kurs belgilanmagan'}
                  </p>

                  <p>
                    <Clock size={16} />
                    Dars vaqti: {group.time || 'Belgilanmagan'}
                  </p>

                  <p>
                    <UserRound size={16} />
                    {group.teacher || 'O‘qituvchi biriktirilmagan'}
                  </p>
                </div>

                <div className="group-card-footer">
                  <Users size={17} />
                  <span>{groupStudents.length} nafar o‘quvchi</span>
                </div>

                <button
                  type="button"
                  className="group-manage-students-btn"
                  onClick={() => openStudentsModal(group)}
                >
                  <UserPlus size={16} />
                  O‘quvchilarni boshqarish
                </button>

              </article>
            )
          })
        ) : (
          <div className="groups-empty">
            <AlertCircle size={35} />
            <h3>Guruh topilmadi</h3>
            <p>Qidiruv so‘zini o‘zgartiring yoki yangi guruh yarating.</p>
          </div>
        )}

      </div>

      {showModal && (
        <div
          className="groups-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="groups-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="groups-modal-title"
          >
            <div className="groups-modal-header">
              <div>
                <span className="groups-eyebrow">GURUH MA’LUMOTLARI</span>

                <h2 id="groups-modal-title">
                  {editingGroup ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}
                </h2>

                <p>Guruh haqida kerakli ma’lumotlarni kiriting.</p>
              </div>

              <button
                type="button"
                className="groups-modal-close"
                onClick={closeModal}
                aria-label="Yopish"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit}>

              <label htmlFor="group-name">Guruh nomi</label>
              <input
                id="group-name"
                type="text"
                placeholder="Masalan: Pre-Intermediate 18:30"
                value={form.name}
                onChange={event =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />

              <label htmlFor="group-subject">Kurs</label>
              <select
                id="group-subject"
                value={form.subject}
                onChange={event =>
                  setForm({
                    ...form,
                    subject: event.target.value,
                    newCourse: ''
                  })
                }
              >
                {courses.map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>

              <label htmlFor="group-new-course">
                Yangi kurs qo‘shish (ixtiyoriy)
              </label>
              <input
                id="group-new-course"
                type="text"
                placeholder="Masalan: Matematika"
                value={form.newCourse}
                onChange={event =>
                  setForm({ ...form, newCourse: event.target.value })
                }
              />

              <label htmlFor="group-level">Daraja</label>
              <select
                id="group-level"
                value={form.level}
                onChange={event =>
                  setForm({ ...form, level: event.target.value })
                }
              >
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Pre-Intermediate">Pre-Intermediate</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Upper-Intermediate">Upper-Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Bolalar guruhi">Bolalar guruhi</option>
              </select>

              <label htmlFor="group-time">Dars vaqti</label>
              <input
                id="group-time"
                type="time"
                value={form.time}
                onChange={event =>
                  setForm({ ...form, time: event.target.value })
                }
                required
              />

              <label htmlFor="group-teacher">O‘qituvchi</label>
              <select
                id="group-teacher"
                value={form.teacher}
                onChange={event =>
                  setForm({ ...form, teacher: event.target.value })
                }
              >
                <option value="">O‘qituvchini tanlang</option>

                {teachers.map(teacher => (
                  <option
                    key={teacher.id}
                    value={teacher.name || teacher.username}
                  >
                    {teacher.name || teacher.username}
                  </option>
                ))}
              </select>

              {error && (
                <div className="groups-form-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="groups-modal-buttons">
                <button
                  type="button"
                  className="groups-cancel-btn"
                  onClick={closeModal}
                >
                  Bekor qilish
                </button>

                <button type="submit" className="groups-save-btn">
                  <CheckCircle2 size={16} />
                  {editingGroup ? 'Saqlash' : 'Guruh yaratish'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {showStudentModal && selectedGroup && (
        <div
          className="groups-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeStudentsModal()
          }}
        >
          <div
            className="groups-modal groups-students-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="groups-students-title"
          >
            <div className="groups-modal-header">
              <div>
                <span className="groups-eyebrow">O‘QUVCHILARNI BIRIKTIRISH</span>

                <h2 id="groups-students-title">
                  {selectedGroup.name}
                </h2>

                <p>
                  Ushbu guruhga biriktiriladigan o‘quvchilarni belgilang.
                </p>
              </div>

              <button
                type="button"
                className="groups-modal-close"
                onClick={closeStudentsModal}
                aria-label="Yopish"
              >
                <X size={20} />
              </button>
            </div>

            <div className="groups-student-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="O‘quvchini qidirish..."
                value={studentSearch}
                onChange={event => setStudentSearch(event.target.value)}
              />
            </div>

            <div className="groups-student-list">

              {availableStudents.length > 0 ? (
                availableStudents.map(student => {
                  const checked = selectedStudentIds.includes(
                    String(student.id)
                  )

                  const otherGroup = student.group &&
                    student.group !== selectedGroup.name

                  return (
                    <label
                      className={`groups-student-option ${
                        checked ? 'selected' : ''
                      }`}
                      key={student.id}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(student.id)}
                      />

                      <span className="groups-student-avatar">
                        {(student.name || 'O').charAt(0).toUpperCase()}
                      </span>

                      <span className="groups-student-option-info">
                        <strong>{student.name || student.username}</strong>
                        <small>
                          {student.username || 'Login mavjud emas'}
                        </small>

                        {otherGroup && !checked && (
                          <small className="groups-student-other-group">
                            Hozirgi guruhi: {student.group}
                          </small>
                        )}
                      </span>

                      {checked && (
                        <CheckCircle2
                          className="groups-student-check"
                          size={19}
                        />
                      )}
                    </label>
                  )
                })
              ) : (
                <div className="groups-student-empty">
                  <Users size={28} />
                  <strong>O‘quvchilar topilmadi</strong>
                  <span>
                    Avval Admin → O‘quvchilar bo‘limidan o‘quvchi qo‘shing.
                  </span>
                </div>
              )}

            </div>

            <div className="groups-selected-count">
              Tanlangan o‘quvchilar:{' '}
              <strong>{selectedStudentIds.length}</strong>
            </div>

            <div className="groups-modal-buttons">
              <button
                type="button"
                className="groups-cancel-btn"
                onClick={closeStudentsModal}
              >
                Bekor qilish
              </button>

              <button
                type="button"
                className="groups-save-btn"
                onClick={saveGroupStudents}
              >
                <CheckCircle2 size={16} />
                O‘quvchilarni saqlash
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}

export default Grupps
