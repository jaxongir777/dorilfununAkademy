
import React, { useEffect, useState } from 'react'
import './Admin.css'
import Groups from './Grupps/Grupps.jsx'
import AdSt from './AdminStudents/AdSt.jsx'
import AdTeachers from './AdTeachers/AdTeachers.jsx'
import users from '../../Data/users.js'
import Logo from '../../Assets/Logo.jpg'

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  LogIn,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  RefreshCw
} from 'lucide-react'

const readData = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const getToday = () => {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getAllStudents = () => {
  const deletedStudents = readData('deletedStudents').map(String)

  const registeredStudents = users
    .filter(user =>
      user.role === 'student' &&
      !deletedStudents.includes(String(user.id))
    )
    .map(user => ({
      ...user,
      points: Number(user.points || 0),
      missedLessons: Number(user.missedLessons || 0)
    }))

  const savedStudents = readData('students')
    .filter(student => !deletedStudents.includes(String(student.id)))

  const studentsMap = new Map()

  registeredStudents.forEach(student => {
    studentsMap.set(String(student.id), student)
  })

  savedStudents.forEach(student => {
    if (student && student.id !== undefined) {
      const id = String(student.id)

      studentsMap.set(id, {
        ...studentsMap.get(id),
        ...student
      })
    }
  })

  return Array.from(studentsMap.values())
}

const getStudentPoints = (student, lessonScores) => {
  const records = lessonScores.filter(score =>
    (score.studentId !== undefined &&
      String(score.studentId) === String(student.id)) ||
    (score.username &&
      score.username === student.username) ||
    (score.studentName &&
      score.studentName === student.name)
  )

  if (records.length > 0) {
    return records.reduce(
      (total, score) => total + Number(score.points || 0),
      0
    )
  }

  return Number(student.points || 0)
}

const Admin = () => {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState('Dorilfunun')

  const [dashboardData, setDashboardData] = useState({
    students: [],
    teachers: [],
    groups: [],
    attendance: [],
    lessons: [],
    lessonScores: []
  })

  const [attendanceSearch, setAttendanceSearch] = useState('')

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'O‘quvchilar', icon: Users },
    { name: 'O‘qituvchilar', icon: GraduationCap },
    { name: 'Guruhlar', icon: BookOpen },
    { name: 'Davomat', icon: CalendarCheck },
    { name: 'Dars jadvali', icon: CalendarDays },
    { name: 'To‘lovlar', icon: CreditCard },
    { name: 'Sozlamalar', icon: Settings },
    { name: 'Login sahifasiga qaytish', icon: LogIn }
  ]

  const loadDashboard = () => {
    const students = getAllStudents()

    const savedTeachers = readData('teachers')

    const registeredTeachers = users
      .filter(user => user.role === 'teacher')
      .map(user => ({ ...user }))

    const teachersMap = new Map()

    registeredTeachers.forEach(teacher => {
      teachersMap.set(String(teacher.id), teacher)
    })

    savedTeachers.forEach(teacher => {
      if (teacher && teacher.id !== undefined) {
        teachersMap.set(String(teacher.id), {
          ...teachersMap.get(String(teacher.id)),
          ...teacher
        })
      }
    })

    setDashboardData({
      students,
      teachers: Array.from(teachersMap.values()),
      groups: readData('groups'),
      attendance: readData('attendance'),
      lessons: readData('lessons'),
      lessonScores: readData('lessonScores')
    })
  }

  useEffect(() => {
    loadDashboard()

    try {
      const currentUser = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      )

      if (currentUser?.name) {
        setAdminName(currentUser.name)
      }
    } catch {
      setAdminName('Dorilfunun')
    }

    const handleUpdate = () => {
      loadDashboard()
    }

    window.addEventListener('storage', handleUpdate)
    window.addEventListener('academyDataUpdated', handleUpdate)

    return () => {
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('academyDataUpdated', handleUpdate)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    window.location.href = '/'
  }

  const {
    students,
    teachers,
    groups,
    attendance,
    lessons,
    lessonScores
  } = dashboardData

  const today = getToday()

  const todayAttendance = attendance.filter(item => {
    const date = item.date || item.createdAt
    return date && String(date).slice(0, 10) === today
  })

  const getAttendanceStatus = (student) => {
    const record = todayAttendance.find(item =>
      String(item.studentId) === String(student.id) ||
      (item.username && item.username === student.username)
    )

    return record?.status || 'unmarked'
  }

  const presentStudents = students.filter(
    student => getAttendanceStatus(student) === 'present'
  )

  const absentStudents = students.filter(
    student => getAttendanceStatus(student) === 'absent'
  )

  const unmarkedStudents = students.filter(
    student => getAttendanceStatus(student) === 'unmarked'
  )

  const todayLessons = lessons.filter(lesson => {
    const lessonDate = lesson.date || lesson.day

    if (!lessonDate) return false

    return String(lessonDate).slice(0, 10) === today
  })

  const topStudents = [...students]
    .map(student => ({
      ...student,
      totalPoints: getStudentPoints(student, lessonScores)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10)

  const saveAttendance = (student, status) => {
    const currentAttendance = readData('attendance')

    const existingIndex = currentAttendance.findIndex(item =>
      String(item.studentId) === String(student.id) &&
      String(item.date || '').slice(0, 10) === today
    )

    const newRecord = {
      id: existingIndex >= 0
        ? currentAttendance[existingIndex].id
        : Date.now(),
      studentId: student.id,
      username: student.username || '',
      studentName: student.name,
      group: student.group || '',
      date: today,
      status,
      markedBy: 'admin',
      updatedAt: new Date().toISOString()
    }

    let updatedAttendance

    if (existingIndex >= 0) {
      updatedAttendance = [...currentAttendance]
      updatedAttendance[existingIndex] = {
        ...updatedAttendance[existingIndex],
        ...newRecord
      }
    } else {
      updatedAttendance = [...currentAttendance, newRecord]
    }

    localStorage.setItem(
      'attendance',
      JSON.stringify(updatedAttendance)
    )

    const updatedStudents = students.map(item => {
      if (String(item.id) !== String(student.id)) {
        return item
      }

      const previousStatus = getAttendanceStatus(student)

      let missedLessons = Number(item.missedLessons || 0)

      if (previousStatus === 'absent' && status === 'present') {
        missedLessons = Math.max(0, missedLessons - 1)
      }

      if (previousStatus === 'present' && status === 'absent') {
        missedLessons += 1
      }

      if (previousStatus === 'unmarked' && status === 'absent') {
        missedLessons += 1
      }

      return {
        ...item,
        missedLessons
      }
    })

    const savedStudents = readData('students')
    const updatedStudentMap = new Map(
      savedStudents.map(item => [String(item.id), item])
    )

    updatedStudents.forEach(item => {
      updatedStudentMap.set(String(item.id), {
        ...updatedStudentMap.get(String(item.id)),
        ...item
      })
    })

    localStorage.setItem(
      'students',
      JSON.stringify(Array.from(updatedStudentMap.values()))
    )

    window.dispatchEvent(new Event('academyDataUpdated'))
    loadDashboard()
  }

  const filteredAttendanceStudents = students.filter(student =>
    `${student.name} ${student.username} ${student.group || ''}`
      .toLowerCase()
      .includes(attendanceSearch.toLowerCase())
  )

  const renderDashboard = () => {
    const statItems = [
      {
        title: 'Jami o‘quvchilar',
        value: students.length,
        icon: Users,
        color: 'blue'
      },
      {
        title: 'Jami ustozlar',
        value: teachers.length,
        icon: GraduationCap,
        color: 'purple'
      },
      {
        title: 'Jami guruhlar',
        value: groups.length,
        icon: BookOpen,
        color: 'orange'
      },
      {
        title: 'Bugungi darslar',
        value: todayLessons.length,
        icon: CalendarDays,
        color: 'green'
      }
    ]

    return (
      <section className="admin-content">
        <div className="admin-welcome">
          <div>
            <h2>Xush kelibsiz, {adminName}!</h2>
            <p>
              Dorilfunun Academy faoliyatini shu yerdan boshqaring.
            </p>
          </div>

          <span>ADMIN PANEL</span>
        </div>

        <div className="admin-stats">
          {statItems.map(stat => {
            const Icon = stat.icon

            return (
              <div className="admin-stat-card" key={stat.title}>
                <div className={`admin-stat-icon ${stat.color}`}>
                  <Icon size={23} />
                </div>

                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            )
          })}
        </div>

        <div className="admin-dashboard-heading">
          <div>
            <h2>Bugungi davomat</h2>
            <p>O‘quvchilarning bugungi qatnashish holati</p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={loadDashboard}
          >
            <RefreshCw size={17} />
            Yangilash
          </button>
        </div>

        <div className="admin-attendance-stats">
          <div className="admin-attendance-card present">
            <CheckCircle2 size={25} />
            <div>
              <span>Kelganlar</span>
              <h3>{presentStudents.length}</h3>
            </div>
          </div>

          <div className="admin-attendance-card absent">
            <XCircle size={25} />
            <div>
              <span>Kelmaganlar</span>
              <h3>{absentStudents.length}</h3>
            </div>
          </div>

          <div className="admin-attendance-card unmarked">
            <Clock size={25} />
            <div>
              <span>Belgilanmagan</span>
              <h3>{unmarkedStudents.length}</h3>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <div className="admin-info-card admin-today-lessons">
            <div className="admin-card-heading">
              <div>
                <h3>
                  <CalendarDays size={19} />
                  Bugungi darslar
                </h3>
                <p>Bugun rejalashtirilgan darslar</p>
              </div>
            </div>

            {todayLessons.length > 0 ? (
              <div className="admin-lesson-list">
                {todayLessons.map((lesson, index) => (
                  <div
                    className="admin-lesson-item"
                    key={lesson.id || index}
                  >
                    <div className="admin-lesson-icon">
                      <BookOpen size={19} />
                    </div>

                    <div>
                      <strong>
                        {lesson.group || lesson.groupName || 'Guruh'}
                      </strong>

                      <p>
                        {lesson.teacher || 'Ustoz belgilanmagan'}
                      </p>
                    </div>

                    <span>
                      {lesson.time || lesson.startTime || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-no-data">
                Bugun uchun dars jadvali topilmadi.
              </div>
            )}
          </div>

          <div className="admin-info-card admin-academy-info">
            <h3>Akademiya holati</h3>

            <p>
              Dorilfunun Academy boshqaruv tizimi faol ishlamoqda.
              Barcha o‘quvchilar, ustozlar va guruhlar ma’lumotlarini
              kuzatishingiz mumkin.
            </p>

            <strong className="admin-status">
              <span />
              Tizim faol
            </strong>
          </div>
        </div>

        <div className="admin-info-card admin-top-students">
          <div className="admin-card-heading">
            <div>
              <h3>
                <Trophy size={21} />
                TOP 10 o‘quvchi
              </h3>

              <p>Akademiya bo‘yicha eng yuqori ball to‘plaganlar</p>
            </div>
          </div>

          {topStudents.length > 0 ? (
            <div className="admin-top-list">
              {topStudents.map((student, index) => (
                <div
                  className="admin-top-student"
                  key={student.id}
                >
                  <div className="admin-top-position">
                    {index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : `${index + 1}`}
                  </div>

                  <div className="admin-top-avatar">
                    {student.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="admin-top-info">
                    <strong>{student.name}</strong>
                    <span>{student.group || 'Guruh belgilanmagan'}</span>
                  </div>

                  <div className="admin-top-points">
                    <Trophy size={16} />
                    {student.totalPoints} ball
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-no-data">
              Hozircha o‘quvchilar mavjud emas.
            </div>
          )}
        </div>
      </section>
    )
  }

  const renderAttendance = () => (
    <section className="admin-content">
      <div className="admin-welcome">
        <div>
          <h2>Davomat boshqaruvi</h2>
          <p>Bugungi o‘quvchilar davomatini belgilang.</p>
        </div>

        <span>DAVOMAT</span>
      </div>

      <div className="admin-attendance-stats">
        <div className="admin-attendance-card present">
          <CheckCircle2 size={25} />
          <div>
            <span>Kelganlar</span>
            <h3>{presentStudents.length}</h3>
          </div>
        </div>

        <div className="admin-attendance-card absent">
          <XCircle size={25} />
          <div>
            <span>Kelmaganlar</span>
            <h3>{absentStudents.length}</h3>
          </div>
        </div>

        <div className="admin-attendance-card unmarked">
          <Clock size={25} />
          <div>
            <span>Belgilanmagan</span>
            <h3>{unmarkedStudents.length}</h3>
          </div>
        </div>
      </div>

      <div className="admin-info-card">
        <div className="admin-attendance-toolbar">
          <div>
            <h3>O‘quvchilar davomat ro‘yxati</h3>
            <p>{today}</p>
          </div>

          <input
            type="text"
            placeholder="O‘quvchini qidirish..."
            value={attendanceSearch}
            onChange={e => setAttendanceSearch(e.target.value)}
          />
        </div>

        <div className="admin-attendance-table-wrapper">
          <table className="admin-attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O‘quvchi</th>
                <th>Guruh</th>
                <th>Holati</th>
                <th>Davomat belgilash</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendanceStudents.map((student, index) => {
                const status = getAttendanceStatus(student)

                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{student.name}</strong>
                    </td>

                    <td>
                      {student.group || 'Guruh biriktirilmagan'}
                    </td>

                    <td>
                      <span className={`admin-attendance-status ${status}`}>
                        {status === 'present'
                          ? 'Keldi'
                          : status === 'absent'
                            ? 'Kelmadi'
                            : 'Belgilanmagan'}
                      </span>
                    </td>

                    <td>
                      <div className="admin-attendance-actions">
                        <button
                          className="admin-mark-present"
                          onClick={() => saveAttendance(student, 'present')}
                        >
                          <CheckCircle2 size={15} />
                          Keldi
                        </button>

                        <button
                          className="admin-mark-absent"
                          onClick={() => saveAttendance(student, 'absent')}
                        >
                          <XCircle size={15} />
                          Kelmadi
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredAttendanceStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-no-data">
                    O‘quvchilar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )

  const renderContent = () => {
    if (activePage === 'Dashboard') {
      return renderDashboard()
    }

    if (activePage === 'O‘quvchilar') {
      return <AdSt />
    }

    if (activePage === 'O‘qituvchilar') {
      return <AdTeachers />
    }

    if (activePage === 'Guruhlar') {
      return <Groups />
    }

    if (activePage === 'Davomat') {
      return renderAttendance()
    }

    return (
      <section className="admin-content">
        <div className="admin-info-card">
          <h2>{activePage}</h2>
          <p>
            Ushbu bo‘lim keyingi bosqichda to‘liq funksiyalar
            bilan ishlab chiqiladi.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <img src={Logo} alt="Dorilfunun Academy Logo" />
          </div>

          <div>
            <h2>Dorilfunun</h2>
            <span>Academy</span>
          </div>

          <button
            className="admin-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="admin-menu-title">
          ASOSIY MENYU
        </div>

        <nav className="admin-navigation">
          {menuItems.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.name}
                className={`admin-menu-item ${
                  activePage === item.name ? 'active' : ''
                }`}
                onClick={() => {
                  if (item.name === 'Login sahifasiga qaytish') {
                    handleLogout()
                    return
                  }

                  setActivePage(item.name)
                  setSidebarOpen(false)
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        <button
          className="admin-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Tizimdan chiqish</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <button
            className="admin-mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div>
            <h1>{activePage}</h1>
            <p>Dorilfunun Academy boshqaruv tizimi</p>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  )
}

export default Admin
