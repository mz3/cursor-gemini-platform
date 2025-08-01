import { AppDataSource } from '../config/database';
import { Application } from '../entities/Application';
import { CodeTemplate } from '../entities/CodeTemplate';
import * as ejs from 'ejs';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const buildApplication = async (applicationId: string): Promise<void> => {
  try {
    console.log(`Starting build for application: ${applicationId}`);

    // Get application details
    const applicationRepository = AppDataSource.getRepository(Application);
    const application = await applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['model']
    });

    if (!application) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    // Validate application name
    if (!application.name || application.name.trim() === '') {
      throw new Error(`Application name is required: ${applicationId}`);
    }

    // Update status to building
    application.status = 'building';
    await applicationRepository.save(application);

    // Generate application code
    const appDir = path.join('/app/generated-apps', application.name);
    await fs.ensureDir(appDir);

    // Generate package.json
    await generatePackageJson(application, appDir);

    // Generate React app structure
    await generateReactApp(application, appDir);

    // Build Docker image
    await buildDockerImage(application, appDir);

    // Update status to built
    application.status = 'built';
    await applicationRepository.save(application);

    console.log(`Build completed for application: ${applicationId}`);
  } catch (error) {
    console.error(`Build failed for application ${applicationId}:`, error);

    // Update status to failed
    const applicationRepository = AppDataSource.getRepository(Application);
    const application = await applicationRepository.findOne({
      where: { id: applicationId }
    });

    if (application) {
      application.status = 'failed';
      await applicationRepository.save(application);
    }
  }
};

const generatePackageJson = async (application: Application, appDir: string): Promise<void> => {
  const packageJson = {
    name: application.name,
    version: "1.0.0",
    private: true,
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0"
    },
    scripts: {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
    },
    browserslist: {
      production: [">0.2%", "not dead", "not op_mini all"],
      development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
    }
  };

  await fs.writeJson(path.join(appDir, 'package.json'), packageJson, { spaces: 2 });
};

const generateReactApp = async (application: Application, appDir: string): Promise<void> => {
  // Create public directory
  const publicDir = path.join(appDir, 'public');
  await fs.ensureDir(publicDir);

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${application.description}" />
    <title>${application.displayName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

  await fs.writeFile(path.join(publicDir, 'index.html'), indexHtml);

  // Create src directory
  const srcDir = path.join(appDir, 'src');
  await fs.ensureDir(srcDir);

  // Create index.js
  const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  await fs.writeFile(path.join(srcDir, 'index.js'), indexJs);

  // Create App.js
  const appJs = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${application.displayName}</h1>
        <p>${application.description}</p>
      </header>
    </div>
  );
}

export default App;`;

  await fs.writeFile(path.join(srcDir, 'App.js'), appJs);

  // Create CSS files
  const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;

  await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

  const appCss = `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.App-link {
  color: #61dafb;
}`;

  await fs.writeFile(path.join(srcDir, 'App.css'), appCss);
};

const buildDockerImage = async (application: Application, appDir: string): Promise<void> => {
  // Create Dockerfile
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`;

  await fs.writeFile(path.join(appDir, 'Dockerfile'), dockerfile);

  // Build Docker image
  const imageName = `platform-app-${application.name}:latest`;
  const { stdout, stderr } = await execAsync(`docker build -t ${imageName} "${appDir}"`);

  console.log('Docker build output:', stdout);
  if (stderr) {
    console.warn('Docker build warnings:', stderr);
  }

  console.log(`Docker image built successfully: ${imageName}`);
};
