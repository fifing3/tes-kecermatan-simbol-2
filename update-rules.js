const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "return request.auth != null && \\n             request.auth.token.email_verified == true && \\n             request.auth.token.email == 'fifing3@gmail.com';",
  "return request.auth != null && \\n             ((request.auth.token.email_verified == true && request.auth.token.email == 'fifing3@gmail.com') || \\n              request.auth.token.firebase.sign_in_provider == 'anonymous');"
);

fs.writeFileSync('firestore.rules', rules);
