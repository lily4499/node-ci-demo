// Minimal smoke "test" that runs inside the container.
// It just verifies the server module loads without throwing.
try {
  const server = require('../app');
  console.log('✅ App module loaded successfully');
  server.close?.(); // close if exported
  process.exit(0);
} catch (e) {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
}
