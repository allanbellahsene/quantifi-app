import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8002';

// Custom styled AuthContainer component
const AuthContainer = ({ children }) => (
  <Container maxWidth="sm">
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          borderRadius: 2,
        }}
      >
        {children}
      </Paper>
    </Box>
  </Container>
);

// Login Component
const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const formDataPayload = new URLSearchParams();
      formDataPayload.append('username', formData.username);
      formDataPayload.append('password', formData.password);

      const response = await axios.post(`${BASE_URL}/api/auth/login`, formDataPayload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      onLogin(access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin} noValidate>
      <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Sign In
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={!!errors.username}
        helperText={errors.username}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <User size={20} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={!!errors.password}
        helperText={errors.password}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </Box>
  );
};

// Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleRegister} noValidate>
      <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Create Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration successful! Please sign in.
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={!!errors.username}
        helperText={errors.username}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <User size={20} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={!!errors.email}
        helperText={errors.email}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Mail size={20} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={!!errors.password}
        helperText={errors.password}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        id="confirmPassword"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock size={20} />
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </Box>
  );
};

// Auth Component that combines Login and Register
const Auth = ({ onLogin }) => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <AuthContainer>
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant="fullWidth"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Sign In" />
        <Tab label="Create Account" />
      </Tabs>

      {tabValue === 0 ? (
        <Login onLogin={onLogin} />
      ) : (
        <Register />
      )}
    </AuthContainer>
  );
};

export default Auth;