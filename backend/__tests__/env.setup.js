// Runs before any test file is loaded — sets env vars Jest needs
process.env.JWT_SECRET = "test_jwt_secret_for_testing_only";
process.env.NODE_ENV   = "test";
process.env.CLIENT_URL = "http://localhost:5173";
// Prevent nodemailer from erroring on missing credentials
process.env.EMAIL_USER = "test@test.com";
process.env.EMAIL_PASS = "testpass";
