import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// TypeScript interface untuk blog posts
export interface BlogPost {
    id: string
    title: string
    content: string
    excerpt?: string
    image_url?: string
    image_name?: string
    slug: string
    status: 'draft' | 'published'
    created_at: string
    updated_at: string
}