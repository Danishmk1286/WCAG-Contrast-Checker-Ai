/**
 * Verification script for localhost optimizations
 * Run this in the browser console at http://localhost:8080/
 */

const verifyLocalhostOptimizations = () => {
  console.log('🔍 Verifying Localhost Optimizations\n');
  console.log('=' .repeat(50));
  
  const results = {
    lcp: false,
    images: false,
    compression: false,
    accessibility: false,
    csp: false
  };
  
  // 1. Check LCP optimizations
  console.log('\n1. LCP Optimization Check:');
  const preloadLinks = Array.from(document.querySelectorAll('link[rel="preload"]'));
  const hasCssPreload = preloadLinks.some(link => link.href.includes('index.css'));
  const hasScriptPreload = preloadLinks.some(link => link.href.includes('main.tsx') && link.getAttribute('fetchpriority') === 'high');
  
  if (hasCssPreload && hasScriptPreload) {
    console.log('   ✅ CSS and script preloads found');
    results.lcp = true;
  } else {
    console.log('   ⚠️  Missing preload hints');
    console.log(`   CSS preload: ${hasCssPreload}`);
    console.log(`   Script preload with fetchpriority: ${hasScriptPreload}`);
  }
  
  // Check hero H1
  const heroH1 = document.querySelector('#hero-heading');
  if (heroH1) {
    const styles = window.getComputedStyle(heroH1);
    const hasContentVisibility = styles.contentVisibility === 'auto';
    if (hasContentVisibility) {
      console.log('   ✅ Hero H1 has content-visibility: auto');
    } else {
      console.log('   ⚠️  Hero H1 missing content-visibility optimization');
    }
  }
  
  // 2. Check image optimizations
  console.log('\n2. Image Format Check:');
  const images = Array.from(document.querySelectorAll('img, picture'));
  const optimizedImages = images.filter(img => {
    const parent = img.closest('picture');
    return parent !== null;
  });
  
  if (optimizedImages.length > 0) {
    console.log(`   ✅ Found ${optimizedImages.length} optimized images with picture element`);
    results.images = true;
  } else {
    console.log('   ⚠️  No optimized images found (may be normal if not using OptimizedImage component)');
  }
  
  // Check for width/height attributes
  const imagesWithDimensions = images.filter(img => img.width && img.height);
  console.log(`   📊 Images with dimensions: ${imagesWithDimensions.length}/${images.length}`);
  
  // 3. Check compression
  console.log('\n3. Compression Check:');
  console.log('   💡 Run checkCompression() to verify server compression');
  console.log('   💡 Or check Network tab in DevTools for Content-Encoding header');
  results.compression = 'manual';
  
  // 4. Check accessibility
  console.log('\n4. Accessibility Check:');
  const ariaLiveRegions = Array.from(document.querySelectorAll('[aria-live]'));
  if (ariaLiveRegions.length > 0) {
    console.log(`   ✅ Found ${ariaLiveRegions.length} aria-live region(s)`);
    ariaLiveRegions.forEach((region, i) => {
      console.log(`      ${i + 1}. ${region.getAttribute('aria-live')} - ${region.textContent?.substring(0, 50)}...`);
    });
    results.accessibility = true;
  } else {
    console.log('   ⚠️  No aria-live regions found');
  }
  
  // Check input labels
  const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"], input[type="color"]'));
  const inputsWithLabels = inputs.filter(input => {
    const id = input.id;
    if (!id) return false;
    const label = document.querySelector(`label[for="${id}"]`);
    return label !== null;
  });
  console.log(`   📊 Inputs with associated labels: ${inputsWithLabels.length}/${inputs.length}`);
  
  if (inputsWithLabels.length === inputs.length) {
    console.log('   ✅ All inputs have associated labels');
  } else {
    console.log('   ⚠️  Some inputs missing label associations');
  }
  
  // 5. Check CSP for localhost
  console.log('\n5. CSP (Content Security Policy) Check:');
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost && !cspMeta) {
    console.log('   ✅ CSP upgrade-insecure-requests correctly disabled for localhost');
    results.csp = true;
  } else if (!isLocalhost && cspMeta) {
    console.log('   ✅ CSP upgrade-insecure-requests enabled for production');
    results.csp = true;
  } else {
    console.log('   ⚠️  CSP configuration may need adjustment');
    console.log(`   Is localhost: ${isLocalhost}`);
    console.log(`   CSP meta tag present: ${cspMeta !== null}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   LCP Optimization: ${results.lcp ? '✅' : '⚠️'}`);
  console.log(`   Image Optimization: ${results.images ? '✅' : '⚠️'}`);
  console.log(`   Compression: ${results.compression === 'manual' ? '🔍 Manual check required' : results.compression ? '✅' : '⚠️'}`);
  console.log(`   Accessibility: ${results.accessibility ? '✅' : '⚠️'}`);
  console.log(`   CSP (Localhost): ${results.csp ? '✅' : '⚠️'}`);
  console.log('\n💡 Tips:');
  console.log('   - Open Network tab in DevTools to verify compression');
  console.log('   - Check Response Headers for Content-Encoding: gzip or br');
  console.log('   - Run Lighthouse audit to verify all optimizations');
  console.log('   - Test with screen reader to verify aria-live announcements');
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.verifyLocalhostOptimizations = verifyLocalhostOptimizations;
  console.log('💡 Run verifyLocalhostOptimizations() in the console to check optimizations');
}

export default verifyLocalhostOptimizations;





