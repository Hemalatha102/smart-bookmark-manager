'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = https://mcxnezfrnkgmsrjnirdi.supabase.co
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeG5lemZybmtnbXNyam5pcmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjE2NjIsImV4cCI6MjA4NjUzNzY2Mn0.gIkBwYY-fxj07nVFYK_UaaYo-hs3gf7oKegWTXcnHC0
const supabase = createClient(supabaseUrl, supabaseKey)

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [user, setUser] = useState<any>(null);

  // 2. Define the fetcher correctly
  async function fetchBookmarks() {
    const { data } = await supabase.from('bookmarks').select('*').order('id', { ascending: false });
    setBookmarks(data || []);
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks();
    };
    checkUser();

    const channel = supabase
      .channel('realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, () => {
        fetchBookmarks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchBookmarks() {
    const { data } = await supabase.from('bookmarks').select('*').order('id', { ascending: false });
    setBookmarks(data || []);
  }

  const addBookmark = async (e: any) => {
    e.preventDefault();
    if (!user) return alert("Please login first");
    await supabase.from('bookmarks').insert([{ url, title, user_id: user.id }]);
    setUrl(''); setTitle('');
  }

  const deleteBookmark = async (id: any) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  }

  const handleLogin = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const handleLogout = () => { supabase.auth.signOut(); setUser(null); setBookmarks([]); };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <button onClick={handleLogin} className="p-4 bg-blue-600 text-white rounded shadow">
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold text-black">My Bookmarks</h1>
        <button onClick={handleLogout} className="text-red-500 underline">Logout</button>
      </div>

      <form onSubmit={addBookmark} className="flex flex-col gap-3 mb-10 p-6 bg-gray-50 rounded shadow-sm">
        <input placeholder="Website Name" value={title} onChange={e => setTitle(e.target.value)} className="p-2 border rounded text-black" required />
        <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} className="p-2 border rounded text-black" required />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Save Bookmark</button>
      </form>

      <div className="space-y-4">
        {bookmarks.map((b: any) => (
          <div key={b.id} className="flex justify-between p-4 border rounded bg-white shadow-sm">
            <div>
              <h3 className="font-bold text-black">{b.title}</h3>
              <a href={b.url} target="_blank" className="text-blue-500 underline text-sm">{b.url}</a>
            </div>
            <button onClick={() => deleteBookmark(b.id)} className="text-red-400">Delete</button>
          </div>
        ))}
      </div>
    </main>
  );
}
