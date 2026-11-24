import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const toUser = (row) => ({
  id: row.id,
  role: row.role,
  name: row.name,
  username: row.username,
  phone: row.phone || '',
  subject: row.subject || '',
  groupId: row.group_id ?? '',
  group: row.group_name || '',
  points: row.points || 0,
  missedLessons: row.missed_lessons || 0,
  isFrozen: Boolean(row.is_frozen)
})

const fail = (error) => {
  if (error) throw new Error(error.message)
}

// ---------- LOGIN ----------
export const login = async (username, password) => {
  const { data, error } = await supabase.rpc('academy_login', {
    p_username: username,
    p_password: password
  })
  fail(error)
  return data && data.length ? toUser(data[0]) : null
}

// ---------- FOYDALANUVCHILAR ----------
export const getUsers = async (role) => {
  const { data, error } = await supabase.rpc('academy_list_users', {
    p_role: role
  })
  fail(error)
  return (data || []).map(toUser)
}

export const saveUser = async (user) => {
  const { data, error } = await supabase.rpc('academy_save_user', {
    p: {
      id: user.id ?? null,
      role: user.role,
      name: user.name,
      username: user.username,
      password: user.password || '',
      phone: user.phone || '',
      subject: user.subject || '',
      group_id: user.groupId === '' ? null : user.groupId ?? null,
      group_name: user.group || '',
      points: user.points,
      missed_lessons: user.missedLessons,
      is_frozen: user.isFrozen
    }
  })
  fail(error)
  return data
}

export const deleteUser = async (id) => {
  const { error } = await supabase.rpc('academy_delete_user', { p_id: id })
  fail(error)
}

export const getTeachers = () => getUsers('teacher')
export const getStudents = () => getUsers('student')

// ---------- GURUHLAR ----------
export const getGroups = async () => {
  const { data, error } = await supabase
    .from('academy_groups')
    .select('*')
    .order('id')
  fail(error)
  return data || []
}

export const saveGroup = async (group) => {
  const row = {
    name: group.name,
    subject: group.subject,
    level: group.level,
    time: group.time,
    teacher: group.teacher
  }

  if (group.id) {
    const { error } = await supabase
      .from('academy_groups')
      .update(row)
      .eq('id', group.id)
    fail(error)
  } else {
    const { error } = await supabase.from('academy_groups').insert(row)
    fail(error)
  }
}

export const deleteGroup = async (id) => {
  const { error } = await supabase
    .from('academy_groups')
    .delete()
    .eq('id', id)
  fail(error)
}