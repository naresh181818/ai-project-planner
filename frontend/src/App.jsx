import { useState } from 'react';
import axios from 'axios';

function App() {
  // These are state variables. They store what the user types and what the AI returns.
  const [projectIdea, setProjectIdea] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  // This function automatically runs when the user clicks the "Generate" button
  const handleGenerateTasks = async (e) => {
    e.preventDefault();
    if (!projectIdea) return alert("Please type a project idea first!");

    setLoading(true);
    setAiSuggestions(''); // Clear previous results

    try {
      // Connect to our backend API running on port 5000
      const response = await axios.post('http://localhost:5000/api/ai/suggest-tasks', {
        projectIdea: projectIdea
      });

      // Save the AI response text into our variable to update the screen
      setAiSuggestions(response.data.suggestions);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Could not talk to the backend server. Make sure your backend terminal is running on Port 5000!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '40px', maxWidth: '600px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: '#4F46E5', textAlign: 'center', margin: '0 0 10px 0' }}>🤖 AI Task Planner</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: 0 }}>Type your idea below to have Gemini AI instantly break it down into development tasks!</p>
      
      <form onSubmit={handleGenerateTasks} style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="e.g., Build an online food delivery app..." 
          value={projectIdea}
          onChange={(e) => setProjectIdea(e.target.value)}
          style={{ padding: '14px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', transition: 'border-color 0.2s' }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '14px', backgroundColor: loading ? '#9CA3AF' : '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' }}
        >
          {loading ? 'Consulting Gemini AI...' : '✨ Generate Task List'}
        </button>
      </form>

      {/* This section only appears once the AI returns the suggested data */}
      {aiSuggestions && (
        <div style={{ marginTop: '35px', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px', borderLeft: '5px solid #4F46E5' }}>
          <h3 style={{ marginTop: 0, color: '#111827' }}>📋 Suggested Tasks:</h3>
          <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', color: '#374151', margin: 0 }}>{aiSuggestions}</p>
        </div>
      )}
    </div>
  );
}

export default App;