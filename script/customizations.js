$(document).ready(function () {
    $('#cover').height($(window).height() + 'px');
    var width = $('#imgs').width();
    $('#imgs img').width(width + 'px');

    $('#imgs').on('mouseover',function(){
        $('.highlight').stop().animate({ width: '100%' },500);
    }).on('mouseout', function () {
        $('.highlight').stop().animate({ width: '0%' },500);
    })

    $('.collapsed').click(function () {
        $(this).removeClass('collapsed');
        $(window).scrollTop($(this).position().top- $('.navbar').height());
    })
});