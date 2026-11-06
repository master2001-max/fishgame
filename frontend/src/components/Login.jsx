import React, { useState } from 'react';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (identifier && password) {
      // Pass the username up to App.jsx to save virtual identity state
      onLoginSuccess(identifier);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-cyan-900/40 to-blue-950/60 p-4">
      {/* Outer Glass Card matching wireframe */}
      <div className="w-full max-w-[650px] bg-sky-400/45 backdrop-blur-md border border-sky-900/40 rounded-[28px] p-10 shadow-2xl flex flex-col items-center">
        
        <h1 className="text-5xl font-normal text-slate-900 font-serif mb-2">Fish Catcher</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-8">Enter the Hunt</h2>

        <form onSubmit={handleSubmit} className="w-full max-w-[420px] flex flex-col items-center">
          
          <div className="w-full mb-4 flex flex-col">
            <label className="text-sm font-bold text-slate-900 mb-1.5">Username / Email</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
              className="w-full h-12 px-4 bg-slate-200/90 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div className="w-full mb-4 flex flex-col">
            <label className="text-sm font-bold text-slate-900 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full h-12 px-4 bg-slate-200/90 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div className="w-full text-left text-sm font-semibold text-slate-900 mb-6">
            Don't have an account?{' '}
            <span 
              onClick={onSwitchToRegister} 
              className="underline cursor-pointer hover:text-white transition-colors"
            >
              SignUp
            </span>
          </div>

          <button 
            type="submit" 
            className="w-[280px] h-[48px] bg-sky-100 hover:bg-white text-slate-900 font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            Dive In
          </button>

        </form>
      </div>
    </div>
  );
}