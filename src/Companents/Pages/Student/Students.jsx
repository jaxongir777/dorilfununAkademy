
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  CalendarDays,
  Trophy,
  Star,
  Clock,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Award
} from 'lucide-react'
import './Students.css'

const getStorageData = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

const getToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getRecordDate = (record) => {
  const value = record.date || record.createdAt || record.lessonDate

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
  const score = Number(record.score ?? record.points ?? record.ball ?? 0)
  return Number.isFinite(score) ? score : 0
}

const Student = () => {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(getCurrentUser)
  const [students, setStudents] = useState(() => getStorageData('students'))
  const [lessonScores, setLessonScores] = useState(() =>
    getStorageData('lessonScores')
  )

  const today = getToday()

  useEffect(() => {
    const updateData = () => {
      setCurrentUser(getCurrentUser())
      setStudents(getStorageData('students'))
      setLessonScores(getStorageData('lessonScores'))
    }

    window.addEventListener('storage', updateData)
    window.addEventListener('academyDataUpdated', updateData)

    return () => {
      window.removeEventListener('storage', updateData)
      window.removeEventListener('academyDataUpdated', updateData)
    }
  }, [])

  const student = useMemo(() => {
    if (!currentUser) return null

    return (
      students.find(item =>
        String(item.id) === String(currentUser.id) ||
        item.username === currentUser.username
      ) ||
      students.find(item => item.name === currentUser.name) ||
      currentUser
    )
  }, [students, currentUser])

  const studentScores = useMemo(() => {
    if (!student) return []

    return lessonScores.filter(record => {
      return (
        String(record.studentId) === String(student.id) ||
        String(record.userId) === String(student.id) ||
        record.username === student.username ||
        record.studentName === student.name ||
        record.name === student.name
      )
    })
  }, [lessonScores, student])

  const totalPoints = useMemo(() => {
    if (studentScores.length > 0) {
      return studentScores.reduce(
        (total, record) => total + getScore(record),
        0
      )
    }

    return Number(student?.points || currentUser?.points || 0)
  }, [studentScores, student, currentUser])

  const todayScores = useMemo(() => {
    return studentScores.filter(record => getRecordDate(record) === today)
  }, [studentScores, today])

  const todayPoints = todayScores.reduce(
    (total, record) => total + getScore(record),
    0
  )

  const missedLessons = Number(
    student?.missedLessons ?? currentUser?.missedLessons ?? 0
  )

  const groupName =
    student?.group ||
    currentUser?.group ||
    'Guruh biriktirilmagan'

  const groupStudents = useMemo(() => {
    return students.filter(item => item.group === groupName)
  }, [students, groupName])

  const ranking = useMemo(() => {
    return groupStudents
      .map(item => {
        const scores = lessonScores.filter(record =>
          String(record.studentId) === String(item.id) ||
          String(record.userId) === String(item.id) ||
          record.username === item.username ||
          record.studentName === item.name ||
          record.name === item.name
        )

        const points = scores.length > 0
          ? scores.reduce((total, record) => total + getScore(record), 0)
          : Number(item.points || 0)

        return {
          ...item,
          totalPoints: points
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [groupStudents, lessonScores])

  const groupRank = ranking.findIndex(item =>
    String(item.id) === String(student?.id) ||
    item.username === student?.username
  ) + 1

  const history = useMemo(() => {
    return [...studentScores]
      .sort((a, b) => {
        return new Date(b.date || b.createdAt || b.lessonDate || 0) -
          new Date(a.date || a.createdAt || a.lessonDate || 0)
      })
      .slice(0, 8)
  }, [studentScores])

  const handleBack = () => {
    navigate(-1)
  }

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <section className="student-dashboard">
        <div className="student-empty">
          <GraduationCap size={42} />
          <h2>O‘quvchi ma’lumotlari topilmadi</h2>
          <p>Iltimos, tizimga o‘quvchi hisobidan qayta kiring.</p>
          <button
            className="student-back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={17} />
            Login sahifasiga qaytish
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="student-dashboard">

      {/* ORQAGA QAYTISH */}
      <div className="student-top-bar">
        <button
          className="student-back-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={18} />
          Menyuga qaytish
        </button>
      </div>

      {/* WELCOME */}
      <div className="student-welcome">
        <div>
          <span className="student-welcome-label">
            Dorilfunun Academy shaxsiy kabineti
          </span>

          <h1>
            Xush kelibsiz, {student?.name || currentUser.name}!
          </h1>

          <p>
            <GraduationCap size={17} />
            {groupName}
          </p>
        </div>

        <div className="student-welcome-icon">
          <GraduationCap size={34} />
        </div>
      </div>

      {/* STATISTIKA */}
      <div className="student-dashboard-heading">
        <h2>O‘quv natijalari</h2>
        <p>O‘zlashtirish ko‘rsatkichlaringiz bilan tanishing</p>
      </div>

      <div className="student-stat-grid">

        <div className="student-stat-card">
          <div className="student-stat-icon points-icon">
            <Star size={23} />
          </div>

          <div>
            <span>Jami ballar</span>
            <h2>
              {totalPoints}
              <small> ball</small>
            </h2>
            <small>Barcha darslar bo‘yicha</small>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon today-icon">
            <CalendarDays size={23} />
          </div>

          <div>
            <span>Bugungi ball</span>
            <h2>
              {todayPoints}
              <small> / 10</small>
            </h2>
            <small>Bugungi natijangiz</small>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon missed-icon">
            <Clock size={23} />
          </div>

          <div>
            <span>Qoldirilgan darslar</span>
            <h2>
              {missedLessons}
              <small> ta</small>
            </h2>
            <small>Umumiy davomad</small>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon rank-icon">
            <Trophy size={23} />
          </div>

          <div>
            <span>Guruhdagi o‘rin</span>
            <h2>
              {groupRank || '-'}
              <small> / {ranking.length}</small>
            </h2>
            <small>Guruh reytingi</small>
          </div>
        </div>

      </div>

      {/* ASOSIY QISMLAR */}
      <div className="student-dashboard-grid">

        {/* GURUH REYTINGI */}
        <div className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h3>
                <Trophy size={19} />
                Guruh reytingi
              </h3>
              <p>Guruhdagi o‘quvchilar natijalari</p>
            </div>

            <Award size={23} />
          </div>

          <div className="student-ranking-list">
            {ranking.length > 0 ? (
              ranking.slice(0, 10).map((item, index) => {
                const isMe =
                  String(item.id) === String(student?.id) ||
                  item.username === student?.username

                return (
                  <div
                    className={`student-ranking-item ${isMe ? 'my-ranking' : ''}`}
                    key={item.id || item.username || index}
                  >
                    <div className="student-ranking-position">
                      {index + 1}
                    </div>

                    <div className="student-ranking-avatar">
                      {item.name?.charAt(0).toUpperCase() || 'O'}
                    </div>

                    <div className="student-ranking-info">
                      <strong>
                        {item.name}
                        {isMe && <span> (Siz)</span>}
                      </strong>

                      <small>{item.group || groupName}</small>
                    </div>

                    <div className="student-ranking-points">
                      <Star size={15} />
                      {item.totalPoints}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="student-no-data">
                Guruh reytingi hozircha mavjud emas.
              </div>
            )}
          </div>
        </div>

        {/* BUGUNGI NATIJA */}
        <div className="student-panel student-daily-panel">
          <div className="student-panel-heading">
            <div>
              <h3>
                <TrendingUp size={19} />
                Bugungi natija
              </h3>
              <p>Bugun to‘plagan ballaringiz</p>
            </div>
          </div>

          <div className="student-today-result">
            <strong>{todayPoints}</strong>
            <span>/ 10 ball</span>
          </div>

          <div className="student-progress-track">
            <div
              className="student-progress-fill"
              style={{
                width: `${Math.min(Math.max(todayPoints, 0), 10) * 10}%`
              }}
            />
          </div>

          <p className="student-result-note">
            {todayScores.length > 0
              ? 'Bugungi dars natijangiz qayd etilgan.'
              : 'Bugungi dars uchun hali ball kiritilmagan.'}
            {' '}Har bir dars uchun maksimal ball — 10.
          </p>
        </div>

      </div>

      {/* BALLAR TARIXI */}
      <div className="student-panel student-history-panel">
        <div className="student-panel-heading">
          <div>
            <h3>
              <BookOpen size={19} />
              Ballar tarixi
            </h3>
            <p>Darslar bo‘yicha oxirgi natijalaringiz</p>
          </div>
        </div>

        <div className="student-history-list">
          {history.length > 0 ? (
            history.map((record, index) => {
              const date = getRecordDate(record)

              return (
                <div
                  className="student-history-item"
                  key={record.id || index}
                >
                  <div className="student-history-icon">
                    <Star size={19} />
                  </div>

                  <div className="student-history-info">
                    <strong>
                      {record.subject ||
                        record.lesson ||
                        record.title ||
                        'Dars natijasi'}
                    </strong>

                    <small>
                      {date || 'Sana ko‘rsatilmagan'}
                    </small>
                  </div>

                  <strong className="student-history-score">
                    +{getScore(record)} ball
                  </strong>
                </div>
              )
            })
          ) : (
            <div className="student-no-data">
              <BookOpen size={30} />
              <p>
                Hozircha ballar tarixi mavjud emas.
                O‘qituvchi dars uchun ball kiritganidan keyin
                natijalaringiz shu yerda ko‘rinadi.
              </p>
            </div>
          )}
        </div>
      </div>

    </section>
  )
}

export default Student
