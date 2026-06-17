import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, RefreshCw, MapPin, Calendar, PlusCircle, LogIn, UserPlus, Layers } from 'lucide-react';

const API_URL = 'http://localhost:4000/api';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Resource & Matching State
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // New Resource Form State
  const [newResource, setNewResource] = useState({
    title: '', description: '', category: 'food', type: 'have',
    latitude: '25.3176', longitude: '82.9739', expiry_at: '' // Defaults set to Varanasi region coordinates
  });

  const [message, setMessage] = useState({ text: '', isError: false });

  // Axios Global Header Config
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch all active listings
  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API_URL}/resources`);
      setResources(res.data);
    } catch (err) {
      showMsg('Failed to load listings', true);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const showMsg = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: '', isError: false }), 4000);
  };

  // Auth Submit Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
      const res = await axios.post(`${API_URL}${endpoint}`, authForm);
      
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      showMsg(`Welcome back, ${res.data.user.name}!`);
    } catch (err) {
      showMsg(err.response?.data?.error || 'Authentication failed', true);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.clear();
    setMatches([]);
    setSelectedResource(null);
    showMsg('Logged out successfully');
  };

  // Create Resource Listing
  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/resources`, newResource);
      showMsg('Listing added successfully!');
      fetchResources();
      setNewResource({
        title: '', description: '', category: 'food', type: 'have',
        latitude: '25.3176', longitude: '82.9739', expiry_at: ''
      });
    } catch (err) {
      showMsg(err.response?.data?.error || 'Failed to submit resource', true);
    }
  };

  // Trigger Matching Engine Algorithm
  const handleFindMatches = async (resource) => {
    setSelectedResource(resource);
    setLoadingMatches(true);
    try {
      const res = await axios.get(`${API_URL}/resources/${resource.id}/matches`);
      setMatches(res.data.matches);
    } catch (err) {
      showMsg('Error running matching algorithm', true);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Confirm and resolve match
  const handleConfirmMatch = async (matchId, score) => {
    try {
      await axios.post(`${API_URL}/resources/confirm-match`, {
        offer_id: selectedResource.type === 'have' ? selectedResource.id : matchId,
        request_id: selectedResource.type === 'need' ? selectedResource.id : matchId,
        score: score
      });
      showMsg('Match successfully completed and closed!');
      setSelectedResource(null);
      setMatches([]);
      fetchResources();
    } catch (err) {
      showMsg('Failed to lock in the match configuration', true);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', color: '#1f2937' }}>
      {/* Top Navigation Bar */}
      <header style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers style={{ color: '#2563eb', width: '32px', height: '32px' }} />
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '800', tracking: '-0.05em' }}>Resource<span style={{ color: '#2563eb' }}>Flow</span></h1>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>Logged in as: <strong>{user.name}</strong></span>
              <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '6px' }}>Log Out</button>
            </div>
          ) : (
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Sign in below to create or fulfill requests</span>
          )}
        </div>
      </header>

      {/* Global Toast Alert Message */}
      {message.text && (
        <div style={{ padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', backgroundColor: message.isError ? '#fee2e2' : '#dcfce7', color: message.isError ? '#991b1b' : '#166534', fontWeight: '600' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: user ? '1fr 2fr' : '1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Auth Panel or Action Form */}
        <div>
          {!user ? (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {authMode === 'login' ? <LogIn /> : <UserPlus />} {authMode === 'login' ? 'Login' : 'Create Account'}
              </h2>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {authMode === 'register' && (
                  <input type="text" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                )}
                <input type="email" placeholder="Email Address" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                <input type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {authMode === 'login' ? 'Sign In' : 'Register Account'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
                {authMode === 'login' ? "New to the platform?" : "Already have an account?"} {' '}
                <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}>
                  {authMode === 'login' ? 'Register here' : 'Login here'}
                </span>
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><PlusCircle style={{ color: '#2563eb' }} /> Launch Resource Listing</h3>
              <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Title (e.g., 50 Packed Lunch Boxes)" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                <textarea placeholder="Description, quantities, skills needed..." value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select value={newResource.category} onChange={e => setNewResource({...newResource, category: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value="food">🍱 Food Supply</option>
                    <option value="skill">🛠️ Skill / Labor</option>
                    <option value="item">📦 Material Item</option>
                  </select>
                  <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>
                    <option value="have">📦 Giving (Donation)</option>
                    <option value="need">🚨 Requesting (Need)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Latitude" value={newResource.latitude} onChange={e => setNewResource({...newResource, latitude: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                  <input type="text" placeholder="Longitude" value={newResource.longitude} onChange={e => setNewResource({...newResource, longitude: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Listing Expiration Date</label>
                  <input type="datetime-local" value={newResource.expiry_at} onChange={e => setNewResource({...newResource, expiry_at: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', width: '93%' }} required />
                </div>

                <button type="submit" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                  Post Listing to Network
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Network Supply Feed & Algorithm Matches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Listings Feed */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Active Resource Network Feed</h2>
              <button onClick={fetchResources} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: '600', marginLeft: 'auto' }}>
                <RefreshCw width={16} /> Refresh Network
              </button>
            </div>

            {resources.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No active listings on the server network loop right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resources.map((item) => (
                  <div key={item.id} style={{ padding: '16px', borderRadius: '8px', border: `2px solid ${item.type === 'have' ? '#10b981' : '#f59e0b'}`, backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: item.type === 'have' ? '#dcfce7' : '#fef3c7', color: item.type === 'have' ? '#166534' : '#92400e' }}>
                          {item.type === 'have' ? 'Supply' : 'Request'}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Category: <strong>{item.category}</strong></span>
                      </div>
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '18px' }}>{item.title}</h4>
                      <p style={{ margin: '0 0 8px 0', color: '#4b5563', fontSize: '14px' }}>{item.description}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin width={14} /> Coordinates: {parseFloat(item.latitude).toFixed(3)}, {parseFloat(item.longitude).toFixed(3)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar width={14} /> Expires: {new Date(item.expiry_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {user && (
                      <button onClick={() => handleFindMatches(item)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Calculate Matches ⚡
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Algorithm Scoring Target Output Block */}
          {selectedResource && (
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
                <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', tracking: 'widest' }}>Active Scoring Engine Input Context</span>
                <h3 style={{ margin: '4px 0 0 0' }}>Matching Results for: "{selectedResource.title}"</h3>
              </div>

              {loadingMatches ? (
                <p style={{ color: '#94a3b8' }}>Running weight metrics calculations on server matrix loop...</p>
              ) : matches.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No opposite type match candidates met the strict distance threshold (10km limit).</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {matches.map((match) => (
                    <div key={match.id} style={{ backgroundColor: '#334155', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid #38bdf8' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{match.title}</h4>
                        <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '13px' }}>{match.description}</p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                          <span>📍 Distance: <strong>{match.distanceKm} km</strong> away</span>
                          <span>⏳ Target Expiry Hours: <strong>{((new Date(match.expiry_at) - Date.now()) / 3600000).toFixed(1)} hrs left</strong></span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Engine Match Score</span>
                          <strong style={{ fontSize: '20px', color: '#34d399' }}>{(match.matchScore * 100).toFixed(1)}%</strong>
                        </div>
                        <button onClick={() => handleConfirmMatch(match.id, match.matchScore)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Confirm Match ✅
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}