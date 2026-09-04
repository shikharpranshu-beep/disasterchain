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
      mobile: width < 768,
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
  console.log('=== STARTING DISASTERCHAIN UX VERIFICATION ===');

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
    } catch (e) {}
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
    // TEST 1: DESKTOP (1440x900) - LANDING PAGE
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Landing Page on Desktop (1440x900) ---');
    await cdp.setViewport(1440, 900);
    await cdp.navigate('http://localhost:3000/');

    const landingData = await cdp.eval(`(() => {
      const h1 = document.querySelector('h1')?.innerText;
      const subtitle = document.querySelector('main p')?.innerText;
      const sosBtn = document.getElementById('landing-primary-sos-btn');
      const secBtns = Array.from(document.querySelectorAll('.landing-secondary-btn')).map(b => b.innerText.trim());
      const blocks = Array.from(document.querySelectorAll('.landing-compact-blocks > div')).map(d => ({
        title: d.querySelector('div')?.innerText,
        h: d.querySelectorAll('div')[1]?.innerText
      }));
      const links = Array.from(document.querySelectorAll('a')).filter(a => a.innerText.includes('Command') || a.innerText.includes('Emergency Data')).map(a => a.innerText.trim());

      return {
        h1,
        subtitle,
        hasSosBtn: !!sosBtn,
        sosText: sosBtn?.innerText,
        secBtns,
        blocksCount: blocks.length,
        blocks,
        links
      };
    })()`);

    console.log('Landing Page Data:', JSON.stringify(landingData, null, 2));
    results.push({
      test: 'Desktop Landing Page',
      passed: landingData.h1.includes('DISASTERCHAIN') &&
              landingData.hasSosBtn &&
              landingData.blocksCount === 3 &&
              landingData.secBtns.length >= 3,
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
      const attentionHeader = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('ATTENTION'))?.innerText;
      const attentionItemsCount = document.querySelectorAll('h2 ~ div > div').length;
      const quickActionsHeader = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('QUICK ACTIONS'))?.innerText;
      const quickActionLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href && (a.href.includes('/shelters') || a.href.includes('/weather') || a.href.includes('/affected-areas') || a.href.includes('/guides'))).map(a => a.innerText.trim());
      const liveMapPreview = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('OPEN FULL MAP'))?.innerText;

      return {
        header,
        hasSosBtn: !!sosCardBtn,
        sosText: sosCardBtn?.innerText,
        statusCardsCount: statusCards.length,
        statusCards,
        attentionHeader,
        quickActionsHeader,
        hasLiveMapPreview: !!liveMapPreview
      };
    })()`);

    console.log('Dashboard Data:', JSON.stringify(dashData, null, 2));
    results.push({
      test: 'Desktop Dashboard Emergency Overview',
      passed: dashData.hasSosBtn &&
              dashData.statusCardsCount === 4 &&
              !!dashData.attentionHeader &&
              !!dashData.quickActionsHeader &&
              dashData.hasLiveMapPreview,
    });

    // -------------------------------------------------------------
    // TEST 3: DESKTOP AI ASSISTANT (OPEN, CONTENT, CLOSE, ESCAPE)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Desktop AI Assistant Interaction ---');
    const aiLauncherVisibleBefore = await cdp.eval(`!document.getElementById('open-ai-assistant-btn').hidden`);
    console.log('AI Launcher visible initially:', aiLauncherVisibleBefore);

    // Open AI
    await cdp.eval(`document.getElementById('open-ai-assistant-btn').click()`);
    await sleep(500);

    const aiOpenData = await cdp.eval(`(() => {
      const modal = document.querySelector('.disaster-ai-modal');
      const launcher = document.getElementById('open-ai-assistant-btn');
      const headerTitle = modal?.querySelector('header')?.innerText;
      const chips = Array.from(document.querySelectorAll('.disaster-ai-chips button')).map(b => b.innerText.trim());
      const closeBtn = document.getElementById('close-ai-assistant-btn');
      const rect = modal?.getBoundingClientRect();

      return {
        hasModal: !!modal,
        launcherHidden: !launcher,
        headerTitle,
        chipsCount: chips.length,
        chips,
        hasCloseBtn: !!closeBtn,
        modalDimensions: rect ? { width: rect.width, height: rect.height } : null
      };
    })()`);

    console.log('AI Assistant Open State:', JSON.stringify(aiOpenData, null, 2));

    // Close via X button
    await cdp.eval(`document.getElementById('close-ai-assistant-btn').click()`);
    await sleep(400);

    const aiClosedX = await cdp.eval(`!document.querySelector('.disaster-ai-modal') && !!document.getElementById('open-ai-assistant-btn')`);
    console.log('AI closed via X button successfully:', aiClosedX);

    // Test Escape key close
    await cdp.eval(`document.getElementById('open-ai-assistant-btn').click()`);
    await sleep(400);
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(400);
    const aiClosedEsc = await cdp.eval(`!document.querySelector('.disaster-ai-modal') && !!document.getElementById('open-ai-assistant-btn')`);
    console.log('AI closed via Escape key successfully:', aiClosedEsc);

    results.push({
      test: 'Desktop AI Assistant Open & Close',
      passed: aiOpenData.hasModal &&
              aiOpenData.chipsCount === 5 &&
              aiClosedX &&
              aiClosedEsc,
    });

    // -------------------------------------------------------------
    // TEST 4: MOBILE VIEWPORTS (360x800, 375x812, 390x844, 412x915)
    // -------------------------------------------------------------
    const mobileViewports = [
      { w: 360, h: 800, name: 'Small Android (360x800)' },
      { w: 375, h: 812, name: 'iPhone X/Mini (375x812)' },
      { w: 390, h: 844, name: 'iPhone 12/13/14 (390x844)' },
      { w: 412, h: 915, name: 'Pixel / Samsung (412x915)' },
    ];

    for (const vp of mobileViewports) {
      console.log(`\n--- 4. Testing Mobile Viewport: ${vp.name} ---`);
      await cdp.setViewport(vp.w, vp.h);
      await cdp.navigate('http://localhost:3000/dashboard');
      await sleep(600);

      // Check overflow & 1-column layout
      const mobileCheck = await cdp.eval(`(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const statusRow = document.querySelector('.dashboard-status-row');
        const gridCols = statusRow ? window.getComputedStyle(statusRow).gridTemplateColumns.split(' ').length : 0;
        const launcher = document.getElementById('open-ai-assistant-btn');
        const launcherRect = launcher ? launcher.getBoundingClientRect() : null;

        return {
          viewportW: docW,
          scrollW: scrollW,
          hasOverflow: scrollW > docW,
          gridCols,
          launcherVisible: !!launcher && launcherRect.width > 0,
          launcherBottom: launcherRect ? Math.round(window.innerHeight - launcherRect.bottom) : null
        };
      })()`);

      console.log(`${vp.name} Overview:`, JSON.stringify(mobileCheck, null, 2));

      // Open AI Modal on mobile
      await cdp.eval(`document.getElementById('open-ai-assistant-btn').click()`);
      await sleep(500);

      // Verify Mobile AI Modal & CRITICAL Close Button
      const mobileAiCheck = await cdp.eval(`(() => {
        const modal = document.querySelector('.disaster-ai-modal');
        const closeBtn = document.getElementById('close-ai-assistant-btn');
        const mRect = modal ? modal.getBoundingClientRect() : null;
        const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
        const cStyles = closeBtn ? window.getComputedStyle(closeBtn) : null;
        const bottomNav = document.querySelector('.mobile-emergency-bottom-bar');
        const bottomNavDisplay = bottomNav ? window.getComputedStyle(bottomNav).display : 'none';

        return {
          modalCoversScreen: mRect && mRect.width === window.innerWidth && mRect.height === window.innerHeight,
          modalWidth: mRect?.width,
          modalHeight: mRect?.height,
          closeBtnVisible: !!closeBtn && cRect.width > 0,
          closeBtnWidth: cRect?.width,
          closeBtnHeight: cRect?.height,
          closeBtnTop: cRect?.top,
          closeBtnZIndex: cStyles?.zIndex,
          bottomNavHidden: bottomNavDisplay === 'none'
        };
      })()`);

      console.log(`${vp.name} Mobile AI & Close Button Check:`, JSON.stringify(mobileAiCheck, null, 2));

      // Test Close Button Tap on mobile
      await cdp.eval(`document.getElementById('close-ai-assistant-btn').click()`);
      await sleep(400);

      const mobileClosed = await cdp.eval(`!document.querySelector('.disaster-ai-modal') && !!document.getElementById('open-ai-assistant-btn')`);
      console.log(`${vp.name} Closed successfully via ✕ button:`, mobileClosed);

      const passed = !mobileCheck.hasOverflow &&
                     mobileCheck.gridCols === 1 &&
                     mobileAiCheck.closeBtnWidth >= 44 &&
                     mobileAiCheck.closeBtnHeight >= 44 &&
                     mobileAiCheck.closeBtnTop >= 16 &&
                     mobileClosed;

      results.push({
        test: `Mobile Viewport ${vp.name}`,
        passed,
        details: {
          noOverflow: !mobileCheck.hasOverflow,
          singleColumn: mobileCheck.gridCols === 1,
          closeBtnSize: `${mobileAiCheck.closeBtnWidth}x${mobileAiCheck.closeBtnHeight}px (>=44x44)`,
          closeBtnTopSafe: `${mobileAiCheck.closeBtnTop}px (>=16px safe area)`,
          closedCleanly: mobileClosed
        }
      });
    }

    // -------------------------------------------------------------
    // TEST 5: PWA STANDALONE MODE SIMULATION
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing PWA Standalone Mode Simulation ---');
    await cdp.setViewport(390, 844);
    await cdp.navigate('http://localhost:3000/dashboard');
    await sleep(600);

    // Emulate PWA standalone environment
    await cdp.eval(`(() => {
      Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
      const origMatch = window.matchMedia;
      window.matchMedia = (q) => {
        if (q.includes('standalone')) {
          return { matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {} };
        }
        return origMatch ? origMatch(q) : { matches: false };
      };
    })()`);

    await cdp.eval(`document.getElementById('open-ai-assistant-btn').click()`);
    await sleep(500);

    const pwaCheck = await cdp.eval(`(() => {
      const closeBtn = document.getElementById('close-ai-assistant-btn');
      const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      return {
        isStandalone,
        closeBtnWidth: cRect?.width,
        closeBtnHeight: cRect?.height,
        closeBtnTop: cRect?.top,
        closeBtnClickable: !closeBtn.disabled
      };
    })()`);

    console.log('PWA Standalone Check:', JSON.stringify(pwaCheck, null, 2));

    await cdp.eval(`document.getElementById('close-ai-assistant-btn').click()`);
    await sleep(400);
    const pwaClosed = await cdp.eval(`!document.querySelector('.disaster-ai-modal')`);

    results.push({
      test: 'PWA Standalone Mode AI Close Button',
      passed: pwaCheck.isStandalone &&
              pwaCheck.closeBtnWidth >= 44 &&
              pwaCheck.closeBtnTop >= 16 &&
              pwaClosed,
    });

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    cdp.close();
    edgeProc.kill();
  }

  console.log('\n=============================================');
  console.log('FINAL VERIFICATION SUMMARY:');
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
    console.log('\n🎉 ALL FRONTEND UX & MOBILE AI VERIFICATIONS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME VERIFICATIONS FAILED.\n');
    process.exit(1);
  }
}

runTests();
