import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runBotExecutionTests() {
  console.log('🧪 Running Bot Execution Integration Tests...\n');

  try {
    // Run the specific test file
    const { stdout, stderr } = await execAsync(
      'npm test -- --testPathPattern=bot-execution.integration.ts --verbose',
      { cwd: process.cwd() }
    );

    console.log('✅ Test Results:');
    console.log(stdout);

    if (stderr) {
      console.log('⚠️ Test Warnings/Errors:');
      console.log(stderr);
    }

    console.log('\n🎉 Bot Execution Integration Tests Completed!');
  } catch (error) {
    console.error('❌ Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runBotExecutionTests();
}

export { runBotExecutionTests }; 