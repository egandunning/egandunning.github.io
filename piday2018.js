"use strict";

var countdownHeader = document.getElementById('countdown');

var piDay = new Date(2018, 2, 14, 0, 0, 0).getTime();

function piDay() {
    countdownHeader.innerText = '';
}

function updateTime() {
    var date = new Date().getTime();
    var remainingMs = piDay - date;

    if(remainingMs <= 0) {
        return piDay();
    }

    var seconds = Math.floor(remainingMs / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    seconds = seconds % 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    minutes = minutes % 60;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    hours = hours % 24;
    hours = hours < 10 ? '0' + hours : hours;
    countdownHeader.innerText = days + ' days, ' + hours + ':' + minutes + ':' + seconds + ' until Pi day!!!';
}

updateTime();

window.setInterval(function() {
    updateTime();
}, 1000);