const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
const hdlnAnimHeight = (vh / 2) - document.querySelector('.info__desc').offsetHeight - 90
const descAnimWidth = (vw / 2)


var tl = anime.timeline({
    easing: 'easeOutExpo',
    duration: 3000,
    direction: 'alternate',
    loop: false,
});
tl
.add({
    targets: '.box-anim__item',
    scale: [
        {value: .1, easing: 'easeOutSine', duration: 400},
        {value: 1, easing: 'easeInOutQuad', duration: 900}
    ],
    opacity: 1,
    translateY: hdlnAnimHeight,
    delay: anime.stagger(200, {grid: [12, 2], from: 'center'})
})


var tlDev = anime.timeline({
    easing: 'easeOutExpo',
    duration: 2000,
});
tlDev
.add({
    delay: 800,
})
.add({
    targets: '.info__desc',
    translateX: -descAnimWidth,
    delay: anime.stagger(200, {grid: [8, 2], from: 'center'}),
    opacity: 1,
})


