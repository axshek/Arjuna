// Simple AI trading assistant (client-side)
// Strategy: EMA(12) / EMA(26) crossover + RSI(14)
(() => {
    const $ = id => document.getElementById(id);
    let timer = null;
    let prices = [];
    let prevShortEMA = null;
    let prevLongEMA = null;

    function ema(values, period, prevEMA) {
        const k = 2 / (period + 1);
        if (prevEMA == null) {
            // simple SMA for first value
            const slice = values.slice(-period);
            const sum = slice.reduce((a,b)=>a+b,0);
            return sum / slice.length;
        }
        const price = values[values.length-1];
        return (price - prevEMA) * k + prevEMA;
    }

    function computeRSI(values, period=14) {
        if (values.length < period + 1) return null;
        let gains = 0, losses = 0;
        for (let i = values.length - period; i < values.length; i++) {
            const diff = values[i] - values[i-1];
            if (diff > 0) gains += diff; else losses += Math.abs(diff);
        }
        if (losses === 0) return 100;
        const rs = (gains / period) / (losses / period);
        return 100 - (100 / (1 + rs));
    }

    function decide(shortEMA, longEMA, rsi, prevShort, prevLong) {
        if (prevShort == null || prevLong == null) return 'HOLD';
        // detect crossover
        const crossedUp = prevShort <= prevLong && shortEMA > longEMA;
        const crossedDown = prevShort >= prevLong && shortEMA < longEMA;
        if (crossedUp && (rsi == null || rsi < 70)) return 'BUY';
        if (crossedDown && (rsi == null || rsi > 30)) return 'SELL';
        return 'HOLD';
    }

    function fmt(n) { return (n==null)?'—':(Number(n).toFixed(2)); }

    function log(msg) {
        const el = $('log');
        const line = document.createElement('div');
        line.textContent = `${new Date().toLocaleTimeString()} — ${msg}`;
        el.prepend(line);
        while (el.children.length > 200) el.removeChild(el.lastChild);
    }

    async function fetchHistoricalAlphaVantage(symbol, apiKey) {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=compact&apikey=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        const j = await res.json();
        const ts = j['Time Series (1min)'] || j['Time Series (5min)'];
        if (!ts) throw new Error('No time series data');
        const entries = Object.keys(ts).sort().map(k => ({t:k, p: parseFloat(ts[k]['4. close'])}));
        return entries.map(e => e.p);
    }

    function startSimulation(symbol) {
        // generate synthetic historical series using a sine+noise to demo real-time
        prices = [];
        const base = 100 + (Math.random()*20-10);
        for (let i=0;i<200;i++) {
            const p = base + Math.sin(i/10)*2 + (Math.random()-0.5)*1.5 + i*0.01;
            prices.push(Number(p.toFixed(2)));
        }
        let idx = 0;
        timer = setInterval(() => {
            // push a small variation
            const last = prices[prices.length-1];
            const next = Number((last + (Math.random()-0.5)*0.6).toFixed(2));
            prices.push(next);
            processTick(next);
            idx++;
            if (idx > 10000) stop();
        }, 1000);
        // process initial tail quickly
        for (let i = Math.max(0, prices.length-40); i < prices.length; i++) {
            // no-op, prefill
        }
        log(`Simulation started for ${symbol}`);
    }

    async function startLiveAlphaVantage(symbol, apiKey) {
        try {
            const hist = await fetchHistoricalAlphaVantage(symbol, apiKey);
            if (!hist || hist.length===0) throw new Error('No historical');
            prices = hist.slice();
            let idx = 0;
            timer = setInterval(async () => {
                // poll latest once per minute (AlphaVantage limit) — here we poll every 15s as demo
                try {
                    const live = await fetchHistoricalAlphaVantage(symbol, apiKey);
                    const latest = live[live.length-1];
                    if (latest !== prices[prices.length-1]) {
                        prices.push(latest);
                        processTick(latest);
                    }
                } catch (e) {
                    console.warn('poll err', e);
                }
                idx++;
                if (idx>10000) stop();
            }, 15000);
            log(`Live polling started for ${symbol}`);
        } catch (e) {
            log('Live start failed: '+e.message);
            stop();
        }
    }

    function processTick(price) {
        $('lastPrice').textContent = fmt(price);
        // compute EMA
        prevShortEMA = prevShortEMA == null ? null : prevShortEMA;
        prevLongEMA = prevLongEMA == null ? null : prevLongEMA;
        const short = (prices.length>=12) ? ema(prices, 12, prevShortEMA) : null;
        const long = (prices.length>=26) ? ema(prices, 26, prevLongEMA) : null;
        const rsi = computeRSI(prices, 14);
        if (short != null) prevShortEMA = short;
        if (long != null) prevLongEMA = long;
        $('emaShort').textContent = fmt(short);
        $('emaLong').textContent = fmt(long);
        $('rsi').textContent = (rsi==null)?'—':Number(rsi).toFixed(1);

        const decisionStr = decide(short, long, rsi, prevShortEMA, prevLongEMA);
        const decEl = $('decision');
        decEl.textContent = decisionStr;
        decEl.className = 'decision-badge ' + (decisionStr==='BUY' ? 'bg-success text-white' : decisionStr==='SELL' ? 'bg-danger text-white' : 'bg-light text-dark');
        log(`${decisionStr} @ ${fmt(price)} (EMA12:${fmt(short)} EMA26:${fmt(long)} RSI:${rsi?Number(rsi).toFixed(1):'—'})`);
    }

    function stop() {
        if (timer) clearInterval(timer);
        timer = null;
        $('startBtn').disabled = false;
        $('stopBtn').disabled = true;
        log('Stopped');
    }

    // UI wiring
    window.addEventListener('load', () => {
        $('mode').addEventListener('change', (e)=>{
            $('apiKeyWrap').style.display = e.target.value==='alphavantage' ? 'block' : 'none';
        });

        $('startBtn').addEventListener('click', async ()=>{
            const symbol = $('symbol').value.trim();
            const mode = $('mode').value;
            const apiKey = $('apiKey').value.trim();
            $('startBtn').disabled = true;
            $('stopBtn').disabled = false;
            prevShortEMA = null; prevLongEMA = null;
            prices = [];
            if (mode === 'simulate') {
                startSimulation(symbol);
            } else {
                if (!apiKey) { log('API key required for live mode'); $('startBtn').disabled=false; $('stopBtn').disabled=true; return; }
                startLiveAlphaVantage(symbol, apiKey);
            }
        });

        $('stopBtn').addEventListener('click', ()=>{
            stop();
        });
    });

})();
// StockAI - AI Trading Signals Handler
(function ($) {
    "use strict";

    // AI Signal Simulator
    const AISignals = {
        stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.', signal: 'BUY', confidence: 92 },
            { symbol: 'MSFT', name: 'Microsoft Corp.', signal: 'HOLD', confidence: 78 },
            { symbol: 'TSLA', name: 'Tesla Inc.', signal: 'SELL', confidence: 85 },
            { symbol: 'GOOGL', name: 'Google LLC.', signal: 'BUY', confidence: 88 },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', signal: 'HOLD', confidence: 81 },
        ],
        
        getSignal: function(symbol) {
            const stock = this.stocks.find(s => s.symbol === symbol);
            return stock || null;
        },
        
        getAllSignals: function() {
            return this.stocks;
        },
        
        updateSignal: function(symbol, newSignal) {
            const stock = this.stocks.find(s => s.symbol === symbol);
            if (stock) {
                stock.signal = newSignal;
                stock.confidence = Math.floor(Math.random() * (95 - 70) + 70);
            }
        }
    };

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);
    
    // Initiate the wowjs
    new WOW().init();

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });

    // Hero Header carousel
    $(".header-carousel").owlCarousel({
        animateOut: 'fadeOut',
        items: 1,
        margin: 0,
        stagePadding: 0,
        autoplay: true,
        smartSpeed: 500,
        dots: true,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
    });

    // Blog carousel
    $(".blog-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive : {
            0 : {
                items: 1
            },
            576 : {
                items: 1
            },
            768 : {
                items: 2
            },
            992 : {
                items: 3
            },
            1200 : {
                items: 3
            }
        }
    });

    // Counter Up
    $('[data-toggle="counter-up"]').counterUp({
        delay: 5,
        time: 2000
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // AI Signal Click Handler
    $(document).on('click', '[data-signal]', function(e) {
        e.preventDefault();
        const symbol = $(this).data('signal');
        const signal = AISignals.getSignal(symbol);
        if (signal) {
            alert(`${signal.name} (${signal.symbol})\nSignal: ${signal.signal}\nConfidence: ${signal.confidence}%`);
        }
    });

})(jQuery);
