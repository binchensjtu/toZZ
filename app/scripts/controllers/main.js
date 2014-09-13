'use strict';

/**
 * @ngdoc function
 * @name toZzApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the toZzApp
 */
var app = angular.module('toZzApp');
app.controller('MainCtrl', ['$scope', 'Garden',
    function($scope, Garden) {

        var loveHeart = document.getElementById('loveHeart');
        var gardenCanvas = document.getElementById('garden');
        gardenCanvas.width = loveHeart.clientHeight;
        gardenCanvas.height = loveHeart.offsetHeight;
        var offsetX = gardenCanvas.width / 2;
        var offsetY = gardenCanvas.height / 2;
        var gardenCtx = gardenCanvas.getContext('2d');
        gardenCtx.globalCompositeOperation = 'lighter';
        var garden = new Garden(gardenCtx, gardenCanvas);

        function map2Screen(x, y) {
            return new Array(offsetX + x, offsetY - y);
        }

        function addBloom(x, y) {
            var coord = map2Screen(x, y);
            garden.createRandomBloom(coord[0], coord[1]);
        }

        function setAnimation() {
            var interval = 50;
            var margin = 20;
            var x = -(offsetX - margin);

            var timer = setInterval(function() {
                if (x > offsetX - margin) {
                    clearInterval(timer);
                    setHeartAnimation();
                } else {
                    addBloom(x, 0);
                    if (Math.abs(x) < offsetY - margin) {
                        addBloom(0, x);
                    }
                    x += 20;
                }
            }, interval);
        }

        function getHeart(angle) {
            var sqrt2 = 1.41421356237;
            var sqrt3 = 1.73205080756;
            var K = 45;
            if (true && angle > 56 && angle <= 236) {
                var coord = getHeart(56 * 2 - angle);
                coord = new Array(coord[1], coord[0]);
                return coord;
            } else {
                var t = angle * Math.PI / 180;
                var x = 2.5 * sqrt3 * Math.cos(t);
                var y = 2 * sqrt2 * Math.sin(t);
                return new Array(x * K, y * K);
            }
        }

        function setHeartAnimation() {
            var interval = 50;
            var angle = 56;
            var rotate = function(arr) {
                var x = arr[0],
                    y = arr[1];
                arr[0] = x - y;
                arr[1] = x + y;
            };

            Garden.options.petalCount = {
                min: 8,
                max: 16
            };
            Garden.options.petalStretch = {
                min: 0.1,
                max: 3
            };

            var timer = setInterval(function() {
                if (angle > 417) {
                    clearInterval(timer);
                } else {
                    var bloomCoor = getHeart(angle);
                    rotate(bloomCoor);
                    addBloom(bloomCoor[0], bloomCoor[1]);
                    angle += 6;
                }
            }, interval);
        }

        addBloom(0, 0);
        var tid = setInterval(function() {
            garden.render();
        }, Garden.options.growSpeed);
        $scope.$on('$destroy', function() {
            if (tid) {
                clearInterval(tid);
            }
        });


        setAnimation();
    }

]);
