import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, type RegisterData } from "../services/authService";
 
export default function Login() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
 
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
 
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(loginUsername, loginPassword);
    if (result.ok && result.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
    setIsLoading(false);
  };
 
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (registerData.password !== confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    if (registerData.password.length < 8) {
      setRegisterError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    const result = await register(registerData);
    if (result.ok && result.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      setIsModalOpen(false);
      navigate("/");
    } else {
      setRegisterError(result.error || "Registration failed");
    }
    setIsLoading(false);
  };
 
  const openModal = () => {
    setRegisterData({ email: "", username: "", displayName: "", password: "" });
    setConfirmPassword("");
    setRegisterError("");
    setIsModalOpen(true);
  };
 
  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(74,222,128,0.08); }
          50%       { box-shadow: 0 0 40px rgba(74,222,128,0.18); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .login-input:focus {
          border-color: #4ade80 !important;
          box-shadow: 0 0 0 2px rgba(74,222,128,0.15) !important;
          outline: none;
        }
        .login-input::placeholder { color: #3d5c44; }
        .login-btn-primary:hover { background: #86efac !important; }
        .login-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
 
      {/* Full page */}
      <div style={{
        minHeight: 'calc(100vh - 62px)',
        backgroundColor: '#0a0f0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 24px',
      }}>
 
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />
 
        {/* Glow orb top left */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
 
        {/* Glow orb bottom right */}
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-60px',
          width: '360px', height: '360px',
          background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
 
        {/* Login card */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '420px',
          backgroundColor: '#0d1610',
          border: '1px solid #1e2e20',
          borderRadius: '12px',
          padding: '40px 36px',
          animation: 'fadeSlideUp 0.4s ease forwards, glowPulse 4s ease infinite',
        }}>
 
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
            borderRadius: '0 0 2px 2px',
          }} />
 
          {/* Logo mark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '32px',
          }}>
            <span style={{ fontSize: '1.6rem', color: '#4ade80', lineHeight: 1 }}>⬡</span>
            <span style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '1.3rem', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#e8f5e9',
            }}>
              NEXUS<span style={{ color: '#4ade80' }}>GG</span>
            </span>
          </div>
 
          {/* Heading */}
          <h1 style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '1.6rem', fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#e8f5e9', margin: '0 0 6px 0',
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '0.85rem', color: '#7a9e82',
            margin: '0 0 28px 0', lineHeight: 1.5,
          }}>
            Sign in to your account to continue
          </p>
 
          {/* Login form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#7a9e82',
              }}>
                Username or Email
              </label>
              <input
                type="text"
                className="login-input"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
                style={{
                  backgroundColor: '#111a14',
                  border: '1px solid #2a4030',
                  borderRadius: '6px',
                  color: '#e8f5e9',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  padding: '11px 14px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#7a9e82',
              }}>
                Password
              </label>
              <input
                type="password"
                className="login-input"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  backgroundColor: '#111a14',
                  border: '1px solid #2a4030',
                  borderRadius: '6px',
                  color: '#e8f5e9',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  padding: '11px 14px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
 
            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <button type="button" style={{
                background: 'none', border: 'none',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.72rem', fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#4ade80', cursor: 'pointer',
                padding: 0,
              }}>
                Forgot password?
              </button>
            </div>
 
            {/* Error */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '6px', padding: '10px 14px',
                fontSize: '0.82rem', color: '#f87171',
              }}>
                {error}
              </div>
            )}
 
            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-btn-primary"
              style={{
                width: '100%', height: '46px', marginTop: '4px',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.88rem', fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#0a0f0d', backgroundColor: '#4ade80',
                border: 'none', borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
 
          </form>
 
          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e2e20' }} />
            <span style={{ fontSize: '0.72rem', color: '#3d5c44', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e2e20' }} />
          </div>
 
          {/* Create account */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#7a9e82' }}>
              Don't have an account?{' '}
            </span>
            <button
              type="button"
              onClick={openModal}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.82rem', fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#4ade80', cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Create Account
            </button>
          </div>
 
        </div>
      </div>
 
      {/* ── Register Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div style={{
            width: '100%', maxWidth: '440px',
            backgroundColor: '#0d1610',
            border: '1px solid #2a4030',
            borderRadius: '12px',
            padding: '32px',
            maxHeight: '90vh', overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(74,222,128,0.1)',
            animation: 'fadeSlideUp 0.25s ease forwards',
          }}>
 
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
            }} />
 
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none',
                color: '#3d5c44', fontSize: '1.4rem',
                cursor: 'pointer', lineHeight: 1,
                transition: 'color 0.15s ease',
                padding: '4px 8px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#e8f5e9'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d5c44'}
            >
              ×
            </button>
 
            {/* Modal heading */}
            <h2 style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '1.4rem', fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#e8f5e9', margin: '0 0 6px 0',
            }}>
              Create Account
            </h2>
            <p style={{
              fontSize: '0.82rem', color: '#7a9e82',
              margin: '0 0 24px 0',
            }}>
              Fill in your details to get started
            </p>
 
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
 
              {[
                { label: 'Email', id: 'reg-email', type: 'email', placeholder: 'your@email.com', key: 'email' },
                { label: 'Username', id: 'reg-username', type: 'text', placeholder: 'Choose a unique username', key: 'username' },
                { label: 'Display Name', id: 'reg-display', type: 'text', placeholder: 'How you want to appear', key: 'displayName' },
                { label: 'Password', id: 'reg-pass', type: 'password', placeholder: 'At least 8 characters', key: 'password' },
              ].map(field => (
                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor={field.id} style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '0.68rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#7a9e82',
                  }}>
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    className="login-input"
                    placeholder={field.placeholder}
                    value={registerData[field.key as keyof RegisterData]}
                    onChange={e => setRegisterData({ ...registerData, [field.key]: e.target.value })}
                    required
                    style={{
                      backgroundColor: '#111a14',
                      border: '1px solid #2a4030',
                      borderRadius: '6px',
                      color: '#e8f5e9',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem',
                      padding: '10px 14px',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
 
              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="reg-confirm" style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#7a9e82',
                }}>
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  className="login-input"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    backgroundColor: '#111a14',
                    border: '1px solid #2a4030',
                    borderRadius: '6px',
                    color: '#e8f5e9',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    padding: '10px 14px',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
 
              {/* Error */}
              {registerError && (
                <div style={{
                  backgroundColor: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: '6px', padding: '10px 14px',
                  fontSize: '0.82rem', color: '#f87171',
                }}>
                  {registerError}
                </div>
              )}
 
              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="login-btn-primary"
                style={{
                  width: '100%', height: '46px', marginTop: '4px',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.88rem', fontWeight: 800,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#0a0f0d', backgroundColor: '#4ade80',
                  border: 'none', borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
 
            </form>
          </div>
        </div>
      )}
    </>
  )
}