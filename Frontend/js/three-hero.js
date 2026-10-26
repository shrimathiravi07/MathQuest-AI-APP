    // 12. THREE.JS 3D FLOATING ISLANDS FANTASY WORLD
    // -------------------------------------------------------------------------
    let threeScene = null;
    let threeCamera = null;
    let threeRenderer = null;
    let islandGroups = {};
    let floatingObjects = [];
    let cameraTargetPos = { x: 0, y: 11, z: 26 };
    let cameraLookAtPos = { x: 0, y: 1, z: 0 };

    function focus3DCamera(targetKey) {
      APP_STATE.threeCameraTarget = targetKey;
      if (targetKey === 'forest') {
        cameraTargetPos = { x: -10, y: 7.5, z: 14 };
        cameraLookAtPos = { x: -9, y: 2, z: -2 };
      } else if (targetKey === 'crystal') {
        cameraTargetPos = { x: 10, y: 7.5, z: 14 };
        cameraLookAtPos = { x: 9, y: 2, z: -2 };
      } else if (targetKey === 'arena') {
        cameraTargetPos = { x: 0, y: 6.5, z: 15 };
        cameraLookAtPos = { x: 0, y: 1, z: 3 };
      } else if (targetKey === 'trophy') {
        cameraTargetPos = { x: 0, y: 9.5, z: 12 };
        cameraLookAtPos = { x: 0, y: 4.5, z: -7 };
      } else {
        cameraTargetPos = { x: 0, y: 11, z: 26 };
        cameraLookAtPos = { x: 0, y: 1.5, z: 0 };
      }
    }

    function initThreeWorld() {
      const canvas = document.getElementById('three-world-canvas');
      if (!canvas || typeof THREE === 'undefined') return;

      try {
        threeScene = new THREE.Scene();
        threeScene.fog = new THREE.FogExp2(0x072957, 0.018);

        threeCamera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
        threeCamera.position.set(0, 11, 26);

        threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        threeRenderer.setSize(window.innerWidth, window.innerHeight);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        // Soft Magical Lighting
        const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
        threeScene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfef08a, 1.15);
        sunLight.position.set(15, 28, 18);
        threeScene.add(sunLight);

        const magicPointLight = new THREE.PointLight(0xc084fc, 1.2, 35);
        magicPointLight.position.set(9, 6, -2);
        threeScene.add(magicPointLight);

        // 1. Deep Blue Shimmering Ocean Base
        const oceanGeo = new THREE.CylinderGeometry(65, 65, 2, 48);
        const oceanMat = new THREE.MeshPhongMaterial({
          color: 0x093b7a,
          emissive: 0x041d42,
          shininess: 70,
          transparent: true,
          opacity: 0.88
        });
        const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
        oceanMesh.position.y = -5.5;
        threeScene.add(oceanMesh);

        // Helper to build a Floating Island base
        function createFloatingIsland(topColor, rockColor, radius, x, y, z) {
          const group = new THREE.Group();
          const rockGeo = new THREE.ConeGeometry(radius * 0.95, radius * 1.35, 9);
          const rockMat = new THREE.MeshLambertMaterial({ color: rockColor, flatShading: true });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.rotation.x = Math.PI;
          rock.position.y = -radius * 0.65;
          group.add(rock);

          const topGeo = new THREE.CylinderGeometry(radius, radius * 0.92, radius * 0.32, 18);
          const topMat = new THREE.MeshPhongMaterial({ color: topColor, shininess: 30 });
          const top = new THREE.Mesh(topGeo, topMat);
          group.add(top);

          group.position.set(x, y, z);
          threeScene.add(group);
          return group;
        }

        // 2. Green Forest Island (Left) with Pine Trees & Colourful Math Books
        const forestIsland = createFloatingIsland(0x22c55e, 0x78350f, 4.6, -9.5, 1.5, -2);
        for (let i = 0; i < 3; i++) {
          const treeGeo = new THREE.ConeGeometry(0.95, 2.5, 7);
          const treeMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
          const tree = new THREE.Mesh(treeGeo, treeMat);
          tree.position.set(-1.6 + i * 1.5, 1.7, -1.2 + (i % 2) * 0.9);
          forestIsland.add(tree);
        }
        // Colourful 3D Math Books on Forest Island
        const bookColors = [0xf43f5e, 0x3b82f6, 0xfacc15];
        bookColors.forEach((col, idx) => {
          const bookGeo = new THREE.BoxGeometry(1.3, 0.32, 1.0);
          const bookMat = new THREE.MeshPhongMaterial({ color: col });
          const book = new THREE.Mesh(bookGeo, bookMat);
          book.position.set(0.9, 0.85 + idx * 0.34, 1.1);
          book.rotation.y = idx * 0.25;
          forestIsland.add(book);
        });
        islandGroups.forest = forestIsland;

        // 3. Crystal Island (Right) with Glowing Gems & Mathematical Shapes
        const crystalIsland = createFloatingIsland(0x7e22ce, 0x3b0764, 4.6, 9.5, 1.8, -2);
        const gemColors = [0x22d3ee, 0xe879f9, 0xa855f7, 0x38bdf8];
        for (let i = 0; i < 4; i++) {
          const gemGeo = new THREE.OctahedronGeometry(0.95, 0);
          const gemMat = new THREE.MeshPhongMaterial({
            color: gemColors[i],
            emissive: gemColors[i],
            emissiveIntensity: 0.35,
            shininess: 95
          });
          const gem = new THREE.Mesh(gemGeo, gemMat);
          gem.position.set(-1.8 + i * 1.2, 1.7 + (i % 2) * 0.6, (i % 2 === 0 ? -0.8 : 0.8));
          crystalIsland.add(gem);
          floatingObjects.push(gem);
        }
        islandGroups.crystal = crystalIsland;

        // 4. Circular Quiz Arena (Center Front) with Wooden Platform & Golden Pillars
        const arenaIsland = createFloatingIsland(0xd97706, 0x78350f, 4.2, 0, 0.4, 3.5);
        const ringGeo = new THREE.TorusGeometry(3.2, 0.22, 12, 36);
        const ringMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.72;
        arenaIsland.add(ring);
        islandGroups.arena = arenaIsland;

        // 5. Starlight Trophy Peak (Center Back) with Golden Trophy, Rocket & Ringed Planet
        const trophyIsland = createFloatingIsland(0x38bdf8, 0x1e3a8a, 3.8, 0, 4.2, -7.5);
        const cupGeo = new THREE.CylinderGeometry(0.9, 0.45, 1.6, 16);
        const cupMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4, shininess: 100 });
        const cup = new THREE.Mesh(cupGeo, cupMat);
        cup.position.y = 1.6;
        trophyIsland.add(cup);
        islandGroups.trophy = trophyIsland;

        // Ringed Planet in Sky
        const planetGroup = new THREE.Group();
        const planetGeo = new THREE.SphereGeometry(1.6, 24, 24);
        const planetMat = new THREE.MeshPhongMaterial({ color: 0xec4899, emissive: 0x831843, emissiveIntensity: 0.25 });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        planetGroup.add(planet);

        const pRingGeo = new THREE.TorusGeometry(2.6, 0.22, 10, 36);
        const pRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const pRing = new THREE.Mesh(pRingGeo, pRingMat);
        pRing.rotation.x = 1.1;
        planetGroup.add(pRing);
        planetGroup.position.set(-14, 9.5, -12);
        threeScene.add(planetGroup);
        floatingObjects.push(planetGroup);

        // Floating 3D Stars & Number Blocks
        for (let i = 0; i < 14; i++) {
          const starGeo = new THREE.OctahedronGeometry(0.42, 0);
          const starMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfde047 : 0x38bdf8 });
          const star = new THREE.Mesh(starGeo, starMat);
          star.position.set(
            (Math.random() - 0.5) * 32,
            2 + Math.random() * 10,
            (Math.random() - 0.5) * 18 - 4
          );
          threeScene.add(star);
          floatingObjects.push(star);
        }

        window.addEventListener('resize', () => {
          if (!threeCamera || !threeRenderer) return;
          threeCamera.aspect = window.innerWidth / window.innerHeight;
          threeCamera.updateProjectionMatrix();
          threeRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        let clock = new THREE.Clock();
        let currentLookAt = new THREE.Vector3(0, 1.5, 0);

        function animateThree() {
          requestAnimationFrame(animateThree);
          const t = clock.getElapsedTime();

          if (!APP_STATE.reducedMotion) {
            if (islandGroups.forest) islandGroups.forest.position.y = 1.5 + Math.sin(t * 1.3) * 0.35;
            if (islandGroups.crystal) islandGroups.crystal.position.y = 1.8 + Math.cos(t * 1.1) * 0.35;
            if (islandGroups.arena) islandGroups.arena.position.y = 0.4 + Math.sin(t * 1.5 + 1) * 0.28;
            if (islandGroups.trophy) islandGroups.trophy.position.y = 4.2 + Math.cos(t * 1.4 + 2) * 0.32;

            floatingObjects.forEach((obj, idx) => {
              obj.rotation.y += 0.012;
              obj.rotation.x += 0.006 * (idx % 2 === 0 ? 1 : -1);
            });
          }

          // Smooth camera interpolation toward target island
          threeCamera.position.x += (cameraTargetPos.x - threeCamera.position.x) * 0.05;
          threeCamera.position.y += (cameraTargetPos.y - threeCamera.position.y) * 0.05;
          threeCamera.position.z += (cameraTargetPos.z - threeCamera.position.z) * 0.05;

          currentLookAt.x += (cameraLookAtPos.x - currentLookAt.x) * 0.06;
          currentLookAt.y += (cameraLookAtPos.y - currentLookAt.y) * 0.06;
          currentLookAt.z += (cameraLookAtPos.z - currentLookAt.z) * 0.06;
          threeCamera.lookAt(currentLookAt);

          threeRenderer.render(threeScene, threeCamera);
        }

        animateThree();
      } catch (e) {
        // Fallback CSS starfield remains visible if WebGL context is unavailable
      }
    }


// Expose Three.js world functions
window.initThreeWorld = typeof initThreeWorld !== 'undefined' ? initThreeWorld : null;
window.focus3DCamera = typeof focus3DCamera !== 'undefined' ? focus3DCamera : null;
