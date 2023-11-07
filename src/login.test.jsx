import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { Login } from './login';

// Mock the useNavigate function and useAuth hook
jest.mock('react-router-dom', () => {
  return {
    useNavigate: () => jest.fn(),
  };
});
jest.mock('./auth', () => {
  return {
    useAuth: () => ({
      login: jest.fn(),
      isAuthenticated: false,
    }),
  };
});

describe('Login Component', () => {
  it('renders the login form', () => {
    render(<Login />);
    
    // Check that the login form elements are present
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('displays an error message on wrong credentials', async () => {
    // Mock the login function to simulate login failure
    const { login } = require('./auth');
    login.mockRejectedValue(new Error('Wrong Credentials'));

    render(<Login />);

    // Fill in the form with invalid credentials and submit
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Login'));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Wrong Credentials')).toBeInTheDocument();
    });
  });

  it('navigates to /profile on successful login', async () => {
    // Mock the login function to simulate successful login
    const { login } = require('./auth');
    login.mockResolvedValue();

    const navigate = require('react-router-dom').useNavigate();
    render(<Login />);

    // Fill in the form with valid credentials and submit
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'valid@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Login'));

    // Wait for the navigation to occur
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });
});
