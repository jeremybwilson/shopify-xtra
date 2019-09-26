$(document).on('click','.nav-sub-sub-item a,.nav-primary-link a',function(){
    ga('send', {
        hitType: 'event',
        eventCategory: 'Top Navigation',
        eventAction: 'Click',
        eventLabel: this.text
    });
});
$(document).on('click','.footer-nav nav ul li a',function(){
    ga('send', {
        hitType: 'event',
        eventCategory: 'Bottom Navigation',
        eventAction: 'Click',
        eventLabel: this.text
    });
});