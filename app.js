// عنوان سيرفر الـ Backend الخاص بك
const API_BASE_URL = 'http://localhost:3000/api';

async function startGeneration() {
  const prompt = document.getElementById('promptInput').value.trim();
  const aspectRatio = document.getElementById('aspectRatio').value;
  const generateBtn = document.getElementById('generateBtn');
  const statusContainer = document.getElementById('statusContainer');
  const resultContainer = document.getElementById('resultContainer');
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');

  if (!prompt) {
    alert('يرجى كتابة وصف للفيديو أولاً!');
    return;
  }

  // ضبط الواجهة أثناء التوليد
  generateBtn.disabled = true;
  statusContainer.style.display = 'block';
  resultContainer.style.display = 'none';
  progressBar.style.width = '10%';
  statusText.textContent = 'جاري الاتصال بالسيرفر وإرسال المهمة...';

  try {
    // 1. إرسال الطلب للسيرفر لبدء المهمة عبر Manus API
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio })
    });

    const data = await response.json();

    if (!data.success || !data.taskId) {
      throw new Error(data.error || 'فشل إرسال المهمة');
    }

    // 2. بدء عملية الاستعلام الدوري (Polling) لمتابعة التوليد
    pollTaskStatus(data.taskId);

  } catch (err) {
    statusText.textContent = `خطأ: ${err.message}`;
    generateBtn.disabled = false;
  }
}

function pollTaskStatus(taskId) {
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');
  const generateBtn = document.getElementById('generateBtn');
  const resultContainer = document.getElementById('resultContainer');
  const outputVideo = document.getElementById('outputVideo');

  // فحص كل 4 ثوانٍ
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/task-status/${taskId}`);
      const task = await res.json();

      if (task.status === 'processing' || task.status === 'queued') {
        // تحديث نسبة التقدم التقريبية
        const progress = task.progress || 50;
        progressBar.style.width = `${progress}%`;
        statusText.textContent = `جاري المعالجة والإنتاج... (${progress}%)`;
      } 
      else if (task.status === 'completed') {
        clearInterval(interval);
        progressBar.style.width = '100%';
        statusText.textContent = 'اكتمل التوليد!';

        // استخراج رابط الفيديو المولد
        const videoUrl = task.videoUrl || (task.artifacts && task.artifacts[0]?.url);
        
        if (videoUrl) {
          outputVideo.src = videoUrl;
          resultContainer.style.display = 'block';
        } else {
          statusText.textContent = 'اكتملت المهمة لكن لم يتم العثور على رابط الفيديو.';
        }

        generateBtn.disabled = false;
      } 
      else if (task.status === 'failed') {
        clearInterval(interval);
        statusText.textContent = 'فشلت عملية التوليد. حاول مجددًا.';
        generateBtn.disabled = false;
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  }, 4000);
}
