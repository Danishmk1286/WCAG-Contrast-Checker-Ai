/**
 * Script to verify that the local server is serving assets with compression
 * Run this in Node.js or browser console
 */

// Browser console version
const browserCheckCompression = () => {
  console.log('🔍 Checking compression for local assets...\n');
  
  const assetsToCheck = [
    '/src/index.css',
    '/src/main.tsx',
    '/assets/index.css',
    '/assets/index.js'
  ];
  
  assetsToCheck.forEach(async (path) => {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const encoding = response.headers.get('content-encoding');
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      if (encoding) {
        console.log(`✅ ${path}`);
        console.log(`   Encoding: ${encoding}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Size: ${contentLength} bytes\n`);
      } else {
        console.log(`⚠️  ${path} - No compression detected`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Size: ${contentLength} bytes\n`);
      }
    } catch (error) {
      console.log(`❌ ${path} - Error: ${error.message}\n`);
    }
  });
};

// Node.js version
const nodeCheckCompression = async () => {
  const http = await import('http');
  
  const checkUrl = (url) => {
    return new Promise((resolve) => {
      const options = new URL(url);
      const req = http.request(options, (res) => {
        const encoding = res.headers['content-encoding'];
        const contentType = res.headers['content-type'];
        const contentLength = res.headers['content-length'];
        
        resolve({
          url,
          encoding: encoding || 'none',
          contentType,
          contentLength,
          compressed: !!encoding
        });
      });
      
      req.on('error', (error) => {
        resolve({
          url,
          error: error.message,
          compressed: false
        });
      });
      
      req.end();
    });
  };
  
  const urls = [
    'http://localhost:8080/src/index.css',
    'http://localhost:8080/src/main.tsx'
  ];
  
  console.log('🔍 Checking compression for local assets...\n');
  
  for (const url of urls) {
    const result = await checkUrl(url);
    if (result.error) {
      console.log(`❌ ${result.url} - Error: ${result.error}\n`);
    } else if (result.compressed) {
      console.log(`✅ ${result.url}`);
      console.log(`   Encoding: ${result.encoding}`);
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Size: ${result.contentLength} bytes\n`);
    } else {
      console.log(`⚠️  ${result.url} - No compression detected`);
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Size: ${result.contentLength} bytes\n`);
    }
  }
};

// Export for use
if (typeof window !== 'undefined') {
  // Browser environment
  window.checkCompression = browserCheckCompression;
  console.log('💡 Run checkCompression() in the console to verify compression');
} else {
  // Node.js environment
  nodeCheckCompression().catch(console.error);
}





