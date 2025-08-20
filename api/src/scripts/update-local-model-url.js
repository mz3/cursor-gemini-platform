import { AppDataSource } from '../config/database.js';
import { AIModel } from '../entities/AIModel.js';

async function updateLocalModelUrl() {
  try {
    console.log('🔌 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const aiModelRepository = AppDataSource.getRepository(AIModel);

    // Find the local Gemma model
    const localModel = await aiModelRepository.findOne({
      where: {
        modelId: 'google/gemma-3-12b',
        provider: 'local'
      }
    });

    if (!localModel) {
      console.error('❌ Local Gemma model not found');
      return;
    }

    console.log('✅ Found local model:', localModel.displayName);
    console.log('📝 Current base URL:', localModel.baseUrl);

    // Update to use host IP instead of localhost
    const newBaseUrl = 'http://192.168.0.227:1234/v1';
    localModel.baseUrl = newBaseUrl;

    await aiModelRepository.save(localModel);
    console.log('✅ Updated base URL to:', newBaseUrl);

    console.log('🎉 Local model URL updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

updateLocalModelUrl();
