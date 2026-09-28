/* ============================================
   BANANO CALCULATOR - SCRIPT
   ============================================ */

// ----------------------------
// 1. DATE & TIME
// ----------------------------
function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');

    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ----------------------------
// 2. FETCH BANANO PRICE (CoinGecko)
// ----------------------------
let currentBanPrice = 0;

async function fetchBananoPrice() {
    const priceEl = document.getElementById('banPrice');
    const changeEl = document.getElementById('banChange');

    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await res.json();

        if (data.banano) {
            currentBanPrice = data.banano.usd;
            const change = data.banano.usd_24h_change || 0;

            if (priceEl) {
                priceEl.textContent = `$${currentBanPrice.toFixed(6)}`;
            }
            if (changeEl) {
                const sign = change >= 0 ? '+' : '';
                changeEl.textContent = `${sign}${change.toFixed(2)}%`;
                changeEl.className = 'top-bar__change ' + (change >= 0 ? 'up' : 'down');
            }
        }
    } catch (err) {
        console.warn('Failed to fetch Banano price:', err);
        if (priceEl) priceEl.textContent = 'N/A';
    }
}

// Refresh price every 60 seconds
fetchBananoPrice();
setInterval(fetchBananoPrice, 60000);

// ----------------------------
// 3. PRICE CHART (Chart.js)
// ----------------------------
let priceChart = null;

async function fetchChartData() {
    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/coins/banano/market_chart?vs_currency=usd&days=7&interval=daily'
        );
        const data = await res.json();

        if (!data.prices || data.prices.length === 0) {
            console.warn('No chart data available.');
            return;
        }

        const labels = data.prices.map(([timestamp]) => {
            const d = new Date(timestamp);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const prices = data.prices.map(([, price]) => price);

        renderChart(labels, prices);
    } catch (err) {
        console.warn('Failed to fetch chart data:', err);
    }
}

function renderChart(labels, prices) {
    const canvas = document.getElementById('priceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(249, 168, 37, 0.25)');
    gradient.addColorStop(1, 'rgba(249, 168, 37, 0.01)');

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'BAN / USD',
                data: prices,
                borderColor: '#F9A825',
                backgroundColor: gradient,
                borderWidth: 2.5,
                pointBackgroundColor: '#F9A825',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2D2D2D',
                    titleFont: { family: 'Inter', size: 12 },
                    bodyFont: { family: 'Inter', size: 13, weight: '600' },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => `$${context.parsed.y.toFixed(6)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#6B6B6B',
                        maxRotation: 45
                    }
                },
                y: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#6B6B6B',
                        callback: (value) => '$' + value.toFixed(6)
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ----------------------------
// 4. CALCULATOR LOGIC
// ----------------------------
const calcBtn = document.getElementById('calcBtn');
const resetBtn = document.getElementById('resetBtn');
const resultBox = document.getElementById('resultBox');

if (calcBtn) {
    calcBtn.addEventListener('click', () => {
        const ppd = parseFloat(document.getElementById('ppdInput').value) || 0;
        const rate = parseFloat(document.getElementById('rateInput').value) || 0;

        if (ppd <= 0 || rate <= 0) {
            alert('Please enter valid PPD and conversion rate values.');
            return;
        }

        const banPerDay = ppd * rate;
        const banPerWeek = banPerDay * 7;
        const banPerMonth = banPerDay * 30;

        const usdPerDay = banPerDay * currentBanPrice;
        const usdPerWeek = banPerWeek * currentBanPrice;
        const usdPerMonth = banPerMonth * currentBanPrice;

        document.getElementById('banPerDay').textContent = banPerDay.toFixed(2) + ' BAN';
        document.getElementById('banPerWeek').textContent = banPerWeek.toFixed(2) + ' BAN';
        document.getElementById('banPerMonth').textContent = banPerMonth.toFixed(2) + ' BAN';

        document.getElementById('usdPerDay').textContent = '$' + usdPerDay.toFixed(4);
        document.getElementById('usdPerWeek').textContent = '$' + usdPerWeek.toFixed(4);
        document.getElementById('usdPerMonth').textContent = '$' + usdPerMonth.toFixed(4);

        resultBox.classList.remove('hidden');
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        document.getElementById('ppdInput').value = '';
        document.getElementById('rateInput').value = '0.001';
        resultBox.classList.add('hidden');
    });
}

// ----------------------------
// 5. CHART REFRESH BUTTON
// ----------------------------
const refreshChartBtn = document.getElementById('refreshChart');
if (refreshChartBtn) {
    refreshChartBtn.addEventListener('click', () => {
        fetchChartData();
        fetchBananoPrice();
    });
}

// ----------------------------
// 6. INITIAL LOAD
// ----------------------------
fetchChartData();
