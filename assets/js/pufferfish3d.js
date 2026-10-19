/**
 * 刺豚数字博物馆 - 程序化3D模型生成器（写实版 v2）
 * 真实刺鲀轮廓、皮肤纹理贴图、InstancedMesh 棘刺（贴伏/竖起）、真实鱼眼、半透明鳍
 */

// WebGL 支持检测
function _hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

const Pufferfish3D = {
  /**
   * 创建刺豚3D场景
   */
  createScene(container, options = {}) {
    if (!_hasWebGL() || typeof THREE === 'undefined') {
      const fallback = document.createElement('div');
      fallback.style.cssText = `
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        color: rgba(255,255,255,0.65);
        font-size: 0.85rem;
        background: linear-gradient(180deg, #0d3b66 0%, #1a5276 100%);
        text-align: center;
        padding: 1rem;
      `;
      const species = options.species || 'hystrix';
      const nameMap = {
        hystrix: '密斑刺鲀 · Diodon hystrix',
        holocanthus: '六斑刺鲀 · Diodon holocanthus',
        liturosus: '大斑刺鲀 · Diodon liturosus',
        rubripes: '红鳍东方鲀 · Takifugu rubripes',
        fasciatus: '暗纹东方鲀 · Takifugu fasciatus',
        hispidus: '纹腹叉鼻鲀 · Arothron hispidus',
        stellatus: '星斑叉鼻鲀 · Arothron stellatus',
      };
      fallback.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" style="margin-bottom: 0.6rem;">
          <ellipse cx="24" cy="24" rx="16" ry="11"/>
          <path d="M40 24l3 -2l0 4z"/>
          <circle cx="30" cy="20" r="1.5" fill="rgba(255,255,255,0.4)"/>
          <path d="M16 16 L17 13 M19 15 L20 12 M22 14 L23.5 11 M25 14 L26 11" stroke-width="1"/>
        </svg>
        <div style="font-family: Georgia, serif; font-style: italic; color: #48c9b0; font-size: 0.95rem; margin-bottom: 0.3rem;">${nameMap[species] || species}</div>
        <div style="font-size: 0.75rem; opacity: 0.7;">3D 交互模型</div>
      `;
      container.appendChild(fallback);
      return {
        toggleAutoRotate: () => false, setAutoRotate: () => {},
        resetView: () => {}, inflate: () => {}, destroy: () => {}, _fallback: true
      };
    }

    const {
      species = 'hystrix',
      autoRotate = true,
      rotateSpeed = 0.005,
      interactive = true,
    } = options;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1), 0.1, 1000);
    camera.position.set(0, 0.5, 5);
    camera.lookAt(0, 0, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      const fallback = document.createElement('div');
      fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7);font-size:0.9rem;background:linear-gradient(180deg,#0d3b66 0%,#1a5276 100%);';
      fallback.innerHTML = '<span>3D 模型加载中</span>';
      container.appendChild(fallback);
      return {
        toggleAutoRotate: () => false, setAutoRotate: () => {},
        resetView: () => {}, inflate: () => {}, destroy: () => {}, _fallback: true
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 尺寸自适应（容器尺寸就绪后自动校正，随容器变化实时同步）
    const syncSize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (w < 1 || h < 1) return;
      const cw = Math.floor(w * renderer.getPixelRatio());
      const ch = Math.floor(h * renderer.getPixelRatio());
      if (renderer.domElement.width !== cw || renderer.domElement.height !== ch) {
        renderer.setSize(w, h);
      }
      const aspect = w / h;
      if (Math.abs(camera.aspect - aspect) > 1e-4) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    };
    syncSize();
    container.appendChild(renderer.domElement);

    // 光照
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.0);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35);
    fillLight.position.set(-3, 1, -2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x48c9b0, 0.5);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    const fishGroup = new THREE.Group();
    scene.add(fishGroup);

    // 构建程序化写实模型（兜底），返回可驱动部件
    const parts = this.buildFish(fishGroup, species);

    // 优先加载真实扫描 GLB 模型（http/https 环境有效；file:// 或缺失时自动回退程序化模型）
    // 放置方式：把扫描/下载的 GLB 放到 assets/models/<species>.glb 即可自动启用
    this.tryLoadGLB(fishGroup, species);

    // 交互状态
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };
    let targetZoom = 5;
    let currentZoom = 5;
    let autoRotateEnabled = autoRotate;
    let inflateState = 0;

    if (interactive) {
      const getEventPos = (e) => e.touches && e.touches.length > 0
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
      const onMouseDown = (e) => {
        isDragging = true;
        autoRotateEnabled = false;
        previousMousePosition = getEventPos(e);
      };
      const onMouseMove = (e) => {
        if (!isDragging) return;
        const pos = getEventPos(e);
        targetRotation.y += (pos.x - previousMousePosition.x) * 0.01;
        targetRotation.x += (pos.y - previousMousePosition.y) * 0.01;
        targetRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotation.x));
        previousMousePosition = pos;
      };
      const onMouseUp = () => {
        isDragging = false;
        setTimeout(() => { if (!isDragging) autoRotateEnabled = autoRotate; }, 2000);
      };
      const onWheel = (e) => {
        e.preventDefault();
        targetZoom += e.deltaY * 0.003;
        targetZoom = Math.max(2.5, Math.min(8, targetZoom));
      };
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
      renderer.domElement.addEventListener('touchstart', onMouseDown);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
    }

    const handleResize = () => { syncSize(); };
    window.addEventListener('resize', handleResize);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      syncSize();
      if (autoRotateEnabled && !isDragging) targetRotation.y += rotateSpeed;

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
      fishGroup.rotation.x = currentRotation.x;
      fishGroup.rotation.y = currentRotation.y;

      currentZoom += (targetZoom - currentZoom) * 0.08;
      camera.position.z = currentZoom;
      camera.lookAt(0, 0, 0);

      // 膨胀驱动：身体横向胀大 + 棘刺竖起
      const infl = inflateState;
      if (parts.body) parts.body.scale.set(1 + 0.34 * infl, 1 + 0.2 * infl, 1 + 0.34 * infl);
      if (parts.spines) parts.spines.setInflate(infl);

      const breathe = Math.sin(Date.now() * 0.0012) * 0.008;
      fishGroup.scale.setScalar(1 + breathe);

      renderer.render(scene, camera);
    };
    animate();

    return {
      toggleAutoRotate: () => { autoRotateEnabled = !autoRotateEnabled; return autoRotateEnabled; },
      setAutoRotate: (val) => { autoRotateEnabled = val; },
      resetView: () => { targetRotation = { x: 0, y: 0 }; targetZoom = 5; },
      inflate: (amount) => { inflateState = Math.max(0, Math.min(1, amount)); },
      destroy: () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  },

  /**
   * 优先加载真实扫描 GLB（assets/models/<species>.glb）。
   * http/https（如 GitHub Pages）环境自动启用；本地 file:// 双击被 CORS 拦 → 回退程序化模型。
   * 加载成功后隐藏程序化部件，完全替换为 GLB 模型。
   */
  tryLoadGLB(fishGroup, species) {
    if (typeof THREE.GLTFLoader === 'undefined' || typeof fetch !== 'function') return;
    fetch('assets/models/' + species + '.glb')
      .then(res => { if (!res.ok) throw new Error('no glb file'); return res.arrayBuffer(); })
      .then(buf => {
        const loader = new THREE.GLTFLoader();
        loader.parse(buf, '', gltf => {
          const model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
          if (!model) return;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          const size = box.getSize(new THREE.Vector3());
          const scale = 2.6 / Math.max(size.x, size.y, size.z, 0.001);
          model.scale.setScalar(scale);
          fishGroup.add(model);
          // 隐藏程序化模型（GLB 是 children 最后一项）
          for (let i = 0; i < fishGroup.children.length - 1; i++) {
            fishGroup.children[i].visible = false;
          }
        }, undefined, () => { /* 解析失败：保持程序化 */ });
      })
      .catch(() => { /* file:// 或无文件：保持程序化 */ });
  },

  /**
   * 构建写实刺豚模型（返回 { body, spines } 供动画驱动）
   */
  buildFish(group, species) {
    const profile = [
      [1.08, 0.44], [1.02, 0.58], [0.92, 0.74], [0.78, 0.92],
      [0.60, 1.06], [0.40, 1.15], [0.20, 1.18], [0.00, 1.18],
      [-0.22, 1.16], [-0.44, 1.10], [-0.66, 0.98], [-0.86, 0.80],
      [-1.00, 0.60], [-1.10, 0.42], [-1.18, 0.28],
    ];

    // ---- 皮肤贴图（含物种图案 + 腹部白色） ----
    const tex = this._createSkinTexture(species);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

    const bodyMat = new THREE.MeshStandardMaterial({
      map: tex, bumpMap: tex, bumpScale: 0.15,
      roughness: 0.86, metalness: 0.0,
    });

    // ---- 身体（真实轮廓管状体） ----
    const body = new THREE.Mesh(this._createBodyGeometry(profile, 64, 44), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // ---- 嘴（白色板状齿，鹦鹉嘴，位于头端腹侧） ----
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf5efdd, roughness: 0.5 });
    const beak = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.025, 10, 30, Math.PI * 0.8), beakMat);
    beak.position.set(1.10, -0.10, 0);
    beak.rotation.x = Math.PI / 2;
    beak.rotation.z = 0.12;
    group.add(beak);
    const lipMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.85 });
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.007, 6, 26, Math.PI * 0.8), lipMat);
    lip.position.set(1.10, -0.092, 0.018);
    lip.rotation.x = Math.PI / 2;
    lip.rotation.z = 0.12;
    group.add(lip);

    // ---- 眼睛（大而圆的萌眼：深色眼带 + 金色虹膜 + 大黑瞳 + 高光） ----
    const eyeSocketMat = new THREE.MeshStandardMaterial({ color: 0x5a4630, roughness: 0.6 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.4 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 0.1 });
    const glintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, emissive: 0xffffff, emissiveIntensity: 0.55 });
    [-1, 1].forEach(s => {
      const eyeG = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.024, 14, 32), eyeSocketMat);
      eyeG.add(ring);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.092, 32), irisMat);
      iris.position.z = 0.002;
      eyeG.add(iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.058, 28), pupilMat);
      pupil.position.z = 0.006;
      eyeG.add(pupil);
      const glint = new THREE.Mesh(new THREE.CircleGeometry(0.024, 14), glintMat);
      glint.position.set(0.030, 0.038, 0.010);
      eyeG.add(glint);
      // 眼下方褐色弧带（密斑刺鲀特征）
      const brow = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.009, 8, 28, Math.PI * 0.6), eyeSocketMat);
      brow.rotation.x = Math.PI / 2;
      brow.rotation.z = 0.6;
      brow.position.set(0.02, -0.098, 0.004);
      eyeG.add(brow);
      // 眼睛精确贴合球面，贴片方向朝外
      eyeG.position.set(0.573, 0.481, s * 0.917);
      const normal = new THREE.Vector3(0.486, 0.408, s * 0.777);
      eyeG.lookAt(eyeG.position.clone().add(normal));
      group.add(eyeG);
    });

    // ---- 鳍（半透明，带鳍条） ----
    this._createFins(group, species, tex);

    // ---- 棘刺（仅刺鲀科：密斑/六斑/大斑） ----
    let spines = null;
    if (['hystrix', 'holocanthus', 'liturosus'].includes(species)) {
      spines = this._createSpines(group, species, profile);
    }

    return { body, spines };
  },

  /**
   * 真实轮廓管状体（x 为长轴，u 环绕 / v 沿长轴）
   */
  _createBodyGeometry(profile, seg, rings) {
    function radiusAt(x) {
      if (x <= profile[0][0]) return profile[0][1];
      if (x >= profile[profile.length - 1][0]) return profile[profile.length - 1][1];
      for (let i = 1; i < profile.length; i++) {
        if (x <= profile[i][0]) {
          const t = (x - profile[i - 1][0]) / (profile[i][0] - profile[i - 1][0]);
          return profile[i - 1][1] + (profile[i][1] - profile[i - 1][1]) * t;
        }
      }
      return profile[profile.length - 1][1];
    }
    const x0 = profile[0][0], x1 = profile[profile.length - 1][0];
    const positions = [], uvs = [], indices = [];
    for (let i = 0; i <= rings; i++) {
      const v = i / rings;
      const x = x0 + v * (x1 - x0);
      const r = radiusAt(x);
      for (let j = 0; j <= seg; j++) {
        const u = j / seg;
        const theta = u * Math.PI * 2;
        const flat = 1 - 0.06 * Math.max(0, -Math.sin(theta)); // 腹部略平（保持圆润）
        const rr = r * flat * (1 - 0.05 * Math.abs(Math.cos(theta))); // 左右略窄，整体更圆鼓
        positions.push(x, rr * Math.sin(theta), rr * Math.cos(theta));
        uvs.push(u, v);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j, b = a + 1;
        const c = (i + 1) * (seg + 1) + j, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  },

  /**
   * 皮肤贴图：基色 + 噪点 + 物种特征 + 腹部白色带
   * canvas: 1024 x 512；x 轴 = u(环绕)，y 轴 = v(吻端→尾端)
   */
  _createSkinTexture(species) {
    const w = 1024, h = 512;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    const base = {
      hystrix: '#d9b98a',
      holocanthus: '#b5a077',
      liturosus: '#cbb27e',
      rubripes: '#7f8b93',
      fasciatus: '#9a845f',
      hispidus: '#6e7a76',
      stellatus: '#6b7a85',
    }[species] || '#d9b98a';

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // 皮肤噪点（粗糙质感）
    for (let i = 0; i < 2600; i++) {
      const lighter = Math.random() > 0.5;
      ctx.fillStyle = lighter
        ? 'rgba(255,246,222,' + (0.03 + Math.random() * 0.07) + ')'
        : 'rgba(70,55,30,' + (0.04 + Math.random() * 0.08) + ')';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

    // 物种特征图案
    this._drawPattern(ctx, species, w, h);

    // 腹部白色带（u 0.60~0.90 中心渐变白，更白更宽）
    const ax = 0.60 * w, bx = 0.90 * w, cx = 0.75 * w;
    const g1 = ctx.createLinearGradient(ax, 0, cx, 0);
    g1.addColorStop(0, 'rgba(250,247,238,0)');
    g1.addColorStop(1, 'rgba(250,247,238,0.97)');
    ctx.fillStyle = g1;
    ctx.fillRect(ax, 0, cx - ax, h);
    const g2 = ctx.createLinearGradient(cx, 0, bx, 0);
    g2.addColorStop(0, 'rgba(250,247,238,0.97)');
    g2.addColorStop(1, 'rgba(250,247,238,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(cx, 0, bx - cx, h);

    const tex = new THREE.CanvasTexture(c);
    return tex;
  },

  /**
   * 物种特征图案（在 u-v 贴图空间绘制）
   * v: 0(吻端)→1(尾端)；u: 0→1 环绕
   */
  _drawPattern(ctx, species, w, h) {
    // u/v → canvas 坐标
    const P = (u, v, rw, rh) => {
      const x = u * w, y = v * h;
      return { x, y, rw: rw || 0, rh: rh || 0 };
    };

    if (species === 'hystrix') {
      // 密斑：黑色小圆点均匀分布（更清晰圆润）
      for (let i = 0; i < 340; i++) {
        const u = Math.random(), v = Math.random();
        if (u > 0.60 && u < 0.88) continue; // 腹白带内少斑
        const r = 2.8 + Math.random() * 4.6;
        ctx.fillStyle = 'rgba(26,18,10,0.95)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // 局部密斑群（自然的斑块聚群）
      for (let i = 0; i < 12; i++) {
        const u = Math.random(), v = Math.random();
        if (u > 0.62 && u < 0.86) continue;
        const cx = u * w, cy = v * h;
        for (let j = 0; j < 6 + Math.random() * 8; j++) {
          const r = 1.8 + Math.random() * 3;
          ctx.fillStyle = 'rgba(22,16,10,0.95)';
          ctx.beginPath();
          ctx.arc(cx + (Math.random() - 0.5) * 28, cy + (Math.random() - 0.5) * 20, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (species === 'holocanthus') {
      // 6 大黑斑块 + 散点
      const blotches = [
        [0.25, 0.85, 60, 34], [0.25, 0.75, 56, 32],
        [0.12, 0.60, 50, 30], [0.25, 0.37, 54, 30],
        [0.25, 0.32, 48, 28], [0.12, 0.28, 44, 26],
      ];
      blotches.forEach(b => {
        ctx.fillStyle = 'rgba(38,34,28,0.92)';
        ctx.beginPath();
        ctx.ellipse(b[0] * w, b[1] * h, b[2], b[3], Math.random() * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      for (let i = 0; i < 150; i++) {
        const u = Math.random(), v = Math.random();
        if (u > 0.60 && u < 0.90) continue;
        ctx.fillStyle = 'rgba(30,26,20,0.9)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 2 + Math.random() * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (species === 'liturosus') {
      // 大斑：黑色大斑块
      for (let i = 0; i < 11; i++) {
        const u = 0.02 + Math.random() * 0.96, v = Math.random();
        if (u > 0.62 && u < 0.88 && Math.random() > 0.4) continue;
        const rw = 36 + Math.random() * 46, rh = 20 + Math.random() * 26;
        ctx.fillStyle = 'rgba(24,20,16,0.93)';
        ctx.beginPath();
        ctx.ellipse(u * w, v * h, rw, rh, Math.random() * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // 斑块边缘晕染
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 26; i++) {
        const u = Math.random(), v = Math.random();
        ctx.fillStyle = 'rgba(40,32,22,0.6)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 6 + Math.random() * 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (species === 'rubripes') {
      // 虎纹（背部横向条纹）
      for (let i = 0; i < 6; i++) {
        const v = 0.30 + i * 0.075;
        ctx.fillStyle = 'rgba(30,32,38,0.9)';
        ctx.fillRect(0, v * h, w, 8 + Math.random() * 8);
      }
      // 白色小点
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = 'rgba(235,238,240,0.5)';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // 胸斑（白缘黑圆，两侧）
      [0.10, 0.90].forEach(u => {
        const v = 0.58;
        ctx.fillStyle = 'rgba(240,240,240,0.95)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(25,25,30,0.95)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 22, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (species === 'fasciatus') {
      // 5-6 条暗褐横纹（环绕带）
      for (let i = 0; i < 6; i++) {
        const v = 0.30 + i * 0.09;
        ctx.fillStyle = 'rgba(58,44,26,0.9)';
        ctx.fillRect(0, v * h, w, 12 + Math.random() * 8);
      }
      // 胸斑（白缘黑圆）
      [0.10, 0.90].forEach(u => {
        const v = 0.55;
        ctx.fillStyle = 'rgba(230,225,210,0.95)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,26,20,0.95)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 22, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (species === 'hispidus') {
      // 深灰底 + 白色圆点（白点河豚）
      for (let i = 0; i < 420; i++) {
        const u = Math.random(), v = Math.random();
        if (u > 0.60 && u < 0.90) continue;
        ctx.fillStyle = 'rgba(238,242,240,0.85)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 1.6 + Math.random() * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (species === 'stellatus') {
      // 深灰底 + 大黑点网纹
      for (let i = 0; i < 320; i++) {
        const u = Math.random(), v = Math.random();
        if (u > 0.60 && u < 0.90) continue;
        ctx.fillStyle = 'rgba(28,32,38,0.92)';
        ctx.beginPath();
        ctx.arc(u * w, v * h, 2.5 + Math.random() * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  /**
   * 半透明鳍（尾/背/臀/胸），带鳍条
   */
  _createFins(group, species, tex) {
    const finMat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, opacity: 0.92,
      side: THREE.DoubleSide, roughness: 0.72, metalness: 0.0,
    });
    const rayMat = new THREE.MeshStandardMaterial({ color: 0xb8a477, roughness: 0.8 });

    // 尾鳍（小巧圆形扇形，贴合球体尾部）
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.quadraticCurveTo(0.12, 0.24, 0.26, 0.27);
    tailShape.quadraticCurveTo(0.18, 0.11, 0.19, 0);
    tailShape.quadraticCurveTo(0.18, -0.11, 0.26, -0.27);
    tailShape.quadraticCurveTo(0.12, -0.24, 0, 0);
    const tailFin = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), finMat);
    tailFin.rotation.y = Math.PI / 2;
    tailFin.position.set(-1.26, 0.02, 0);
    group.add(tailFin);
    for (let i = -1; i <= 1; i++) {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.004, 0.32, 6), rayMat);
      ray.rotation.z = Math.PI / 2;
      ray.rotation.y = i * 0.15;
      ray.position.set(-1.30, 0.02 + i * 0.11, 0);
      group.add(ray);
    }

    // 背鳍（小圆刀形，位于身体后上部）
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(-0.15, 0);
    dorsalShape.quadraticCurveTo(-0.08, 0.22, 0.03, 0.30);
    dorsalShape.quadraticCurveTo(0.11, 0.18, 0.16, 0);
    dorsalShape.quadraticCurveTo(0.04, 0.05, -0.15, 0);
    const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
    dorsal.position.set(-0.48, 1.04, 0);
    dorsal.rotation.x = 0.10;
    group.add(dorsal);
    for (let i = 0; i < 3; i++) {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.24, 6), rayMat);
      ray.rotation.z = Math.PI / 2 + (i - 1) * 0.11;
      ray.position.set(-0.52, 0.92 + i * 0.08, 0);
      group.add(ray);
    }

    // 臀鳍（小圆刀形，贴合球体腹部）
    const anal = dorsal.clone();
    anal.position.set(-0.54, -1.00, 0);
    anal.rotation.x = -0.10;
    group.add(anal);

    // 胸鳍（宽短圆润，两侧）
    const pecShape = new THREE.Shape();
    pecShape.moveTo(0, 0);
    pecShape.quadraticCurveTo(0.18, 0.11, 0.36, 0.05);
    pecShape.quadraticCurveTo(0.27, -0.10, 0.10, -0.11);
    pecShape.quadraticCurveTo(0.02, -0.05, 0, 0);
    [-1, 1].forEach(s => {
      const pec = new THREE.Mesh(new THREE.ShapeGeometry(pecShape), finMat);
      pec.position.set(0.38, -0.14, s * 0.92);
      pec.rotation.y = s * 0.55;
      pec.rotation.z = s * 0.18;
      pec.rotation.x = Math.PI / 2;
      group.add(pec);
      for (let i = 0; i < 3; i++) {
        const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.4, 6), rayMat);
        ray.position.set(0.30 + i * 0.10, -0.16, s * (0.90 + i * 0.09));
        ray.rotation.x = Math.PI / 2;
        ray.rotation.z = s * 0.5;
        group.add(ray);
      }
    });
  },

  /**
   * InstancedMesh 棘刺（默认贴伏后倾，膨胀时竖起）
   */
  _createSpines(group, species, profile) {
    const counts = { hystrix: 130, holocanthus: 110, liturosus: 90 };
    const count = counts[species] || 130;
    const lenRange = [0.05, 0.09];

    const spineGeo = new THREE.ConeGeometry(0.028, 1, 5);
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xe8dfc8, roughness: 0.85, metalness: 0.0,
    });

    const mesh = new THREE.InstancedMesh(spineGeo, spineMat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;

    const up = new THREE.Vector3(0, 1, 0);
    const data = [];
    const x0 = profile[0][0], x1 = profile[profile.length - 1][0];

    function radiusAt(x) {
      if (x <= profile[0][0]) return profile[0][1];
      if (x >= profile[profile.length - 1][0]) return profile[profile.length - 1][1];
      for (let i = 1; i < profile.length; i++) {
        if (x <= profile[i][0]) {
          const t = (x - profile[i - 1][0]) / (profile[i][0] - profile[i - 1][0]);
          return profile[i - 1][1] + (profile[i][1] - profile[i - 1][1]) * t;
        }
      }
      return profile[profile.length - 1][1];
    }

    let placed = 0, guard = 0;
    while (placed < count && guard < count * 60) {
      guard++;
      const x = x0 + (Math.random() * (x1 - x0));
      // 吻端与尾柄无刺
      if (x > 1.38 || x < -1.32) continue;
      const r = radiusAt(x);
      const theta = Math.random() * Math.PI * 2;
      const y = r * Math.sin(theta);
      const z = r * Math.cos(theta);
      // 腹部少刺且短
      const belly = y < -0.25 ? 0.35 : 1;
      if (Math.random() > belly * 0.9 && y < -0.3) continue;
      const dir = new THREE.Vector3(x * 0.22, y, z).normalize();
      const pos = new THREE.Vector3(x, y, z);
      const len = (lenRange[0] + Math.random() * (lenRange[1] - lenRange[0])) * (0.6 + 0.4 * belly);
      data.push({ pos, dir, tilt: 0.85 + Math.random() * 0.10, len });
      placed++;
    }

    // 用实际放置数量重建（若不足则截断）
    mesh.count = data.length;

    const tmpM = new THREE.Matrix4();
    const tmpQ = new THREE.Quaternion();
    const tmpS = new THREE.Vector3();
    const axis = new THREE.Vector3();

    function updateMatrices(infl) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const qAlign = new THREE.Quaternion().setFromUnitVectors(up, d.dir);
        axis.crossVectors(d.dir, new THREE.Vector3(-1, 0, 0)).normalize();
        if (axis.lengthSq() < 0.01) axis.set(0, 0, 1);
        const ang = d.tilt * (1 - infl); // 贴伏→竖起
        const qTilt = new THREE.Quaternion().setFromAxisAngle(axis, ang);
        tmpQ.copy(qAlign).multiply(qTilt);
        tmpS.set(1, d.len, 1);
        tmpM.compose(d.pos, tmpQ, tmpS);
        mesh.setMatrixAt(i, tmpM);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    updateMatrices(0);
    group.add(mesh);

    return {
      setInflate: (infl) => updateMatrices(infl),
      dispose: () => { spineGeo.dispose(); spineMat.dispose(); }
    };
  },

  /**
   * 简单版本（用于卡片缩略）
   */
  createSimple(container, species) {
    return this.createScene(container, {
      species, autoRotate: true, rotateSpeed: 0.008, interactive: false,
    });
  }
};

window.Pufferfish3D = Pufferfish3D;
