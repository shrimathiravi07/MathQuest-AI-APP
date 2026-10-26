    // 6. LOGIN, REGISTRATION, LOGOUT & STRICT GRADE ISOLATION
    // -------------------------------------------------------------------------
    function selectLoginGrade(grade) {
      playGameSound('click');
      APP_STATE.selectedLoginGrade = Number(grade);
      const btn5 = document.getElementById('btn-select-grade-5');
      const btn6 = document.getElementById('btn-select-grade-6');
      const img5 = document.getElementById('login-mascot-img-g5');
      const img6 = document.getElementById('login-mascot-img-g6');
      const badge = document.getElementById('login-mascot-badge');
      const previewTitle = document.getElementById('login-world-preview-title');

      if (grade === 5) {
        btn5.className = 'p-3.5 rounded-2xl border-3 transition-all text-left flex items-center gap-3 bg-emerald-600/45 border-yellow-300 shadow-lg ring-2 ring-yellow-300';
        btn6.className = 'p-3.5 rounded-2xl border-3 transition-all text-left flex items-center gap-3 bg-slate-900/50 border-white/20 hover:bg-purple-900/40';
        img5.classList.remove('hidden');
        img6.classList.add('hidden');
        badge.textContent = '🦊 Grade 5 • Forest Island';
        badge.className = 'px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-300/50 text-emerald-200 font-bold text-xs';
        previewTitle.textContent = 'Grade 5 Floating Forest Island!';
        focus3DCamera('forest');
      } else {
        btn6.className = 'p-3.5 rounded-2xl border-3 transition-all text-left flex items-center gap-3 bg-purple-600/45 border-yellow-300 shadow-lg ring-2 ring-yellow-300';
        btn5.className = 'p-3.5 rounded-2xl border-3 transition-all text-left flex items-center gap-3 bg-slate-900/50 border-white/20 hover:bg-emerald-900/40';
        img6.classList.remove('hidden');
        img5.classList.add('hidden');
        badge.textContent = '🤖 Grade 6 • Crystal Cosmos';
        badge.className = 'px-3 py-1 rounded-full bg-purple-500/30 border border-purple-300/50 text-purple-200 font-bold text-xs';
        previewTitle.textContent = 'Grade 6 Crystal Cosmos Sanctuary!';
        focus3DCamera('crystal');
      }
    }

    function togglePasswordVisibility() {
      const input = document.getElementById('login-password');
      const btn = document.getElementById('btn-toggle-password');
      if (!input || !btn) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈 Hide';
      } else {
        input.type = 'password';
        btn.textContent = '👁️ Show';
      }
    }

    function toggleAuthMode() {
      playGameSound('click');
      const loginForm = document.getElementById('login-form');
      const regForm = document.getElementById('register-form');
      const toggleBtn = document.getElementById('btn-toggle-register');
      const promptSpan = document.getElementById('auth-toggle-prompt');
      hideLoginAlert();

      if (APP_STATE.authMode === 'login') {
        APP_STATE.authMode = 'register';
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        promptSpan.textContent = 'Already have an Explorer account?';
        toggleBtn.textContent = 'Back to Login 🔑';
      } else {
        APP_STATE.authMode = 'login';
        regForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        promptSpan.textContent = 'Need a student account?';
        toggleBtn.textContent = 'Create New Account ✨';
      }
    }

    function showLoginAlert(message, type) {
      const box = document.getElementById('login-alert-box');
      const text = document.getElementById('login-alert-text');
      const icon = document.getElementById('login-alert-icon');
      if (!box || !text) return;
      box.classList.remove('hidden', 'bg-rose-500/25', 'border-rose-300', 'text-rose-100', 'bg-emerald-500/25', 'border-emerald-300', 'text-emerald-100');
      if (type === 'success') {
        box.classList.add('bg-emerald-500/25', 'border-emerald-300', 'text-emerald-100');
        icon.textContent = '🌟';
      } else {
        box.classList.add('bg-rose-500/25', 'border-rose-300', 'text-rose-100');
        icon.textContent = '🎈';
      }
      text.textContent = message;
    }

    function hideLoginAlert() {
      const box = document.getElementById('login-alert-box');
      if (box) box.classList.add('hidden');
    }

    function fillDemoCredentials(username, selectGrade) {
      playGameSound('click');
      if (APP_STATE.authMode !== 'login') toggleAuthMode();
      selectLoginGrade(selectGrade);
      const uInput = document.getElementById('login-username');
      const pInput = document.getElementById('login-password');
      const record = LOCAL_STUDENTS_DB[username];
      if (uInput && pInput && record) {
        uInput.value = record.username;
        pInput.value = record.password_key;
        if (record.grade !== selectGrade) {
          showLoginAlert(
            `Demo Ready: "${username}" is a Grade ${record.grade} student, and Grade ${selectGrade} is selected. Click Login to see the Grade Restriction check in action!`,
            'error'
          );
        } else {
          showLoginAlert(
            `Filled "${username}" (Grade ${selectGrade}). Now click the golden "Login to MathQuest!" button below!`,
            'success'
          );
        }
      }
    }

    async function handleLoginSubmit(event) {
      event.preventDefault();
      hideLoginAlert();

      const uInput = document.getElementById('login-username');
      const pInput = document.getElementById('login-password');
      const username = (uInput ? uInput.value : '').trim();
      const password = pInput ? pInput.value : '';

      // 1. Validate empty username or password
      if (!username && !password) {
        playGameSound('tryagain');
        showLoginAlert('Please enter your Explorer username and secret password to start!', 'error');
        return;
      }
      if (!username) {
        playGameSound('tryagain');
        showLoginAlert('Oops! Please enter your Explorer username first.', 'error');
        return;
      }
      if (!password) {
        playGameSound('tryagain');
        showLoginAlert("Don't forget to enter your secret password!", 'error');
        return;
      }

      try {
        const result = await callFastApi('/auth/login', 'POST', {
          username,
          password,
          grade: APP_STATE.selectedLoginGrade
        });
        completeAuthentication(result.token, result.student);
      } catch (err) {
        playGameSound('tryagain');
        showLoginAlert(err.message || 'Invalid credentials. Please try again!', 'error');
      }
    }

    async function handleRegisterSubmit(event) {
      event.preventDefault();
      hideLoginAlert();

      const displayName = (document.getElementById('reg-display-name').value || '').trim();
      const username = (document.getElementById('reg-username').value || '').trim();
      const grade = Number(document.getElementById('reg-grade').value || 5);
      const password = document.getElementById('reg-password').value || '';

      if (!displayName || !username) {
        playGameSound('tryagain');
        showLoginAlert('Please enter both your nickname and a username!', 'error');
        return;
      }
      if (password.length < 4) {
        playGameSound('tryagain');
        showLoginAlert('Please choose a secret password with at least 4 characters!', 'error');
        return;
      }

      try {
        const result = await callFastApi('/auth/register', 'POST', {
          display_name: displayName,
          username,
          grade,
          password,
          avatar: grade === 5 ? '🦊' : '🤖'
        });
        showToast(`Welcome aboard, ${result.student.display_name}! 🎉`, 'success');
        completeAuthentication(result.token, result.student);
      } catch (err) {
        playGameSound('tryagain');
        showLoginAlert(err.message || 'Could not create account.', 'error');
      }
    }

    function completeAuthentication(token, student) {
      APP_STATE.sessionToken = token;
      APP_STATE.currentStudent = student;
      APP_STATE.currentTopic = 'fractions';
      APP_STATE.currentLessonStep = 0;
      triggerStarCelebration();
      updateNavbarHUD();
      navigateTo('world');
      showToast(`Logged in as ${student.display_name} (Grade ${student.grade})!`, 'success');
    }

    async function handleLogout() {
      playGameSound('click');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      try {
        await callFastApi('/auth/logout', 'POST', {});
      } catch (e) {
        // Ignore
      }
      APP_STATE.sessionToken = null;
      APP_STATE.currentStudent = null;
      APP_STATE.currentScreen = 'login';
      const pInput = document.getElementById('login-password');
      if (pInput) pInput.value = '';
      hideLoginAlert();
      document.getElementById('main-navbar').classList.add('hidden');
      showOnlyScreen('screen-login');
      focus3DCamera('overview');
      if (window.location.hash !== '#/login') {
        history.replaceState(null, '', '#/login');
      }
      showToast('You have logged out safely! See you next time! 👋', 'info');
    }

    // -------------------------------------------------------------------------
    // 7. ROUTING & STRICT GRADE-LEVEL ACCESS PROTECTION
    // -------------------------------------------------------------------------
    function showOnlyScreen(screenId) {
      const screens = [
        'screen-login',
        'screen-grade5',
        'screen-grade6',
        'screen-map',
        'screen-lesson',
        'screen-quiz',
        'screen-stars',
        'screen-profile'
      ];
      screens.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden', id !== screenId);
      });
    }

    function updateNavbarHUD() {
      const student = APP_STATE.currentStudent;
      const navbar = document.getElementById('main-navbar');
      if (!student) {
        if (navbar) navbar.classList.add('hidden');
        return;
      }
      if (navbar) navbar.classList.remove('hidden');

      const gradeBadge = document.getElementById('nav-grade-badge');
      if (gradeBadge) {
        gradeBadge.textContent = student.grade === 5 ? '🌲 Grade 5 World' : '💎 Grade 6 World';
        gradeBadge.className =
          student.grade === 5
            ? 'text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white inline-block'
            : 'text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500 text-white inline-block';
      }

      document.getElementById('hud-star-count').textContent = student.stars;
      document.getElementById('hud-avatar-emoji').textContent = student.avatar || (student.grade === 5 ? '🦊' : '🤖');
      document.getElementById('hud-username').textContent = student.display_name;

      // Calculate overall progress across 4 lessons + 4 quizzes
      const lessonCount = (student.completed_lessons || []).length;
      const quizSolved = Object.values(student.quiz_scores || {}).reduce((a, b) => a + b, 0);
      const pct = Math.min(100, Math.round(((lessonCount * 4 + quizSolved) / 32) * 100));
      document.getElementById('hud-progress-pct').textContent = `${pct}%`;
      document.getElementById('hud-progress-bar').style.width = `${Math.max(8, pct)}%`;
    }

    function highlightNavPill(activeKey) {
      const keys = ['world', 'map', 'lesson', 'quiz', 'stars', 'profile'];
      keys.forEach((k) => {
        const btn = document.getElementById(`nav-btn-${k}`);
        if (!btn) return;
        if (k === activeKey) {
          btn.className = 'nav-pill px-3.5 py-2 rounded-2xl font-heading font-semibold text-sm sm:text-base transition-all flex items-center gap-1.5 bg-yellow-400 text-slate-950 shadow-md scale-105';
        } else {
          btn.className = 'nav-pill px-3.5 py-2 rounded-2xl font-heading font-semibold text-sm sm:text-base transition-all flex items-center gap-1.5 bg-white/10 hover:bg-white/25 text-white';
        }
      });
    }

    function navigateTo(destination, topicOverride) {
      playGameSound('click');
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Block protected screens when not logged in
      if (!APP_STATE.currentStudent || !APP_STATE.sessionToken) {
        showOnlyScreen('screen-login');
        if (destination !== 'login') {
          showToast('Please log in with your student account first! 🔑', 'warning');
        }
        return;
      }

      const grade = Number(APP_STATE.currentStudent.grade);

      // Guard against cross-grade navigation attempts
      if (destination === 'grade5' && grade !== 5) {
        showToast('Access Denied: Grade 6 students cannot enter Grade 5 World! 🛡️', 'error');
        destination = 'world';
      }
      if (destination === 'grade6' && grade !== 6) {
        showToast('Access Denied: Grade 5 students cannot enter Grade 6 World! 🛡️', 'error');
        destination = 'world';
      }

      if (topicOverride) {
        APP_STATE.currentTopic = topicOverride;
      }

      updateNavbarHUD();

      if (destination === 'world' || destination === 'grade5' || destination === 'grade6') {
        APP_STATE.currentScreen = 'world';
        highlightNavPill('world');
        if (grade === 5) {
          renderGradeWorld(5);
          showOnlyScreen('screen-grade5');
          focus3DCamera('forest');
          history.replaceState(null, '', '#/grade5');
        } else {
          renderGradeWorld(6);
          showOnlyScreen('screen-grade6');
          focus3DCamera('crystal');
          history.replaceState(null, '', '#/grade6');
        }
      } else if (destination === 'map') {
        APP_STATE.currentScreen = 'map';
        highlightNavPill('map');
        showOnlyScreen('screen-map');
        focus3DCamera('overview');
        history.replaceState(null, '', '#/map');
      } else if (destination === 'lesson') {
        APP_STATE.currentScreen = 'lesson';
        highlightNavPill('lesson');
        renderLessonScreen();
        showOnlyScreen('screen-lesson');
        focus3DCamera(grade === 5 ? 'forest' : 'crystal');
        history.replaceState(null, '', `#/grade${grade}/lesson/${APP_STATE.currentTopic}`);
      } else if (destination === 'quiz') {
        APP_STATE.currentScreen = 'quiz';
        highlightNavPill('quiz');
        initQuizArena(grade, APP_STATE.currentTopic);
        showOnlyScreen('screen-quiz');
        focus3DCamera('arena');
        history.replaceState(null, '', `#/grade${grade}/quiz/${APP_STATE.currentTopic}`);
      } else if (destination === 'stars') {
        APP_STATE.currentScreen = 'stars';
        highlightNavPill('stars');
        renderStarsScreen();
        showOnlyScreen('screen-stars');
        focus3DCamera('trophy');
        history.replaceState(null, '', '#/stars');
      } else if (destination === 'profile') {
        APP_STATE.currentScreen = 'profile';
        highlightNavPill('profile');
        renderProfileScreen();
        showOnlyScreen('screen-profile');
        focus3DCamera('overview');
        history.replaceState(null, '', '#/profile');
      }
    }

    // Listen to manual URL hash edits to enforce protected route & grade restrictions
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash || '#/login';
      if (hash === '#/login') return;

      if (!APP_STATE.currentStudent || !APP_STATE.sessionToken) {
        showToast('Protected Page: Please log in to access MathQuest AI! 🔒', 'error');
        showOnlyScreen('screen-login');
        history.replaceState(null, '', '#/login');
        return;
      }

      const studentGrade = Number(APP_STATE.currentStudent.grade);
      if (hash.startsWith('#/grade5') && studentGrade !== 5) {
        showToast('Grade Restriction: Grade 6 students cannot access Grade 5 URLs! 🛡️', 'error');
        navigateTo('world');
        return;
      }
      if (hash.startsWith('#/grade6') && studentGrade !== 6) {
        showToast('Grade Restriction: Grade 5 students cannot access Grade 6 URLs! 🛡️', 'error');
        navigateTo('world');
        return;
      }
    });

    // -------------------------------------------------------------------------
    // 8. RENDER GRADE 5 & GRADE 6 FLOATING ISLAND WORLDS
    // -------------------------------------------------------------------------
    function getTopicIllustrationSVG(grade, topicKey) {
      if (grade === 5) {
        if (topicKey === 'fractions') {
          // Colourful pizza slices SVG
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <circle cx="70" cy="55" r="44" fill="#d97706" stroke="#fef08a" stroke-width="3"/>
              <circle cx="70" cy="55" r="37" fill="#facc15"/>
              <line x1="70" y1="11" x2="70" y2="99" stroke="#92400e" stroke-width="3"/>
              <line x1="26" y1="55" x2="114" y2="55" stroke="#92400e" stroke-width="3"/>
              <path d="M74 51 L74 12 A40 40 0 0 1 113 51 Z" fill="#f97316" stroke="#ffffff" stroke-width="2.5"/>
              <circle cx="88" cy="34" r="5" fill="#dc2626"/>
              <circle cx="52" cy="38" r="5" fill="#dc2626"/>
              <circle cx="54" cy="72" r="5" fill="#dc2626"/>
              <circle cx="86" cy="70" r="5" fill="#dc2626"/>
              <circle cx="46" cy="50" r="3.5" fill="#16a34a"/>
              <circle cx="82" cy="46" r="3.5" fill="#16a34a"/>
            </svg>`;
        }
        if (topicKey === 'decimals') {
          // Number balloons SVG
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <path d="M42 68 Q40 90 55 102" stroke="#bae6fd" stroke-width="2" fill="none"/>
              <path d="M72 58 Q72 85 68 102" stroke="#bae6fd" stroke-width="2" fill="none"/>
              <path d="M100 70 Q98 90 82 102" stroke="#bae6fd" stroke-width="2" fill="none"/>
              <ellipse cx="42" cy="44" rx="20" ry="24" fill="#ec4899" stroke="#fbcfe8" stroke-width="2"/>
              <text x="42" y="48" text-anchor="middle" fill="#fff" font-family="Fredoka" font-weight="bold" font-size="13">0.25</text>
              <ellipse cx="72" cy="34" rx="22" ry="26" fill="#06b6d4" stroke="#cffafe" stroke-width="2"/>
              <text x="72" y="39" text-anchor="middle" fill="#fff" font-family="Fredoka" font-weight="bold" font-size="15">0.5</text>
              <ellipse cx="100" cy="48" rx="19" ry="23" fill="#facc15" stroke="#fef08a" stroke-width="2"/>
              <text x="100" y="53" text-anchor="middle" fill="#0f172a" font-family="Fredoka" font-weight="bold" font-size="13">0.75</text>
            </svg>`;
        }
        if (topicKey === 'ratios') {
          // Groups of colourful objects SVG
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <rect x="14" y="22" width="112" height="68" rx="16" fill="#1e293b" stroke="#f472b6" stroke-width="2.5"/>
              <circle cx="34" cy="44" r="10" fill="#ef4444" stroke="#fecaca" stroke-width="2"/>
              <circle cx="58" cy="44" r="10" fill="#ef4444" stroke="#fecaca" stroke-width="2"/>
              <circle cx="82" cy="44" r="10" fill="#ef4444" stroke="#fecaca" stroke-width="2"/>
              <circle cx="46" cy="70" r="10" fill="#22c55e" stroke="#bbf7d0" stroke-width="2"/>
              <circle cx="70" cy="70" r="10" fill="#22c55e" stroke="#bbf7d0" stroke-width="2"/>
              <text x="108" y="62" text-anchor="middle" fill="#fde047" font-family="Fredoka" font-weight="bold" font-size="18">3:2</text>
            </svg>`;
        }
        // Shapes: Geometric toy houses SVG
        return `
          <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
            <polygon points="70,12 28,50 112,50" fill="#f43f5e" stroke="#fecdd3" stroke-width="2.5"/>
            <rect x="38" y="50" width="64" height="48" rx="4" fill="#38bdf8" stroke="#e0f2fe" stroke-width="2.5"/>
            <rect x="61" y="68" width="18" height="30" rx="3" fill="#facc15" stroke="#ffffff" stroke-width="2"/>
            <rect x="44" y="58" width="12" height="12" rx="2" fill="#fde047"/>
            <rect x="84" y="58" width="12" height="12" rx="2" fill="#fde047"/>
          </svg>`;
      } else {
        // Grade 6 Advanced Visuals (Crystal Fractions, Orbital Decimals, Starship Ratios, 3D Prisms)
        if (topicKey === 'fractions') {
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <polygon points="45,14 68,32 58,92 32,92 22,32" fill="#a855f7" stroke="#f3e8ff" stroke-width="2.5"/>
              <polygon points="95,20 116,36 108,92 82,92 74,36" fill="#06b6d4" stroke="#cffafe" stroke-width="2.5"/>
              <text x="70" y="62" text-anchor="middle" fill="#fde047" font-family="Fredoka" font-weight="bold" font-size="16">3/4 ÷ 1/8</text>
            </svg>`;
        }
        if (topicKey === 'decimals') {
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <rect x="18" y="28" width="104" height="54" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
              <rect x="26" y="38" width="66" height="16" rx="6" fill="#22d3ee"/>
              <text x="70" y="72" text-anchor="middle" fill="#fde047" font-family="Fredoka" font-weight="bold" font-size="16">0.375 × 100</text>
            </svg>`;
        }
        if (topicKey === 'ratios') {
          return `
            <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
              <path d="M30 75 L70 16 L110 75 Z" fill="#ec4899" stroke="#fbcfe8" stroke-width="2.5"/>
              <circle cx="70" cy="52" r="12" fill="#38bdf8" stroke="#fff" stroke-width="2"/>
              <text x="70" y="96" text-anchor="middle" fill="#fde047" font-family="Fredoka" font-weight="bold" font-size="15">50 km/h • 3:5</text>
            </svg>`;
        }
        return `
          <svg viewBox="0 0 140 110" class="w-28 h-24 mx-auto drop-shadow-lg">
            <polygon points="70,14 114,34 114,78 70,98 26,78 26,34" fill="#6366f1" stroke="#e0e7ff" stroke-width="2.5"/>
            <polyline points="26,34 70,54 114,34" fill="none" stroke="#e0e7ff" stroke-width="2.5"/>
            <line x1="70" y1="54" x2="70" y2="98" stroke="#e0e7ff" stroke-width="2.5"/>
            <text x="70" y="44" text-anchor="middle" fill="#fde047" font-family="Fredoka" font-weight="bold" font-size="13">V = l×w×h</text>
          </svg>`;
      }
    }

    function renderGradeWorld(grade) {
      const student = APP_STATE.currentStudent;
      if (!student) return;

      const gridId = grade === 5 ? 'grade5-topic-grid' : 'grade6-topic-grid';
      const grid = document.getElementById(gridId);
      if (!grid) return;

      const topics = CURRICULUM[grade].topics;
      const topicKeys = ['fractions', 'decimals', 'ratios', 'shapes'];

      // If Grade 6, also populate Grade 6's dedicated dashboard strip
      if (grade === 6) {
        const dash = document.getElementById('grade6-dashboard-strip');
        if (dash) {
          const completedCount = (student.completed_lessons || []).length;
          const totalQuiz = Object.values(student.quiz_scores || {}).reduce((a, b) => a + b, 0);
          dash.innerHTML = `
            <div class="toy-card p-4 border border-purple-300/40 flex items-center gap-3">
              <span class="text-3xl">⭐</span>
              <div>
                <div class="text-xs text-purple-200 font-bold uppercase">Champion Stars</div>
                <div class="font-heading text-2xl font-bold text-yellow-300">${student.stars} Stars</div>
              </div>
            </div>
            <div class="toy-card p-4 border border-cyan-300/40 flex items-center gap-3">
              <span class="text-3xl">🔮</span>
              <div>
                <div class="text-xs text-cyan-200 font-bold uppercase">Modules Mastered</div>
                <div class="font-heading text-2xl font-bold text-white">${completedCount} / 4</div>
              </div>
            </div>
            <div class="toy-card p-4 border border-pink-300/40 flex items-center gap-3">
              <span class="text-3xl">🎯</span>
              <div>
                <div class="text-xs text-pink-200 font-bold uppercase">Arena Score</div>
                <div class="font-heading text-2xl font-bold text-emerald-300">${totalQuiz} / 16</div>
              </div>
            </div>
            <div class="toy-card p-4 border border-yellow-300/40 flex items-center gap-3">
              <span class="text-3xl">🏅</span>
              <div>
                <div class="text-xs text-yellow-200 font-bold uppercase">Cosmic Badges</div>
                <div class="font-heading text-2xl font-bold text-amber-300">${(student.badges || []).length} Unlocked</div>
              </div>
            </div>
          `;
        }
      }

      grid.innerHTML = topicKeys
        .map((key, idx) => {
          const t = topics[key];
          const isDone = (student.completed_lessons || []).includes(key);
          const bestQuiz = (student.quiz_scores && student.quiz_scores[key]) || 0;
          const floatClass = idx % 2 === 0 ? 'animate-float' : 'animate-float-delayed';
          return `
            <div class="toy-card toy-card-interactive p-6 flex flex-col justify-between relative overflow-hidden ${floatClass}">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="px-3 py-1 rounded-full bg-gradient-to-r ${t.badgeColor} text-white font-heading font-bold text-xs shadow">
                    Island ${idx + 1}
                  </span>
                  <span class="px-2.5 py-1 rounded-full ${isDone ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-300/50' : 'bg-white/10 text-cyan-200'} font-bold text-xs">
                    ${isDone ? '✅ Lesson Done' : '✨ Ready'}
                  </span>
                </div>

                <!-- Fun 3D Toy Illustration -->
                <div class="my-2 py-3 rounded-2xl bg-slate-950/55 border border-white/15">
                  ${getTopicIllustrationSVG(grade, key)}
                </div>

                <h2 class="font-heading text-2xl sm:text-3xl font-bold text-white mt-3">
                  ${t.title}
                </h2>
                <div class="text-sm font-extrabold text-yellow-300">${t.subtitle}</div>
                <p class="text-sm text-cyan-100 mt-2 leading-relaxed">
                  ${t.cardDesc}
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-white/15 space-y-2.5">
                <div class="flex items-center justify-between text-xs font-bold text-cyan-200">
                  <span>Quiz Best Score:</span>
                  <span class="text-yellow-300">${bestQuiz} / 4 ⭐</span>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick="startTopicLesson('${key}')"
                    class="btn-3d ${grade === 5 ? 'btn-green' : 'btn-purple'} flex-1 py-3 text-base sm:text-lg"
                  >
                    <span>🚀</span> <span>Start</span>
                  </button>
                  <button
                    type="button"
                    onclick="startGradeQuiz(${grade}, '${key}')"
                    class="btn-3d btn-gold px-4 py-3 text-sm sm:text-base"
                    title="Jump to ${t.title} Quiz"
                  >
                    🎯 Quiz
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    function startTopicLesson(topicKey) {
      APP_STATE.currentTopic = topicKey;
      APP_STATE.currentLessonStep = 0;
      navigateTo('lesson', topicKey);
    }

    function startGradeQuiz(grade, topicKey) {
      if (!APP_STATE.currentStudent || Number(APP_STATE.currentStudent.grade) !== Number(grade)) {
        showToast('Access Denied: Grade mismatch!', 'error');
        return;
      }
      APP_STATE.currentTopic = topicKey;
      navigateTo('quiz', topicKey);
    }

    // -------------------------------------------------------------------------

    // 10. 3D QUIZ ARENA LOGIC (Server-Side Answer Verification, Never Fakes Scores)
    // -------------------------------------------------------------------------
    function switchQuizTopic(topicKey) {
      playGameSound('click');
      APP_STATE.currentTopic = topicKey;
      initQuizArena(Number(APP_STATE.currentStudent.grade), topicKey);
    }

    function initQuizArena(grade, topicKey) {
      const topicObj = CURRICULUM[grade].topics[topicKey];
      APP_STATE.quizQuestions = topicObj.quiz;
      APP_STATE.quizCurrentIndex = 0;
      APP_STATE.quizSelectedOption = null;
      APP_STATE.quizSubmitted = false;
      APP_STATE.quizRoundScore = 0;

      document.getElementById('quiz-mascot-avatar').textContent = grade === 5 ? '🦊' : '🤖';
      document.getElementById('quiz-topic-badge').textContent = `${topicObj.icon} Grade ${grade} ${topicObj.title}`;
      document.getElementById('quiz-active-container').classList.remove('hidden');
      document.getElementById('quiz-summary-container').classList.add('hidden');
      renderCurrentQuizQuestion();
    }

    function renderCurrentQuizQuestion() {
      const q = APP_STATE.quizQuestions[APP_STATE.quizCurrentIndex];
      const total = APP_STATE.quizQuestions.length;
      if (!q) return;

      APP_STATE.quizSelectedOption = null;
      APP_STATE.quizSubmitted = false;

      document.getElementById('quiz-question-counter').textContent = `Question ${APP_STATE.quizCurrentIndex + 1} of ${total}`;
      document.getElementById('quiz-difficulty-badge').textContent = `⭐ ${q.difficulty}`;
      document.getElementById('quiz-progress-bar').style.width = `${Math.round(((APP_STATE.quizCurrentIndex + 1) / total) * 100)}%`;
      document.getElementById('quiz-question-text').textContent = q.question;

      // Hide feedback and Next button until answer is submitted
      document.getElementById('quiz-feedback-box').classList.add('hidden');
      document.getElementById('btn-quiz-submit').classList.remove('hidden');
      document.getElementById('btn-quiz-next').classList.add('hidden');

      renderQuizOptionCards();
    }

    function renderQuizOptionCards(verifiedResult) {
      const q = APP_STATE.quizQuestions[APP_STATE.quizCurrentIndex];
      const grid = document.getElementById('quiz-options-grid');
      if (!grid || !q) return;

      const badgeLetters = ['A', 'B', 'C', 'D'];
      grid.innerHTML = q.options
        .map((optText, idx) => {
          const isSelected = APP_STATE.quizSelectedOption === idx;
          let cardStyle = 'bg-slate-900/80 border-white/25 hover:border-yellow-300 text-white';

          if (!APP_STATE.quizSubmitted && isSelected) {
            cardStyle = 'bg-sky-600/80 border-yellow-300 ring-4 ring-yellow-300/50 text-white scale-[1.02]';
          } else if (APP_STATE.quizSubmitted && verifiedResult) {
            if (idx === verifiedResult.correct_index) {
              cardStyle = 'bg-emerald-600/90 border-emerald-200 ring-4 ring-emerald-300/60 text-white';
            } else if (isSelected && !verifiedResult.correct) {
              cardStyle = 'bg-rose-700/85 border-rose-300 text-white opacity-90';
            } else {
              cardStyle = 'bg-slate-900/50 border-white/10 text-slate-400 opacity-65';
            }
          }

          return `
            <button
              type="button"
              onclick="selectQuizOption(${idx})"
              ${APP_STATE.quizSubmitted ? 'disabled' : ''}
              class="toy-card p-5 sm:p-6 text-left flex items-center gap-4 border-3 transition-all ${cardStyle}"
            >
              <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 font-heading font-bold text-xl flex items-center justify-center shrink-0 shadow">
                ${badgeLetters[idx]}
              </span>
              <span class="font-heading text-2xl sm:text-3xl font-bold">${optText}</span>
            </button>
          `;
        })
        .join('');
    }

    function selectQuizOption(idx) {
      if (APP_STATE.quizSubmitted) return;
      playGameSound('click');
      APP_STATE.quizSelectedOption = idx;
      renderQuizOptionCards();
    }

    async function submitQuizAnswer() {
      if (APP_STATE.quizSubmitted) return;
      if (APP_STATE.quizSelectedOption === null) {
        playGameSound('tryagain');
        showToast('Tap one of the 4 floating answer cards first! 🎯', 'warning');
        return;
      }

      const student = APP_STATE.currentStudent;
      const q = APP_STATE.quizQuestions[APP_STATE.quizCurrentIndex];

      try {
        const result = await callFastApi(
          `/grades/${student.grade}/quiz/${APP_STATE.currentTopic}/verify`,
          'POST',
          {
            question_id: q.id,
            selected_index: APP_STATE.quizSelectedOption
          }
        );

        APP_STATE.quizSubmitted = true;
        APP_STATE.currentStudent = result.student;
        if (result.correct) {
          APP_STATE.quizRoundScore += 1;
          triggerStarCelebration();
        } else {
          playGameSound('tryagain');
        }
        updateNavbarHUD();
        renderQuizOptionCards(result);

        // Show required feedback messages verbatim:
        // Correct: "Awesome! You earned 1 star!"
        // Incorrect: "Nice try! Let's learn together."
        const fbBox = document.getElementById('quiz-feedback-box');
        const fbIcon = document.getElementById('quiz-feedback-icon');
        const fbHead = document.getElementById('quiz-feedback-headline');
        const fbAns = document.getElementById('quiz-feedback-correct-ans');
        const fbExp = document.getElementById('quiz-feedback-explanation');

        fbBox.classList.remove('hidden', 'bg-emerald-900/85', 'border-emerald-300', 'text-emerald-100', 'bg-rose-900/85', 'border-rose-300', 'text-rose-100');
        if (result.correct) {
          fbBox.classList.add('bg-emerald-900/85', 'border-emerald-300', 'text-emerald-100');
          fbIcon.textContent = '🌟';
          fbHead.textContent = 'Awesome! You earned 1 star!';
        } else {
          fbBox.classList.add('bg-rose-900/85', 'border-rose-300', 'text-rose-100');
          fbIcon.textContent = '💡';
          fbHead.textContent = "Nice try! Let's learn together.";
        }
        fbAns.textContent = `Correct Answer: ${result.correct_answer}`;
        fbExp.textContent = result.explanation;

        document.getElementById('btn-quiz-submit').classList.add('hidden');
        const nextBtn = document.getElementById('btn-quiz-next');
        nextBtn.classList.remove('hidden');
        nextBtn.innerHTML =
          APP_STATE.quizCurrentIndex < APP_STATE.quizQuestions.length - 1
            ? '<span>Next Question</span> <span>➔</span>'
            : '<span>See Arena Results</span> <span>🏆</span>';
      } catch (err) {
        showToast(err.message || 'Could not verify quiz answer.', 'error');
      }
    }

    function nextQuizQuestion() {
      playGameSound('click');
      if (APP_STATE.quizCurrentIndex < APP_STATE.quizQuestions.length - 1) {
        APP_STATE.quizCurrentIndex += 1;
        renderCurrentQuizQuestion();
      } else {
        document.getElementById('quiz-active-container').classList.add('hidden');
        const summary = document.getElementById('quiz-summary-container');
        summary.classList.remove('hidden');
        document.getElementById('quiz-summary-text').textContent =
          `You answered ${APP_STATE.quizRoundScore} out of ${APP_STATE.quizQuestions.length} questions right in this round! Your total stars: ${APP_STATE.currentStudent.stars} ⭐`;
        triggerStarCelebration();
      }
    }

    function restartCurrentQuiz() {
      playGameSound('click');
      initQuizArena(Number(APP_STATE.currentStudent.grade), APP_STATE.currentTopic);
    }

    // -------------------------------------------------------------------------
    // 11. MY STARS (REWARDS, 3D TROPHIES & PROGRESS PATH) & MY PROFILE
    // -------------------------------------------------------------------------
    function renderStarsScreen() {
      const student = APP_STATE.currentStudent;
      if (!student) return;
      const grade = Number(student.grade);
      const topics = CURRICULUM[grade].topics;

      document.getElementById('stars-total-big').textContent = `${student.stars} ⭐`;
      document.getElementById('stars-student-subtitle').textContent =
        `${student.display_name}'s Grade ${grade} Reward Vault • Only your own verified student progress is shown here!`;

      // 1. Progress Path across the 4 islands
      const pathEl = document.getElementById('stars-progress-path');
      const keys = ['fractions', 'decimals', 'ratios', 'shapes'];
      pathEl.innerHTML = keys
        .map((key, idx) => {
          const t = topics[key];
          const lessonDone = (student.completed_lessons || []).includes(key);
          const quizScore = (student.quiz_scores && student.quiz_scores[key]) || 0;
          return `
            <div class="bg-slate-900/80 p-4 rounded-2xl border-2 ${lessonDone ? 'border-emerald-400' : 'border-white/15'} flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-cyan-300">Stop ${idx + 1}</span>
                  <span class="${lessonDone ? 'text-emerald-300' : 'text-amber-300'}">${lessonDone ? '✅ Lesson Done' : '⏳ In Progress'}</span>
                </div>
                <div class="font-heading text-xl font-bold text-white mt-1 flex items-center gap-2">
                  <span>${t.icon}</span> <span>${t.title}</span>
                </div>
              </div>
              <div class="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                <span class="text-slate-300">Best Quiz Score:</span>
                <span class="text-yellow-300 text-sm">${quizScore} / 4 ⭐</span>
              </div>
            </div>
          `;
        })
        .join('');

      // 2. 3D Trophies
      const trophies = [
        { title: 'Bronze Explorer Cup', reqStars: 3, icon: '🥉', color: 'from-amber-600 to-yellow-800' },
        { title: 'Silver Island Trophy', reqStars: 6, icon: '🥈', color: 'from-slate-300 to-slate-500' },
        { title: 'Golden Math Legend', reqStars: 10, icon: '🏆', color: 'from-yellow-300 to-amber-500' }
      ];
      document.getElementById('stars-trophies-grid').innerHTML = trophies
        .map((tr) => {
          const unlocked = student.stars >= tr.reqStars;
          return `
            <div class="p-4 rounded-2xl border-2 text-center ${unlocked ? 'bg-slate-900/90 border-yellow-300 shadow-lg' : 'bg-slate-950/50 border-white/10 opacity-60'}">
              <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${tr.color} flex items-center justify-center text-4xl shadow-md border-2 border-white">
                ${tr.icon}
              </div>
              <div class="font-heading font-bold text-base text-white mt-2">${tr.title}</div>
              <div class="text-xs font-bold mt-1 ${unlocked ? 'text-emerald-300' : 'text-amber-300'}">
                ${unlocked ? '✨ Unlocked!' : `Needs ${tr.reqStars} ⭐`}
              </div>
            </div>
          `;
        })
        .join('');

      // 3. Achievement Badges
      const allBadges = [
        { id: 'first_login', name: 'First Voyage', icon: '🧭', unlocked: true },
        { id: 'fraction_slicer', name: 'Pizza Slicer', icon: '🍕', unlocked: (student.completed_lessons || []).includes('fractions') },
        { id: 'balloon_captain', name: 'Balloon Pilot', icon: '🎈', unlocked: (student.completed_lessons || []).includes('decimals') },
        { id: 'ratio_ranger', name: 'Ratio Ranger', icon: '🍎', unlocked: (student.completed_lessons || []).includes('ratios') },
        { id: 'shape_builder', name: 'Shape Architect', icon: '🏠', unlocked: (student.completed_lessons || []).includes('shapes') },
        { id: 'star_collector', name: 'Star Champion', icon: '🌟', unlocked: student.stars >= 8 }
      ];
      document.getElementById('stars-badges-grid').innerHTML = allBadges
        .map((b) => `
          <div class="p-3.5 rounded-2xl border ${b.unlocked ? 'bg-purple-900/50 border-purple-300 text-white' : 'bg-slate-950/50 border-white/10 text-slate-400 opacity-60'} flex items-center gap-3">
            <span class="text-3xl">${b.icon}</span>
            <div>
              <div class="font-heading font-bold text-sm leading-tight">${b.name}</div>
              <div class="text-[11px] font-bold ${b.unlocked ? 'text-yellow-300' : 'text-slate-400'}">${b.unlocked ? 'Earned!' : 'Locked'}</div>
            </div>
          </div>
        `)
        .join('');
    }

    function renderProfileScreen() {
      const student = APP_STATE.currentStudent;
      if (!student) return;
      document.getElementById('profile-avatar-box').textContent = student.avatar || (student.grade === 5 ? '🦊' : '🤖');
      document.getElementById('profile-grade-pill').textContent = `Assigned Grade ${student.grade}`;
      document.getElementById('profile-display-name').textContent = student.display_name;
      document.getElementById('profile-username').textContent = student.username;
      document.getElementById('profile-stat-stars').textContent = student.stars;
      document.getElementById('profile-stat-lessons').textContent = `${(student.completed_lessons || []).length} / 4`;

      const totalQuiz = Object.values(student.quiz_scores || {}).reduce((a, b) => a + b, 0);
      document.getElementById('profile-stat-quizzes').textContent = `${totalQuiz} / 16`;
      document.getElementById('profile-security-grade').textContent = `Grade ${student.grade}`;
    }

    function updateStudentAvatar(emoji) {
      playGameSound('click');
      if (!APP_STATE.currentStudent) return;
      APP_STATE.currentStudent.avatar = emoji;
      if (LOCAL_STUDENTS_DB[APP_STATE.currentStudent.username]) {
        LOCAL_STUDENTS_DB[APP_STATE.currentStudent.username].avatar = emoji;
        safeSetStorage('mathquest_students_v2', LOCAL_STUDENTS_DB);
      }
      updateNavbarHUD();
      renderProfileScreen();
      showToast(`Avatar updated to ${emoji}!`, 'success');
    }

    // -------------------------------------------------------------------------

    // Initialize on load (Never auto-logs in; starts cleanly on Login screen)
    window.addEventListener('load', () => {
      initThreeWorld();
      selectLoginGrade(5);
      saveApiBaseUrl();
    });
