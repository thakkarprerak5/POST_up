const mongoose = require('mongoose');

async function checkAllGanpatProjects() {
  try {
    console.log('🔍 Checking All Ganpat Projects\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projects = db.collection('projects');
    
    const allProjects = await projects.find({}).toArray();
    console.log(`📊 Found ${allProjects.length} total projects`);
    
    console.log('\n📋 All Projects:');
    allProjects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} - author: ${p.author?.name} - _id: ${p._id}`);
      if (p.author?.name === 'ganpat') {
        console.log(`   >>> GANPAT: image=${p.author?.image}, avatar=${p.author?.avatar}`);
      }
    });
    
    // Find projects with ganpat author
    const ganpatProjects = allProjects.filter(p => p.author?.name === 'ganpat');
    console.log(`\n✅ Found ${ganpatProjects.length} ganpat projects:`);
    
    ganpatProjects.forEach((project, index) => {
      console.log(`\n   ${index + 1}. ${project.title}`);
      console.log(`      _id: ${project._id}`);
      console.log(`      author.id: ${project.author?.id}`);
      console.log(`      author.name: ${project.author?.name}`);
      console.log(`      author.image: ${project.author?.image || 'NOT SET'}`);
      console.log(`      author.avatar: ${project.author?.avatar || 'NOT SET'}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAllGanpatProjects();
