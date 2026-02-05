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
