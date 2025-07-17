import React, { useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface CreatePromptForm {
  name: string;
  content: string;
  type: 'llm' | 'code_generation';
  description: string;
}

const CreatePrompt: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreatePromptForm>({
    name: '',
    content: '',
    type: 'llm',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/prompts', form);
      navigate('/prompts');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePromptForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/prompts')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Prompt</h1>
          <p className="text-gray-600 mt-1">Create a new LLM or code generation prompt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Prompt Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter prompt name"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Prompt Type *
              </label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as 'llm' | 'code_generation')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="llm">LLM Prompt</option>
                <option value="code_generation">Code Generation</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Optional description of what this prompt does"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Prompt Content *
              </label>
              <textarea
                id="content"
                required
                rows={12}
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                placeholder="Enter your prompt content here..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Use placeholders like {'{variable}'} for dynamic content
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/prompts')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrompt;
