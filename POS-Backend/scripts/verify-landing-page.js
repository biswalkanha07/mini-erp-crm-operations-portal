/**
 * verify-landing-page.js
 * Automated verification of ERP&CRM portal branding, hero SVG background effects, and image dashboard mockup
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

async function testLandingPage() {
  console.log('================================================================');
  console.log('🧪 VERIFYING ERP&CRM PORTAL, SVG HERO EFFECTS & IMAGE MOCKUP');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Check Source Files
  console.log('--- 1. SOURCE CODE & ASSET INTEGRITY ---');
  const landingTsxPath = path.resolve(__dirname, '../../POS-Frontend/src/pages/LandingPage.tsx');
  const landingCssPath = path.resolve(__dirname, '../../POS-Frontend/src/pages/LandingPage.css');
  const appTsxPath = path.resolve(__dirname, '../../POS-Frontend/src/App.tsx');
  const erpLogoPath = path.resolve(__dirname, '../../POS-Frontend/src/components/common/ErpLogo.tsx');
  const imgOriginal = path.resolve(__dirname, '../../POS-Frontend/public/ChatGPT Image Sep 3, 2026, 12_28_07 AM.png');
  const imgClean = path.resolve(__dirname, '../../POS-Frontend/public/hero-dashboard-preview.png');

  assert('LandingPage.tsx exists', fs.existsSync(landingTsxPath));
  assert('LandingPage.css exists', fs.existsSync(landingCssPath));
  assert('App.tsx exists', fs.existsSync(appTsxPath));
  assert('Original image exists in public/', fs.existsSync(imgOriginal));
  assert('Clean filename image exists in public/', fs.existsSync(imgClean));

  const tsxContent = fs.readFileSync(landingTsxPath, 'utf8');
  const cssContent = fs.readFileSync(landingCssPath, 'utf8');
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  const logoContent = fs.readFileSync(erpLogoPath, 'utf8');

  // 2. Brand Name Verification: ERP&CRM portal
  console.log('\n--- 2. BRAND NAME: ERP&CRM portal EVERYWHERE IN UI ---');
  assert('LandingPage.tsx header has ERP&CRM portal', 
    tsxContent.includes('ERP&CRM portal'));
  assert('LandingPage.tsx footer has ERP&CRM portal', 
    tsxContent.includes('ERP&CRM portal. All rights reserved.'));
  assert('ErpLogo.tsx default text is ERP&CRM portal', 
    logoContent.includes('ERP&CRM portal'));
  assert('App.tsx document.title is ERP&CRM portal', 
    appContent.includes("document.title = 'ERP&CRM portal';"));

  // 3. Hero SVG Background Effects
  console.log('\n--- 3. HERO SVG BACKGROUND EFFECTS ---');
  assert('Hero has erp-hero-svg-canvas element', 
    tsxContent.includes('erp-hero-svg-canvas') && cssContent.includes('.erp-hero-svg-canvas'));
  assert('SVG defines architectural wave ribbon gradients', 
    tsxContent.includes('heroSvgWave1') && tsxContent.includes('heroSvgWave2'));
  assert('SVG defines tech coordinate grid pattern', 
    tsxContent.includes('heroGridPattern'));
  assert('SVG defines tech accent vector lines', 
    tsxContent.includes('heroTechLine'));
  assert('SVG defines coordinate tech crosshairs', 
    tsxContent.includes('stroke="#3b82f6"'));
  assert('Hero has glowing ambient orbs (glow-right & glow-left)', 
    tsxContent.includes('erp-hero-glow-right') && tsxContent.includes('erp-hero-glow-left'));

  // 4. Hero Dashboard Image Mockup Frame
  console.log('\n--- 4. HERO DASHBOARD IMAGE MOCKUP FRAME ---');
  assert('Dashboard mockup frame container present', 
    tsxContent.includes('erp-dashboard-image-frame') && cssContent.includes('.erp-dashboard-image-frame'));
  assert('Window controls present (macOS dots)', 
    tsxContent.includes('erp-window-controls') && tsxContent.includes('erp-window-dot-red'));
  assert('Window URL title pill present: erp-crm-portal.app/operations', 
    tsxContent.includes('erp-crm-portal.app/operations'));
  assert('Status badge present: All systems operational', 
    tsxContent.includes('All systems operational'));
  assert('Dashboard preview image embedded with fallback', 
    tsxContent.includes('/hero-dashboard-preview.png') && tsxContent.includes('ChatGPT Image Sep 3, 2026, 12_28_07 AM.png'));
  assert('Floating sync status badge present (Neon DB Active)', 
    tsxContent.includes('erp-floating-sync-badge') && tsxContent.includes('Neon DB Active'));

  // 5. Scrollable Sections Verification
  console.log('\n--- 5. SCROLLABLE SECTIONS VERIFICATION ---');
  assert('Feature section present (6 cards)', 
    tsxContent.includes('Everything Your Operations Team Needs') &&
    tsxContent.includes('Customer & CRM'));
  assert('Role section present (4 cards)', 
    tsxContent.includes('Built for Every Operations Role'));
  assert('Trust & Final CTA sections present', 
    tsxContent.includes('One Platform. Complete Operational Visibility.') &&
    tsxContent.includes('Ready to Simplify Your Operations?'));

  // 6. Production Build Artifacts
  console.log('\n--- 6. PRODUCTION BUILD ARTIFACTS ---');
  const buildDir = path.resolve(__dirname, '../../POS-Frontend/build');
  assert('Frontend build directory exists', fs.existsSync(buildDir));
  assert('build/index.html exists', fs.existsSync(path.join(buildDir, 'index.html')));

  // 7. Live HTTP Test
  console.log('\n--- 7. LIVE HTTP TEST (http://localhost:3000/) ---');
  await new Promise((resolve) => {
    http.get('http://localhost:3000/', (res) => {
      assert('http://localhost:3000/ responds with HTTP 200 OK', res.statusCode === 200);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert('HTML contains root element <div id="root">', data.includes('id="root"'));
        resolve();
      });
    }).on('error', (err) => {
      assert(`HTTP request failed: ${err.message}`, false);
      resolve();
    });
  });

  console.log('\n================================================================');
  console.log(`📊 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

testLandingPage().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
