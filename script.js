/**
 * 李育家 Lee - 個人自我介紹與作品集
 * 互動功能腳本：
 * 1. HUD 即時時鐘與系統狀態列更新
 * 2. 響應式手機導覽列開合與捲動高亮追蹤
 * 3. 唱片展示架互動 (展開 / 摺疊堆疊模式切換、黑膠唱片抽出與懸停旋轉)
 * 4. 學習成果作品集燈箱視窗 (Lightbox) 與鍵盤左右切換控制 (支援全部 7 件作品)
 * 5. 聯絡信箱一鍵複製與即時回饋提示
 */

document.addEventListener('DOMContentLoaded', () => {

  // 圖片載入容錯備援 (確保在特殊環境、file:// 協定或不同伺服器編碼下皆 100% 正常顯示)
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function onImgError() {
      img.removeEventListener('error', onImgError);
      const currentSrc = img.getAttribute('src');
      if (!currentSrc) return;
      try {
        if (currentSrc.includes('%')) {
          img.src = decodeURIComponent(currentSrc);
        } else {
          img.src = encodeURI(currentSrc);
        }
      } catch (e) {
        console.warn('Image recovery failed for:', currentSrc);
      }
    });
  });

  /* ==========================================================================
     1. HUD 系統狀態列時間戳記更新
     ========================================================================== */
  const hudTimestamp = document.getElementById('hudTimestamp');
  function updateHudTime() {
    if (!hudTimestamp) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    hudTimestamp.textContent = `SYS.CLOCK: ${y}.${m}.${d} // ${h}:${min}:${s}_LOC`;
  }
  updateHudTime();
  setInterval(updateHudTime, 1000);

  /* ==========================================================================
     2. 手機端導覽選單開關與平滑滾動連結
     ========================================================================== */
  const menuToggle = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* 導覽列當前區塊高亮 (Active state on scroll) */
  const sections = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('.desktop-nav .nav-btn');

  function updateActiveNavLink() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const offset = 180;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - offset;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        desktopNavLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  /* ==========================================================================
     3. 音樂唱片展示架互動 (展開 / 摺疊堆疊模式切換 & 黑膠抽出)
     ========================================================================== */
  const vinylDeck = document.getElementById('vinylDeck');
  const btnSpreadMode = document.getElementById('btnSpreadMode');
  const btnFoldMode = document.getElementById('btnFoldMode');
  const vinylUnits = document.querySelectorAll('.vinyl-unit');

  if (vinylDeck && btnSpreadMode && btnFoldMode) {
    // 切換為展開展示模式
    btnSpreadMode.addEventListener('click', () => {
      btnSpreadMode.classList.add('active');
      btnFoldMode.classList.remove('active');
      vinylDeck.classList.remove('folded-state');
      vinylDeck.classList.add('spread-state');
    });

    // 切換為摺疊堆疊模式
    btnFoldMode.addEventListener('click', () => {
      btnFoldMode.classList.add('active');
      btnSpreadMode.classList.remove('active');
      vinylDeck.classList.remove('spread-state');
      vinylDeck.classList.add('folded-state');
    });

    // 點擊唱片單元切換 Active 狀態 (使黑膠唱片抽出保持展示)
    vinylUnits.forEach(unit => {
      unit.addEventListener('click', () => {
        const isCurrentActive = unit.classList.contains('active');
        vinylUnits.forEach(u => u.classList.remove('active'));
        if (!isCurrentActive) {
          unit.classList.add('active');
        }
      });
    });
  }

  /* ==========================================================================
     4. 作品集展示互動 (摺疊堆疊 / 展開網格切換 & 全螢幕燈箱 Lightbox)
     ========================================================================== */
  const portfolioDeck = document.getElementById('portfolioDeck');
  const btnWorksFoldMode = document.getElementById('btnWorksFoldMode');
  const btnWorksSpreadMode = document.getElementById('btnWorksSpreadMode');
  const deckNavControls = document.getElementById('deckNavControls');
  const deckPrevBtn = document.getElementById('deckPrevBtn');
  const deckNextBtn = document.getElementById('deckNextBtn');
  const deckIndicator = document.getElementById('deckIndicator');

  const workCards = document.querySelectorAll('.portfolio-card');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxCurtain = document.getElementById('lightboxCurtain');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');

  let currentWorkIndex = 0;
  let activeStackedIndex = 0;
  const worksData = [];

  // 動態讀取 works 區塊中所有卡片資訊
  workCards.forEach((card, idx) => {
    worksData.push({
      src: card.getAttribute('data-src'),
      title: card.getAttribute('data-title') || `創作成果展示 ${idx + 1}`
    });

    // 點選卡片處理：摺疊模式下支援抽檢置頂與開啟燈箱
    card.addEventListener('click', (e) => {
      const isFolded = portfolioDeck && portfolioDeck.classList.contains('folded-state');
      if (isFolded) {
        // 若點擊的是全螢幕按鈕或已是當前抽檢中的卡片，直接開啟燈箱
        if (card.classList.contains('is-active') || e.target.closest('.hud-view-btn') || e.target.closest('.bezel-action')) {
          openLightbox(idx);
        } else {
          setActiveStackedCard(idx);
        }
      } else {
        // 展開模式下直接開啟燈箱
        openLightbox(idx);
      }
    });
  });

  // 設定當前堆疊抽檢的卡片
  function setActiveStackedCard(idx) {
    if (!workCards || workCards.length === 0) return;
    activeStackedIndex = (idx + workCards.length) % workCards.length;
    workCards.forEach((c, i) => {
      c.classList.toggle('is-active', i === activeStackedIndex);
    });
    // 更新快捷提示文字
    if (deckIndicator && worksData[activeStackedIndex]) {
      deckIndicator.textContent = `目前抽檢：${worksData[activeStackedIndex].title} (${activeStackedIndex + 1} / ${worksData.length})`;
    }
    // 讓被抽檢卡片平滑滾動至視野中心 (便於手機與小螢幕瀏覽)
    const targetCard = workCards[activeStackedIndex];
    if (targetCard && portfolioDeck && portfolioDeck.classList.contains('folded-state')) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // 初始化第一張卡片為抽檢置頂
  if (workCards.length > 0) {
    setActiveStackedCard(0);
  }

  // 摺疊堆疊模式 vs 展開模式切換按鈕
  if (btnWorksFoldMode && btnWorksSpreadMode && portfolioDeck) {
    // 切換為摺疊堆疊模式
    btnWorksFoldMode.addEventListener('click', () => {
      btnWorksFoldMode.classList.add('active');
      btnWorksSpreadMode.classList.remove('active');
      portfolioDeck.classList.remove('spread-state');
      portfolioDeck.classList.add('folded-state');
      if (deckNavControls) deckNavControls.classList.remove('is-hidden');
      setActiveStackedCard(activeStackedIndex);
    });

    // 切換為展開展示模式
    btnWorksSpreadMode.addEventListener('click', () => {
      btnWorksSpreadMode.classList.add('active');
      btnWorksFoldMode.classList.remove('active');
      portfolioDeck.classList.remove('folded-state');
      portfolioDeck.classList.add('spread-state');
      if (deckNavControls) deckNavControls.classList.add('is-hidden');
      workCards.forEach(c => c.classList.remove('is-active'));
    });
  }

  // 堆疊快捷導覽按鈕 (上一件 / 下一件)
  if (deckPrevBtn) {
    deckPrevBtn.addEventListener('click', () => {
      setActiveStackedCard(activeStackedIndex - 1);
    });
  }
  if (deckNextBtn) {
    deckNextBtn.addEventListener('click', () => {
      setActiveStackedCard(activeStackedIndex + 1);
    });
  }

  function openLightbox(index) {
    if (!lightboxModal || worksData.length === 0) return;
    currentWorkIndex = (index + worksData.length) % worksData.length;
    updateLightboxContent();
    lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // 防止背後頁面滾動
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const item = worksData[currentWorkIndex];
    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
    }
    if (lightboxTitle) {
      lightboxTitle.textContent = `[VIEWER] ${item.title}`;
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentWorkIndex + 1} / ${worksData.length}`;
    }
  }

  function showNextWork() {
    currentWorkIndex = (currentWorkIndex + 1) % worksData.length;
    updateLightboxContent();
  }

  function showPrevWork() {
    currentWorkIndex = (currentWorkIndex - 1 + worksData.length) % worksData.length;
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxCurtain) lightboxCurtain.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', showNextWork);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevWork);

  // 鍵盤左右鍵與 ESC 控制支援
  window.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNextWork();
    if (e.key === 'ArrowLeft') showPrevWork();
  });

  /* ==========================================================================
     5. 聯絡信箱一鍵複製與即時回饋
     ========================================================================== */
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnLabel = document.getElementById('copyBtnLabel');
  const copyAlert = document.getElementById('copyAlert');
  const emailVal = document.getElementById('emailVal');

  if (copyBtn && emailVal) {
    copyBtn.addEventListener('click', async () => {
      const email = emailVal.textContent.trim();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          // Fallback for non-https / older browsers
          const tempInput = document.createElement('textarea');
          tempInput.value = email;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        // 成功提示
        if (copyAlert) {
          copyAlert.classList.add('show');
          setTimeout(() => {
            copyAlert.classList.remove('show');
          }, 3500);
        }

        if (copyBtnLabel) {
          const original = copyBtnLabel.textContent;
          copyBtnLabel.textContent = '已複製成功！';
          setTimeout(() => {
            copyBtnLabel.textContent = original;
          }, 2500);
        }
      } catch (err) {
        console.error('複製失敗:', err);
        alert(`複製失敗，請手動複製信箱：${email}`);
      }
    });
  }

});
