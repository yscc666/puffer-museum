/* ============================================================
 * Pufferfish3D —— 程序化刺豚 3D 模型（AI 生成整合版）
 * 密斑刺鲀数字博物馆 · DiodonDB
 *
 * 接口：
 *   window.Pufferfish3D.createScene(container, {
 *     species: 'hystrix',            // 物种 key（7 种）
 *     autoRotate: true,              // 是否自动旋转
 *     rotateSpeed: 1.0,              // 旋转速度倍率
 *     interactive: true              // 是否允许鼠标拖拽/滚轮
 *   })
 *   返回 { toggleAutoRotate, setAutoRotate, resetView, inflate, changeSpecies, destroy }
 * ============================================================ */
(function () {

  const SPECIES_DATA = {
    hystrix: {
      name: "Spot-fin Porcupinefish",
      sciName: "Diodon hystrix",
      family: "Diodontidae",
      desc: "Covered with numerous small, erectable spines and uniform dark spots over a warm beige body with a white belly. Swells into a rounded defensive spiky sphere.",
      length: "up to 91 cm",
      habitat: "Tropical Reefs Worldwide",
      baseColor: "#d9b98a",
      hasSpines: true,
      spineColor: 0xe8ded1,
      finColor: 0xd9b98a,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#bd9868');
        grad.addColorStop(0.35, '#d9b98a');
        grad.addColorStop(0.72, '#f2e6d5');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#1a110b';
        for (let i = 0; i < 900; i++) {
          const x = Math.random() * width;
          const y = Math.random() * (height * 0.72);
          const r = 2.5 + Math.random() * 4.5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    holocanthus: {
      name: "Longspined Porcupinefish",
      sciName: "Diodon holocanthus",
      family: "Diodontidae",
      desc: "Features long prominent spines on head and body, characterized by 6 large dark brown blotches on back and head with smaller scattered dots.",
      length: "up to 50 cm",
      habitat: "Circumtropical Reefs",
      baseColor: "#cbb07a",
      hasSpines: true,
      spineColor: 0xf0e3cb,
      finColor: 0xcbb07a,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#af925a');
        grad.addColorStop(0.4, '#cbb07a');
        grad.addColorStop(0.75, '#ebdcc1');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#2b1d14';
        const patches = [
          {x: width * 0.3, y: height * 0.25, rx: 60, ry: 40},
          {x: width * 0.7, y: height * 0.25, rx: 60, ry: 40},
          {x: width * 0.5, y: height * 0.18, rx: 70, ry: 45},
          {x: width * 0.5, y: height * 0.42, rx: 90, ry: 50},
          {x: width * 0.25, y: height * 0.48, rx: 55, ry: 35},
          {x: width * 0.75, y: height * 0.48, rx: 55, ry: 35}
        ];
        patches.forEach(p => {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.rx, p.ry, Math.PI * 0.05, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#332318';
        for (let i = 0; i < 350; i++) {
          const x = Math.random() * width;
          const y = Math.random() * (height * 0.7);
          const r = 2 + Math.random() * 4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    liturosus: {
      name: "Black-blotched Porcupinefish",
      sciName: "Diodon liturosus",
      family: "Diodontidae",
      desc: "Distinctive large dark brown blotches with white margins on dorsal side. Spines are shorter and flat when relaxed.",
      length: "up to 65 cm",
      habitat: "Indo-Pacific Coral Reefs",
      baseColor: "#e3cda8",
      hasSpines: true,
      spineColor: 0xf5ead7,
      finColor: 0xe3cda8,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#c2aa80');
        grad.addColorStop(0.4, '#e3cda8');
        grad.addColorStop(0.75, '#f4e8d3');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const blotches = [
          {x: width * 0.5, y: height * 0.22, rx: 110, ry: 55},
          {x: width * 0.25, y: height * 0.38, rx: 80, ry: 45},
          {x: width * 0.75, y: height * 0.38, rx: 80, ry: 45},
          {x: width * 0.5, y: height * 0.52, rx: 95, ry: 50}
        ];

        blotches.forEach(b => {
          ctx.fillStyle = '#fffefa';
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, b.rx + 8, b.ry + 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d1c12';
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    },
    rubripes: {
      name: "Japanese Puffer (Torafugu)",
      sciName: "Takifugu rubripes",
      family: "Tetraodontidae",
      desc: "Smooth-skinned pufferfish with dark blue-gray back, prominent black patch behind pectoral fin, and reddish/orange fins.",
      length: "up to 80 cm",
      habitat: "Northwest Pacific Ocean",
      baseColor: "#5b6a7a",
      hasSpines: false,
      spineColor: 0x000000,
      finColor: 0xd65a31,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#3a4754');
        grad.addColorStop(0.45, '#5b6a7a');
        grad.addColorStop(0.7, '#c2c9d1');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const drawChestBlotch = (cx, cy) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 46, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#11161b';
          ctx.beginPath();
          ctx.arc(cx, cy, 40, 0, Math.PI * 2);
          ctx.fill();
        };
        drawChestBlotch(width * 0.28, height * 0.42);
        drawChestBlotch(width * 0.72, height * 0.42);

        ctx.fillStyle = '#2b3642';
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * width;
          const y = Math.random() * (height * 0.35);
          const r = 3 + Math.random() * 8;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    fasciatus: {
      name: "Dark-striped Puffer",
      sciName: "Takifugu fasciatus",
      family: "Tetraodontidae",
      desc: "Characterized by yellowish-brown back with distinct dark transverse stripes across the upper body.",
      length: "up to 40 cm",
      habitat: "Freshwater & Estuaries of East Asia",
      baseColor: "#9d885a",
      hasSpines: false,
      spineColor: 0x000000,
      finColor: 0xb59e6b,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#75633e');
        grad.addColorStop(0.45, '#9d885a');
        grad.addColorStop(0.75, '#d9ceb5');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#292014';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        for (let y = 60; y < height * 0.55; y += 45) {
          ctx.beginPath();
          ctx.moveTo(0, y + Math.sin(y) * 15);
          ctx.bezierCurveTo(width * 0.33, y - 20, width * 0.66, y + 20, width, y);
          ctx.stroke();
        }
      }
    },
    hispidus: {
      name: "White-spotted Puffer",
      sciName: "Arothron hispidus",
      family: "Tetraodontidae",
      desc: "Olive greenish body sprinkled with bright white spots on upper half and fine dark lines on the belly.",
      length: "up to 50 cm",
      habitat: "Indo-Pacific Reefs",
      baseColor: "#58614d",
      hasSpines: false,
      spineColor: 0x000000,
      finColor: 0x6e7a60,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#3f4736');
        grad.addColorStop(0.5, '#58614d');
        grad.addColorStop(0.75, '#b4baa8');
        grad.addColorStop(1, '#eaf0e4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 600; i++) {
          const x = Math.random() * width;
          const y = Math.random() * (height * 0.6);
          const r = 2 + Math.random() * 4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = '#383e32';
        ctx.lineWidth = 3;
        for (let y = height * 0.65; y < height; y += 12) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    },
    stellatus: {
      name: "Starry Puffer",
      sciName: "Arothron stellatus",
      family: "Tetraodontidae",
      desc: "Large pufferfish covered in dense black starry dots over a blue-gray background, with dark patches around fins.",
      length: "up to 120 cm",
      habitat: "Indo-Pacific Lagoons & Reefs",
      baseColor: "#637582",
      hasSpines: false,
      spineColor: 0x000000,
      finColor: 0x637582,
      drawPattern: (ctx, width, height) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#43515c');
        grad.addColorStop(0.5, '#637582');
        grad.addColorStop(0.75, '#adb9c4');
        grad.addColorStop(1, '#f0f4f7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#11171d';
        for (let i = 0; i < 1200; i++) {
          const x = Math.random() * width;
          const y = Math.random() * (height * 0.75);
          const r = 1.5 + Math.random() * 3.5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  function createSpeciesTexture(speciesKey) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const spec = SPECIES_DATA[speciesKey] || SPECIES_DATA.hystrix;
    spec.drawPattern(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function createScene(container, options = {}) {
    const config = {
      species: options.species || 'hystrix',
      autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
      rotateSpeed: options.rotateSpeed || 1.0,
      interactive: options.interactive !== undefined ? options.interactive : true
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1329);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    mainLight.position.set(5, 6, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x73d2de, 0.6);
    fillLight.position.set(-5, -3, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 4, -6);
    scene.add(rimLight);

    const fishGroup = new THREE.Group();
    scene.add(fishGroup);

    const inflationGroup = new THREE.Group();
    fishGroup.add(inflationGroup);

    let bodyMesh, spineInstancedMesh;
    let currentInflation = 1.0;
    let finMeshes = [];

    function buildPufferfish(speciesKey) {
      while (inflationGroup.children.length > 0) {
        const child = inflationGroup.children[0];
        inflationGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      }
      finMeshes = [];

      const specData = SPECIES_DATA[speciesKey] || SPECIES_DATA.hystrix;

      const bodyRadius = 2.0;
      const bodyGeo = new THREE.SphereGeometry(bodyRadius, 64, 64);
      bodyGeo.scale(1.08, 0.98, 1.04);

      const bodyTexture = createSpeciesTexture(speciesKey);
      const bodyMat = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        roughness: 0.45,
        metalness: 0.05,
        bumpScale: 0.02
      });

      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      inflationGroup.add(bodyMesh);

      // 大眼睛：眼白 + 棕色虹膜渐变 + 大瞳孔 + 高光
      const eyeRadius = 0.38;
      const eyeGeo = new THREE.SphereGeometry(eyeRadius, 32, 32);

      const eyeCanvas = document.createElement('canvas');
      eyeCanvas.width = 256;
      eyeCanvas.height = 256;
      const ectx = eyeCanvas.getContext('2d');

      ectx.fillStyle = '#f7f7f7';
      ectx.fillRect(0, 0, 256, 256);

      const irisGrad = ectx.createRadialGradient(128, 128, 10, 128, 128, 80);
      irisGrad.addColorStop(0, '#1a0b05');
      irisGrad.addColorStop(0.5, '#7c431d');
      irisGrad.addColorStop(0.85, '#a6602b');
      irisGrad.addColorStop(1, '#1b0e06');
      ectx.fillStyle = irisGrad;
      ectx.beginPath();
      ectx.arc(128, 128, 80, 0, Math.PI * 2);
      ectx.fill();

      ectx.fillStyle = '#050505';
      ectx.beginPath();
      ectx.arc(128, 128, 48, 0, Math.PI * 2);
      ectx.fill();

      ectx.fillStyle = '#ffffff';
      ectx.beginPath();
      ectx.arc(152, 104, 16, 0, Math.PI * 2);
      ectx.fill();

      ectx.beginPath();
      ectx.arc(108, 150, 8, 0, Math.PI * 2);
      ectx.fill();

      const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
      const eyeMat = new THREE.MeshStandardMaterial({
        map: eyeTexture,
        roughness: 0.1,
        metalness: 0.1
      });

      const eyeOffsetX = 1.05;
      const eyeOffsetY = 0.45;
      const eyeOffsetZ = 1.55;

      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(eyeOffsetX, eyeOffsetY, eyeOffsetZ);
      leftEye.rotation.y = Math.PI * 0.15;
      leftEye.rotation.x = -Math.PI * 0.05;

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(-eyeOffsetX, eyeOffsetY, eyeOffsetZ);
      rightEye.rotation.y = -Math.PI * 0.15;
      rightEye.rotation.x = -Math.PI * 0.05;

      inflationGroup.add(leftEye);
      inflationGroup.add(rightEye);

      // 嘴：白色板状齿 + 内口
      const mouthGroup = new THREE.Group();
      const beakGeo = new THREE.TorusGeometry(0.24, 0.08, 16, 32);
      const beakMat = new THREE.MeshStandardMaterial({
        color: 0xf2f2eb,
        roughness: 0.3,
        metalness: 0.1
      });
      const beakMesh = new THREE.Mesh(beakGeo, beakMat);
      beakMesh.scale.set(1.1, 0.7, 1.0);

      const innerMouthGeo = new THREE.CircleGeometry(0.2, 32);
      const innerMouthMat = new THREE.MeshBasicMaterial({ color: 0x110505 });
      const innerMouthMesh = new THREE.Mesh(innerMouthGeo, innerMouthMat);
      innerMouthMesh.position.z = -0.02;

      mouthGroup.add(beakMesh);
      mouthGroup.add(innerMouthMesh);

      mouthGroup.position.set(0, -0.35, 1.98);
      mouthGroup.rotation.x = Math.PI * 0.1;
      inflationGroup.add(mouthGroup);

      // 棘刺（仅刺鲀类物种）：贴伏短刺，避开眼睛与口部区域
      if (specData.hasSpines) {
        const spineCount = 380;
        const spineGeo = new THREE.ConeGeometry(0.045, 0.32, 8);
        spineGeo.translate(0, 0.16, 0);
        spineGeo.rotateX(Math.PI * 0.5);

        const spineMat = new THREE.MeshStandardMaterial({
          color: specData.spineColor,
          roughness: 0.5,
          metalness: 0.05
        });

        spineInstancedMesh = new THREE.InstancedMesh(spineGeo, spineMat, spineCount);
        const dummy = new THREE.Object3D();

        let count = 0;
        for (let i = 0; i < spineCount; i++) {
          const y = 1 - (i / (spineCount - 1)) * 1.6;
          const radiusAtY = Math.sqrt(1 - y * y);
          const theta = i * 2.399963;

          const x = Math.cos(theta) * radiusAtY;
          const z = Math.sin(theta) * radiusAtY;

          const pos = new THREE.Vector3(x * 2.16, y * 1.96, z * 2.08);

          if (pos.z > 1.2 && Math.abs(pos.x) < 1.3 && pos.y > -0.6 && pos.y < 0.9) {
            continue;
          }

          dummy.position.copy(pos);
          const normal = pos.clone().normalize();
          dummy.lookAt(pos.clone().add(normal));
          dummy.rotateX(Math.PI * 0.15);

          dummy.updateMatrix();
          spineInstancedMesh.setMatrixAt(count++, dummy.matrix);
        }
        spineInstancedMesh.instanceMatrix.needsUpdate = true;
        inflationGroup.add(spineInstancedMesh);
      }

      // 鳍：半透明，摆动动画
      const finMat = new THREE.MeshStandardMaterial({
        color: specData.finColor,
        transparent: true,
        opacity: 0.82,
        roughness: 0.3,
        side: THREE.DoubleSide
      });

      function createFinMesh(width, height) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(width * 0.5, height * 1.1, width, height * 0.7);
        shape.quadraticCurveTo(width * 0.8, height * 0.2, 0, 0);

        const finGeometry = new THREE.ShapeGeometry(shape);
        return new THREE.Mesh(finGeometry, finMat);
      }

      const tailFin = createFinMesh(0.7, 1.1);
      tailFin.position.set(0, 0, -2.05);
      tailFin.rotation.y = Math.PI * 0.5;
      inflationGroup.add(tailFin);
      finMeshes.push({ mesh: tailFin, baseRotY: Math.PI * 0.5, speed: 6, amp: 0.15 });

      const dorsalFin = createFinMesh(0.5, 0.8);
      dorsalFin.position.set(0, 1.75, -1.2);
      dorsalFin.rotation.x = -Math.PI * 0.25;
      dorsalFin.rotation.y = Math.PI * 0.5;
      inflationGroup.add(dorsalFin);
      finMeshes.push({ mesh: dorsalFin, baseRotY: Math.PI * 0.5, speed: 8, amp: 0.1 });

      const analFin = createFinMesh(0.45, 0.7);
      analFin.position.set(0, -1.65, -1.1);
      analFin.rotation.x = Math.PI * 0.25;
      analFin.rotation.y = Math.PI * 0.5;
      inflationGroup.add(analFin);
      finMeshes.push({ mesh: analFin, baseRotY: Math.PI * 0.5, speed: 8, amp: 0.1 });

      const leftPectoral = createFinMesh(0.5, 0.65);
      leftPectoral.position.set(1.95, -0.1, 0.4);
      leftPectoral.rotation.y = Math.PI * 0.2;
      leftPectoral.rotation.z = -Math.PI * 0.1;
      inflationGroup.add(leftPectoral);
      finMeshes.push({ mesh: leftPectoral, baseRotY: Math.PI * 0.2, speed: 5, amp: 0.22 });

      const rightPectoral = createFinMesh(0.5, 0.65);
      rightPectoral.position.set(-1.95, -0.1, 0.4);
      rightPectoral.rotation.y = Math.PI * 0.8;
      rightPectoral.rotation.z = Math.PI * 0.1;
      inflationGroup.add(rightPectoral);
      finMeshes.push({ mesh: rightPectoral, baseRotY: Math.PI * 0.8, speed: 5, amp: 0.22 });

      setInflation(currentInflation);
    }

    function setInflation(amount) {
      currentInflation = Math.max(0.2, Math.min(1.0, amount));
      const scaleY = 0.55 + currentInflation * 0.45;
      const scaleXZ = 0.5 + currentInflation * 0.5;
      inflationGroup.scale.set(scaleXZ, scaleY, scaleXZ);
    }

    buildPufferfish(config.species);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;
    let targetDistance = 8.5;

    function onMouseDown(e) {
      if (!config.interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e) {
      if (!isDragging || !config.interactive) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp() {
      isDragging = false;
    }

    function onWheel(e) {
      if (!config.interactive) return;
      e.preventDefault();
      targetDistance += e.deltaY * 0.005;
      targetDistance = Math.max(4.5, Math.min(14.0, targetDistance));
    }

    function onTouchStart(e) {
      if (!config.interactive || e.touches.length !== 1) return;
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function onTouchMove(e) {
      if (!isDragging || !config.interactive || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotationX));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    function onWindowResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onWindowResize);

    let animationFrameId;
    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (config.autoRotate && !isDragging) {
        targetRotationY += 0.005 * config.rotateSpeed;
      }

      fishGroup.rotation.y += (targetRotationY - fishGroup.rotation.y) * 0.08;
      fishGroup.rotation.x += (targetRotationX - fishGroup.rotation.x) * 0.08;

      camera.position.z += (targetDistance - camera.position.z) * 0.08;

      // 轻微浮动，增强生动感
      fishGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12;
      fishGroup.position.x = Math.cos(elapsedTime * 1.2) * 0.05;

      finMeshes.forEach(finItem => {
        const flutter = Math.sin(elapsedTime * finItem.speed) * finItem.amp;
        finItem.mesh.rotation.y = finItem.baseRotY + flutter;
      });

      renderer.render(scene, camera);
    }

    animate();

    return {
      toggleAutoRotate: () => {
        config.autoRotate = !config.autoRotate;
        return config.autoRotate;
      },
      setAutoRotate: (val) => {
        config.autoRotate = !!val;
      },
      resetView: () => {
        targetRotationX = 0;
        targetRotationY = 0;
        targetDistance = 8.5;
      },
      inflate: (amount) => {
        setInflation(amount);
      },
      changeSpecies: (newSpeciesKey) => {
        if (SPECIES_DATA[newSpeciesKey]) {
          config.species = newSpeciesKey;
          buildPufferfish(newSpeciesKey);
        }
      },
      destroy: () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', onWindowResize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onMouseUp);
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }

  window.Pufferfish3D = { createScene: createScene };

})();
