
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const response = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return response({ error: "Server sozlamalari topilmadi." }, 500);
    }

    // 1. Kirgan foydalanuvchini tekshirish
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return response({ error: "Tizimga kiring." }, 401);
    }

    const token = authorization.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, anonKey);

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return response({ error: "Sessiya yaroqsiz." }, 401);
    }

    // 2. Admin rolini tekshirish
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: adminProfile, error: profileError } =
      await adminClient
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

    if (profileError || adminProfile?.role !== "admin") {
      return response({ error: "Faqat admin hisob yarata oladi." }, 403);
    }

    // 3. Yangi foydalanuvchi ma'lumotlari
    const body = await req.json();

    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role;
    const phone = String(body.phone || "").trim();
    const subject = String(body.subject || "").trim();
    const groupId = body.group_id || null;

    if (!name || !username || !password) {
      return response({ error: "Majburiy maydonlarni to'ldiring." }, 400);
    }

    if (!["teacher", "student"].includes(role)) {
      return response({ error: "Foydalanuvchi roli noto'g'ri." }, 400);
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return response({ error: "Login 3-30 ta belgidan iborat bo'lsin." }, 400);
    }

    if (password.length < 8) {
      return response({ error: "Parol kamida 8 ta belgidan iborat bo'lsin." }, 400);
    }

    if (role === "teacher" && !subject) {
      return response({ error: "Ustoz fanini kiriting." }, 400);
    }

    // 4. Login bandligini tekshirish
    const { data: existingUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return response({ error: "Bu login band." }, 409);
    }

    // Haqiqiy email talab qilinmaydi.
    // Bu tizim ichidagi texnik email manzilidir.
    const internalEmail = `${username}@login.dorilfunun.com`;

    // 5. Supabase Auth hisobini yaratish
    const { data: createdAuth, error: createError } =
      await adminClient.auth.admin.createUser({
        email: internalEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          username,
          role,
        },
      });

    if (createError || !createdAuth.user) {
      return response({
        error: createError?.message || "Hisob yaratilmadi.",
      }, 400);
    }

    const newUserId = createdAuth.user.id;

    // 6. Profilni saqlash
    const { error: insertProfileError } = await adminClient
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: name,
        username,
        role,
        is_frozen: false,
      });

    if (insertProfileError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return response({ error: insertProfileError.message }, 400);
    }

    // 7. Ustoz yoki o'quvchi ma'lumotlarini saqlash
    const table = role === "teacher" ? "teachers" : "students";

    const userRecord =
      role === "teacher"
        ? {
            user_id: newUserId,
            full_name: name,
            phone: phone || null,
            subject,
          }
        : {
            user_id: newUserId,
            full_name: name,
            phone: phone || null,
            group_id: groupId,
            points: 0,
            missed_lessons: 0,
          };

    const { error: insertError } = await adminClient
      .from(table)
      .insert(userRecord);

    if (insertError) {
      await adminClient.from("profiles").delete().eq("id", newUserId);
      await adminClient.auth.admin.deleteUser(newUserId);

      return response({ error: insertError.message }, 400);
    }

    return response({
      success: true,
      message: role === "teacher"
        ? "Ustoz muvaffaqiyatli yaratildi."
        : "O'quvchi muvaffaqiyatli yaratildi.",
      user: {
        id: newUserId,
        name,
        username,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    return response({ error: "Serverda xatolik yuz berdi." }, 500);
  }
});
