// ==========================================
// SUPABASE CONFIG & GLOBAL TRANSACTIONS (supabase-config.js)
// ==========================================

const SUPABASE_URL = 'https://cnbxvtywghvogtvwztpd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSbIc8x2FCTXZs3Q4gBfkA_dsBSHcK2';

// تهيئة عميل Supabase الموحد
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. نظام الحماية والأمان والحظر الذكي
// ==========================================

/**
 * فحص جلسة المستخدم والتحقق مما إذا كان محظوراً
 */
async function checkUserSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) return null;

    const userId = session.user.id;

    // فحص جدول المحظورين
    const { data: banRecord } = await supabaseClient
      .from('banned_users')
      .select('reason')
      .eq('user_id', userId)
      .maybeSingle();

    if (banRecord) {
      alert(`تم حظرك من المنصة. السبب: ${banRecord.reason}`);
      await supabaseClient.auth.signOut();
      window.location.reload();
      return null;
    }

    return session.user;
  } catch (err) {
    console.error('Auth Session Error:', err);
    return null;
  }
}

/**
 * تسجيل المخالفات الأمنية ومحاولات السحب الآلي
 */
async function logSecurityViolation(violationType, details = '') {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const userId = session ? session.user.id : null;

    await supabaseClient.from('user_security_logs').insert([
      {
        user_id: userId,
        violation_type: violationType,
        details: details,
        ip_address: 'Client-Side Action'
      }
    ]);

    if (userId) {
      const { count, error } = await supabaseClient
        .from('user_security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!error && count >= 5) {
        await supabaseClient.from('banned_users').insert([
          {
            user_id: userId,
            reason: 'تكرار المحاولات المشبوهة واختراق قواعد الاستخدام (Automated Ban)'
          }
        ]);
        alert('تم حظرك نهائياً بسبب رصد سلوكيات مشبوهة ومتكررة.');
        await supabaseClient.auth.signOut();
        window.location.reload();
      }
    }
  } catch (err) {
    console.error('Security Logging Error:', err);
  }
}

// ==========================================
// 2. دوال المصادقة وجلب بيانات البروفايل للهيدر
// ==========================================

/**
 * تحديث حالة الهيدر وعرض اسم المستخدم وصورة البروفايل
 */
async function checkUserSessionAndHeader() {
  const sessionUser = await checkUserSession();
  const authButtonsContainer = document.getElementById('authButtonsContainer');
  const userProfileBadge = document.getElementById('userProfileBadge');
  const headerUsername = document.getElementById('headerUsername');
  const headerUserAvatar = document.getElementById('headerUserAvatar');

  if (sessionUser) {
    if (authButtonsContainer) authButtonsContainer.style.display = 'none';
    if (userProfileBadge) userProfileBadge.style.display = 'flex';

    const userId = sessionUser.id;
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (profile) {
      if (headerUsername) headerUsername.textContent = profile.username || sessionUser.email.split('@')[0];
      if (headerUserAvatar && profile.avatar_url) {
        headerUserAvatar.src = profile.avatar_url;
      }
    } else {
      if (headerUsername) headerUsername.textContent = sessionUser.email.split('@')[0];
    }
  } else {
    if (authButtonsContainer) authButtonsContainer.style.display = 'flex';
    if (userProfileBadge) userProfileBadge.style.display = 'none';
  }
}

/**
 * تسجيل الخروج
 */
async function handleSignOut() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

// ==========================================
// 3. معاملات قاعدة البيانات (جلب الأفلام وقائمة المشاهدة)
// ==========================================

/**
 * جلب الأفلام من قاعدة البيانات وعرضها
 */
async function loadMoviesFromDatabase() {
  const moviesGrid = document.querySelector('.movies-grid');
  if (!moviesGrid) return;

  try {
    const { data: movies, error } = await supabaseClient
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!movies || movies.length === 0) {
      moviesGrid.innerHTML = '<p style="color: #94a3b8; grid-column: 1/-1; text-align: center; padding: 2rem;">لا توجد أفلام مضافة حالياً في قاعدة البيانات.</p>';
      return;
    }

    moviesGrid.innerHTML = '';
    movies.forEach(movie => {
      moviesGrid.innerHTML += `
        <div class="movie-card" style="position: relative;">
          <button onclick="toggleWatchlist(${movie.id})" style="position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.8); border: none; color: #38bdf8; padding: 6px; border-radius: 50%; cursor: pointer; z-index: 10;" title="إضافة إلى قائمة المشاهدة">
            ❤️
          </button>
          <a href="watch.html?id=${movie.id}">
            <div class="poster-box">
              <span class="badge">★ ${movie.rating || 'N/A'}</span>
              <img src="${movie.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'}" alt="${movie.title}">
            </div>
            <div class="movie-info">
              <div class="movie-title">${movie.title}</div>
              <div class="movie-meta">
                <span>${movie.release_year || ''}</span>
                <span>${movie.category || ''}</span>
              </div>
            </div>
          </a>
        </div>
      `;
    });
  } catch (err) {
    console.error('خطأ أثناء جلب البيانات:', err.message);
  }
}

/**
 * إضافة أو إزالة فيلم من قائمة المشاهدة (Watchlist)
 */
async function toggleWatchlist(movieId) {
  const user = await checkUserSession();
  if (!user) {
    alert('يجب تسجيل الدخول أولاً لإضافة الأفلام إلى قائمة المشاهدة.');
    if (typeof openAuthModal === 'function') openAuthModal('login');
    return;
  }

  const { data: existingItem } = await supabaseClient
    .from('watchlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('movie_id', movieId)
    .maybeSingle();

  if (existingItem) {
    const { error: deleteError } = await supabaseClient
      .from('watchlist')
      .delete()
      .eq('id', existingItem.id);

    if (!deleteError) alert('تمت إزالة الفيلم من قائمة المشاهدة الخاصة بك.');
  } else {
    const { error: insertError } = await supabaseClient
      .from('watchlist')
      .insert([{ user_id: user.id, movie_id: movieId }]);

    if (!insertError) alert('تمت إضافة الفيلم إلى قائمة المشاهدة بنجاح! 🎬');
  }
}
