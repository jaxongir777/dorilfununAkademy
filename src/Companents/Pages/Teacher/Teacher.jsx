
import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Star,
  Clock,
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Search,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './Teacher.css'

const readStorage = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

const todayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const normalize = (value) =>
  String(value || '').trim().toLowerCase()

const getRecordDate = (record) => {
  const value = record.date || record.lessonDate || record.createdAt

  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getScore = (record) => {
  const value = Number(record.score ?? record.points ?? record.ball ?? 0)
  return Number.isFinite(value) ? value : 0
}

const Teacher = () => {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(readUser)
  const [groups, setGroups] = useState(() => readStorage('groups'))
  const [students, setStudents] = useState(() => readStorage('students'))
  const [teachers, setTeachers] = useState(() => readStorage('teachers'))
  const [lessonScores, setLessonScores] = useState(() => readStorage('lessonScores'))
  const [attendance, setAttendance] = useState(() => readStorage('attendance'))
  const [schedule, setSchedule] = useState(() => readStorage('schedule'))

  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [attendanceValues, setAttendanceValues] = useState({})
  const [scoreValues, setScoreValues] = useState({})

  const [message, setMessage] = useState('')

  const teacherName = currentUser?.name || currentUser?.username || 'O‘qituvchi'

  const notifyUpdate = () => {
    window.dispatchEvent(new Event('academyDataUpdated'))
  }

  const refreshData = () => {
    setCurrentUser(readUser())
    setGroups(readStorage('groups'))
    setStudents(readStorage('students'))
    setTeachers(readStorage('teachers'))
    setLessonScores(readStorage('lessonScores'))
    setAttendance(readStorage('attendance'))
    setSchedule(readStorage('schedule'))
  }

  useEffect(() => {
    const update = () => refreshData()

    window.addEventListener('storage', update)
    window.addEventListener('academyDataUpdated', update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('academyDataUpdated', update)
    }
  }, [])

  // O‘qituvchining o‘zini aniqlash
  const teacherRecord = useMemo(() => {
    if (!currentUser) return null

    return teachers.find(item =>
      String(item.id) === String(currentUser.id) ||
      normalize(item.username) === normalize(currentUser.username) ||
      normalize(item.name) === normalize(currentUser.name)
    ) || currentUser
  }, [teachers, currentUser])

  // Faqat shu o‘qituvchiga biriktirilgan guruhlar
  const myGroups = useMemo(() => {
    if (!teacherRecord) return []

    const identifiers = [
      teacherRecord.id,
      currentUser?.id
    ]
      .filter(value => value !== undefined && value !== null)
      .map(String)

    const names = [
      teacherRecord.name,
      currentUser?.name,
      teacherRecord.username,
      currentUser?.username
    ]
      .filter(Boolean)
      .map(normalize)

    return groups.filter(group => {
      const assignedTeacher = group.teacher

      if (assignedTeacher && typeof assignedTeacher === 'object') {
        const assignedId = assignedTeacher.id
        const assignedName = normalize(
          assignedTeacher.name || assignedTeacher.username
        )

        if (identifiers.includes(String(assignedId))) return true
        if (names.includes(assignedName)) return true
      }

      const teacherId = group.teacherId || group.teacher_id

      if (
        teacherId !== undefined &&
        identifiers.includes(String(teacherId))
      ) {
        return true
      }

      const assignedName = normalize(assignedTeacher)

      if (
        assignedName &&
        names.some(name =>
          assignedName === name ||
          assignedName.includes(name) ||
          name.includes(assignedName)
        )
      ) {
        return true
      }

      return false
    })
  }, [groups, teacherRecord, currentUser])

  // Tanlangan guruh
  const selectedGroup = useMemo(() => {
    return (
      myGroups.find(group => String(group.id) === String(selectedGroupId)) ||
      myGroups[0] ||
      null
    )
  }, [myGroups, selectedGroupId])

  useEffect(() => {
    if (myGroups.length > 0) {
      const exists = myGroups.some(
        group => String(group.id) === String(selectedGroupId)
      )

      if (!exists) {
        setSelectedGroupId(String(myGroups[0].id))
      }
    } else {
      setSelectedGroupId('')
    }
  }, [myGroups, selectedGroupId])

  // Tanlangan guruh o‘quvchilari
  const groupStudents = useMemo(() => {
    if (!selectedGroup) return []

    return students.filter(student => {
      const sameGroupId =
        student.groupId !== undefined &&
        String(student.groupId) === String(selectedGroup.id)

      const sameGroupName =
        normalize(student.group) === normalize(selectedGroup.name)

      return sameGroupId || sameGroupName
    })
  }, [students, selectedGroup])

  const allMyStudents = useMemo(() => {
    const ids = new Set()

    return myGroups.flatMap(group =>
      students.filter(student => {
        const sameGroupId =
          student.groupId !== undefined &&
          String(student.groupId) === String(group.id)

        const sameGroupName =
          normalize(student.group) === normalize(group.name)

        const isInGroup = sameGroupId || sameGroupName
        const uniqueId = String(student.id || student.username)

        if (!isInGroup || ids.has(uniqueId)) return false

        ids.add(uniqueId)
        return true
      })
    )
  }, [myGroups, students])

  const todayLessons = useMemo(() => {
    return schedule.filter(item => {
      const groupId = item.groupId || item.group_id
      const groupName = normalize(item.group)

      return myGroups.some(group =>
        String(group.id) === String(groupId) ||
        normalize(group.name) === groupName
      )
    })
  }, [schedule, myGroups])

  const todayAttendance = attendance.filter(record =>
    getRecordDate(record) === todayDate() &&
    myGroups.some(group =>
      String(record.groupId) === String(group.id) ||
      normalize(record.group) === normalize(group.name)
    )
  )

  const presentCount = todayAttendance.filter(
    item => item.status === 'present'
  ).length

  const absentCount = todayAttendance.filter(
    item => item.status === 'absent'
  ).length

  const filteredStudents = groupStudents.filter(student =>
    `${student.name} ${student.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Sana va guruh o‘zgarganda saqlangan davomat va ballarni chiqarish
  useEffect(() => {
    if (!selectedGroup) {
      setAttendanceValues({})
      setScoreValues({})
      return
    }

    const savedAttendance = {}
    const savedScores = {}

    groupStudents.forEach(student => {
      const attendanceRecord = attendance.find(record =>
        String(record.studentId) === String(student.id) &&
        String(record.groupId) === String(selectedGroup.id) &&
        getRecordDate(record) === selectedDate
      )

      if (attendanceRecord) {
        savedAttendance[student.id] = attendanceRecord.status
      }

      const scoreRecord = lessonScores.find(record =>
        String(record.studentId) === String(student.id) &&
        String(record.groupId) === String(selectedGroup.id) &&
        getRecordDate(record) === selectedDate
      )

      if (scoreRecord) {
        savedScores[student.id] = String(getScore(scoreRecord))
      }
    })

    setAttendanceValues(savedAttendance)
    setScoreValues(savedScores)
  }, [selectedGroup, selectedDate, groupStudents, attendance, lessonScores])

  const setStudentAttendance = (studentId, status) => {
    setAttendanceValues(previous => ({
      ...previous,
      [studentId]: status
    }))
  }

  const setStudentScore = (studentId, value) => {
    if (value === '') {
      setScoreValues(previous => ({
        ...previous,
        [studentId]: ''
      }))
      return
    }

    const number = Number(value)

    if (!Number.isFinite(number) || number < 0 || number > 10) return

    setScoreValues(previous => ({
      ...previous,
      [studentId]: value
    }))
  }

  // Davomatni saqlash
  const saveAttendance = () => {
    if (!selectedGroup) return

    const updatedAttendance = [...attendance]

    groupStudents.forEach(student => {
      const status = attendanceValues[student.id]

      if (!status) return

      const existingIndex = updatedAttendance.findIndex(record =>
        String(record.studentId) === String(student.id) &&
        String(record.groupId) === String(selectedGroup.id) &&
        getRecordDate(record) === selectedDate
      )

      const record = {
        id: existingIndex >= 0
          ? updatedAttendance[existingIndex].id
          : `${selectedGroup.id}-${student.id}-${selectedDate}`,
        studentId: student.id,
        username: student.username,
        studentName: student.name,
        groupId: selectedGroup.id,
        group: selectedGroup.name,
        teacherId: currentUser?.id,
        teacherName,
        date: selectedDate,
        status,
        updatedAt: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        updatedAttendance[existingIndex] = record
      } else {
        updatedAttendance.push(record)
      }
    })

    localStorage.setItem('attendance', JSON.stringify(updatedAttendance))
    setAttendance(updatedAttendance)

    // O‘quvchining qoldirilgan darslari sonini yangilash
    const updatedStudents = students.map(student => {
      const absentLessons = updatedAttendance.filter(record =>
        String(record.studentId) === String(student.id) &&
        record.status === 'absent'
      ).length

      return {
        ...student,
        missedLessons: absentLessons
      }
    })

    localStorage.setItem('students', JSON.stringify(updatedStudents))
    setStudents(updatedStudents)

    notifyUpdate()
    setMessage('Davomat muvaffaqiyatli saqlandi!')
  }

  // Ballarni saqlash
  const saveScores = () => {
    if (!selectedGroup) return

    const updatedScores = [...lessonScores]

    groupStudents.forEach(student => {
      const value = scoreValues[student.id]

      if (value === undefined || value === '') return

      const score = Number(value)

      if (!Number.isFinite(score) || score < 0 || score > 10) return

      const existingIndex = updatedScores.findIndex(record =>
        String(record.studentId) === String(student.id) &&
        String(record.groupId) === String(selectedGroup.id) &&
        getRecordDate(record) === selectedDate
      )

      const record = {
        id: existingIndex >= 0
          ? updatedScores[existingIndex].id
          : `${selectedGroup.id}-${student.id}-${selectedDate}`,
        studentId: student.id,
        username: student.username,
        studentName: student.name,
        groupId: selectedGroup.id,
        group: selectedGroup.name,
        teacherId: currentUser?.id,
        teacherName,
        subject: selectedGroup.subject || 'Dars',
        date: selectedDate,
        score,
        createdAt: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        updatedScores[existingIndex] = record
      } else {
        updatedScores.push(record)
      }
    })

    localStorage.setItem('lessonScores', JSON.stringify(updatedScores))
    setLessonScores(updatedScores)

    notifyUpdate()
    setMessage('O‘quvchilar ballari saqlandi!')
  }

  const logout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  // Bo‘limlar o‘rtasida o‘tish
  const changeTab = (tab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
    setSearch('')
    setMessage('')
  }

  // Menyuga qaytish
  const backToMenu = () => {
    changeTab('dashboard')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'groups', label: 'Guruhlarim', icon: GraduationCap },
    { id: 'students', label: 'O‘quvchilar', icon: Users },
    { id: 'attendance', label: 'Davomat', icon: ClipboardCheck },
    { id: 'scores', label: 'Ball qo‘yish', icon: Star },
    { id: 'schedule', label: 'Dars jadvali', icon: CalendarDays }
  ]

  const pageTitles = {
    dashboard: 'Dashboard',
    groups: 'Mening guruhlarim',
    students: 'O‘quvchilar',
    attendance: 'Davomat',
    scores: 'O‘quvchilarga ball qo‘yish',
    schedule: 'Dars jadvali'
  }

  if (!currentUser || currentUser.role !== 'teacher') {
    return (
      <div className="teacher-access-error">
        <GraduationCap size={48} />
        <h2>O‘qituvchi kabinetiga kirish mumkin emas</h2>
        <p>Iltimos, o‘qituvchi hisobidan tizimga kiring.</p>
        <button onClick={() => navigate('/')}>
          Login sahifasiga qaytish
        </button>
      </div>
    )
  }

  return (
    <div className="teacher-layout">

      {sidebarOpen && (
        <div
          className="teacher-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="teacher-brand">
          <div className="teacher-brand-icon">
            <GraduationCap size={27} />
          </div>

          <div>
            <h2>Dorilfunun</h2>
            <span>ACADEMY</span>
          </div>

          <button
            className="teacher-close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="teacher-profile">
          <div className="teacher-profile-avatar">
            {teacherName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{teacherName}</strong>
            <span>O‘qituvchi</span>
          </div>
        </div>

        <p className="teacher-menu-title">ASOSIY MENYU</p>

        <nav className="teacher-nav">
          {menuItems.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                className={`teacher-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => changeTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="teacher-nav-arrow" />
              </button>
            )
          })}
        </nav>

        <div className="teacher-sidebar-bottom">
          <button className="teacher-logout" onClick={logout}>
            <LogOut size={19} />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="teacher-main">

        <header className="teacher-topbar">
          <div className="teacher-topbar-left">
            <button
              className="teacher-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <h1>{pageTitles[activeTab]}</h1>
              <p>Dorilfunun Academy o‘qituvchi paneli</p>
            </div>
          </div>

          {/* MENYUGA QAYTISH VA PROFIL */}
          <div className="teacher-topbar-right">
            <button
              className="teacher-back-menu-btn"
              onClick={backToMenu}
              title="Dashboard sahifasiga qaytish"
            >
              <LayoutDashboard size={18} />
              <span>Menyuga qaytish</span>
            </button>

            <div className="teacher-topbar-user">
              <div className="teacher-topbar-avatar">
                {teacherName.charAt(0).toUpperCase()}
              </div>
              <span>{teacherName}</span>
            </div>
          </div>
        </header>

        <div className="teacher-content">

          {message && (
            <div className="teacher-success-message">
              <CheckCircle size={18} />
              {message}
              <button onClick={() => setMessage('')}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <section className="teacher-welcome">
                <div>
                  <span>O‘QITUVCHI KABINETI</span>
                  <h2>Xush kelibsiz, {teacherName}!</h2>
                  <p>
                    Bugungi darslaringiz va o‘quvchilaringiz natijalarini boshqaring.
                  </p>
                </div>

                <div className="teacher-welcome-icon">
                  <GraduationCap size={42} />
                </div>
              </section>

              <div className="teacher-stats-grid">
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon purple">
                    <GraduationCap size={23} />
                  </div>
                  <div>
                    <span>Mening guruhlarim</span>
                    <strong>{myGroups.length}</strong>
                    <small>Biriktirilgan guruhlar</small>
                  </div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon blue">
                    <Users size={23} />
                  </div>
                  <div>
                    <span>O‘quvchilar</span>
                    <strong>{allMyStudents.length}</strong>
                    <small>Barcha guruhlarda</small>
                  </div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon green">
                    <CheckCircle size={23} />
                  </div>
                  <div>
                    <span>Bugun kelganlar</span>
                    <strong>{presentCount}</strong>
                    <small>Qayd etilgan davomat</small>
                  </div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon red">
                    <XCircle size={23} />
                  </div>
                  <div>
                    <span>Bugun kelmaganlar</span>
                    <strong>{absentCount}</strong>
                    <small>Qayd etilgan davomat</small>
                  </div>
                </div>
              </div>

              <div className="teacher-dashboard-grid">
                <section className="teacher-panel">
                  <div className="teacher-panel-heading">
                    <div>
                      <h3>
                        <GraduationCap size={19} /> Mening guruhlarim
                      </h3>
                      <p>Sizga biriktirilgan guruhlar</p>
                    </div>

                    <button onClick={() => changeTab('groups')}>
                      Barchasi <ChevronRight size={16} />
                    </button>
                  </div>

                  {myGroups.length > 0 ? (
                    <div className="teacher-group-list">
                      {myGroups.slice(0, 5).map(group => {
                        const count = students.filter(student =>
                          String(student.groupId) === String(group.id) ||
                          normalize(student.group) === normalize(group.name)
                        ).length

                        return (
                          <div className="teacher-group-item" key={group.id}>
                            <div className="teacher-group-icon">
                              <BookOpen size={21} />
                            </div>

                            <div className="teacher-group-info">
                              <strong>{group.name}</strong>
                              <small>
                                {group.subject || 'Fan ko‘rsatilmagan'} · {count} nafar o‘quvchi
                              </small>
                            </div>

                            <span>{group.time || '—'}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="teacher-empty">
                      Sizga hali guruh biriktirilmagan.
                    </div>
                  )}
                </section>

                <section className="teacher-panel">
                  <div className="teacher-panel-heading">
                    <div>
                      <h3>
                        <CalendarDays size={19} /> Bugungi darslar
                      </h3>
                      <p>Dars jadvalingiz</p>
                    </div>
                  </div>

                  {todayLessons.length > 0 ? (
                    <div className="teacher-group-list">
                      {todayLessons.slice(0, 5).map((lesson, index) => (
                        <div
                          className="teacher-group-item"
                          key={lesson.id || index}
                        >
                          <div className="teacher-group-icon blue">
                            <Clock size={20} />
                          </div>

                          <div className="teacher-group-info">
                            <strong>
                              {lesson.group || lesson.groupName || 'Guruh'}
                            </strong>
                            <small>{lesson.subject || 'Dars'}</small>
                          </div>

                          <span>
                            {lesson.time || lesson.startTime || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="teacher-empty">
                      Dars jadvaliga hozircha ma’lumot kiritilmagan.
                    </div>
                  )}
                </section>
              </div>

              <section className="teacher-panel teacher-quick-panel">
                <div className="teacher-panel-heading">
                  <div>
                    <h3>
                      <TrendingUp size={19} /> Tezkor amallar
                    </h3>
                    <p>Kerakli bo‘limga tez o‘ting</p>
                  </div>
                </div>

                <div className="teacher-quick-actions">
                  <button onClick={() => changeTab('attendance')}>
                    <ClipboardCheck size={21} />
                    <span>Davomat belgilash</span>
                    <ChevronRight size={17} />
                  </button>

                  <button onClick={() => changeTab('scores')}>
                    <Star size={21} />
                    <span>Ball qo‘yish</span>
                    <ChevronRight size={17} />
                  </button>

                  <button onClick={() => changeTab('students')}>
                    <Users size={21} />
                    <span>O‘quvchilarni ko‘rish</span>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* GURUHLAR */}
          {activeTab === 'groups' && (
            <section className="teacher-panel">
              <div className="teacher-panel-heading">
                <div>
                  <h3>
                    <GraduationCap size={20} /> Mening guruhlarim
                  </h3>
                  <p>Faqat sizga biriktirilgan guruhlar</p>
                </div>
                <span className="teacher-total-badge">
                  {myGroups.length} ta guruh
                </span>
              </div>

              {myGroups.length > 0 ? (
                <div className="teacher-groups-grid">
                  {myGroups.map(group => {
                    const count = students.filter(student =>
                      String(student.groupId) === String(group.id) ||
                      normalize(student.group) === normalize(group.name)
                    ).length

                    return (
                      <article className="teacher-group-card" key={group.id}>
                        <div className="teacher-group-card-top">
                          <div className="teacher-group-icon">
                            <BookOpen size={23} />
                          </div>
                          <span>{group.level || 'Guruh'}</span>
                        </div>

                        <h3>{group.name}</h3>
                        <p>{group.subject || 'Fan ko‘rsatilmagan'}</p>

                        <div className="teacher-group-card-details">
                          <span>
                            <Users size={16} /> {count} nafar o‘quvchi
                          </span>
                          <span>
                            <Clock size={16} /> {group.time || 'Vaqt belgilanmagan'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedGroupId(String(group.id))
                            changeTab('students')
                          }}
                        >
                          O‘quvchilarni ko‘rish
                          <ChevronRight size={17} />
                        </button>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="teacher-empty">
                  <GraduationCap size={35} />
                  <h3>Guruhlar mavjud emas</h3>
                  <p>
                    Admin sizga guruh biriktirganidan keyin shu yerda ko‘rinadi.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* O‘QUVCHILAR */}
          {activeTab === 'students' && (
            <section className="teacher-panel">
              <div className="teacher-panel-heading">
                <div>
                  <h3>
                    <Users size={20} /> O‘quvchilar ro‘yxati
                  </h3>
                  <p>Faqat sizga biriktirilgan guruh o‘quvchilari</p>
                </div>
                <span className="teacher-total-badge">
                  {allMyStudents.length} nafar
                </span>
              </div>

              <div className="teacher-filter-row">
                <select
                  value={selectedGroup ? String(selectedGroup.id) : ''}
                  onChange={event => setSelectedGroupId(event.target.value)}
                >
                  {myGroups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <div className="teacher-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="O‘quvchini qidirish..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="teacher-table-wrapper">
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>O‘quvchi</th>
                      <th>Login</th>
                      <th>Guruh</th>
                      <th>Jami ball</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => {
                        const points = lessonScores
                          .filter(record =>
                            String(record.studentId) === String(student.id) ||
                            record.username === student.username
                          )
                          .reduce((sum, record) => sum + getScore(record), 0)

                        return (
                          <tr key={student.id || student.username}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="teacher-student-cell">
                                <div className="teacher-student-avatar">
                                  {student.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                                <strong>{student.name}</strong>
                              </div>
                            </td>
                            <td>{student.username || '—'}</td>
                            <td>{selectedGroup?.name || student.group || '—'}</td>
                            <td>
                              <span className="teacher-score-badge">
                                <Star size={14} /> {points}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="teacher-table-empty">
                          {myGroups.length === 0
                            ? 'Sizga hali guruh biriktirilmagan.'
                            : 'Bu guruhda o‘quvchilar topilmadi.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* DAVOMAT */}
          {activeTab === 'attendance' && (
            <section className="teacher-panel">
              <div className="teacher-panel-heading">
                <div>
                  <h3>
                    <ClipboardCheck size={20} /> Davomat belgilash
                  </h3>
                  <p>O‘quvchilarning darsga qatnashishini belgilang</p>
                </div>
              </div>

              <div className="teacher-filter-row">
                <select
                  value={selectedGroup ? String(selectedGroup.id) : ''}
                  onChange={event => setSelectedGroupId(event.target.value)}
                >
                  {myGroups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <input
                  className="teacher-date-input"
                  type="date"
                  value={selectedDate}
                  onChange={event => setSelectedDate(event.target.value)}
                />
              </div>

              {selectedGroup && groupStudents.length > 0 ? (
                <>
                  <div className="teacher-attendance-list">
                    {groupStudents.map((student, index) => (
                      <div
                        className="teacher-attendance-row"
                        key={student.id}
                      >
                        <div className="teacher-attendance-student">
                          <span>{index + 1}</span>
                          <div className="teacher-student-avatar">
                            {student.name?.charAt(0).toUpperCase() || 'O'}
                          </div>
                          <strong>{student.name}</strong>
                        </div>

                        <div className="teacher-attendance-actions">
                          <button
                            className={
                              attendanceValues[student.id] === 'present'
                                ? 'present selected'
                                : 'present'
                            }
                            onClick={() =>
                              setStudentAttendance(student.id, 'present')
                            }
                          >
                            <CheckCircle size={16} />
                            Keldi
                          </button>

                          <button
                            className={
                              attendanceValues[student.id] === 'absent'
                                ? 'absent selected'
                                : 'absent'
                            }
                            onClick={() =>
                              setStudentAttendance(student.id, 'absent')
                            }
                          >
                            <XCircle size={16} />
                            Kelmadi
                          </button>

                          <button
                            className={
                              attendanceValues[student.id] === 'late'
                                ? 'late selected'
                                : 'late'
                            }
                            onClick={() =>
                              setStudentAttendance(student.id, 'late')
                            }
                          >
                            <AlertCircle size={16} />
                            Kechikdi
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="teacher-save-row">
                    <span>
                      Belgilangan: {Object.keys(attendanceValues).length} / {groupStudents.length}
                    </span>

                    <button
                      className="teacher-primary-btn"
                      onClick={saveAttendance}
                    >
                      <Save size={17} />
                      Davomatni saqlash
                    </button>
                  </div>
                </>
              ) : (
                <div className="teacher-empty">
                  {myGroups.length === 0
                    ? 'Sizga hali guruh biriktirilmagan.'
                    : 'Tanlangan guruhda o‘quvchilar mavjud emas.'}
                </div>
              )}
            </section>
          )}

          {/* BALL QO‘YISH */}
          {activeTab === 'scores' && (
            <section className="teacher-panel">
              <div className="teacher-panel-heading">
                <div>
                  <h3>
                    <Star size={20} /> O‘quvchilarga ball qo‘yish
                  </h3>
                  <p>Har bir dars uchun maksimal 10 ball</p>
                </div>
                <span className="teacher-total-badge">0–10 ball</span>
              </div>

              <div className="teacher-filter-row">
                <select
                  value={selectedGroup ? String(selectedGroup.id) : ''}
                  onChange={event => setSelectedGroupId(event.target.value)}
                >
                  {myGroups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <input
                  className="teacher-date-input"
                  type="date"
                  value={selectedDate}
                  onChange={event => setSelectedDate(event.target.value)}
                />
              </div>

              {selectedGroup && groupStudents.length > 0 ? (
                <>
                  <div className="teacher-score-list">
                    {groupStudents.map((student, index) => (
                      <div
                        className="teacher-score-row"
                        key={student.id}
                      >
                        <div className="teacher-attendance-student">
                          <span>{index + 1}</span>
                          <div className="teacher-student-avatar">
                            {student.name?.charAt(0).toUpperCase() || 'O'}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                            <small>{student.username}</small>
                          </div>
                        </div>

                        <div className="teacher-score-input-wrap">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="1"
                            placeholder="0–10"
                            value={scoreValues[student.id] ?? ''}
                            onChange={event =>
                              setStudentScore(student.id, event.target.value)
                            }
                          />
                          <span>/ 10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="teacher-save-row">
                    <span>Ballar 0 dan 10 gacha bo‘lishi kerak.</span>

                    <button
                      className="teacher-primary-btn"
                      onClick={saveScores}
                    >
                      <Save size={17} />
                      Ballarni saqlash
                    </button>
                  </div>
                </>
              ) : (
                <div className="teacher-empty">
                  {myGroups.length === 0
                    ? 'Sizga hali guruh biriktirilmagan.'
                    : 'Tanlangan guruhda o‘quvchilar mavjud emas.'}
                </div>
              )}
            </section>
          )}

          {/* DARS JADVALI */}
          {activeTab === 'schedule' && (
            <section className="teacher-panel">
              <div className="teacher-panel-heading">
                <div>
                  <h3>
                    <CalendarDays size={20} /> Dars jadvalim
                  </h3>
                  <p>O‘zingizga biriktirilgan guruhlar jadvali</p>
                </div>
              </div>

              {todayLessons.length > 0 ? (
                <div className="teacher-schedule-list">
                  {todayLessons.map((lesson, index) => (
                    <div
                      className="teacher-schedule-item"
                      key={lesson.id || index}
                    >
                      <div className="teacher-schedule-time">
                        <Clock size={19} />
                        <strong>
                          {lesson.time || lesson.startTime || '—'}
                        </strong>
                      </div>

                      <div className="teacher-schedule-info">
                        <strong>
                          {lesson.group || lesson.groupName || 'Guruh'}
                        </strong>
                        <span>{lesson.subject || 'Fan belgilanmagan'}</span>
                      </div>

                      <span className="teacher-schedule-status">Dars</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-empty">
                  <CalendarDays size={34} />
                  <h3>Jadval hozircha bo‘sh</h3>
                  <p>
                    Admin dars jadvalini kiritganidan keyin shu yerda ko‘rinadi.
                  </p>
                </div>
              )}

              <div className="teacher-panel-heading teacher-group-schedule-heading">
                <div>
                  <h3>
                    <BookOpen size={19} /> Guruhlar vaqti
                  </h3>
                  <p>Biriktirilgan guruhlarning vaqtlari</p>
                </div>
              </div>

              {myGroups.length > 0 ? (
                <div className="teacher-schedule-list">
                  {myGroups.map(group => (
                    <div
                      className="teacher-schedule-item"
                      key={group.id}
                    >
                      <div className="teacher-schedule-time">
                        <Clock size={19} />
                        <strong>{group.time || '—'}</strong>
                      </div>

                      <div className="teacher-schedule-info">
                        <strong>{group.name}</strong>
                        <span>{group.subject || 'Fan ko‘rsatilmagan'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-empty">
                  Sizga hali guruh biriktirilmagan.
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  )
}

export default Teacher
