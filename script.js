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
