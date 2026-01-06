'use client';

import { useState } from 'react';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        ...(type !== 'all' && { type }),
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Search Test</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search term..."
            className="flex-1 p-2 border rounded"
          />
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="projects">Projects</option>
            <option value="collections">Collections</option>
          </select>
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="grid gap-4">
            <div>
              <h3 className="font-medium mb-2">Users ({results.users?.results?.length || 0})</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results.users?.results || [], null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Projects ({results.projects?.results?.length || 0})</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results.projects?.results || [], null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Collections ({results.collections?.results?.length || 0})</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results.collections?.results || [], null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Raw Response</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
