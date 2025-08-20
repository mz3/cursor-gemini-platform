import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../components/Profile';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock the API module
jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

// Mock the error handler
jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn((error) => ({ message: error.message })),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
};

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock for useAuth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null,
      darkMode: false,
      setDarkMode: jest.fn(),
      clearError: jest.fn(),
      featureFlags: {},
      isFeatureEnabled: jest.fn(() => false),
      hasRole: jest.fn(() => false),
      refreshFeatureFlags: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  it('renders profile page with user information', () => {
    renderWithProviders(<Profile />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('displays current user email in the form', () => {
    renderWithProviders(<Profile />);

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('allows email input changes', () => {
    renderWithProviders(<Profile />);

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(emailInput).toHaveValue('newemail@example.com');
  });

  it('validates password confirmation', async () => {
    renderWithProviders(<Profile />);

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });

    const submitButton = screen.getByText('Update Profile');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderWithProviders(<Profile />);

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } });
    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    const submitButton = screen.getByText('Update Profile');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
  });

  it('requires current password when changing password', async () => {
    renderWithProviders(<Profile />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });

    const submitButton = screen.getByText('Update Profile');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Current password is required to change password')).toBeInTheDocument();
    });
  });
});
