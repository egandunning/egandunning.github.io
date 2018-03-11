"use strict";

var countdownHeader = document.getElementById('countdown');
var canvas = document.getElementById('canvas');
var slider = document.getElementById('slider');
var spinBox = document.getElementById('spinBox');
var vertexCounter = document.getElementById('vertexCounter');
var estimate = document.getElementById('estimate');
var percentError = document.getElementById('percentError');

var piDay = new Date(2018, 2, 14, 0, 0, 0).getTime();

function sliderChanged() {
    var vertexCount = slider.value;
    spinBox.value = vertexCount;
    piDayDraw(vertexCount);
}

function spinBoxChanged() {
    var vertexCount = spinBox.value;
    slider.value = vertexCount;
    piDayDraw(vertexCount);
}

function piDayDraw(n) {
    //countdownHeader.innerText = '';
    var ctx = canvas.getContext('2d');
    ctx.canvas.width = window.innerWidth * 0.8;
    ctx.canvas.height = window.innerHeight * 0.7;
    canvas.style = 'border: 1px solid lightgrey;';

    var midX = Math.floor(ctx.canvas.width / 2);
    var midY = Math.floor(ctx.canvas.height / 2);
    var radius = midY / 2 - 10;

    var vertexCount = n || slider.value;

    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Circle circumference:', midX, midY - radius - 55);
    ctx.fillText(2 * Math.PI, midX, midY - radius - 25);

    ctx.beginPath();
    ctx.arc(midX, midY, radius, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    //no visible difference when over 50
    var displayVertexCount = vertexCount > 50 ? 50 : vertexCount;
    var length = Math.PI * (2 / displayVertexCount);
    var i = 0;
    for(i; i < displayVertexCount; i++) {
        ctx.beginPath();
        ctx.arc(midX, midY, radius, i * length, (i + 1) * length, false);
        ctx.closePath();
        ctx.stroke();
    }

    //var piEstimate = Math.sin(2 * Math.PI / vertexCount) * vertexCount;
    var piEstimate = vertexCount * Math.sqrt(2 - 2 * Math.cos(2 * Math.PI / vertexCount)) / 2;
    if(piEstimate === 0) {
        estimate.innerText = 'Overflow!! Enter a smaller number.';
        return;
    }

    ctx.fillText('Polygon perimeter:', midX, midY + radius + 25);
    ctx.fillText(2 * piEstimate, midX, midY + radius + 55);

    estimate.innerText = 'π ≈ ' + piEstimate;
    percentError.innerText = (Math.abs(piEstimate - Math.PI) / piEstimate * 100).toFixed(10) + '% error.';
}

function updateTime() {
    var date = new Date().getTime();
    var remainingMs = piDay - date;

    if(remainingMs <= 0) {
        return false;
    }

    //bad daylight savings hack
    if(date < new Date(2018, 2, 11).getTime()) {
        remainingMs += 3600000;
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

    var dayString = days > 1 ? days + ' days, ' : ( days > 0 ? days + ' day and ' : '' );

    countdownHeader.innerText = days + ' days, ' + hours + ':' + minutes + ':' + seconds;
    return true;
}

//show countdown timer if pi day hasn't passed yet
if(updateTime()) {
    window.setInterval(function() {
        updateTime();
    }, 1000);
} else {
    piDayDraw();
}
