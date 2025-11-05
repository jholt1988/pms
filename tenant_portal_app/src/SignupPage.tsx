
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [policy, setPolicy] = useState<{
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await fetch('/api/auth/password-policy');
        if (res.ok) {
          setPolicy(await res.json());
        }
      } catch {
        // ignore policy fetch errors
      }
    };
    fetchPolicy();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let message = 'Signup failed';
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData?.errors)) {
            message = errorData.errors.join(' ');
          } else {
            message = errorData.message || message;
          }
        } catch {
          message = await response.text();
        }
        throw new Error(message || 'Signup failed');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/CreateAccount.svg" 
        alt="Create Account Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default SignupPage;
