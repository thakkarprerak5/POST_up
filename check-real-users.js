// Check which users have real accounts vs sample users
const { MongoClient } = require('mongodb');

async function checkRealUsers() {
  const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('post-up');
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Get all real users
    const realUsers = await usersCollection.find({}).toArray();
    console.log(`\n👥 Found ${realUsers.length} real users:`);
    
    realUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.name || 'Unknown'} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Type: ${user.type || 'student'}`);
      console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Profile: ${user.profile ? 'Complete' : 'Incomplete'}`);
      console.log('---');
    });
    
    // Get all projects and their authors
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`\n📦 Found ${allProjects.length} projects:`);
    
    const realUserIds = realUsers.map(user => user._id.toString());
    
    allProjects.forEach((project, index) => {
      const authorId = project.author?.id;
      const isFromRealUser = realUserIds.includes(authorId);
      
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Author: ${project.author?.name}`);
      console.log(`   Author ID: ${authorId}`);
      console.log(`   From Real User: ${isFromRealUser ? '✅ Yes' : '❌ No'}`);
      console.log('---');
    });
    
    // Count projects from real vs fake users
    const realUserProjects = allProjects.filter(project => 
      realUserIds.includes(project.author?.id)
    );
    
    const fakeUserProjects = allProjects.filter(project => 
      !realUserIds.includes(project.author?.id)
    );
    
    console.log(`\n📊 Summary:`);
    console.log(`Real users: ${realUsers.length}`);
    console.log(`Projects from real users: ${realUserProjects.length}`);
    console.log(`Projects from fake users: ${fakeUserProjects.length}`);
    
    if (fakeUserProjects.length > 0) {
      console.log(`\n❌ Projects to hide (from fake users):`);
      fakeUserProjects.forEach(project => {
        console.log(`   - ${project.title} by ${project.author?.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkRealUsers();
