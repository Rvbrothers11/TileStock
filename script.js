const API_KEY = 'd94ch4pr01qj2cibo1pgd94ch4pr01qj2cibo1q0';


const searchBtn = document.getElementById('searchBtn');
const tickerInput = document.getElementById('tickerInput');
const dashboard = document.getElementById('dashboard');
const welcomeState = document.getElementById('welcomeState');
const historyPanel = document.getElementById('historyPanel');
const portfolioPanel = document.getElementById('portfolioPanel');
const historyList = document.getElementById('historyList');



let searchHistory = JSON.parse(localStorage.getItem('tileStockHistory')) || [];
let paperBalance = parseFloat(localStorage.getItem('tileStockBalance')) || 10000.00;
let paperHoldings = JSON.parse(localStorage.getItem('tileStockHoldings')) || {};
let watchlist = JSON.parse(localStorage.getItem('tileStockWatchlist')) || [];


let currentTicker = '';
let currentAssetPrice = 0;
let liveWs = null;
let currentWsTicker = '';



document.getElementById('themeSelector').addEventListener('change', (e) => {
    document.body.className = '';
    if(e.target.value !== 'default') {
        document.body.classList.add(`theme-${e.target.value}`);
    }
});


window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('introScreen').classList.add('fade-out');
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.remove('hidden');
        setTimeout(() => mainContainer.classList.add('visible'), 50);


        initTraderGame();
        initClickerGame();
        updateHistoryUI();
        updatePortfolioUI();
    }, 1500);
});



document.getElementById('navHomeBtn').addEventListener('click', returnHome);
document.getElementById('brandLogo').addEventListener('click', returnHome);


function returnHome() {
    dashboard.classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
    welcomeState.classList.remove('hidden');
    document.getElementById('navHomeBtn').classList.add('active');
    document.getElementById('navPortfolioBtn').classList.remove('active');
    historyPanel.classList.remove('open');
    portfolioPanel.classList.remove('open');
    tickerInput.value = '';
}



document.getElementById('navHistoryBtn').addEventListener('click', () => { historyPanel.classList.add('open'); portfolioPanel.classList.remove('open'); });
document.getElementById('closeHistoryBtn').addEventListener('click', () => historyPanel.classList.remove('open'));
document.getElementById('navPortfolioBtn').addEventListener('click', () => { portfolioPanel.classList.add('open'); historyPanel.classList.remove('open'); });
document.getElementById('closePortfolioBtn').addEventListener('click', () => portfolioPanel.classList.remove('open'));
document.getElementById('clearHistoryBtn').addEventListener('click', () => { searchHistory = []; localStorage.removeItem('tileStockHistory'); updateHistoryUI(); });


document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => { tickerInput.value = chip.getAttribute('data-ticker'); searchBtn.click(); });
});


document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-view').forEach(v => v.classList.add('hidden'));
        e.target.classList.add('active');
        document.getElementById(e.target.getAttribute('data-target')).classList.remove('hidden');
    });
});



async function resolveTickerQuery(query) {
    try {
        const res = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`);
        const data = await res.json();
        if (data.count > 0 && data.result.length > 0) {
            const bestMatch = data.result.find(r => !r.symbol.includes('.')) || data.result[0];
            return bestMatch.symbol.toUpperCase();
        }
        return query.toUpperCase();
    } catch (e) { return query.toUpperCase(); }
}


searchBtn.addEventListener('click', async () => {
    const rawQuery = tickerInput.value.trim();
    if (!rawQuery) return;


    welcomeState.classList.add('hidden');
    dashboard.classList.add('hidden');
    historyPanel.classList.remove('open');
    portfolioPanel.classList.remove('open');
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('navHomeBtn').classList.remove('active');


    const loader = document.getElementById('loadingMessage');
    loader.textContent = "Resolving company name to market ticker via NLP...";
    loader.classList.remove('hidden');


    const actualTicker = await resolveTickerQuery(rawQuery);
    loader.textContent = `Fetching live market data for ${actualTicker}...`;
    executeMarketDataPipeline(actualTicker);
});


tickerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });



async function executeMarketDataPipeline(ticker) {
    try {
        const dateObj = new Date();
        const toDateStr = dateObj.toISOString().split('T')[0];
        dateObj.setDate(dateObj.getDate() - 7);
        const fromDateStr = dateObj.toISOString().split('T')[0];


        const [quoteRes, profileRes, metricRes, newsRes, calendarRes, recRes] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDateStr}&to=${toDateStr}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${API_KEY}`)
        ]);


        const quote = await quoteRes.json();
        const profile = await profileRes.json();
        const metrics = await metricRes.json();
        const news = await newsRes.json();
        const calendar = await calendarRes.json();
        const recommendations = await recRes.json();


        if (!quote.c || quote.c === 0) throw new Error("Invalid Ticker or No Data");


        currentTicker = ticker;
        currentAssetPrice = quote.c;


        addToHistory(ticker, quote.c, profile.name);
        renderDashboardTiles(ticker, quote, profile, metrics.metric, news, calendar, recommendations);


        document.getElementById('loadingMessage').classList.add('hidden');
        dashboard.classList.remove('hidden');


        subscribeToWebsocket(ticker);
        updatePortfolioUI(); 


    } catch (err) {
        console.error("Pipeline Error:", err);
        document.getElementById('loadingMessage').classList.add('hidden');
        document.getElementById('errorMessage').classList.remove('hidden');
    }
}



function renderDashboardTiles(ticker, quote, profile, metrics, news, calendar, recs) {
    document.getElementById('stockName').textContent = profile.name || "Unknown Entity";
    document.getElementById('stockTicker').textContent = `${ticker} | ${profile.exchange || 'Global Exchange'}`;
    document.getElementById('currentPrice').textContent = `$${quote.c.toFixed(2)}`;
    document.getElementById('openPrice').textContent = `$${quote.o.toFixed(2)}`;
    document.getElementById('prevClosePrice').textContent = `$${quote.pc.toFixed(2)}`;


    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%`;
    changeEl.className = `badge ${quote.dp >= 0 ? 'bg-buy' : 'bg-sell'}`;


    const high52 = metrics['52WeekHigh'] || quote.h;
    const low52 = metrics['52WeekLow'] || quote.l;
    document.getElementById('high52Value').textContent = `$${high52.toFixed(2)}`;
    document.getElementById('low52Value').textContent = `$${low52.toFixed(2)}`;
    document.getElementById('distHighValue').textContent = `-${(((high52 - quote.c) / high52) * 100).toFixed(1)}%`;
    document.getElementById('distLowValue').textContent = `+${(((quote.c - low52) / low52) * 100).toFixed(1)}%`;


    document.getElementById('mcapValue').textContent = profile.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(2)}B` : 'N/A';
    document.getElementById('peValue').textContent = metrics.peNormalizedAnnual ? metrics.peNormalizedAnnual.toFixed(1) : 'N/A';
    document.getElementById('betaValue').textContent = metrics.beta ? metrics.beta.toFixed(2) : 'Unranked';
    document.getElementById('divYieldValue').textContent = metrics.dividendYieldIndicatedAnnual ? `${metrics.dividendYieldIndicatedAnnual.toFixed(2)}%` : '0.00%';



    if (recs && recs.length > 0) {
        const latestRec = recs[0];
        const total = latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell;


        setTimeout(() => {
            document.getElementById('recStrongBuy').style.width = `${(latestRec.strongBuy / total) * 100}%`;
            document.getElementById('recBuy').style.width = `${(latestRec.buy / total) * 100}%`;
            document.getElementById('recHold').style.width = `${(latestRec.hold / total) * 100}%`;
            document.getElementById('recSell').style.width = `${((latestRec.sell + latestRec.strongSell) / total) * 100}%`;
        }, 100);


        document.getElementById('txtStrongBuy').textContent = latestRec.strongBuy;
        document.getElementById('txtBuy').textContent = latestRec.buy;
        document.getElementById('txtHold').textContent = latestRec.hold;
        document.getElementById('txtSell').textContent = (latestRec.sell + latestRec.strongSell);
    } else {
        ['recStrongBuy', 'recBuy', 'recHold', 'recSell'].forEach(id => document.getElementById(id).style.width = '0%');
        ['txtStrongBuy', 'txtBuy', 'txtHold', 'txtSell'].forEach(id => document.getElementById(id).textContent = '0');
    }



    const baseAmount = quote.c;
    document.getElementById('fxBaseDisplay').textContent = `$${baseAmount.toFixed(2)} USD`;
    document.getElementById('fxEur').textContent = `€${(baseAmount * 0.92).toFixed(2)}`;
    document.getElementById('fxGbp').textContent = `£${(baseAmount * 0.78).toFixed(2)}`;
    document.getElementById('fxJpy').textContent = `¥${(baseAmount * 155.4).toFixed(2)}`;
    document.getElementById('fxCad').textContent = `$${(baseAmount * 1.36).toFixed(2)}`;


    const earningsDateEl = document.getElementById('earningsDate');
    earningsDateEl.textContent = (calendar.earningsCalendar && calendar.earningsCalendar.length > 0) ? calendar.earningsCalendar[0].date : "No near-term release scheduled.";
    document.getElementById('dividendDate').textContent = metrics.dividendGrowthRate5Y ? "Quarterly Scheduled" : "Non-dividend equity";



    const bullishWords = ['soars', 'record', 'highs', 'beats', 'up', 'buy', 'growth', 'surges', 'jump', 'gains', 'strong', 'profit'];
    const bearishWords = ['plunges', 'lawsuit', 'lows', 'misses', 'down', 'sell', 'loss', 'drops', 'fall', 'investigation', 'crash', 'weak'];


    function getSentiment(text) {
        let score = 0;
        const words = text.toLowerCase().split(/\W+/);
        words.forEach(w => {
            if(bullishWords.includes(w)) score++;
            if(bearishWords.includes(w)) score--;
        });
        if(score > 0) return { label: 'BULLISH', class: 'bg-buy', txtColor: '#fff' };
        if(score < 0) return { label: 'BEARISH', class: 'bg-sell', txtColor: '#fff' };
        return { label: 'NEUTRAL', class: 'bg-hold', txtColor: '#000' };
    }


    const newsContainer = document.getElementById('newsFeedContainer');
    newsContainer.innerHTML = '';
    if (news && news.length > 0) {
        news.slice(0, 5).forEach(article => {
            const dateStr = new Date(article.datetime * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
            const sent = getSentiment(article.headline);
            newsContainer.innerHTML += `
                <a class="news-card" href="${article.url}" target="_blank">
                    <div class="news-headline">
                        ${article.headline} 
                        <span class="sentiment-badge ${sent.class}" style="color:${sent.txtColor}">${sent.label}</span>
                    </div>
                    <div class="news-meta">${article.source} • ${dateStr}</div>
                </a>`;
        });
    } else {
        newsContainer.innerHTML = `<p class="news-placeholder">No recent intelligence dispatches found.</p>`;
    }


    runQuantitativeAnalysis(quote.c, high52, low52, metrics.peNormalizedAnnual, metrics.beta);
}



function runQuantitativeAnalysis(currentPrice, high52, low52, peRatio, beta) {
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictReason = document.getElementById('verdictReason');
    const riskProgress = document.getElementById('riskProgress');


    verdictBadge.className = 'verdict-text';
    const betaRiskFactor = Math.min(Math.max((beta || 1.0) * 50, 10), 100);
    setTimeout(() => {
        riskProgress.style.width = `${betaRiskFactor}%`;
        riskProgress.style.backgroundColor = betaRiskFactor > 65 ? 'var(--sell-color)' : (betaRiskFactor > 40 ? 'var(--hold-color)' : 'var(--buy-color)');
    }, 200);


    const pFromLow = ((currentPrice - low52) / low52) * 100;
    const pFromHigh = ((high52 - currentPrice) / high52) * 100;


    if (pFromLow < 12 && (peRatio && peRatio < 22)) {
        verdictBadge.textContent = "ACCUMULATE"; verdictBadge.classList.add('color-buy');
        verdictReason.textContent = "Asset properties are compressed near a 52-week floor with strong value multiples. Highly favorable entry metrics detected.";
    } else if (pFromHigh < 4 || (peRatio && peRatio > 45)) {
        verdictBadge.textContent = "LIQUIDATE"; verdictBadge.classList.add('color-sell');
        verdictReason.textContent = "Risk boundaries breached via fundamental over-extension. High divergence vulnerability detected at current pricing.";
    } else {
        verdictBadge.textContent = "ALLOCATE / HOLD"; verdictBadge.classList.add('color-hold');
        verdictReason.textContent = "Equilibrium distribution mechanics are stable. Maintain position allocation pending further momentum execution signals.";
    }
}



function subscribeToWebsocket(ticker) {
    if (!liveWs || liveWs.readyState !== WebSocket.OPEN) {
        liveWs = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);
        liveWs.onopen = () => {
            liveWs.send(JSON.stringify({'type':'subscribe', 'symbol': ticker}));
            currentWsTicker = ticker;
        };
        liveWs.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'trade' && data.data && data.data.length > 0) {
                updateLivePrice(data.data[0].p);
            }
        };
    } else {
        if (currentWsTicker) liveWs.send(JSON.stringify({'type':'unsubscribe', 'symbol': currentWsTicker}));
        liveWs.send(JSON.stringify({'type':'subscribe', 'symbol': ticker}));
        currentWsTicker = ticker;
    }
}


function updateLivePrice(newPrice) {
    currentAssetPrice = newPrice;
    const priceEl = document.getElementById('currentPrice');
    const oldPrice = parseFloat(priceEl.textContent.replace('$', '').replace(/,/g, ''));


    priceEl.textContent = `$${newPrice.toFixed(2)}`;


    if (newPrice > oldPrice) {
        priceEl.classList.remove('flash-green', 'flash-red');
        void priceEl.offsetWidth; 
        priceEl.classList.add('flash-green');
    } else if (newPrice < oldPrice) {
        priceEl.classList.remove('flash-green', 'flash-red');
        void priceEl.offsetWidth; 
        priceEl.classList.add('flash-red');
    }
}



function savePortfolioState() {
    localStorage.setItem('tileStockBalance', paperBalance);
    localStorage.setItem('tileStockHoldings', JSON.stringify(paperHoldings));
    localStorage.setItem('tileStockWatchlist', JSON.stringify(watchlist));
}


document.getElementById('starBtn').addEventListener('click', () => {
    if(!currentTicker) return;
    if(watchlist.includes(currentTicker)) {
        watchlist = watchlist.filter(t => t !== currentTicker);
    } else {
        watchlist.push(currentTicker);
    }
    savePortfolioState();
    updatePortfolioUI();
});



function executeRealTrade(type) {
    const qty = parseInt(document.getElementById('tradeQty').value);
    if(isNaN(qty) || qty <= 0 || !currentTicker) return;


    const totalCost = qty * currentAssetPrice;


    if(type === 'BUY') {
        if(paperBalance >= totalCost) {
            paperBalance -= totalCost;
            if(!paperHoldings[currentTicker]) paperHoldings[currentTicker] = { qty: 0, avgPrice: 0 };
            const oldTotal = paperHoldings[currentTicker].qty * paperHoldings[currentTicker].avgPrice;
            paperHoldings[currentTicker].qty += qty;
            paperHoldings[currentTicker].avgPrice = (oldTotal + totalCost) / paperHoldings[currentTicker].qty;
        } else {
            alert('Insufficient Paper Funds!'); return;
        }
    } else if(type === 'SELL') {
        if(paperHoldings[currentTicker] && paperHoldings[currentTicker].qty >= qty) {
            paperBalance += totalCost;
            paperHoldings[currentTicker].qty -= qty;
            if(paperHoldings[currentTicker].qty === 0) delete paperHoldings[currentTicker];
        } else {
            alert('Insufficient Shares to Sell!'); return;
        }
    }


    savePortfolioState();
    updatePortfolioUI();


    const btn = document.getElementById(type === 'BUY' ? 'buyRealBtn' : 'sellRealBtn');
    const oldText = btn.textContent;
    btn.textContent = 'EXECUTED';
    setTimeout(() => btn.textContent = oldText, 1000);
}


document.getElementById('buyRealBtn').addEventListener('click', () => executeRealTrade('BUY'));
document.getElementById('sellRealBtn').addEventListener('click', () => executeRealTrade('SELL'));



function updatePortfolioUI() {
    document.getElementById('paperBalanceDisplay').textContent = `$${paperBalance.toFixed(2)}`;


    const hList = document.getElementById('holdingsList');
    hList.innerHTML = '';
    if(Object.keys(paperHoldings).length === 0) {
        hList.innerHTML = '<p class="empty-msg" style="color:var(--text-muted); text-align:center;">No open positions.</p>';
    } else {
        for(let t in paperHoldings) {
            const h = paperHoldings[t];
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<strong>${t}</strong> • ${h.qty} Shrs <br><small style="color:var(--text-muted)">Avg Entry: $${h.avgPrice.toFixed(2)}</small>`;
            div.onclick = () => { tickerInput.value = t; searchBtn.click(); portfolioPanel.classList.remove('open'); };
            hList.appendChild(div);
        }
    }


    const wList = document.getElementById('watchlistContainer');
    wList.innerHTML = '';
    if(watchlist.length === 0) {
        wList.innerHTML = '<p class="empty-msg" style="color:var(--text-muted); text-align:center;">No starred tickers.</p>';
    } else {
        watchlist.forEach(w => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<span style="color:#f59e0b;">★</span> <strong>${w}</strong>`;
            div.onclick = () => { tickerInput.value = w; searchBtn.click(); portfolioPanel.classList.remove('open'); };
            wList.appendChild(div);
        });
    }


    const starBtn = document.getElementById('starBtn');
    if(watchlist.includes(currentTicker)) {
        starBtn.classList.add('active'); starBtn.textContent = '★';
    } else {
        starBtn.classList.remove('active'); starBtn.textContent = '☆';
    }
}



function addToHistory(ticker, price, name) {
    const entry = { ticker, price, name: name || 'Unknown', time: new Date().toLocaleTimeString() };
    searchHistory = searchHistory.filter(item => item.ticker !== ticker);
    searchHistory.unshift(entry);
    if(searchHistory.length > 15) searchHistory.pop(); 
    localStorage.setItem('tileStockHistory', JSON.stringify(searchHistory));
    updateHistoryUI();
}


function updateHistoryUI() {
    historyList.innerHTML = ''; 
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-msg" style="color:var(--text-muted); text-align:center;">No recent searches.</p>'; return;
    }
    searchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<strong>${item.ticker}</strong> - $${item.price.toFixed(2)} <br><small style="color:var(--text-muted)">${item.name} • ${item.time}</small>`;
        div.onclick = () => { tickerInput.value = item.ticker; searchBtn.click(); };
        historyList.appendChild(div);
    });
}



function initTraderGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; };
    resizeCanvas(); window.addEventListener('resize', resizeCanvas);


    let balance = 1000, shares = 0, price = 100;
    const history = Array(60).fill(price);


    setInterval(() => {
        price += (Math.random() - 0.5) * 4;
        if (price < 10) price = 10;
        history.push(price); history.shift();


        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for(let i=1; i<4; i++) { ctx.beginPath(); ctx.moveTo(0, canvas.height * (i/4)); ctx.lineTo(canvas.width, canvas.height * (i/4)); ctx.stroke(); }


        ctx.beginPath(); ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        const min = Math.min(...history), max = Math.max(...history), range = (max - min) || 1;
        history.forEach((p, i) => {
            const x = (i / 59) * canvas.width, y = canvas.height - ((p - min) / range) * canvas.height;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();


        const netWorth = balance + (shares * price);
        document.getElementById('gameNetWorth').textContent = `$${netWorth.toFixed(2)}`;
        document.getElementById('gameNetWorth').className = netWorth >= 1000 ? 'color-buy' : 'color-sell';
    }, 250);


    const buyBtn = document.getElementById('gameBuyBtn'), sellBtn = document.getElementById('gameSellBtn'), posBadge = document.getElementById('gamePosition');
    buyBtn.onclick = () => { if(balance > 0) { shares = balance / price; balance = 0; buyBtn.disabled = true; sellBtn.disabled = false; posBadge.textContent = `ACTIVE: ${shares.toFixed(2)} SHRS`; posBadge.className = 'position-badge active'; } };
    sellBtn.onclick = () => { if(shares > 0) { balance = shares * price; shares = 0; buyBtn.disabled = false; sellBtn.disabled = true; posBadge.textContent = 'NO POSITION'; posBadge.className = 'position-badge empty'; } };
}



function initClickerGame() {
    let funds = 0, power = 1, incomePerSec = 0;
    const fundsEl = document.getElementById('clickerFunds');
    document.getElementById('clickerBtn').onclick = () => { funds += power; fundsEl.textContent = `$${funds.toFixed(2)}`; };


    const upgrades = [['buyInternBtn', 50, 1], ['buyManagerBtn', 500, 15], ['buyServerBtn', 5000, 200]];
    upgrades.forEach(([id, cost, income]) => {
        document.getElementById(id).onclick = () => {
            if (funds >= cost) {
                funds -= cost; incomePerSec += income; fundsEl.textContent = `$${funds.toFixed(2)}`;
                const btn = document.getElementById(id); btn.style.borderColor = 'var(--buy-color)';
                setTimeout(() => btn.style.borderColor = 'var(--border)', 300);
            }
        };
    });
    setInterval(() => { if (incomePerSec > 0) { funds += (incomePerSec / 10); fundsEl.textContent = `$${funds.toFixed(2)}`; } }, 100);
}

