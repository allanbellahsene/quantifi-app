import React, { useState } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const BASE_URL = 'http://localhost:8001';

const App = () => {
  const [username, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // For manual login/register via username and password
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/login`, {
          username_email: email,  // Replace with actual data
          password: password
        },
        { withCredentials: true }  // Secure cookie handling
      );
      alert('Login successful!');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/register`,{
          username: username,
          email: email,
          password: password
        },
        { withCredentials: true }  // Secure cookie handling
      );
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  // For Google login
  const handleGoogleSuccess = () => {
    const googleLoginUrl = `${BASE_URL}/api/auth/login/google`;  // Backend route for Google login
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Open the Google login in a popup
    const popup = window.open(
        googleLoginUrl,
        'Google Login',
        `width=${width},height=${height},top=${top},left=${left}`
    );
    
    // Listen for a message from the popup when the login is complete
    window.addEventListener('message', (event) => {
        if (event.origin === BASE_URL && event.data.success) {
            // The user is logged in, handle the response here (e.g., update UI)
            alert('Login successful!');
            popup.close();
        }
    });
  };


  const handleGoogleFailure = () => {
    alert('Google login failed');
  };

  // Access protected route
  const accessProtectedRoute = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/protected_routes/protected`, { withCredentials: true });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Access denied', error);
      setMessage('Access denied');
    }
  };

  return (
    <GoogleOAuthProvider clientId="158152846990-ll99295nbvaam3ik6koq8sh70tjq4eqb.apps.googleusercontent.com">
      <div>
        <h2>Login or Register</h2>
        
        <div>
          <label>Username: </label>
          <input 
            type="username" 
            value={username} 
            onChange={(e) => setName(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>

        <h3>OR</h3>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onFailure={handleGoogleFailure}
          useOneTap
        />

        <div>
          <button onClick={accessProtectedRoute}>Access Protected Route</button>
        </div>

        <p>{message}</p>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
