import Foundation
import Supabase

enum Config {
    // The publishable (anon) key is safe to ship; row-level security protects the data.
    static let supabaseURL = URL(string: "https://zxzpyrsglniohutwzhlq.supabase.co")!
    static let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4enB5cnNnbG5pb2h1dHd6aGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MDUyMzgsImV4cCI6MjA1MDE4MTIzOH0.UGjGrAJePzoZapGU5JI4yicMKse5HneYG6Ncu01tFjc"
}

let supabase = SupabaseClient(supabaseURL: Config.supabaseURL, supabaseKey: Config.supabaseKey)
