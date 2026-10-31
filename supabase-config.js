// 1. تهيئة الاتصال بـ Supabase
const SUPABASE_URL = 'https://cnbxvtywghvogtvwztpd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSbIc8x2FCTXZs3Q4gBfkA_dsBSHcK2';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. دالة إنشاء حساب جديد (Sign Up)
async function signUpUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) throw error;

    alert('تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيده.');
    closeAuthModal();
    return data;
  } catch (error) {
    alert('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
  }
}

// 3. دالة تسجيل الدخول (Sign In)
async function signInUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    alert('تم تسجيل الدخول بنجاح! مرحباً بك.');
    closeAuthModal();
    checkUserSession(); // تحديث الواجهة فور الدخول
    return data;
  } catch (error) {
    alert('خطأ في تسجيل الدخول: ' + error.message);
  }
}

// 4. دالة تسجيل الخروج (Sign Out)
async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    alert('تم تسجيل الخروج.');
    checkUserSession();
  }
}

// 5. التحقق من حالة الجلسة وتحديث زر الهيدر
async function checkUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  const authContainer = document.querySelector('.header-auth-btns');

  if (!authContainer) return;

  if (session) {
    // إذا كان المستخدم مسجلاً لدخوله
    authContainer.innerHTML = `
      <span style="color: #38bdf8; font-size: 0.85rem; font-weight: bold;">مرحباً، ${session.user.email.split('@')[0]}</span>
      <button class="btn-login" onclick="signOutUser()">خروج</button>
    `;
  } else {
    // إذا لم يكن مسجلاً
    authContainer.innerHTML = `
      <button class="btn-login" onclick="openAuthModal('login')">تسجيل الدخول</button>
      <button class="btn-signup" onclick="openAuthModal('signup')">إنشاء حساب</button>
    `;
  }
}

// 6. ربط نماذج HTML بالدوال عند تحميل الصفحة
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
