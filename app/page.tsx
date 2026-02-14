'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pksaozhutulcwflykhrq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrc2Fvemh1dHVsY3dmbHlraHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI5NDUsImV4cCI6MjA4NjU4ODk0NX0.BpIb09m13oSqFmbAxS6uIKpjH85sm_1Bn1L9aED4Nn4' // Keep your existing key here
const supabase = createClient(supabaseUrl, supabaseKey)

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [user, setUser] = useState<any>(null)

  async function fetchBookmarks() {
    const { data } = await supabase.from('bookmarks').select('*').order('id', { ascending: false })
    setBookmarks(data || [])
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) fetchBookmarks()
    }
    checkUser()
  }, [])

  const handleMagicLink = async () => {
    const email = window.prompt("Enter your email:")
    if (email) {
      await supabase.auth.signInWithOtp({ 
        email, 
        options: { emailRedirectTo: 'https://smart-bookmark-manager-delta.vercel.app' } 
      })
      alert("Check your email!")
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-6 italic bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Smart Bookmark Manager</h1>
        <button onClick={handleMagicLink} className="bg-blue-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-500 transition-all">
          Login with Email Link
        </button>
      </div>
    )
  }

  // --- PASTE THE NEW CSS CODE BELOW THIS LINE ---
  return (
    <main className="min-h-screen bg-black text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Smart Bookmarks
          </h1>
          <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="px-4 py-2 text-sm font-medium text-red-400 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition">
            Logout
          </button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault()
          const { error } = await supabase.from('bookmarks').insert([{ title, url, user_id: user.id }])
          if (!error) { setTitle(''); setUrl(''); fetchBookmarks() }
        }} className="grid gap-4 mb-12 p-6 bg-gray-900/50 rounded-2xl border border-gray-800 shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1 text-left block">Website Name</label>
            <input placeholder="e.g. GitHub" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-blue-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1 text-left block">URL</label>
            <input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-blue-500" required />
          </div>
          <button type="submit" className="mt-2 w-full bg-blue-600 p-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
            Save Bookmark
          </button>
        </form>

        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="flex justify-between items-center p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-600 transition shadow-md">
              <div className="text-left">
                <h3 className="font-bold text-lg text-white">{bm.title}</h3>
                <a href={bm.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">{bm.url}</a>
              </div>
              <button onClick={async () => { await supabase.from('bookmarks').delete().eq('id', bm.id); fetchBookmarks() }} className="text-gray-500 hover:text-red-500 transition font-medium">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
