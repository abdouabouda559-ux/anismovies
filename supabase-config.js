// تهيئة الاتصال بمشروع Supabase
const SUPABASE_URL = 'https://cnbxvtywghvogtvwztpd.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_vSbIc8x2FCTXZs3Q4gBfkA_dsBSHcK2'; // ضع مفتاحك هنا

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. دالة إنشاء حساب جديد مع التحقق من الأخطاء وإظهارها للمستخدم
async function signUpUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) throw error;

    alert('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
    closeAuthModal();
    return data;
  } catch (error) {
    // إظهار سبب الخطأ الحقيقي (مثل كلمة المرور ضعيفة أو البريد مستخدم مسبقاً)
    alert('فشل إنشاء الحساب: ' + error.message);
  }
}

// 2. دالة تسجيل الدخول مع التحقق الفعلي من صحة المعلومات
async function signInUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    alert('تم تسجيل الدخول بنجاح! مرحباً بك.');
    closeAuthModal();
    checkUserSession(); // تحديث واجهة الهيدر فوراً
    return data;
  } catch (error) {
    // إظهار رسالة خطأ واضحة إذا كانت البيانات غير صحيحة
    alert('خطأ في تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  }
}

// 3. دالة تسجيل الخروج
async function signOutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (!error) {
    alert('تم تسجيل الخروج بنجاح.');
    checkUserSession();
  }
}

// 4. التحقق من الجلسة وعرض صورة وبروفايل المستخدم بشكل صحيح
async function checkUserSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authContainer = document.querySelector('.header-auth-btns');

  if (!authContainer) return;

  if (session) {
    const userEmail = session.user.email;
    const userName = userEmail.split('@')[0];
    // توليد حرف أول افتراضي لصورة البروفايل الدائرية إن لم توجد صورة مرفوعة
    const initial = userName.charAt(0).toUpperCase();

    authContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; background-color: #38bdf8; color: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
          ${initial}
        </div>
        <span style="color: #38bdf8; font-size: 0.85rem; font-weight: bold;">${userName}</span>
      </div>
      <button class="btn-login" onclick="signOutUser()">خروج</button>
    `;
  } else {
    authContainer.innerHTML = `
      <button class="btn-login" onclick="openAuthModal('login')">تسجيل الدخول</button>
      <button class="btn-signup" onclick="openAuthModal('signup')">إنشاء حساب</button>
    `;
  }
}

// تشغيل الفحص عند تحميل الصفحة وربط النماذج
document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      signInUser(email, password);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = signupForm.querySelector('input[type="email"]').value;
      const password = signupForm.querySelector('input[type="password"]').value;
      signUpUser(email, password);
    });
  }
});
