import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import LoginSignup from '../pages/LoginSignup';

const renderPage = (context = {}) =>
  render(
    <ShopContext.Provider value={{ login: jest.fn(), signup: jest.fn(), ...context }}>
      <MemoryRouter>
        <LoginSignup />
      </MemoryRouter>
    </ShopContext.Provider>
  );

test('starts on sign up and can switch to login', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Sign up' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Login here'));
  expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Your Name')).not.toBeInTheDocument();
});

test('sign up needs the terms to be accepted', () => {
  const signup = jest.fn();
  renderPage({ signup });
  fireEvent.change(screen.getByPlaceholderText('Your Name'), { target: { value: 'Asha' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'asha@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Passw0rd1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText('Please agree to the terms and privacy policy')).toBeInTheDocument();
  expect(signup).not.toHaveBeenCalled();
});

test('shows the error the server sends back', async () => {
  const login = jest.fn().mockRejectedValue(new Error('Invalid email or password'));
  renderPage({ login });
  fireEvent.click(screen.getByText('Login here'));
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
});
