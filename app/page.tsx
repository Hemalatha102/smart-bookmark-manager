'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. Supabase Setup
const supabaseUrl = 'https://xnezfrnkgmsrjnrirdi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeG5lemZybmtnbXNyam5pcmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1MjE2MjgsImV4cCI6MjA1NTA5NzYyOH0.v-9M4G8Xy-X3H1_V7G_7G_7G_7G'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [user, setUser] = useState<any>(null)

  // 2. Database Functions
  async function fetchBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('id', { ascending: false })
    setBookmarks(data || [])
  }

  async function addBookmark(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !title || !user) return;
    const { error } = await supabase
      .from('bookmarks')
      .insert([{ title, url, user_id: user.id }])
    
    if (!error) {
      setTitle('')
      setUrl('')
      fetchBookmarks()
    }
  }

  async function deleteBookmark(id: any) {
    await supabase.from('bookmarks').delete().eq('id', id)
    fetchBookmarks()
  }

  // 3. Auth and Real-time listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) fetchBookmarks()
    }
    checkUser()

    const channel = supabase
      .channel('realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, () => {
        fetchBookmarks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 4. UI for Logged Out User
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-6">Smart Bookmark Manager</h1>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="bg-blue-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
        >
          Login with Google
        </button>
      </div>
    )
  }

  // 5. UI for Logged In User
  return (
    <main className="max-w-2xl mx-auto p-8 text-white min-h-screen bg-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-red-400 hover:underline">Logout</button>
      </div>

      <form onSubmit={addBookmark} className="flex flex-col gap-3 mb-10 p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
        <input 
          placeholder="Website Name" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="p-2 rounded bg-white text-black font-medium" 
          required
        />
        <input 
          placeholder="URL (https://...)" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          className="p-2 rounded bg-white text-black font-medium" 
          required
        />
        <button type="submit" className="bg-blue-600 p-2 rounded font-bold hover:bg-blue-700 transition mt-2">
          Save Bookmark
        </button>
      </form>

      <div className="space-y-4">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="flex justify-between items-center p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div>
              <h3 className="font-bold text-blue-300 text-lg">{bm.title}</h3>
              <a href={bm.url} target="_blank" className="text-gray-400 text-sm hover:underline">{bm.url}</a>
            </div>
            <button onClick={() => deleteBookmark(bm.id)} className="text-red-500 font-bold hover:text-red-400">
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
