// API route: app/api/countdown-start/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for API routes
)

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'countdownStart')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching countdown start:', error)
      return Response.json({ startTime: null }, { status: 500 })
    }

    return Response.json({ startTime: data?.value || null })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ startTime: null }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { startTime } = body

    const { data, error } = await supabase
      .from('config')
      .upsert(
        { key: 'countdownStart', value: startTime },
        { onConflict: 'key' }
      )
      .select()

    if (error) {
      console.error('Error updating countdown start:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, startTime })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}