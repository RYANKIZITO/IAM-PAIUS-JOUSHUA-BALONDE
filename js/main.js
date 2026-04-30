(function() {
    'use strict';

    /* --- YOUTUBE LAZY LOAD SCRIPT (Added for Video Playback) --- */

    let lazyVideosInitialized = false;

    function loadVideo(container) {
        if (!container || container.classList.contains('video-loaded')) {
            return;
        }

        const videoId = container.getAttribute('data-youtube-id') || container.getAttribute('data-youtubeid');
        if (!videoId) {
            return;
        }

        const activeSlider = $(container).closest('.slick-slider');
        if (activeSlider.length && activeSlider.hasClass('slick-initialized')) {
            activeSlider.slick('slickPause');
        }

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
        iframe.setAttribute('title', 'Safari field video');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');

        container.innerHTML = '';
        container.appendChild(iframe);
        container.classList.add('video-loaded');
    }

    function initializeLazyLoadVideos() {
        if (lazyVideosInitialized) {
            return;
        }

        lazyVideosInitialized = true;

        ['mousedown', 'touchstart'].forEach(function(eventName) {
            document.addEventListener(eventName, function(event) {
                if (event.target.closest('.lazy-video-container')) {
                    event.stopPropagation();
                }
            }, true);
        });

        document.addEventListener('click', function(event) {
            const container = event.target.closest('.lazy-video-container');
            if (!container) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            loadVideo(container);
        });

        document.addEventListener('keydown', function(event) {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            const container = event.target.closest('.lazy-video-container');
            if (!container) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            loadVideo(container);
        });
    }

    /* --- ORIGINAL DETAILS AND ITEM CLASSES --- */

    class Details {
        constructor() {
            this.DOM = {};

            const detailsTmpl = `
            <div class="details__bg details__bg--down">
                <button class="details__close"><i class="fas fa-2x fa-times icon--cross tm-fa-close"></i></button>
                <div class="details__description"></div>
            </div> 
            `;

            this.DOM.details = document.createElement('div');
            this.DOM.details.className = 'details';
            this.DOM.details.innerHTML = detailsTmpl;
            document.getElementById('tm-wrap').appendChild(this.DOM.details);
            
            // Pre-bind necessary methods for use in event listeners
            this.setCarousel = this.setCarousel.bind(this);
            this.closeHandler = this.closeHandler.bind(this);

            this.init();
        }
        init() {
            this.DOM.bgDown = this.DOM.details.querySelector('.details__bg--down');
            this.DOM.description = this.DOM.details.querySelector('.details__description');
            this.DOM.close = this.DOM.details.querySelector('.details__close');

            this.initEvents();
        }
        initEvents() {
            // Close page when cross button is clicked.
            this.DOM.close.addEventListener('click', () => this.close());
        }
        
        // Method to handle global click-to-close logic (used when open)
        closeHandler(event) {
            // Check if the click occurred outside the main details background
            if (!this.DOM.bgDown.contains(event.target)) {
                 this.close();
            }
        }
        
        fill(info) {
            // fill current page info
            this.DOM.description.innerHTML = info.description;
        }    
        getProductDetailsRect(){
            // Initializing with {} instead of 0 to return object properties
            var p = {}; 
            var d = {};

            try {
                p = this.DOM.productBg.getBoundingClientRect();
                d = this.DOM.bgDown.getBoundingClientRect();    
            }
            catch(e){}

            return {
                productBgRect: p,
                detailsBgRect: d
            };
        }
        open(data) {
            if(this.isAnimating) return false;
            this.isAnimating = true;

            this.DOM.details.style.display = 'block'; 

            this.DOM.details.classList.add('details--open');

            this.DOM.productBg = data.productBg;

            this.DOM.productBg.style.opacity = 0;

            const rect = this.getProductDetailsRect();

            this.DOM.bgDown.style.transform = `translateX(${rect.productBgRect.left-rect.detailsBgRect.left}px) translateY(${rect.productBgRect.top-rect.detailsBgRect.top}px) scaleX(${rect.productBgRect.width/rect.detailsBgRect.width}) scaleY(${rect.productBgRect.height/rect.detailsBgRect.height})`;
            this.DOM.bgDown.style.opacity = 1;

            // animate background
            anime({
                targets: [this.DOM.bgDown],
                duration: (target, index) => index ? 800 : 250,
                easing: (target, index) => index ? 'easeOutElastic' : 'easeOutSine',
                elasticity: 250,
                translateX: 0,
                translateY: 0,
                scaleX: 1,
                scaleY: 1,                          
                complete: () => {
                    this.isAnimating = false;
                    // Attach global listener ONLY when animation is complete
                    document.body.addEventListener('click', this.closeHandler);
                }
            });

            // animate content
            anime({
                targets: [this.DOM.description],
                duration: 1000,
                easing: 'easeOutExpo',           
                translateY: ['100%',0],
                opacity: 1
            });

            // animate close button
            anime({
                targets: this.DOM.close,
                duration: 250,
                easing: 'easeOutSine',
                translateY: ['100%',0],
                opacity: 1
            });

            this.setCarousel();

            // Attach resize listener (already bound in constructor)
            window.addEventListener("resize", this.setCarousel);
        }
        close() {
            if(this.isAnimating) return false;
            this.isAnimating = true;
            
            // Remove event listeners to prevent memory leaks and unexpected closing
            document.body.removeEventListener('click', this.closeHandler);
            window.removeEventListener("resize", this.setCarousel);

            this.DOM.details.classList.remove('details--open');

            anime({
                targets: this.DOM.close,
                duration: 250,
                easing: 'easeOutSine',
                translateY: '100%',
                opacity: 0
            });

            anime({
                targets: [this.DOM.description],
                duration: 20,
                easing: 'linear',
                opacity: 0
            });

            const rect = this.getProductDetailsRect();
            anime({
                targets: [this.DOM.bgDown],
                duration: 250,
                easing: 'easeOutSine',           
                // Used the correct properties (BgRect) for closing animation
                translateX: rect.productBgRect.left - rect.detailsBgRect.left,
                translateY: rect.productBgRect.top - rect.detailsBgRect.top,
                scaleX: rect.productBgRect.width / rect.detailsBgRect.width,
                scaleY: rect.productBgRect.height / rect.detailsBgRect.height,
                complete: () => {
                    this.DOM.bgDown.style.opacity = 0;
                    this.DOM.bgDown.style.transform = 'none';
                    this.DOM.productBg.style.opacity = 1;
                    this.DOM.details.style.display = 'none';                    
                    this.isAnimating = false;
                }
            });
        }
        // Slick Carousel
        setCarousel() {
            
            var slider = $('.details .tm-img-slider');

            if(slider.length) { // check if slider exist

                if (slider.hasClass('slick-initialized')) {
                    slider.slick('destroy');
                }

                slider.slick({
                    autoplay: true,
                    autoplaySpeed: 0,
                    arrows: false,
                    cssEase: 'linear',
                    dots: false,
                    draggable: true,
                    infinite: true,
                    pauseOnFocus: false,
                    pauseOnHover: false,
                    slidesToScroll: 1,
                    speed: 10500,
                    swipeToSlide: true,
                    variableWidth: true
                });  
                
            }                  
        }
    }; // class Details

    class Item {
        constructor(el) {
            this.DOM = {};
            this.DOM.el = el;
            this.DOM.product = this.DOM.el.querySelector('.product');
            this.DOM.productBg = this.DOM.product.querySelector('.product__bg');

            this.info = {
                description: this.DOM.product.querySelector('.product__description').innerHTML
            };

            this.initEvents();
        }
        initEvents() {
            this.DOM.product.addEventListener('click', () => this.open());
        }
        open() {
            DOM.details.fill(this.info);
            DOM.details.open({
                productBg: this.DOM.productBg
            });
        }
    }; // class Item

    const DOM = {};
    DOM.grid = document.querySelector('.grid');
    DOM.content = DOM.grid.parentNode;
    DOM.gridItems = Array.from(DOM.grid.querySelectorAll('.grid__item'));
    let items = [];
    DOM.gridItems.forEach(item => items.push(new Item(item)));

    DOM.details = new Details();
    
    // Initialize the new lazy video functionality after everything else is ready
    document.addEventListener('DOMContentLoaded', initializeLazyLoadVideos); 

})();



