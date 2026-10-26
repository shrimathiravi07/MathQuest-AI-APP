    // 3. SYNTHESIZED WEB AUDIO SOUND EFFECTS (No external audio files, respects mute)
    // -------------------------------------------------------------------------
    let audioCtx = null;

    function playGameSound(type) {
      if (!APP_STATE.soundEnabled) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'star') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
          osc.frequency.setValueAtTime(1046.5, now + 0.27); // C6
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.start(now);
          osc.stop(now + 0.48);
        } else if (type === 'tryagain') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.linearRampToValueAtTime(260, now + 0.22);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        }
      } catch (e) {
        // Ignore audio errors if blocked
      }
    }

    function toggleSound() {
      APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) btn.textContent = APP_STATE.soundEnabled ? '🔊' : '🔇';
      showToast(APP_STATE.soundEnabled ? 'Sound effects enabled! 🔊' : 'Sound effects muted 🔇', 'info');
      if (APP_STATE.soundEnabled) playGameSound('click');
    }

    function toggleReducedMotion() {
      APP_STATE.reducedMotion = !APP_STATE.reducedMotion;
      document.body.classList.toggle('reduced-motion', APP_STATE.reducedMotion);
      const btn = document.getElementById('btn-motion-toggle');
      if (btn) btn.textContent = APP_STATE.reducedMotion ? '🛑' : '✨';
      showToast(
        APP_STATE.reducedMotion
          ? 'Reduced Motion enabled: gentle static view active.'
          : '3D floating animations enabled! ✨',
        'info'
      );
    }

    // -------------------------------------------------------------------------

// Expose sound helpers
window.playGameSound = playGameSound;
window.playTone = typeof playTone !== 'undefined' ? playTone : null;
