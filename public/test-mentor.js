// Simple test to check recent invitations
console.log('Checking for recent invitations...');

// Test the student-mentor API directly
fetch('/api/public/student-mentor?studentId=6969da08df26fcd9f45af398&t=' + Date.now())
  .then(response => response.json())
  .then(data => {
    console.log('Student Mentor API Response:', data);
  })
  .catch(error => console.error('Student Mentor API Error:', error));

// Test mentor invitations API  
fetch('/api/mentor/invitations')
  .then(response => response.json())
  .then(data => {
    console.log('Mentor Invitations API Response:', data);
    if (data.invitations && data.invitations.length > 0) {
      data.invitations.forEach((inv, index) => {
        console.log(`Invitation ${index + 1}:`, {
          id: inv._id,
          studentId: inv.studentId,
          studentIdType: typeof inv.studentId,
          studentIdValue: inv.studentId._id || inv.studentId,
          status: inv.status
        });
      });
    }
  })
  .catch(error => console.error('Mentor Invitations API Error:', error));
