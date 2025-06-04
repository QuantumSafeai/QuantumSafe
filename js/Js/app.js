// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let paid = false;

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const networkSelect = document.getElementById('network');
    const paymentAddressDiv = document.getElementById('payment-address');
    const payNetworkSpan = document.getElementById('pay-network');
    const qrCodeImg = document.getElementById('qr-code');
    const payAmountSpan = document.getElementById('pay-amount');
    const paidBtn = document.getElementById('paid-btn');
    const supabaseForm = document.getElementById('supabase-form');
    const secureResult = document.getElementById('secure-result');
    const resultsInfo = document.getElementById('results-info');
    const referralLinkDiv = document.getElementById('referral-link');
    const twitterInput = document.getElementById('twitter-username');
    const walletInput = document.getElementById('wallet-address');
    const userProfileDiv = document.getElementById('user-profile');
    const twitterAvatar = document.getElementById('twitter-avatar');
    const twitterName = document.getElementById('twitter-name');
    const userPoints = document.getElementById('user-points');
    const logoutBtn = document.getElementById('logout-btn');
    const profileConnect = document.getElementById('profile-connect');
    const rewardStats = document.getElementById('reward-stats');
    const subscribeForm = document.getElementById('subscribe-form');
    const subscribeResult = document.getElementById('subscribe-result');
    const tweetHistoryDiv = document.getElementById('tweet-history');
    const marketDataDiv = document.getElementById('market-data');

    // Toast notification
    function showToast(msg) {
        const toastBody = document.getElementById('toast-body');
        toastBody.textContent = msg;
        const toast = new bootstrap.Toast(document.getElementById('main-toast'));
        toast.show();
    }

    // Profile logic
    function showUserProfile() {
        const userRef = localStorage.getItem('user_ref');
        if (!userRef || userRef.startsWith('guest_')) {
            userProfileDiv.style.display = 'none';
            if (profileConnect) profileConnect.style.display = '';
            if (rewardStats) rewardStats.style.display = 'none';
            return;
        }
        const twitter = decodeURIComponent(userRef).split('_')[0];
        const avatarUrl = `https://unavatar.io/twitter/${twitter}`;
        twitterAvatar.src = avatarUrl;
        twitterName.textContent = '@' + twitter;
        userProfileDiv.style.display = '';
        if (profileConnect) profileConnect.style.display = 'none';
        if (rewardStats) rewardStats.style.display = '';
        updateRewardStats();
    }

    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('user_ref');
            location.reload();
        };
    }

    // Update payment details when network changes
    if (networkSelect) {
        networkSelect.addEventListener('change', function() {
            const network = this.value;
            paymentAddressDiv.textContent = WALLET_ADDRESSES[network];
            payNetworkSpan.textContent = network;
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${WALLET_ADDRESSES[network]}`;
            payAmountSpan.textContent = PAY_AMOUNTS[network];
        });
    }

    // Copy address button
    const copyBtn = document.getElementById('copy-address');
    if (copyBtn) {
        copyBtn.onclick = function() {
            navigator.clipboard.writeText(paymentAddressDiv.textContent);
            this.textContent = "Copied!";
            setTimeout(() => { this.textContent = "Copy"; }, 1200);
        };
    }

    // Paid button
    if (paidBtn) {
        paidBtn.onclick = function() {
            paid = true;
            this.classList.remove('btn-warning');
            this.classList.add('btn-success');
            this.textContent = "Payment Confirmed";
        };
    }

    // Form submission
    if (supabaseForm) {
        supabaseForm.onsubmit = async function(e) {
            e.preventDefault();
            const asset = document.getElementById('asset-input').value.trim();
            const network = networkSelect.value;
            const txHash = document.getElementById('tx-hash').value.trim();

            if (!paid) {
                secureResult.innerHTML = `<span style="color:orange;">Please complete payment first.</span>`;
                return;
            }

            // Save to Supabase
            const { data, error } = await supabase
                .from("quantum_inputs")
                .insert([{ user_input: asset, network, tx_hash: txHash }]);
            if (error) {
                secureResult.innerHTML = `<span style="color:red;">Error saving data. Please try again.</span>`;
                return;
            }
            secureResult.innerHTML = `<span style="color:#00e0ff;">Asset successfully submitted for quantum protection scan.</span>`;

            // Show fake analysis result for demo
            resultsInfo.innerHTML = `
                <b>Asset/Project:</b> ${asset}<br>
                <b>Network:</b> ${network}<br>
                <b>Status:</b> <span style="color:#00e0ff;">Pending Analysis</span>
            `;
            renderRiskChart([60, 30, 10]);
            renderSecureChart([Math.random()*100, Math.random()*100, Math.random()*100]);
            this.reset();
            paid = false;
            paidBtn.classList.remove('btn-success');
            paidBtn.classList.add('btn-warning');
            paidBtn.textContent = "I've Paid";
        };
    }

    // Helper: Validate Twitter username
    function isValidTwitter(username) {
        return /^[A-Za-z0-9_]{1,15}$/.test(username);
    }

    // Helper: Validate wallet address for all supported networks
    function isValidWallet(address, network) {
        if (network === "Solana") return /^([1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address);
        if (network === "Ethereum") return /^0x[a-fA-F0-9]{40}$/.test(address);
        if (network === "SUI") return /^0x[a-fA-F0-9]{64}$/.test(address);
        if (network === "Bitcoin") return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
        return false;
    }

    // Generate referral link after user signs and verifies Twitter and wallet
    async function generateReferralLink() {
        const twitter = twitterInput ? twitterInput.value.trim().replace(/^@/, "") : "";
        const wallet = walletInput ? walletInput.value.trim() : "";
        const network = networkSelect ? networkSelect.value : "Solana";

        if (!isValidTwitter(twitter)) {
            showToast("Please enter a valid Twitter username.");
            return;
        }
        if (!isValidWallet(wallet, network)) {
            showToast("Please enter a valid wallet address for " + network + ".");
            return;
        }

        // Save user info in Supabase (optional)
        await supabase.from('referral_users').upsert([
            { twitter: twitter, wallet: wallet, network: network }
        ]);

        // Generate unique referral link
        const refId = encodeURIComponent(`${twitter}_${wallet}_${network}`);
        const link = `${window.location.origin}/?ref=${refId}`;
        if (referralLinkDiv) {
            referralLinkDiv.innerHTML = `<b>Your Referral Link:</b> <a href="${link}" target="_blank">${link}</a>`;
        }
        localStorage.setItem('user_ref', refId);
        showUserProfile();
        updateRewardStats();
    }

    // Add event for referral link generation
    const generateReferralBtn = document.getElementById('generate-referral');
    if (generateReferralBtn) {
        generateReferralBtn.onclick = generateReferralLink;
    }

    // Update reward stats (points and tweets)
    async function updateRewardStats() {
        const userRef = localStorage.getItem('user_ref');
        if (!userRef) return;
        const { data, error } = await supabase
            .from('referral_rewards')
            .select('*', { count: 'exact' })
            .eq('user_ref', userRef);
        if (data) {
            document.getElementById('tweets-count').textContent = data.length;
            document.getElementById('points-count').textContent = data.length * 10; // 10 points per tweet
            if (userPoints) userPoints.textContent = `${data.length * 10} pts`;
            renderReferralChart(data.length);
            renderTweetHistory(data);
        }
    }

    // Show tweet history
    function renderTweetHistory(data) {
        if (!tweetHistoryDiv) return;
        if (!data || data.length === 0) {
            tweetHistoryDiv.innerHTML = "<i>No tweets yet.</i>";
            return;
        }
        tweetHistoryDiv.innerHTML = `<b>Your Tweets:</b><ul class="list-group mt-2">${data.map(t => `<li class="list-group-item bg-dark text-light border-info">${t.tweet} <span class="badge bg-secondary float-end">${new Date(t.timestamp).toLocaleString()}</span></li>`).join('')}</ul>`;
    }

    // Enhanced Tweet Buttons Logic for Referral Campaign
    document.querySelectorAll('.tweet-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userRef = localStorage.getItem('user_ref');
            if (!userRef || userRef.startsWith('guest_')) {
                showToast("Please connect your profile first to earn points for tweets.");
                return;
            }
            const referralLink = `${window.location.origin}/?ref=${userRef}`;
            let tweetText = this.getAttribute('data-tweet');
            tweetText += `\n\nJoin QuantumSafe with my link: ${referralLink}`;
            if (this.dataset.cooldown && Date.now() < Number(this.dataset.cooldown)) {
                showToast("Please wait before tweeting this again.");
                return;
            }
            this.dataset.cooldown = Date.now() + 10 * 60 * 1000; // 10 minutes
            const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(tweetUrl, '_blank');
            await supabase.from('referral_rewards').insert([
                { user_ref: userRef, tweet: tweetText, timestamp: new Date().toISOString() }
            ]);
            this.textContent = "Tweeted!";
            this.disabled = true;
            setTimeout(() => {
                this.textContent = "Tweet Again";
                this.disabled = false;
            }, 10 * 60 * 1000);
            updateRewardStats();
            showToast("Thank you! Your tweet has been recorded and points added.");
        });
    });

    // Subscribe form logic
    if (subscribeForm) {
        subscribeForm.onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('subscribe-email').value.trim();
            if (!email) {
                subscribeResult.innerHTML = '<span class="text-danger">Please enter a valid email.</span>';
                return;
            }
            await supabase.from('subscribers').insert([{ email }]);
            this.reset();
            subscribeResult.innerHTML = '<span class="text-success">Thank you for subscribing!</span>';
        };
    }

    // Dynamic Charts
    let riskChart, tokenomicsChart, referralChart, secureChart;
    function renderRiskChart(data) {
        const ctx = document.getElementById('riskChart')?.getContext('2d');
        if (!ctx) return;
        if (riskChart) riskChart.destroy();
        riskChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Quantum Safe', 'Potential Risk', 'High Risk'],
                datasets: [{
                    data: data || [60, 30, 10],
                    backgroundColor: ['#00e0ff', '#ffb300', '#ff3b3b'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    function renderTokenomicsChart() {
        const ctx = document.getElementById('tokenomicsChart')?.getContext('2d');
        if (!ctx) return;
        if (tokenomicsChart) tokenomicsChart.destroy();
        tokenomicsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    'Community Rewards', 'Team', 'Marketing', 'Early Investors',
                    'Development', 'Liquidity Pool', 'Presale', 'Developer Grants'
                ],
                datasets: [{
                    data: [20, 8, 12, 15, 15, 20, 13, 7],
                    backgroundColor: [
                        '#00e0ff', '#ffb300', '#ff3b3b', '#00b3cc',
                        '#7c4dff', '#43e97b', '#ff6f91', '#f9f871'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                cutout: '70%',
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    function renderReferralChart(tweetCount) {
        const ctx = document.getElementById('referralChart')?.getContext('2d');
        if (!ctx) return;
        if (referralChart) referralChart.destroy();
        referralChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Your Tweets', 'Goal'],
                datasets: [{
                    label: 'Referral Progress',
                    data: [tweetCount || 0, 10],
                    backgroundColor: ['#00e0ff', '#ffb300'],
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });
    }
    function renderSecureChart(data) {
        const ctx = document.getElementById('secureChart')?.getContext('2d');
        if (!ctx) return;
        if (secureChart) secureChart.destroy();
        secureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Scan 1', 'Scan 2', 'Scan 3'],
                datasets: [{
                    label: 'Quantum Risk Score',
                    data: data || [70, 50, 30],
                    borderColor: '#00e0ff',
                    backgroundColor: 'rgba(0,224,255,0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    renderRiskChart();
    renderTokenomicsChart();
    renderReferralChart(0);
    renderSecureChart();

    // Live Market Data (CoinGecko)
    async function fetchMarketData() {
        if (!marketDataDiv) return;
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
            const data = await res.json();
            marketDataDiv.innerHTML = `
                <b>BTC:</b> $${data.bitcoin.usd} &nbsp; 
                <b>ETH:</b> $${data.ethereum.usd} &nbsp; 
                <b>SOL:</b> $${data.solana.usd}
            `;
        } catch {
            marketDataDiv.innerHTML = "<span class='text-danger'>Failed to load market data.</span>";
        }
    }
    fetchMarketData();
    setInterval(fetchMarketData, 60000);

    // On load
    showUserProfile();
    updateRewardStats();
});