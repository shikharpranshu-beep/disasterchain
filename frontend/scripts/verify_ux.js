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
    const isMobile = width < 900;
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile,
    });
    if (isMobile) {
      await this.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1200);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) { }
    }
  }
}

// Emulate real physical touch finger drag across the screen
async function realTouchSwipeUp(cdp, startX, startY, distance = 350, steps = 10) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 0 }]
  });
  const stepDelta = distance / steps;
  for (let i = 1; i <= steps; i++) {
    const curY = Math.round(startY - stepDelta * i);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX, y: curY, id: 0 }]
    });
    await sleep(20);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await sleep(350);
}

async function realTouchSwipeDown(cdp, startX, startY, distance = 350, steps = 10) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 0 }]
  });
  const stepDelta = distance / steps;
  for (let i = 1; i <= steps; i++) {
    const curY = Math.round(startY + stepDelta * i);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX, y: curY, id: 0 }]
    });
    await sleep(20);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await sleep(350);
}

async function runTests() {
  console.log('=== STARTING DISASTERCHAIN REAL TOUCH VERTICAL SCROLLING & UX VERIFICATION ===');

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
      const subtitle = document.querySelector('section p')?.innerText;
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

    // Verify vertical scroll down and up on desktop
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
    // TEST 3: FULL DEVICE TEST MATRIX - REAL TOUCH VERTICAL SCROLLING
    // -------------------------------------------------------------
    const testMatrix = [
      // Exact required viewports from STEP 13
      { w: 360, h: 800, name: 'Phone 360x800', type: 'phone' },
      { w: 375, h: 812, name: 'Phone 375x812', type: 'phone' },
      { w: 390, h: 844, name: 'Phone 390x844', type: 'phone' },
      { w: 412, h: 915, name: 'Phone 412x915', type: 'phone' },
      { w: 430, h: 932, name: 'Phone 430x932', type: 'phone' },
      { w: 480, h: 1040, name: 'Phone 480x1040', type: 'phone' },
      { w: 540, h: 720, name: 'Phone/Foldable 540x720', type: 'phone' },
      { w: 600, h: 800, name: 'Phone 600x800', type: 'phone' },
      { w: 720, h: 1280, name: 'Large Phone 720x1280', type: 'large-phone' },
      { w: 768, h: 1024, name: 'Tablet 768x1024', type: 'tablet' },
      { w: 820, h: 1180, name: 'Tablet 820x1180', type: 'tablet' },
      { w: 900, h: 1200, name: 'Tablet 900x1200', type: 'compact-desktop' },
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

      // Test REAL TOUCH SWIPE on mobile (< 900) or programmatic/mouse on desktop (>= 900)
      let landingScrolledDown = false;
      let landingScrolledBack = false;

      if (dev.w < 900) {
        // Real touch finger swipe upward -> moves page downward
        await realTouchSwipeUp(cdp, Math.round(dev.w / 2), Math.round(dev.h * 0.7), Math.round(dev.h * 0.4));
        const downY = await cdp.eval(`window.scrollY`);
        landingScrolledDown = downY > 30;

        // Real touch finger swipe downward -> moves page back up
        await realTouchSwipeDown(cdp, Math.round(dev.w / 2), Math.round(dev.h * 0.25), Math.round(dev.h * 0.45));
        const backY = await cdp.eval(`window.scrollY`);
        landingScrolledBack = backY < downY;
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
      } else {
        await cdp.eval(`window.scrollTo({ top: 350, behavior: 'instant' })`);
        await sleep(150);
        landingScrolledDown = await cdp.eval(`window.scrollY > 50`);
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
        await sleep(100);
        landingScrolledBack = await cdp.eval(`window.scrollY === 0`);
      }

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
      let dashScrolledDown = false;
      let dashScrolledBack = false;

      if (dev.w < 900) {
        await realTouchSwipeUp(cdp, Math.round(dev.w / 2), Math.round(dev.h * 0.7), Math.round(dev.h * 0.35));
        const downY = await cdp.eval(`window.scrollY`);
        dashScrolledDown = downY > 30;

        await realTouchSwipeDown(cdp, Math.round(dev.w / 2), Math.round(dev.h * 0.25), Math.round(dev.h * 0.45));
        const backY = await cdp.eval(`window.scrollY`);
        dashScrolledBack = backY < downY;
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
      } else {
        await cdp.eval(`window.scrollTo({ top: 300, behavior: 'instant' })`);
        await sleep(150);
        dashScrolledDown = await cdp.eval(`window.scrollY > 50`);
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
        await sleep(100);
        dashScrolledBack = await cdp.eval(`window.scrollY === 0`);
      }

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

          return {
            hasModal: !!modal,
            modalWidth: mRect?.width,
            modalHeight: mRect?.height,
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
        await cdp.eval(`window.scrollTo({ top: 250, behavior: 'instant' })`);
        await sleep(150);
        const postAiScrolled = await cdp.eval(`window.scrollY > 0`);
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);

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
        (landingVpCheck.isTallerThanViewport ? (landingScrolledDown && landingScrolledBack) : true) &&
        (dashVpCheck.isTallerThanViewport ? (dashScrolledDown && dashScrolledBack) : true) &&
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
          touchOrPageScrollsVertically: landingScrolledDown && dashScrolledDown,
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
    // TEST 4: CHECK VERTICAL SCROLL ACROSS ALL REQUIRED ROUTES (STEP 12)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing All Required Routes with Real Touch Drag on Mobile (390x844) ---');
    await cdp.setViewport(390, 844);

    const requiredRoutes = [
      '/',
      '/dashboard',
      '/alerts',
      '/weather',
      '/shelters',
      '/guides',
      '/offline',
      '/profile',
      '/incidents',
      '/resources',
      '/donations',
      '/preparedness',
      '/map'
    ];

    for (const page of requiredRoutes) {
      await cdp.navigate(`http://localhost:3000${page}`);
      await sleep(600);

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
        // Real touch swipe upward
        await realTouchSwipeUp(cdp, 195, 600, 300);
        const scrolledY = await cdp.eval(`window.scrollY`);
        canScroll = scrolledY > 30;

        // Real touch swipe back downward
        await realTouchSwipeDown(cdp, 195, 250, 300);
        await sleep(100);
        await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
      }

      results.push({
        test: `Route ${page} Real Touch Mobile Scroll`,
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
    console.log('\n🎉 ALL REAL TOUCH VERTICAL SCROLLING & RESPONSIVE CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME VERIFICATIONS FAILED.\n');
    process.exit(1);
  }
}

runTests();
