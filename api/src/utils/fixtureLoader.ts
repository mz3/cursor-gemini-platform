import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

export interface FixtureData {
  [key: string]: any[];
}

export class FixtureLoader {
  private fixturesPath: string;

  constructor() {
    this.fixturesPath = join(__dirname, 'fixtures');
  }

  /**
   * Load a fixture file by name
   * @param fixtureName - The name of the fixture file (without .json extension)
   * @returns The parsed JSON data from the fixture file
   */
  loadFixture<T = any[]>(fixtureName: string): T {
    try {
      const filePath = join(this.fixturesPath, `${fixtureName}.json`);
      const fileContent = readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as T;
    } catch (error) {
      throw new Error(`Failed to load fixture '${fixtureName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load all fixtures
   * @returns Object containing all fixture data
   */
  loadAllFixtures(): FixtureData {
    const fixtureNames = [
      'applications',
      'features',
      'components',
      'schemas',
      'prompts',
      'promptVersions',
      'bots',
      'botTools',
      'workflows',
      'workflowActions',
      'templates',
      'codeTemplates',
      'relationships',
      'users',
      'userSettings'
    ];

    const fixtures: FixtureData = {};

    for (const name of fixtureNames) {
      try {
        fixtures[name] = this.loadFixture(name);
      } catch (error) {
        console.warn(`Warning: Could not load fixture '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        fixtures[name] = [];
      }
    }

    return fixtures;
  }

  /**
   * Validate fixture data structure
   * @param fixtureName - The name of the fixture
   * @param data - The fixture data to validate
   * @returns True if valid, throws error if invalid
   */
  validateFixture(fixtureName: string, data: any[]): boolean {
    if (!Array.isArray(data)) {
      throw new Error(`Fixture '${fixtureName}' must be an array`);
    }

    // Basic validation - ensure each item is an object
    for (let i = 0; i < data.length; i++) {
      if (typeof data[i] !== 'object' || data[i] === null) {
        throw new Error(`Fixture '${fixtureName}' item at index ${i} must be an object`);
      }
    }

    return true;
  }

  /**
   * Get fixture file path
   * @param fixtureName - The name of the fixture file
   * @returns The full path to the fixture file
   */
  getFixturePath(fixtureName: string): string {
    return join(this.fixturesPath, `${fixtureName}.json`);
  }
}
