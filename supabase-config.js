// supabase-config.js - ملف الاتصال الموحد لـ Supabase

const SUPABASE_URL = 'https://cnbxvtywghvogtvwztpd.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_vSbIc8x2FCTXZs3Q4gBfkA_dsBSHcK2';

// تهيئة عميل Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * دالة التحقق من جلسة المستخدم وفحص ما إذا كان محظوراً
 */
async function checkUserSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) return null;

    const userId = session.user.id;

    // فحص هل المستخدم موجود في جدول المحظورين
    const { data: banRecord, error: banError } = await supabaseClient
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
 * دالة لتسجيل المخالفات الأمنية أو محاولات السحب
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
