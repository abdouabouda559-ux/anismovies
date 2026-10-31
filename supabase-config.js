// تهيئة الاتصال بمشروع Supabase
const SUPABASE_URL = 'https://cnbxvtyvghvogtwwtpxl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSbIc8x2FCTXZs3Q4gBfkA_dsBSHcK2'; // استبدل هذا بالمفتاح الخاص بك (anon public)

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// دالة مساعدة لعرض الرسائل داخل الفورم بشكل أنيق
function showFormMessage(formType, message, isSuccess = false) {
  const msgBox = document.getElementById(formType + 'Message');
  if (!msgBox) return;
  msgBox.innerText = message;
  msgBox.className = 'form-message ' + (isSuccess ? 'success' : 'error');
  msgBox.style.display = 'block';
}

// 1. دالة إنشاء حساب جديد (Sign Up)
async function signUpUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) throw error;

    showFormMessage('signup', 'تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيده.', true);
  } catch (error) {
    showFormMessage('signup', 'فشل إنشاء الحساب: ' + error.message, false);
  }
}

// 2. دالة تسجيل الدخول (Sign In)
async function signInUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    showFormMessage('login', 'تم تسجيل الدخول بنجاح! مرحباً بك.', true);
    setTimeout(() => {
      closeAuthModal();
      checkUserSession();
    }, 1200);
  } catch (error) {
    // عرض الرسالة أنيقة داخل الفورم بدلاً من alert المنبثق
    showFormMessage('login', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', false);
  }
}

// 3. دالة تسجيل الخروج (Sign Out)
async function signOutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (!error) {
    checkUserSession();
  }
}

// 4. التحقق من الجلسة وتحديث الهيدر وصورة البروفايل
async function checkUserSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authContainer = document.querySelector('.header-auth-btns');

  if (!authContainer) return;

  if (session) {
    const userEmail = session.user.email;
    const userName = userEmail.split('@')[0];
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

// ربط النماذج عند تحميل المستند
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
