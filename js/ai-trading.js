// ================================
// StockAI - REAL RL Trading Signals
// ================================
(function ($) {
    "use strict";

    // ================================
    // 🔥 RL BACKEND CONFIG
    // ================================
    const BACKEND_URL = "http://127.0.0.1:5000/predict";

    // ================================
    // 🔥 FUNCTION: Call RL Backend
    // ================================
    function getRLDecision(prevPrice, currPrice, shares, callback) {
        fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prev_price: prevPrice,
                curr_price: currPrice,
                shares: shares
            })
        })
        .then(response => response.json())
        .then(data => {
            callback(data);
        })
        .catch(error => {
            console.error("AI Backend Error:", error);
            alert("AI Server is not reachable. Please try again later.");
        });
    }

    // ================================
    // Spinner
    // ================================
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);

    // ================================
    // Initiate WOW.js
    // ================================
    new WOW().init();

    // ================================
    // Sticky Navbar
    // ================================
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });

    // ================================
    // Hero Header Carousel
    // ================================
    $(".header-carousel").owlCarousel({
        animateOut: 'fadeOut',
        items: 1,
        margin: 0,
        stagePadding: 0,
        autoplay: true,
        smartSpeed: 500,
        dots: true,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
    });

    // ================================
    // Blog Carousel
    // ================================
    $(".blog-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive: {
            0: { items: 1 },
            576: { items: 1 },
            768: { items: 2 },
            992: { items: 3 },
            1200: { items: 3 }
        }
    });

    // ================================
    // Counter Up
    // ================================
    $('[data-toggle="counter-up"]').counterUp({
        delay: 5,
        time: 2000
    });

    // ================================
    // Back to Top Button
    // ================================
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });

    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // ================================
    // 🔥 REAL AI SIGNAL HANDLER
    // ================================
    $(document).on('click', '[data-signal]', function (e) {
        e.preventDefault();

        const symbol = $(this).data('signal');

        // TEMP demo prices (later connect live API)
        const prevPrice = 1440;
        const currPrice = 1445;
        const shares = 0;

        getRLDecision(prevPrice, currPrice, shares, function (result) {
            alert(
                "Symbol: " + symbol + "\n" +
                "AI Decision: " + result.decision + "\n" +
                "Model: Reinforcement Learning Agent"
            );
        });
    });

})(jQuery);
