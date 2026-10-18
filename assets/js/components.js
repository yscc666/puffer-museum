/**
 * 刺豚数字博物馆 - 共用组件
 */

const MuseumUI = {
  /**
   * 渲染导航栏
   * @param {string} activePage - 当前激活页面
   */
  renderNavbar(activePage = 'home') {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    
    nav.innerHTML = `
      <div class="nav-container">
        <a href="index.html" class="nav-brand">
          <div class="nav-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#48c9b0" stroke-width="2">
              <ellipse cx="12" cy="12" rx="8" ry="5.5"/>
              <path d="M20 12l2 -1l0 2z"/>
              <path d="M4 12l-2 -1l0 2z"/>
              <path d="M9 8 L10 6 M11 7 L11.5 5 M13 7 L12.5 5 M15 8 L14 6" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="nav-brand-text">
            <span class="nav-brand-title">刺豚数字博物馆</span>
            <span class="nav-brand-sub">Diodon Digital Museum</span>
          </div>
        </a>
        <ul class="nav-links">
          <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">首页</a></li>
          <li><a href="specimen.html" class="${activePage === 'specimen' ? 'active' : ''}">3D标本馆</a></li>
          <li><a href="species.html" class="${activePage === 'species' ? 'active' : ''}">物种百科</a></li>
          <li class="nav-divider"></li>
          <li><a href="diodondb.html" class="db-link ${activePage === 'diodondb' ? 'active' : ''}">DiodonDB</a></li>
          <li><a href="about.html" class="${activePage === 'about' ? 'active' : ''}">关于</a></li>
        </ul>
      </div>
    `;
    
    document.body.prepend(nav);
    
    // 滚动效果
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  },

  /**
   * 渲染页脚
   */
  renderFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <h3>刺豚数字博物馆</h3>
            <p>Diodon Digital Museum —— 以密斑刺鲀为旗舰物种的刺豚科与鲀科数字科普与科研平台。标本数字化展示，兼顾科普阅读与科研数据查询。</p>
          </div>
          <div class="footer-col">
            <h4>探索展区</h4>
            <ul>
              <li><a href="index.html">博物馆总览</a></li>
              <li><a href="specimen.html">3D标本馆</a></li>
              <li><a href="species.html">物种百科</a></li>
              <li><a href="diodondb.html">DiodonDB 生信数据</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>科普资源</h4>
            <ul>
              <li><a href="species.html#comparison">二齿与四齿</a></li>
              <li><a href="species.html#toxicity">河豚毒素</a></li>
              <li><a href="species.html#defense">膨胀防御</a></li>
              <li><a href="about.html">标本与数字化</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>关于</h4>
            <ul>
              <li><a href="about.html">博物馆介绍</a></li>
              <li><a href="about.html#specimens">实体标本</a></li>
              <li><a href="about.html#data">数据来源</a></li>
              <li><a href="about.html#contact">联系我们</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 刺豚数字博物馆 Diodon Digital Museum</span>
          <span>科普 · 科研 · 保护</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(footer);
  },

  /**
   * 获取物种图片URL - 使用 generate_image 返回的原始路径
   */
  getSpeciesImage(imageId) {
    return imageId;
  },

  /**
   * 渲染物种卡片
   */
  renderSpeciesCard(species, link = true) {
    const toxicClass = species.toxicityLevel === 'high' ? 'tag-toxic' : '';
    const toxicText = species.toxicityLevel === 'high' ? '剧毒' : '有毒';
    
    return `
      <article class="species-card">
        <div class="species-card-image">
          ${species.flagship ? '<span class="species-card-flagship">旗舰物种</span>' : ''}
          <img src="${this.getSpeciesImage(species.image)}" alt="${species.name}" loading="lazy">
          <span class="species-card-family">${species.familyCn}</span>
        </div>
        <div class="species-card-body">
          <div class="species-card-header">
            <h3 class="species-card-name">${species.name}</h3>
          </div>
          <div class="species-card-sci">${species.sciName}</div>
          <div class="species-card-meta">
            <div class="species-meta-item">
              <span class="species-meta-label">最大体长</span>
              <span class="species-meta-value">${species.maxLength}</span>
            </div>
            <div class="species-meta-item">
              <span class="species-meta-label">保护等级</span>
              <span class="species-meta-value">IUCN ${species.conservation}</span>
            </div>
          </div>
          <div class="species-card-tags">
            <span class="tag ${toxicClass}">${toxicText}</span>
            <span class="tag tag-lc">${species.conservationCn}</span>
            ${species.isPorcupine ? '<span class="tag">二齿</span>' : '<span class="tag">四齿</span>'}
          </div>
          <div class="species-card-footer">
            <span class="species-card-size">${species.commonLength ? '常见 ' + species.commonLength : ''}</span>
            ${link ? `<a href="species-detail.html?id=${species.id}" class="species-card-btn">
              查看详情
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  /**
   * 波浪分隔SVG
   */
  waveDivider(color = '#f8f4e8') {
    return `
      <div class="wave-divider">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="${color}"/>
        </svg>
      </div>
    `;
  },
};

window.MuseumUI = MuseumUI;
