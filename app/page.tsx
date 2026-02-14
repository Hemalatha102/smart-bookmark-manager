'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. Correct Project Credentials from your screenshot
const supabaseUrl = 'https://pksaozhutulcwflykhrq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrc2Fvemh1dHVsY3dmbHlraHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI5NDUsImV4cCI6MjA4NjU4ODk0NX0.BpIb09m13oSqFmbAxS6uIKpjH85sm_1Bn1L9aED4Nn4' // Ensure this matches your full Anon Key
const supabase = createClient(supabaseUrl, supabaseKey)

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [user, setUser] = useState<any>(null)

  // 2. Fetch bookmarks from database
  async function fetchBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('id', { ascending: false })
    setBookmarks(data || [])
  }

  // 3. Auth State Listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) fetchBookmarks()
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBookmarks()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 4. Magic Link Login Function
  const handleMagicLink = async () => {
    const email = window.prompt("Enter your email for login link:")
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: { emailRedirectTo: window.location.origin }
      })
      if (error) alert(error.message)
      else alert("Check your email for the login link!")
    }
  }

  // 5. UI for Logged Out User
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-6">Smart Bookmark Manager</h1>
        <button 
          onClick={handleMagicLink}
          className="bg-green-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition"
        >
          Login with Email Link
        </button>
      </div>
    )
  }

  // 6. UI for Logged In User
  return (
    <main className="max-w-2xl mx-auto p-8 text-white min-h-screen bg-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-red-400 hover:underline">Logout</button>
      </div>

      <form onSubmit={async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('bookmarks').insert([{ title, url, user_id: user.id }])
        if (!error) { setTitle(''); setUrl(''); fetchBookmarks() }
      }} className="flex flex-col gap-3 mb-10 p-6 bg-gray-900 rounded-lg border border-gray-700">
        <input placeholder="Website Name" value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 rounded text-black" required />
        <input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="p-2 rounded text-black" required />
        <button type="submit" className="bg-blue-600 p-2 rounded font-bold hover:bg-blue-700">Save Bookmark</button>
      </form>

      <div className="space-y-4">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="flex justify-between items-center p-4 bg-gray-900 border border-gray-700 rounded">
            <div>
              <h3 className="font-bold text-blue-300">{bm.title}</h3>
              <p className="text-sm text-gray-400">{bm.url}</p>
            </div>
            <button onClick={async () => { 
              await supabase.from('bookmarks').delete().eq('id', bm.id)
              fetchBookmarks() 
            }} className="text-red-500 font-bold">Delete</button>
          </div>
        ))}
      </div>
    </main>
  )
}
