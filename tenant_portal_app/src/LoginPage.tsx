
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * The login page component.
 * It provides a form for users to enter their credentials and log in to the application.
 * It also includes links to the signup and rental application pages.
 */
export default function LoginPage(): React.ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMfaRequired(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, mfaCode: mfaCode || undefined }),
      });

      if (!response.ok) {
        let message = 'Login failed';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          message = await response.text();
        }

        if (message && message.toLowerCase().includes('mfa')) {
          setMfaRequired(true);
        }

        throw new Error(message || 'Login failed');
      }

      const data = await response.json();
      if (data.access_token) {
        login(data.access_token);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/LoginScreen.svg" 
        alt="Login Screen Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
