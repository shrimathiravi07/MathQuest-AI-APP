    // 4. TOAST & CELEBRATION HELPERS (No alert/confirm/prompt)
    // -------------------------------------------------------------------------
    function showToast(message, variant) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const colors = {
        success: 'bg-emerald-600 border-emerald-200 text-white',
        error: 'bg-rose-600 border-rose-200 text-white',
        warning: 'bg-amber-400 border-yellow-100 text-slate-950',
        info: 'bg-sky-600 border-sky-200 text-white'
      };
      const toast = document.createElement('div');
      toast.className = `px-4 py-3 rounded-2xl border-2 shadow-2xl font-heading font-semibold text-sm sm:text-base flex items-center gap-2 transition-all duration-300 pointer-events-auto ${colors[variant] || colors.info}`;
      toast.innerHTML = `<span>✨</span><span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        setTimeout(() => toast.remove(), 300);
      }, 3400);
    }

    function triggerStarCelebration() {
      playGameSound('star');
      if (APP_STATE.reducedMotion) return;
      const layer = document.getElementById('celebration-layer');
      if (!layer) return;
      const symbols = ['⭐', '🌟', '✨', '🏆', '🎉', '💫'];
      for (let i = 0; i < 22; i++) {
        const el = document.createElement('div');
        el.textContent = symbols[i % symbols.length];
        el.style.position = 'absolute';
        el.style.left = `${15 + Math.random() * 70}%`;
        el.style.top = `${55 + Math.random() * 20}%`;
        el.style.fontSize = `${20 + Math.random() * 22}px`;
        el.style.transition = 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.1s ease';
        layer.appendChild(el);
        requestAnimationFrame(() => {
          const dx = (Math.random() - 0.5) * 260;
          const dy = -120 - Math.random() * 220;
          el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg) scale(1.25)`;
          el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 1150);
      }
    }

    // Text-to-Speech (TTS) Engine
    function speakText(text) {
      if (!('speechSynthesis' in window)) {
        showToast('Text-to-speech is not supported in this browser.', 'warning');
        return;
      }
      const synth = window.speechSynthesis;
      if (synth.speaking) {
        synth.cancel();
      }
      if (!text || !text.trim()) return;
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 0.95;
      utterance.pitch = 1.08;
      synth.speak(utterance);
    }

    function stopSpeaking() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    const launchConfetti = triggerStarCelebration;

    // -------------------------------------------------------------------------

// Expose UI celebration & speech helpers
window.showToast = showToast;
window.triggerStarCelebration = triggerStarCelebration;
window.launchConfetti = launchConfetti;
window.speakText = speakText;
window.stopSpeaking = stopSpeaking;
