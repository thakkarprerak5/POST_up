// Test what happens when we access project page directly
const puppeteer = require('puppeteer');

async function testProjectPage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Opening project page...');
    
    // Go to project page
    await page.goto('http://localhost:3000/projects/693aaf4dc27e95a9fd1a0f05');
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check if like button exists and what it shows
    const likeButton = await page.$('[data-testid="like-button"]');
    if (likeButton) {
      const buttonText = await page.evaluate(el => el.textContent, likeButton);
      console.log('❤️ Like button text:', buttonText);
    }
    
    // Check like count
    const likeCount = await page.$('[data-testid="like-count"]');
    if (likeCount) {
      const countText = await page.evaluate(el => el.textContent, likeCount);
      console.log('📈 Like count displayed:', countText);
    }
    
    // Wait a bit to see any console logs
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProjectPage();
