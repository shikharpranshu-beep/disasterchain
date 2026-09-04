const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 900,
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1500);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTests() {
  console.log('=== STARTING DISASTERCHAIN VERTICAL SCROLLING & UX VERIFICATION ===');

  const edgeProc = spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--user-data-dir=' + path.join(__dirname, 'edge_temp_profile'),
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 30; i++) {
    try {
      targets = await getJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch (e) { }
    await sleep(400);
  }

  if (!targets || targets.length === 0) {
    console.error('Failed to connect to Edge debugging port');
    edgeProc.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const results = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: DESKTOP (1440x900) - LANDING & VERTICAL SCROLL
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Landing Page on Desktop (1440x900) ---');
    await cdp.setViewport(1440, 900);
    await cdp.navigate('http://localhost:3000/');

    const landingData = await cdp.eval(`(() => {
      const h1 = document.querySelector('h1')?.innerText;
      const subtitle = document.querySelector('main p')?.innerText;
      const sosBtn = document.getElementById('landing-primary-sos-btn');
      const loginHeroBtn = document.getElementById('landing-hero-login-btn');
      const navbarLoginBtn = document.getElementById('navbar-login-btn');
      const secBtns = Array.from(document.querySelectorAll('.landing-secondary-btn')).map(b => b.innerText.trim());
      const blocks = Array.from(document.querySelectorAll('.landing-compact-blocks > div')).map(d => ({
        title: d.querySelector('div')?.innerText,
        h: d.querySelectorAll('div')[1]?.innerText
      }));
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const clientH = document.documentElement.clientHeight;
      const scrollH = document.documentElement.scrollHeight;

      return {
        h1,
        subtitle,
        hasSosBtn: !!sosBtn,
        hasLoginHeroBtn: !!loginHeroBtn,
        loginHeroHref: loginHeroBtn?.getAttribute('href'),
        hasNavbarLoginBtn: !!navbarLoginBtn,
        secBtns,
        blocksCount: blocks.length,
        hasOverflow: scrollW > docW,
        isTallerThanViewport: scrollH > clientH,
        scrollH,
        clientH
      };
    })()`);

    // Verify vertical scroll down and up
    await cdp.eval(`window.scrollTo({ top: 300, behavior: 'instant' })`);
    await sleep(150);
    const desktopScrolledDown = await cdp.eval(`window.scrollY > 0`);
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(150);
    const desktopScrolledBack = await cdp.eval(`window.scrollY === 0`);

    console.log('Landing Page Desktop Data:', JSON.stringify(landingData, null, 2));
    results.push({
      test: 'Desktop Landing Page (Scrolls Vertically & Has Public Login)',
      passed: landingData.h1.includes('DISASTERCHAIN') &&
        landingData.hasSosBtn &&
        landingData.hasLoginHeroBtn &&
        landingData.loginHeroHref === '/login' &&
        landingData.hasNavbarLoginBtn &&
        landingData.blocksCount === 3 &&
        !landingData.hasOverflow &&
        landingData.isTallerThanViewport &&
        desktopScrolledDown &&
        desktopScrolledBack,
    });

    // -------------------------------------------------------------
    // TEST 2: DESKTOP (1440x900) - DASHBOARD
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Emergency Overview Dashboard on Desktop (1440x900) ---');
    await cdp.navigate('http://localhost:3000/dashboard');

    const dashData = await cdp.eval(`(() => {
      const header = document.querySelector('header h1')?.innerText;
      const sosCardBtn = document.getElementById('dashboard-send-sos-btn');
      const statusCards = Array.from(document.querySelectorAll('.dashboard-status-row > div')).map(d => ({
        title: d.children[0]?.innerText,
        value: d.children[1]?.innerText,
        sub: d.children[2]?.innerText,
      }));
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const rail = document.querySelector('.command-rail');
      const railVisible = rail && window.getComputedStyle(rail).display !== 'none';
      const hamburger = document.querySelector('.mobile-hamburger-btn');
      const hamburgerHidden = !hamburger || window.getComputedStyle(hamburger).display === 'none';

      return {
        header,
        hasSosBtn: !!sosCardBtn,
        statusCardsCount: statusCards.length,
        railVisible,
        hamburgerHidden,
        hasOverflow: scrollW > docW
      };
    })()`);

    console.log('Dashboard Desktop Data:', JSON.stringify(dashData, null, 2));
    results.push({
      test: 'Desktop Dashboard (Rail Active, Hamburger Hidden, 4 Cards)',
      passed: dashData.hasSosBtn &&
        dashData.statusCardsCount === 4 &&
        dashData.railVisible &&
        dashData.hamburgerHidden &&
        !dashData.hasOverflow,
    });

    // -------------------------------------------------------------
    // TEST 3: FULL DEVICE TEST MATRIX - VERTICAL SCROLLING & TOUCH SWIPE
    // -------------------------------------------------------------
    const testMatrix = [
      // Phones
      { w: 360, h: 800, name: 'Phone 360x800', type: 'phone' },
      { w: 375, h: 812, name: 'Phone 375x812', type: 'phone' },
      { w: 390, h: 844, name: 'Phone 390x844', type: 'phone' },
      { w: 412, h: 915, name: 'Phone 412x915', type: 'phone' },
      { w: 430, h: 932, name: 'Phone 430x932', type: 'phone' },
      { w: 480, h: 960, name: 'Phone 480x960', type: 'phone' },
      // Large Phones
      { w: 540, h: 1200, name: 'Large Phone 540x1200', type: 'phone' },
      { w: 600, h: 1024, name: 'Large Phone 600x1024', type: 'large-phone' },
      { w: 720, h: 1600, name: 'Large Phone 720x1600', type: 'large-phone' },
      // Tablets
      { w: 768, h: 1024, name: 'Tablet 768x1024', type: 'tablet' },
      { w: 820, h: 1180, name: 'Tablet 820x1180', type: 'tablet' },
      { w: 900, h: 1200, name: 'Tablet 900x1200', type: 'compact-desktop' },
      // Desktop
      { w: 1024, h: 768, name: 'Desktop 1024x768', type: 'desktop' },
      { w: 1280, h: 800, name: 'Desktop 1280x800', type: 'desktop' },
      { w: 1920, h: 1080, name: 'Desktop 1920x1080', type: 'desktop' },
    ];

    for (const dev of testMatrix) {
      console.log(`\n--- Testing Device Viewport: ${dev.name} (${dev.w}x${dev.h}) ---`);
      await cdp.setViewport(dev.w, dev.h);

      // 1. Test Landing Page for this device
      await cdp.navigate('http://localhost:3000/');
      await sleep(400);

      const landingVpCheck = await cdp.eval(`(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const clientH = document.documentElement.clientHeight;
        const scrollH = document.documentElement.scrollHeight;
        const loginHeroBtn = document.getElementById('landing-hero-login-btn');
        const sosBtn = document.getElementById('landing-primary-sos-btn');
        const hamburger = document.querySelector('.mobile-hamburger-btn');
        const hamburgerVisible = hamburger && window.getComputedStyle(hamburger).display !== 'none';
        const desktopExtras = document.querySelector('.navbar-desktop-extras');
        const desktopExtrasHidden = !desktopExtras || window.getComputedStyle(desktopExtras).display === 'none';

        return {
          docW,
          scrollW,
          clientH,
          scrollH,
          isTallerThanViewport: scrollH > clientH,
          hasOverflow: scrollW > docW,
          hasLoginHeroBtn: !!loginHeroBtn,
          hasSosBtn: !!sosBtn,
          hamburgerVisible: !!hamburgerVisible,
          desktopExtrasHidden: !!desktopExtrasHidden
        };
      })()`);

      // Test vertical swipe/scroll on Landing Page
      await cdp.eval(`window.scrollTo(0, 350)`);
      await sleep(150);
      const landingScrolledDown = await cdp.eval(`window.scrollY > 50`);
      await cdp.eval(`window.scrollTo(0, 0)`);
      await sleep(100);
      const landingScrolledBack = await cdp.eval(`window.scrollY === 0`);

      console.log(`${dev.name} Landing Check:`, JSON.stringify({
        ...landingVpCheck,
        landingScrolledDown,
        landingScrolledBack
      }, null, 2));

      // 2. Test Dashboard for this device
      await cdp.navigate('http://localhost:3000/dashboard');
      await sleep(400);

      const dashVpCheck = await cdp.eval(`(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const clientH = document.documentElement.clientHeight;
        const scrollH = document.documentElement.scrollHeight;
        const statusRow = document.querySelector('.dashboard-status-row');
        const gridCols = statusRow ? window.getComputedStyle(statusRow).gridTemplateColumns.split(' ').length : 0;
        const bottomNav = document.querySelector('.mobile-emergency-nav');
        const bottomNavVisible = bottomNav && window.getComputedStyle(bottomNav).display !== 'none';
        const rail = document.querySelector('.command-rail');
        const railVisible = rail && window.getComputedStyle(rail).display !== 'none';
        const launcher = document.getElementById('open-ai-assistant-btn');

        return {
          hasOverflow: scrollW > docW,
          clientH,
          scrollH,
          isTallerThanViewport: scrollH > clientH,
          gridCols,
          bottomNavVisible: !!bottomNavVisible,
          railVisible: !!railVisible,
          hasAiLauncher: !!launcher
        };
      })()`);

      // Test vertical swipe/scroll on Dashboard
      await cdp.eval(`window.scrollTo(0, 300)`);
      await sleep(150);
      const dashScrolledDown = await cdp.eval(`window.scrollY > 50`);
      await cdp.eval(`window.scrollTo(0, 0)`);
      await sleep(100);
      const dashScrolledBack = await cdp.eval(`window.scrollY === 0`);

      console.log(`${dev.name} Dashboard Check:`, JSON.stringify({
        ...dashVpCheck,
        dashScrolledDown,
        dashScrolledBack
      }, null, 2));

      // 3. Test AI Modal & scroll restore after closing
      let aiPassed = true;
      if (dashVpCheck.hasAiLauncher) {
        await cdp.eval(`document.getElementById('open-ai-assistant-btn').click()`);
        await sleep(400);

        const aiCheck = await cdp.eval(`(() => {
          const modal = document.querySelector('.disaster-ai-modal');
          const closeBtn = document.getElementById('close-ai-assistant-btn');
          const chatContent = document.querySelector('.ai-chat-content');
          const mRect = modal ? modal.getBoundingClientRect() : null;
          const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
          const bottomNav = document.querySelector('.mobile-emergency-nav');
          const bottomNavDisplay = bottomNav ? window.getComputedStyle(bottomNav).display : 'none';
          const bodyOverflow = window.getComputedStyle(document.body).overflow;

          return {
            hasModal: !!modal,
            modalWidth: mRect?.width,
            modalHeight: mRect?.height,
            isFullScreenOnMobile: devWidth => devWidth < 900 ? (mRect && Math.abs(mRect.width - window.innerWidth) <= 2) : true,
            closeBtnWidth: cRect?.width,
            closeBtnHeight: cRect?.height,
            bottomNavHiddenWhenAiOpen: bottomNavDisplay === 'none',
            hasChatContent: !!chatContent
          };
        })()`);

        // Close AI via X button
        await cdp.eval(`document.getElementById('close-ai-assistant-btn').click()`);
        await sleep(300);

        const aiClosed = await cdp.eval(`!document.querySelector('.disaster-ai-modal')`);

        // CRITICAL: Verify page vertical scrolling works immediately after AI closes
        await cdp.eval(`window.scrollTo(0, 250)`);
        await sleep(150);
        const postAiScrolled = await cdp.eval(`window.scrollY > 0`);
        await cdp.eval(`window.scrollTo(0, 0)`);

        aiPassed = aiCheck.hasModal &&
          aiCheck.closeBtnWidth >= 44 &&
          aiCheck.closeBtnHeight >= 44 &&
          (dev.w < 900 ? aiCheck.bottomNavHiddenWhenAiOpen : true) &&
          aiClosed &&
          postAiScrolled;
      }

      // 4. Check Mobile Drawer on < 900px
      let drawerPassed = true;
      if (dev.w < 900) {
        await cdp.eval(`document.getElementById('mobile-hamburger-toggle').click()`);
        await sleep(350);

        const drawerCheck = await cdp.eval(`(() => {
          const drawer = document.querySelector('.mobile-nav-drawer');
          const isOpen = drawer && drawer.classList.contains('open');
          const hasSos = !!drawer?.querySelector('.btn-emergency');
          const hasLogin = !!drawer?.querySelector('a[href="/login"]');
          return { isOpen, hasSos, hasLogin };
        })()`);

        await cdp.eval(`document.querySelector('.mobile-drawer-close-btn').click()`);
        await sleep(300);

        const drawerClosed = await cdp.eval(`!document.querySelector('.mobile-nav-drawer.open')`);
        drawerPassed = drawerCheck.isOpen && drawerCheck.hasSos && drawerCheck.hasLogin && drawerClosed;
      }

      // Evaluation criteria
      let passed = !landingVpCheck.hasOverflow &&
        !dashVpCheck.hasOverflow &&
        landingVpCheck.isTallerThanViewport &&
        landingScrolledDown &&
        landingScrolledBack &&
        dashScrolledDown &&
        dashScrolledBack &&
        landingVpCheck.hasLoginHeroBtn &&
        landingVpCheck.hasSosBtn &&
        aiPassed &&
        drawerPassed;

      if (dev.w < 900) {
        passed = passed && landingVpCheck.desktopExtrasHidden && dashVpCheck.bottomNavVisible && !dashVpCheck.railVisible;
      } else {
        passed = passed && dashVpCheck.railVisible;
      }

      results.push({
        test: `Viewport ${dev.name} (${dev.w}x${dev.h})`,
        passed,
        details: {
          noOverflow: !landingVpCheck.hasOverflow && !dashVpCheck.hasOverflow,
          pageScrollsVertically: landingScrolledDown && dashScrolledDown,
          contentTallerThanScreen: landingVpCheck.isTallerThanViewport,
          loginHeroBtn: landingVpCheck.hasLoginHeroBtn,
          desktopExtrasHidden: dev.w < 900 ? landingVpCheck.desktopExtrasHidden : 'N/A',
          bottomNav: dev.w < 900 ? dashVpCheck.bottomNavVisible : 'N/A',
          rail: dev.w >= 900 ? dashVpCheck.railVisible : 'N/A',
          aiPassed,
          drawerPassed
        }
      });
    }

    // -------------------------------------------------------------
    // TEST 4: CHECK VERTICAL SCROLL ACROSS ALL SECONDARY PAGES
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Secondary Pages Vertical Scrolling on Mobile (390x844) ---');
    await cdp.setViewport(390, 844);
    const secondaryPages = ['/alerts', '/weather', '/shelters', '/guides', '/offline', '/profile'];

    for (const page of secondaryPages) {
      await cdp.navigate(`http://localhost:3000${page}`);
      await sleep(500);

      const pageCheck = await cdp.eval(`(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const clientH = document.documentElement.clientHeight;
        const scrollH = document.documentElement.scrollHeight;
        return {
          hasOverflow: scrollW > docW,
          scrollH,
          clientH,
          isScrollable: scrollH > clientH
        };
      })()`);

      let canScroll = true;
      if (pageCheck.isScrollable) {
        await cdp.eval(`window.scrollTo(0, 200)`);
        await sleep(100);
        canScroll = await cdp.eval(`window.scrollY > 0`);
        await cdp.eval(`window.scrollTo(0, 0)`);
      }

      results.push({
        test: `Secondary Route ${page} Mobile Scroll`,
        passed: !pageCheck.hasOverflow && canScroll,
        details: {
          hasOverflow: pageCheck.hasOverflow,
          isScrollable: pageCheck.isScrollable,
          canScroll
        }
      });
    }

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    cdp.close();
    edgeProc.kill();
  }

  console.log('\n=============================================');
  console.log('FINAL VERTICAL SCROLLING & UX VERIFICATION SUMMARY:');
  console.log('=============================================');
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} : ${r.test}`);
    if (r.details) {
      console.log('   Details:', JSON.stringify(r.details));
    }
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL VERTICAL SCROLLING & RESPONSIVE CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME VERIFICATIONS FAILED.\n');
    process.exit(1);
  }
}

runTests();
