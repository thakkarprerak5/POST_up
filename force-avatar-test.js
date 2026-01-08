// Force avatar test with inline styles to bypass any CSS issues
const fs = require('fs');
const path = require('path');

async function forceAvatarTest() {
  console.log('🔧 Force Avatar Test - Bypassing CSS Issues\n');
  
  try {
    // Read the current project card file
    const projectCardPath = path.join(__dirname, 'components', 'project-card.tsx');
    let projectCardContent = fs.readFileSync(projectCardPath, 'utf8');
    
    // Find the ganpat-specific code and replace with inline styles
    const oldCode = `              {/* Simple HTML img for ganpat - this will definitely work */}
              {project.author.name === 'ganpat' ? (
                <>
                  <img 
                    src={project.author.image || project.author.avatar || '/placeholder-user.jpg'} 
                    alt={project.author.name}
                    className="h-8 w-8 rounded-full cursor-pointer object-cover"
                    onClick={handleAuthorClick}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.log('HTML img failed to load:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('HTML img loaded successfully');
                    }}
                  />
                  <div 
                    className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium cursor-pointer"
                    style={{display: 'none'}}
                    onClick={handleAuthorClick}
                  >
                    {project.author.name.charAt(0).toUpperCase()}
                  </div>
                </>`;
    
    const newCode = `              {/* Simple HTML img for ganpat - with inline styles to bypass CSS */}
              {project.author.name === 'ganpat' ? (
                <>
                  <img 
                    src={project.author.image || project.author.avatar || '/placeholder-user.jpg'} 
                    alt={project.author.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onClick={handleAuthorClick}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.log('HTML img failed to load:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        (nextElement as HTMLElement).style.display = 'flex';
                      }
                    }}
                    onLoad={() => {
                      console.log('HTML img loaded successfully');
                    }}
                  />
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#6b7280',
                      cursor: 'pointer'
                    }}
                    onClick={handleAuthorClick}
                  >
                    {project.author.name.charAt(0).toUpperCase()}
                  </div>
                </>`;
    
    // Replace the code
    projectCardContent = projectCardContent.replace(oldCode, newCode);
    
    // Write back the file
    fs.writeFileSync(projectCardPath, projectCardContent);
    
    console.log('✅ Updated project-card.tsx with inline styles');
    console.log('✅ This bypasses any CSS issues');
    console.log('✅ Image will be forced to display with inline styles');
    
    console.log('\n🎯 TEST INSTRUCTIONS:');
    console.log('1. Server should recompile automatically');
    console.log('2. Refresh browser (Ctrl+F5)');
    console.log('3. Go to: http://localhost:3000');
    console.log('4. Look for ganpat\'s "website" project');
    console.log('5. Profile photo should now be visible with inline styles');
    
    console.log('\n🔍 WHAT THIS FIX DOES:');
    console.log('• Uses inline styles instead of Tailwind classes');
    console.log('• Bypasses any CSS loading issues');
    console.log('• Forces image to be visible');
    console.log('• Maintains fallback functionality');
    
  } catch (error) {
    console.error('❌ Force test failed:', error.message);
  }
}

forceAvatarTest();
