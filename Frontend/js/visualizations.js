    // 9. INTERACTIVE LESSON SCREEN & 3D MANIPULATIVES (PIZZA, BALLOONS, RATIOS, SHAPES)
    // -------------------------------------------------------------------------
    function openLessonTopic(topicKey) {
      playGameSound('click');
      APP_STATE.currentTopic = topicKey;
      APP_STATE.currentLessonStep = 0;
      if (topicKey === 'fractions') {
        APP_STATE.pizzaTotalSlices = APP_STATE.currentStudent && APP_STATE.currentStudent.grade === 6 ? 8 : 4;
        APP_STATE.pizzaSelectedSlices = APP_STATE.pizzaTotalSlices === 8
          ? [true, true, true, true, true, true, false, false]
          : [true, false, false, false];
      }
      renderLessonScreen();
    }

    function changeLessonStep(delta) {
      playGameSound('click');
      const grade = Number(APP_STATE.currentStudent.grade);
      const topicObj = CURRICULUM[grade].topics[APP_STATE.currentTopic];
      const maxStep = topicObj.steps.length - 1;
      APP_STATE.currentLessonStep = Math.max(0, Math.min(maxStep, APP_STATE.currentLessonStep + delta));
      renderLessonScreen();
    }

    function renderLessonScreen() {
      const student = APP_STATE.currentStudent;
      if (!student) return;
      const grade = Number(student.grade);
      const topicKey = APP_STATE.currentTopic;
      const topicObj = CURRICULUM[grade].topics[topicKey];
      const stepObj = topicObj.steps[APP_STATE.currentLessonStep] || topicObj.steps[0];

      // Update topic tab highlights
      ['fractions', 'decimals', 'ratios', 'shapes'].forEach((k) => {
        const tab = document.getElementById(`tab-lesson-${k}`);
        if (!tab) return;
        if (k === topicKey) {
          tab.className = 'px-4 py-2 rounded-2xl font-heading font-bold text-sm sm:text-base transition bg-yellow-400 text-slate-950 shadow-md scale-105';
        } else {
          tab.className = 'px-4 py-2 rounded-2xl font-heading font-bold text-sm sm:text-base transition bg-white/10 text-white hover:bg-white/20';
        }
      });

      document.getElementById('lesson-grade-chip').textContent = `Grade ${grade} • ${topicObj.title}`;
      document.getElementById('lesson-step-indicator').textContent = `Step ${APP_STATE.currentLessonStep + 1} of ${topicObj.steps.length}`;
      document.getElementById('lesson-title').textContent = stepObj.heading;

      const expBox = document.getElementById('lesson-explanation-box');
      expBox.innerHTML = stepObj.lines
        .map((line, i) => `<p class="${i === stepObj.lines.length - 1 ? 'text-emerald-700 font-black' : ''}">${line}</p>`)
        .join('');

      document.getElementById('lesson-worked-example').textContent = stepObj.example;

      // Update Prev/Next button states
      const prevBtn = document.getElementById('btn-lesson-prev');
      const nextBtn = document.getElementById('btn-lesson-next');
      if (prevBtn) prevBtn.disabled = APP_STATE.currentLessonStep === 0;
      if (prevBtn) prevBtn.style.opacity = APP_STATE.currentLessonStep === 0 ? '0.45' : '1';
      if (nextBtn) {
        nextBtn.innerHTML =
          APP_STATE.currentLessonStep < topicObj.steps.length - 1
            ? '<span>Next</span> <span>➔</span>'
            : '<span>Restart Steps</span> <span>↺</span>';
        nextBtn.onclick = () => {
          if (APP_STATE.currentLessonStep < topicObj.steps.length - 1) {
            changeLessonStep(1);
          } else {
            APP_STATE.currentLessonStep = 0;
            renderLessonScreen();
          }
        };
      }

      renderInteractiveManipulative(grade, topicKey);
    }

    function renderInteractiveManipulative(grade, topicKey) {
      const stage = document.getElementById('manipulative-stage');
      const controls = document.getElementById('manipulative-controls');
      const titleEl = document.getElementById('manipulative-title');
      const readoutEl = document.getElementById('manipulative-readout');
      if (!stage || !controls) return;

      if (topicKey === 'fractions') {
        // Large Interactive 3D-Styled Pizza Divided into Equal Slices!
        const total = APP_STATE.pizzaTotalSlices || 4;
        if (APP_STATE.pizzaSelectedSlices.length !== total) {
          APP_STATE.pizzaSelectedSlices = Array.from({ length: total }, (_, i) => i === 0);
        }
        const selectedCount = APP_STATE.pizzaSelectedSlices.filter(Boolean).length;
        titleEl.textContent = grade === 5 ? 'Click Any Pizza Slice!' : 'Click 1/8 Crystal Pizza Slices!';
        readoutEl.textContent = `${selectedCount}/${total}`;

        // Build SVG pizza slices with polar coordinates
        const cx = 140;
        const cy = 140;
        const r = 108;
        let slicesSvg = '';
        for (let i = 0; i < total; i++) {
          const startAngle = (i * 2 * Math.PI) / total - Math.PI / 2;
          const endAngle = ((i + 1) * 2 * Math.PI) / total - Math.PI / 2;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const midAngle = (startAngle + endAngle) / 2;
          const isSelected = APP_STATE.pizzaSelectedSlices[i];
          const offset = isSelected ? 10 : 0;
          const tx = Math.cos(midAngle) * offset;
          const ty = Math.sin(midAngle) * offset;

          // Pepperoni & label positions
          const px = cx + r * 0.56 * Math.cos(midAngle);
          const py = cy + r * 0.56 * Math.sin(midAngle);
          const lx = cx + r * 0.72 * Math.cos(midAngle);
          const ly = cy + r * 0.72 * Math.sin(midAngle);

          const fillCrust = isSelected ? '#f59e0b' : '#78350f';
          const fillCheese = isSelected
            ? grade === 5 ? '#facc15' : '#c084fc'
            : '#334155';
          const pepColor = grade === 5 ? '#dc2626' : '#22d3ee';

          slicesSvg += `
            <g
              class="pizza-slice-path ${isSelected ? 'pizza-slice-selected' : ''}"
              transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)})"
              onclick="togglePizzaSlice(${i})"
              role="button"
              tabindex="0"
              aria-label="Pizza slice ${i + 1} of ${total}"
            >
              <path
                d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z"
                fill="${fillCheese}"
                stroke="${fillCrust}"
                stroke-width="6"
                stroke-linejoin="round"
              />
              <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${total === 4 ? 11 : 7}" fill="${pepColor}" opacity="${isSelected ? 1 : 0.4}" />
              <text x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle" fill="${isSelected ? '#0f172a' : '#cbd5e1'}" font-family="Fredoka" font-weight="bold" font-size="${total === 4 ? 16 : 13}">
                1/${total}
              </text>
            </g>
          `;
        }

        const pct = Math.round((selectedCount / total) * 100);
        stage.innerHTML = `
          <div class="flex flex-col items-center">
            <svg viewBox="0 0 280 280" class="w-60 h-60 sm:w-64 sm:h-64 drop-shadow-2xl select-none">
              <circle cx="140" cy="148" r="116" fill="#020617" opacity="0.55" />
              <circle cx="140" cy="140" r="116" fill="#451a03" stroke="#fbbf24" stroke-width="3" />
              ${slicesSvg}
            </svg>
            <div class="mt-2 text-center">
              <div class="font-heading text-lg sm:text-xl font-bold text-yellow-300">
                ${selectedCount} out of ${total} equal slices = <span class="text-white underline">${selectedCount}/${total}</span> (${pct}% of the pizza)
              </div>
              <div class="text-xs text-cyan-200 mt-0.5">
                Tap any slice above to put it on your plate or put it back!
              </div>
            </div>
          </div>
        `;

        controls.innerHTML = `
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-bold text-cyan-200 text-xs">Slice Pizza Into:</span>
            <button type="button" onclick="setPizzaTotalSlices(4)" class="px-3 py-1.5 rounded-xl font-bold text-xs ${total === 4 ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">4 Slices (Quarters)</button>
            <button type="button" onclick="setPizzaTotalSlices(6)" class="px-3 py-1.5 rounded-xl font-bold text-xs ${total === 6 ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">6 Slices (Sixths)</button>
            <button type="button" onclick="setPizzaTotalSlices(8)" class="px-3 py-1.5 rounded-xl font-bold text-xs ${total === 8 ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">8 Slices (Eighths)</button>
          </div>
          <button type="button" onclick="resetPizzaSlices()" class="px-3 py-1.5 rounded-xl bg-emerald-500/30 border border-emerald-300/40 text-emerald-200 font-bold text-xs">
            Show 1/4 Example
          </button>
        `;
      } else if (topicKey === 'decimals') {
        // Interactive Number Balloons
        const balloons = grade === 5
          ? [
              { val: 0.1, label: '0.1', frac: '1/10', color: 'from-pink-400 to-rose-600' },
              { val: 0.25, label: '0.25', frac: '1/4', color: 'from-cyan-400 to-blue-600' },
              { val: 0.25, label: '0.25', frac: '1/4', color: 'from-emerald-400 to-green-600' },
              { val: 0.4, label: '0.4', frac: '4/10', color: 'from-amber-400 to-orange-500' }
            ]
          : [
              { val: 0.125, label: '0.125', frac: '1/8', color: 'from-purple-400 to-indigo-600' },
              { val: 0.25, label: '0.250', frac: '2/8', color: 'from-cyan-400 to-blue-600' },
              { val: 0.375, label: '0.375', frac: '3/8', color: 'from-pink-400 to-rose-600' },
              { val: 0.25, label: '0.250', frac: '2/8', color: 'from-amber-400 to-orange-500' }
            ];

        const sum = APP_STATE.balloonSelectedIndices.reduce((acc, idx) => acc + (balloons[idx] ? balloons[idx].val : 0), 0);
        const formattedSum = Number(sum.toFixed(3));
        titleEl.textContent = 'Click Number Balloons to Float!';
        readoutEl.textContent = formattedSum.toString();

        stage.innerHTML = `
          <div class="w-full flex flex-col items-center justify-between h-full py-2">
            <div class="grid grid-cols-4 gap-3 sm:gap-5 w-full max-w-md my-auto">
              ${balloons
                .map((b, idx) => {
                  const active = APP_STATE.balloonSelectedIndices.includes(idx);
                  return `
                    <button
                      type="button"
                      onclick="toggleNumberBalloon(${idx})"
                      class="flex flex-col items-center transition-all duration-300 ${active ? '-translate-y-5 scale-110' : 'opacity-65 hover:opacity-100'}"
                    >
                      <div class="w-16 h-20 sm:w-20 sm:h-24 rounded-full bg-gradient-to-b ${b.color} border-3 ${active ? 'border-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.8)]' : 'border-white/40'} flex flex-col items-center justify-center text-white shadow-xl">
                        <span class="font-heading font-bold text-base sm:text-lg">${b.label}</span>
                        <span class="text-[11px] font-bold opacity-90">(${b.frac})</span>
                      </div>
                      <div class="w-0.5 h-8 bg-cyan-200/60"></div>
                      <span class="text-xs font-bold ${active ? 'text-yellow-300' : 'text-slate-400'}">${active ? 'Floating!' : 'Tap me'}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="w-full max-w-md bg-slate-900/90 p-3.5 rounded-2xl border border-cyan-400/40 mt-3">
              <div class="flex justify-between text-xs font-bold text-cyan-200 mb-1">
                <span>Decimal Meter (Out of 1.0 Whole)</span>
                <span class="text-yellow-300">${formattedSum} / 1.0</span>
              </div>
              <div class="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300 transition-all duration-300" style="width: ${Math.min(100, formattedSum * 100)}%"></div>
              </div>
            </div>
          </div>
        `;

        controls.innerHTML = `
          <span class="text-xs text-cyan-200 font-bold">Combine balloons to see decimal addition in action!</span>
          <button type="button" onclick="APP_STATE.balloonSelectedIndices=[0,1,2,3]; renderInteractiveManipulative(${grade}, 'decimals')" class="px-3 py-1.5 rounded-xl bg-yellow-400 text-slate-950 font-bold text-xs">
            Float All (= 1.0)
          </button>
        `;
      } else if (topicKey === 'ratios') {
        // Interactive Groups of Colourful Objects
        const groups = APP_STATE.ratioGroupCount || 1;
        const leftPerGroup = 3;
        const rightPerGroup = grade === 5 ? 2 : 5;
        const leftTotal = groups * leftPerGroup;
        const rightTotal = groups * rightPerGroup;
        titleEl.textContent = grade === 5 ? 'Colourful Object Groups (3:2)' : 'Cosmic Crystal Ratio Dock (3:5)';
        readoutEl.textContent = `${leftTotal} : ${rightTotal}`;

        let rowsHtml = '';
        for (let g = 0; g < groups; g++) {
          const leftIcons = Array.from({ length: leftPerGroup }, () => (grade === 5 ? '🍎' : '💎')).join(' ');
          const rightIcons = Array.from({ length: rightPerGroup }, () => (grade === 5 ? '🍐' : '🔮')).join(' ');
          rowsHtml += `
            <div class="flex items-center justify-between bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 w-full">
              <span class="text-xs font-bold text-cyan-200">Group ${g + 1}</span>
              <div class="text-xl sm:text-2xl tracking-widest">${leftIcons}</div>
              <span class="font-heading font-bold text-yellow-300 text-lg">:</span>
              <div class="text-xl sm:text-2xl tracking-widest">${rightIcons}</div>
            </div>
          `;
        }

        stage.innerHTML = `
          <div class="w-full max-w-md space-y-2.5">
            ${rowsHtml}
            <div class="text-center pt-2">
              <div class="font-heading text-lg font-bold text-yellow-300">
                Base Ratio ${leftPerGroup}:${rightPerGroup} × ${groups} group(s) = <span class="text-white underline">${leftTotal}:${rightTotal}</span>
              </div>
            </div>
          </div>
        `;

        controls.innerHTML = `
          <div class="flex items-center gap-2">
            <button type="button" onclick="changeRatioGroups(-1)" class="px-3.5 py-1.5 rounded-xl bg-rose-500/40 border border-rose-300/40 text-white font-bold text-xs">➖ Remove Group</button>
            <button type="button" onclick="changeRatioGroups(1)" class="px-3.5 py-1.5 rounded-xl bg-emerald-500/40 border border-emerald-300/40 text-white font-bold text-xs">➕ Add Group</button>
          </div>
          <span class="text-xs text-cyan-200 font-bold">Total Objects: ${leftTotal + rightTotal}</span>
        `;
      } else {
        // Shapes: 3D Geometric Toy House (Grade 5) or 3D Crystal Prism Volume Explorer (Grade 6)
        const mode = APP_STATE.shapeInspectMode || 'faces';
        titleEl.textContent = grade === 5 ? '3D Geometric Toy House' : '3D Rectangular Prism Explorer';
        readoutEl.textContent =
          grade === 5
            ? mode === 'faces' ? '6 Cube Faces' : mode === 'roof' ? '180° Roof' : '16 cm Perim.'
            : mode === 'faces' ? 'V = 60 m³' : mode === 'roof' ? 'Area = 30 cm²' : 'SA = 54 cm²';

        stage.innerHTML = `
          <div class="flex flex-col items-center text-center">
            <svg viewBox="0 0 240 210" class="w-56 h-52 drop-shadow-2xl">
              <!-- Isometric 3D Toy House / Prism -->
              <polygon
                points="120,18 46,72 120,104 194,72"
                fill="${mode === 'roof' ? '#facc15' : '#f43f5e'}"
                stroke="#ffffff"
                stroke-width="3"
              />
              <polygon
                points="46,72 120,104 120,184 46,152"
                fill="${mode === 'faces' ? '#22c55e' : '#0284c7'}"
                stroke="#ffffff"
                stroke-width="3"
              />
              <polygon
                points="194,72 120,104 120,184 194,152"
                fill="${mode === 'edges' ? '#a855f7' : '#0369a1'}"
                stroke="#ffffff"
                stroke-width="3"
              />
              <!-- Corner Vertex Dots -->
              <circle cx="120" cy="18" r="6" fill="#fde047" />
              <circle cx="46" cy="72" r="6" fill="#fde047" />
              <circle cx="194" cy="72" r="6" fill="#fde047" />
              <circle cx="120" cy="104" r="6" fill="#fde047" />
              <circle cx="120" cy="184" r="6" fill="#fde047" />
              <text x="120" y="72" text-anchor="middle" fill="#0f172a" font-family="Fredoka" font-weight="bold" font-size="14">
                ${grade === 5 ? 'Triangle Roof (180°)' : 'Height = 5 m'}
              </text>
              <text x="82" y="144" text-anchor="middle" fill="#ffffff" font-family="Fredoka" font-weight="bold" font-size="13">
                ${grade === 5 ? 'Square Wall' : '4m × 3m'}
              </text>
            </svg>
            <p class="text-sm font-bold text-cyan-100 mt-1 max-w-sm">
              ${
                grade === 5
                  ? 'Click the buttons below to inspect the Triangle Roof (180°), Square Walls (6 Cube Faces), and Perimeter!'
                  : 'Volume = 4m × 3m × 5m = 60 m³! A 3cm cube has 6 faces × 9 cm² = 54 cm² surface area!'
              }
            </p>
          </div>
        `;

        controls.innerHTML = `
          <div class="flex flex-wrap gap-2">
            <button type="button" onclick="setShapeInspectMode('faces')" class="px-3 py-1.5 rounded-xl font-bold text-xs ${mode === 'faces' ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">
              ${grade === 5 ? '🧊 Inspect 6 Cube Faces' : '📦 Prism Volume (60 m³)'}
            </button>
            <button type="button" onclick="setShapeInspectMode('roof')" class="px-3 py-1.5 rounded-xl font-bold text-xs ${mode === 'roof' ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">
              ${grade === 5 ? '📐 Triangle Roof (180°)' : '📐 Triangle Area (30 cm²)'}
            </button>
            <button type="button" onclick="setShapeInspectMode('edges')" class="px-3 py-1.5 rounded-xl font-bold text-xs ${mode === 'edges' ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white'}">
              ${grade === 5 ? '📏 Perimeter (16 cm)' : '🟦 Cube Net (54 cm²)'}
            </button>
          </div>
        `;
      }
    }

    function togglePizzaSlice(index) {
      playGameSound('click');
      APP_STATE.pizzaSelectedSlices[index] = !APP_STATE.pizzaSelectedSlices[index];
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'fractions');
    }

    function setPizzaTotalSlices(count) {
      playGameSound('click');
      APP_STATE.pizzaTotalSlices = count;
      APP_STATE.pizzaSelectedSlices = Array.from({ length: count }, (_, i) => i === 0);
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'fractions');
    }

    function resetPizzaSlices() {
      playGameSound('click');
      APP_STATE.pizzaTotalSlices = 4;
      APP_STATE.pizzaSelectedSlices = [true, false, false, false];
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'fractions');
    }

    function toggleNumberBalloon(idx) {
      playGameSound('click');
      const pos = APP_STATE.balloonSelectedIndices.indexOf(idx);
      if (pos >= 0) {
        APP_STATE.balloonSelectedIndices.splice(pos, 1);
      } else {
        APP_STATE.balloonSelectedIndices.push(idx);
      }
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'decimals');
    }

    function changeRatioGroups(delta) {
      playGameSound('click');
      APP_STATE.ratioGroupCount = Math.max(1, Math.min(4, (APP_STATE.ratioGroupCount || 1) + delta));
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'ratios');
    }

    function setShapeInspectMode(mode) {
      playGameSound('click');
      APP_STATE.shapeInspectMode = mode;
      const grade = APP_STATE.currentStudent ? Number(APP_STATE.currentStudent.grade) : 5;
      renderInteractiveManipulative(grade, 'shapes');
    }

    // Read Aloud TTS Button
    function speakCurrentLesson() {
      if (!('speechSynthesis' in window)) {
        showToast('Read Aloud is not supported in this browser.', 'warning');
        return;
      }
      const synth = window.speechSynthesis;
      const label = document.getElementById('read-aloud-label');
      if (synth.speaking) {
        synth.cancel();
        if (label) label.textContent = 'Read Aloud';
        return;
      }
      const grade = Number(APP_STATE.currentStudent.grade);
      const stepObj = CURRICULUM[grade].topics[APP_STATE.currentTopic].steps[APP_STATE.currentLessonStep];
      const textToRead = `${stepObj.heading}. ${stepObj.lines.join(' ')} Worked Example: ${stepObj.example}`;
      const utter = new SpeechSynthesisUtterance(textToRead);
      utter.rate = 0.95;
      utter.pitch = 1.08;
      utter.onend = () => {
        if (label) label.textContent = 'Read Aloud';
      };
      if (label) label.textContent = 'Stop Reading';
      synth.speak(utter);
    }

    async function completeLessonAndStartQuiz() {
      const student = APP_STATE.currentStudent;
      if (!student) return;
      try {
        const res = await callFastApi(
          `/grades/${student.grade}/lessons/${APP_STATE.currentTopic}/complete`,
          'POST',
          {}
        );
        APP_STATE.currentStudent = res.student;
        updateNavbarHUD();
        if (res.awarded_star) {
          triggerStarCelebration();
          showToast('Lesson Completed! You earned +1 Golden Star! ⭐', 'success');
        }
      } catch (e) {
        // Proceed to quiz
      }
      navigateTo('quiz', APP_STATE.currentTopic);
    }

    // -------------------------------------------------------------------------

// Expose lesson & interactive manipulative functions
window.openLessonTopic = typeof openLessonTopic !== 'undefined' ? openLessonTopic : null;
window.renderLessonScreen = typeof renderLessonScreen !== 'undefined' ? renderLessonScreen : null;
window.renderInteractiveManipulative = typeof renderInteractiveManipulative !== 'undefined' ? renderInteractiveManipulative : null;
window.selectSubtopic = typeof selectSubtopic !== 'undefined' ? selectSubtopic : null;
