    // 5. FASTAPI CLIENT WITH AUTOMATIC SANDBOX FALLBACK
    // -------------------------------------------------------------------------
    async function callFastApi(endpoint, method, bodyObj) {
      const fullUrl = `${APP_STATE.apiBaseUrl.replace(/\/$/, '')}${endpoint}`;
      const headers = { 'Content-Type': 'application/json' };
      if (APP_STATE.sessionToken) {
        headers['Authorization'] = `Bearer ${APP_STATE.sessionToken}`;
      }

      // 1. Try live FastAPI server first with short timeout
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 900);
        const response = await fetch(fullUrl, {
          method: method || 'GET',
          headers,
          body: bodyObj ? JSON.stringify(bodyObj) : undefined,
          signal: controller.signal
        });
        clearTimeout(timer);
        APP_STATE.backendLive = true;
        updateBackendStatusBadge(true);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'FastAPI validation error');
        }
        return data;
      } catch (err) {
        // If it was an explicit HTTP 401/403/400 returned from a live FastAPI server, rethrow it
        if (APP_STATE.backendLive && err.message && !err.message.includes('Failed to fetch') && err.name !== 'AbortError') {
          throw err;
        }
        // Otherwise, FastAPI server is not running on localhost:8000 (e.g. inside Canvas iframe)
        APP_STATE.backendLive = false;
        updateBackendStatusBadge(false);
        return simulateFastApiEndpoint(endpoint, method || 'GET', bodyObj);
      }
    }

    function updateBackendStatusBadge(isLive) {
      const dot = document.getElementById('api-status-dot');
      const label = document.getElementById('api-status-label');
      const modalStatus = document.getElementById('api-modal-ping-status');
      if (isLive) {
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
        if (label) label.textContent = 'FastAPI Live Connected';
        if (modalStatus) modalStatus.textContent = `Connected to Live FastAPI Backend at ${APP_STATE.apiBaseUrl}`;
      } else {
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
        if (label) label.textContent = 'FastAPI Auth Engine (Sandbox)';
        if (modalStatus) {
          modalStatus.textContent = `Sandbox Mode: Live FastAPI server at ${APP_STATE.apiBaseUrl} not detected; using built-in FastAPI route & grade-authorization verifier.`;
        }
      }
    }

    function simulateFastApiEndpoint(endpoint, method, body) {
      // Exact mirror of backend/main.py authentication & grade-authorization logic
      if (endpoint === '/auth/login' && method === 'POST') {
        const uname = (body.username || '').trim().toLowerCase();
        const student = LOCAL_STUDENTS_DB[uname];
        if (!student || student.password_key !== body.password) {
          throw new Error("Hmm, that username or password didn't match! Check your spelling or use a demo student pill below.");
        }
        if (Number(student.grade) !== Number(body.grade)) {
          throw new Error(
            `Grade Mismatch! Student "${student.username}" is assigned to Grade ${student.grade}. Grade ${body.grade} is locked for this account — please select Grade ${student.grade}!`
          );
        }
        const token = 'mq_tok_' + Math.random().toString(36).slice(2) + '_' + student.grade;
        return { token, student: JSON.parse(JSON.stringify(student)) };
      }

      if (endpoint === '/auth/register' && method === 'POST') {
        const uname = (body.username || '').trim().toLowerCase();
        if (LOCAL_STUDENTS_DB[uname]) {
          throw new Error('That Explorer username is already taken! Try adding a lucky number.');
        }
        const newStudent = {
          username: uname,
          display_name: (body.display_name || uname).trim(),
          password_key: body.password,
          grade: Number(body.grade),
          avatar: Number(body.grade) === 5 ? '🦊' : '🤖',
          stars: 1,
          completed_lessons: [],
          quiz_scores: { fractions: 0, decimals: 0, ratios: 0, shapes: 0 },
          badges: ['first_login']
        };
        LOCAL_STUDENTS_DB[uname] = newStudent;
        safeSetStorage('mathquest_students_v2', LOCAL_STUDENTS_DB);
        const token = 'mq_tok_' + Math.random().toString(36).slice(2) + '_' + newStudent.grade;
        return { token, student: JSON.parse(JSON.stringify(newStudent)) };
      }

      if (endpoint === '/auth/logout' && method === 'POST') {
        return { message: 'Logged out safely!' };
      }

      // All protected routes below require an active authenticated student
      if (!APP_STATE.currentStudent || !APP_STATE.sessionToken) {
        throw new Error('Unauthorized: Please log in first.');
      }

      const activeRecord = LOCAL_STUDENTS_DB[APP_STATE.currentStudent.username];
      if (!activeRecord) {
        throw new Error('Session expired. Please log in again.');
      }

      // Grade-restricted routes: /grades/{grade}/...
      const gradeMatch = endpoint.match(/^\/grades\/(\d+)/);
      if (gradeMatch) {
        const requestedGrade = Number(gradeMatch[1]);
        if (Number(activeRecord.grade) !== requestedGrade) {
          throw new Error(
            `Access Denied (403): Grade ${activeRecord.grade} students cannot access Grade ${requestedGrade} content!`
          );
        }
      }

      const completeMatch = endpoint.match(/^\/grades\/(\d+)\/lessons\/([a-z]+)\/complete$/);
      if (completeMatch && method === 'POST') {
        const topic = completeMatch[2];
        let awarded = false;
        if (!activeRecord.completed_lessons.includes(topic)) {
          activeRecord.completed_lessons.push(topic);
          activeRecord.stars += 1;
          awarded = true;
        }
        if (activeRecord.completed_lessons.length >= 2 && !activeRecord.badges.includes('island_explorer')) {
          activeRecord.badges.push('island_explorer');
        }
        safeSetStorage('mathquest_students_v2', LOCAL_STUDENTS_DB);
        return { student: JSON.parse(JSON.stringify(activeRecord)), awarded_star: awarded };
      }

      const verifyMatch = endpoint.match(/^\/grades\/(\d+)\/quiz\/([a-z]+)\/verify$/);
      if (verifyMatch && method === 'POST') {
        const grade = Number(verifyMatch[1]);
        const topic = verifyMatch[2];
        const questions = CURRICULUM[grade].topics[topic].quiz;
        const q = questions.find((item) => item.id === body.question_id);
        if (!q) throw new Error('Question not found');
        const isCorrect = Number(body.selected_index) === Number(q.correctIndex);
        if (isCorrect) {
          activeRecord.stars += 1;
          const prev = activeRecord.quiz_scores[topic] || 0;
          activeRecord.quiz_scores[topic] = Math.min(4, Math.max(prev, APP_STATE.quizRoundScore + 1));
          if (activeRecord.stars >= 8 && !activeRecord.badges.includes('star_collector')) {
            activeRecord.badges.push('star_collector');
          }
          safeSetStorage('mathquest_students_v2', LOCAL_STUDENTS_DB);
        }
        return {
          correct: isCorrect,
          feedback: isCorrect ? 'Awesome! You earned 1 star!' : "Nice try! Let's learn together.",
          correct_index: q.correctIndex,
          correct_answer: q.options[q.correctIndex],
          explanation: q.explanation,
          student: JSON.parse(JSON.stringify(activeRecord))
        };
      }

      return { status: 'ok', student: JSON.parse(JSON.stringify(activeRecord)) };
    }

    function toggleApiModal(show) {
      const modal = document.getElementById('api-config-modal');
      if (!modal) return;
      modal.classList.toggle('hidden', !show);
    }

    async function saveApiBaseUrl() {
      const input = document.getElementById('input-api-base-url');
      if (!input || !input.value.trim()) return;
      APP_STATE.apiBaseUrl = input.value.trim();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1000);
        const healthUrl = APP_STATE.apiBaseUrl.replace(/\/$/, '') + '/health';
        const res = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          APP_STATE.backendLive = true;
          updateBackendStatusBadge(true);
          showToast('Connected to live FastAPI server!', 'success');
          return;
        }
      } catch (e) {
        // Fallback remains active
      }
      APP_STATE.backendLive = false;
      updateBackendStatusBadge(false);
      showToast('Saved URL! Using built-in FastAPI verifier while localhost is offline.', 'info');
    }

    // -------------------------------------------------------------------------

// Expose API client helpers
window.callFastApi = callFastApi;
window.saveApiBaseUrl = typeof saveApiBaseUrl !== 'undefined' ? saveApiBaseUrl : null;
window.toggleApiModal = typeof toggleApiModal !== 'undefined' ? toggleApiModal : null;
window.pingFastApi = typeof pingFastApi !== 'undefined' ? pingFastApi : null;
