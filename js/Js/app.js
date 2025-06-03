// Initialize Supabase client using config.js variables
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
            alert("Please enter a valid Twitter username.");
            return;
        }
        if (!isValidWallet(wallet, network)) {
            alert("Please enter a valid wallet address for " + network + ".");
            return;
        }

        await supabase.from('referral_users').upsert([
            { twitter: twitter, wallet: wallet, network: network }
        ]);

        const refId = encodeURIComponent(`${twitter}_${wallet}_${network}`);
        const link = `${window.location.origin}/?ref=${refId}`;
        if (referralLinkDiv) {
            referralLinkDiv.innerHTML = `<b>Your Referral Link:</b> <a href="${link}" target="_blank">${link}</a>`;
        }
        localStorage.setItem('user_ref', refId);
        updateRewardStats();
        showProfileOrStats();
    }

    // Add event for referral link generation (assume button with id="generate-referral")
    const generateReferralBtn = document.getElementById('generate-referral');
    if (generateReferralBtn) {
        generateReferralBtn.onclick = generateReferralLink;
    }

    // Helper: Get or set user referral id (localStorage)
    function getUserRef() {
        let ref = localStorage.getItem('user_ref');
        if (!ref) {
            ref = 'guest_' + Math.random().toString(36).substring(2, 12);
            localStorage.setItem('user_ref', ref);
        }
        return ref;
    }

    // Update reward stats (points and tweets)
    async function updateRewardStats() {
        const userRef = getUserRef();
        const { data, error } = await supabase
            .from('referral_rewards')
            .select('*', { count: 'exact' })
            .eq('user_ref', userRef);
        if (data) {
            document.getElementById('tweets-count').textContent = data.length;
            document.getElementById('points-count').textContent = data.length * 10; // 10 points per tweet
        }
    }

    // Enhanced Tweet Buttons Logic for Referral Campaign
    document.querySelectorAll('.tweet-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            // Ensure user is connected
            const userRef = localStorage.getItem('user_ref');
            if (!userRef || userRef.startsWith('guest_')) {
                alert("Please connect your profile first to earn points for tweets.");
                return;
            }

            // Personalize tweet with referral link
            const referralLink = `${window.location.origin}/?ref=${userRef}`;
            let tweetText = this.getAttribute('data-tweet');
            tweetText += `\n\nJoin QuantumSafe with my link: ${referralLink}`;

            // Prevent rapid repeat tweets (10 min cooldown per button)
            if (this.dataset.cooldown && Date.now() < Number(this.dataset.cooldown)) {
                alert("Please wait before tweeting this again.");
                return;
            }
            this.dataset.cooldown = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Open Twitter intent
            const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(tweetUrl, '_blank');

            // Save tweet action in Supabase
            await supabase.from('referral_rewards').insert([
                { user_ref: userRef, tweet: tweetText, timestamp: new Date().toISOString() }
            ]);

            // UI feedback
            this.textContent = "Tweeted!";
            this.disabled = true;
            setTimeout(() => {
                this.textContent = "Tweet Again";
                this.disabled = false;
            }, 10 * 60 * 1000); // 10 minutes

            // Update stats and notify user
            updateRewardStats();
            alert("Thank you! Your tweet has been recorded and points added.");
        });
    });

    // Results chart
    let riskChart;
    window.renderRiskChart = function(data, labels) {
        const ctx = document.getElementById('riskChart').getContext('2d');
        if (riskChart) riskChart.destroy();
        riskChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels || ['Quantum Safe', 'Potential Risk', 'High Risk'],
                datasets: [{
                    data: data || [60, 30, 10],
                    backgroundColor: ['#00e0ff', '#ffb300', '#ff3b3b'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    };
    if (document.getElementById('riskChart')) renderRiskChart();

    // Tokenomics chart
    const tokenomicsCtx = document.getElementById('tokenomicsChart')?.getContext('2d');
    if (tokenomicsCtx) {
        new Chart(tokenomicsCtx, {
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
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Update reward stats on page load
    updateRewardStats();
    showProfileOrStats();
});