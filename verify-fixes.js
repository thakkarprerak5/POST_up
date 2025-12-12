#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

function readFile(filePath) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function verifyBlobURLFix() {
  log('\n✓ Verifying Blob URL Fix in home-page-client.tsx...', 'cyan');
  
  try {
    const content = readFile('./components/home-page-client.tsx');
    
    // Check for the blob URL fix in FeedCard
    if (content.includes("!project.author.image.startsWith('blob:')")) {
      log('✅ Blob URL check found in FeedCard component', 'green');
      log('   Code: (project.author?.image && !project.author.image.startsWith(\'blob:\'))', 'green');
      log('   → Prevents loading invalid blob URLs on image reload', 'green');
      return true;
    } else {
      log('❌ Blob URL check NOT found in FeedCard', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error reading file: ${error.message}`, 'red');
    return false;
  }
}

function verifyLikeEndpointFix() {
  log('\n✓ Verifying Like Endpoint Fix in project-interactions.tsx...', 'cyan');
  
  try {
    const content = readFile('./components/project-interactions.tsx');
    
    const hasConsoleLog = content.includes("console.log('Calling like endpoint:', endpoint)");
    const hasErrorHandling = content.includes("console.error('Like endpoint error:'");
    const hasHeaders = content.includes("'Content-Type': 'application/json'");
    const hasErrorParsing = content.includes("const errorData = await response.json().catch");
    
    if (hasConsoleLog) {
      log('✅ Logging added to track endpoint calls', 'green');
    } else {
      log('❌ Missing console log for endpoint tracking', 'red');
    }
    
    if (hasHeaders) {
      log('✅ Content-Type header explicitly set', 'green');
    } else {
      log('❌ Missing Content-Type header', 'red');
    }
    
    if (hasErrorHandling) {
      log('✅ Error logging implemented', 'green');
    } else {
      log('❌ Missing error logging', 'red');
    }
    
    if (hasErrorParsing) {
      log('✅ Error response parsing with fallback', 'green');
    } else {
      log('❌ Missing error response parsing', 'red');
    }
    
    return hasConsoleLog && hasHeaders && hasErrorHandling && hasErrorParsing;
  } catch (error) {
    log(`❌ Error reading file: ${error.message}`, 'red');
    return false;
  }
}

function verifyLikeRouteExists() {
  log('\n✓ Verifying Like Route File Exists...', 'cyan');
  
  try {
    const routePath = './app/api/projects/[id]/like/route.ts';
    if (fs.existsSync(path.resolve(routePath))) {
      const content = readFile(routePath);
      
      if (content.includes('export async function POST')) {
        log('✅ Like route file exists with POST handler', 'green');
        log('   Path: app/api/projects/[id]/like/route.ts', 'green');
        return true;
      } else {
        log('❌ Like route missing POST handler', 'red');
        return false;
      }
    } else {
      log('❌ Like route file not found', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error checking route: ${error.message}`, 'red');
    return false;
  }
}

function verifySamplePlaceholder() {
  log('\n✓ Verifying Placeholder Image Fallback...', 'cyan');
  
  try {
    const content = readFile('./components/home-page-client.tsx');
    
    if (content.includes('/placeholder-user.jpg')) {
      log('✅ Placeholder image fallback defined', 'green');
      log('   Fallback: /placeholder-user.jpg', 'green');
      return true;
    } else {
      log('❌ Placeholder image not configured', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n🧪 VERIFICATION REPORT - CONSOLE ERROR FIXES\n', 'cyan');
  log('═'.repeat(60) + '\n', 'cyan');
  
  const results = {
    blobURL: verifyBlobURLFix(),
    likeEndpoint: verifyLikeEndpointFix(),
    likeRoute: verifyLikeRouteExists(),
    placeholder: verifySamplePlaceholder()
  };
  
  log('\n' + '═'.repeat(60), 'cyan');
  log('\n📊 SUMMARY\n', 'cyan');
  
  let passed = 0;
  let total = Object.keys(results).length;
  
  Object.entries(results).forEach(([key, result]) => {
    if (result) passed++;
  });
  
  log(`✅ Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 ALL CODE FIXES VERIFIED!\n', 'green');
    log('✓ Blob URL error fix is in place', 'green');
    log('✓ Like endpoint error handling is enhanced', 'green');
    log('✓ Like route file exists with proper handler', 'green');
    log('✓ Placeholder fallback is configured', 'green');
    
    log('\n📋 NEXT STEPS:\n', 'cyan');
    log('1. Open http://localhost:3000 in your browser', 'cyan');
    log('2. Press F12 to open Developer Tools', 'cyan');
    log('3. Go to Console tab', 'cyan');
    log('4. Reload the page (F5)', 'cyan');
    log('5. Check that no blob URL errors appear', 'cyan');
    log('6. Click a like button on any project', 'cyan');
    log('7. Check console for clean logs\n', 'cyan');
    
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed - review fixes needed\n', 'yellow');
    process.exit(1);
  }
}

main();
