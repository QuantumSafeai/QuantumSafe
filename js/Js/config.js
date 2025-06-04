// Supabase configuration (use only for development, never expose secrets in production)
const SUPABASE_URL = "https://dljtgacjflzmdpntanww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsanRnYWNqZmx6bWRwbnRhbnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjAxMTcsImV4cCI6MjA2NDIzNjExN30.SwK4ITWu2fWXJ53sd005nVGeTY4KnuS6B5lKyHckmwE";

// Main wallet addresses for each supported network
const WALLET_ADDRESSES = {
    Solana: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
    Ethereum: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    SUI: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
    Bitcoin: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875"
};

// Payment amounts required for each network
const PAY_AMOUNTS = {
    Solana: "0.5 SOL",
    Ethereum: "0.01 ETH",
    SUI: "10 SUI",
    Bitcoin: "0.0005 BTC"
};

// Export for use in app.js (if using modules, otherwise these are global)