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
