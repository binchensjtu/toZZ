'use strict';

/**
 * @ngdoc function
 * @name toZzApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the toZzApp
 */
var app = angular.module('toZzApp');
app.controller('MainCtrl', ['$scope', '$window', 'Garden',
    function($scope, $window, Garden) {

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

app.factory('Garden', function() {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }

    Vector.prototype = {
        rotate: function(theta) {
            var x = this.x;
            var y = this.y;
            this.x = Math.cos(theta) * x - Math.sin(theta) * y;
            this.y = Math.sin(theta) * x + Math.cos(theta) * y;
            return this;
        },
        mult: function(f) {
            this.x *= f;
            this.y *= f;
            return this;
        },
        clone: function() {
            return new Vector(this.x, this.y);
        },
        length: function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        subtract: function(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        },
        set: function(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }
    };

    function Petal(stretchA, stretchB, startAngle, angle, growFactor, bloom) {
        this.stretchA = stretchA;
        this.stretchB = stretchB;
        this.startAngle = startAngle;
        this.angle = angle;
        this.bloom = bloom;
        this.growFactor = growFactor;
        this.r = 1;
        this.isfinished = false;
        //this.tanAngleA = Garden.random(-Garden.degrad(Garden.options.tanAngle), Garden.degrad(Garden.options.tanAngle));
        //this.tanAngleB = Garden.random(-Garden.degrad(Garden.options.tanAngle), Garden.degrad(Garden.options.tanAngle));
    }
    Petal.prototype = {
        draw: function() {
            var ctx = this.bloom.garden.ctx;
            var v1, v2, v3, v4;
            v1 = new Vector(0, this.r).rotate(Garden.degrad(this.startAngle));
            v2 = v1.clone().rotate(Garden.degrad(this.angle));
            v3 = v1.clone().mult(this.stretchA); //.rotate(this.tanAngleA);
            v4 = v2.clone().mult(this.stretchB); //.rotate(this.tanAngleB);
            ctx.strokeStyle = this.bloom.c;
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.bezierCurveTo(v3.x, v3.y, v4.x, v4.y, v2.x, v2.y);
            ctx.stroke();
        },
        render: function() {
            if (this.r <= this.bloom.r) {
                this.r += this.growFactor; // / 10;
                this.draw();
            } else {
                this.isfinished = true;
            }
        }
    };

    function Bloom(p, r, c, pc, garden) {
        this.p = p;
        this.r = r;
        this.c = c;
        this.pc = pc;
        this.petals = [];
        this.garden = garden;
        this.init();
        this.garden.addBloom(this);
    }
    Bloom.prototype = {
        draw: function() {
            var p, isfinished = true;
            this.garden.ctx.save();
            this.garden.ctx.translate(this.p.x, this.p.y);
            for (var i = 0; i < this.petals.length; i++) {
                p = this.petals[i];
                p.render();
                isfinished *= p.isfinished;
            }
            this.garden.ctx.restore();
            if (isfinished === true) {
                this.garden.removeBloom(this);
            }
        },
        init: function() {
            var angle = 360 / this.pc;
            var startAngle = Garden.randomInt(0, 90);
            for (var i = 0; i < this.pc; i++) {
                this.petals.push(new Petal(Garden.random(Garden.options.petalStretch.min, Garden.options.petalStretch.max), Garden.random(Garden.options.petalStretch.min, Garden.options.petalStretch.max), startAngle + i * angle, angle, Garden.random(Garden.options.growFactor.min, Garden.options.growFactor.max), this));
            }
        }
    };

    function Garden(ctx, element) {
        this.blooms = [];
        this.element = element;
        this.ctx = ctx;
    }
    Garden.prototype = {
        render: function() {
            for (var i = 0; i < this.blooms.length; i++) {
                this.blooms[i].draw();
            }
        },
        addBloom: function(b) {
            this.blooms.push(b);
        },
        removeBloom: function(b) {
            var bloom;
            for (var i = 0; i < this.blooms.length; i++) {
                bloom = this.blooms[i];
                if (bloom === b) {
                    this.blooms.splice(i, 1);
                    return this;
                }
            }
        },
        createRandomBloom: function(x, y) {
            this.createBloom(x, y, Garden.randomInt(Garden.options.bloomRadius.min, Garden.options.bloomRadius.max), Garden.randomrgba(Garden.options.color.rmin, Garden.options.color.rmax, Garden.options.color.gmin, Garden.options.color.gmax, Garden.options.color.bmin, Garden.options.color.bmax, Garden.options.color.opacity), Garden.randomInt(Garden.options.petalCount.min, Garden.options.petalCount.max));
        },
        createBloom: function(x, y, r, c, pc) {
            new Bloom(new Vector(x, y), r, c, pc, this);
        },
        clear: function() {
            this.blooms = [];
            this.ctx.clearRect(0, 0, this.element.width, this.element.height);
        }
    };

    Garden.options = {
        petalCount: {
            min: 6,
            max: 10
        },
        petalStretch: {
            min: 0.1,
            max: 2
        },
        growFactor: {
            min: 0.1,
            max: 1
        },
        bloomRadius: {
            min: 8,
            max: 10
        },
        density: 10,
        growSpeed: 1000 / 60,
        color: {
            rmin: 128,
            rmax: 255,
            gmin: 0,
            gmax: 128,
            bmin: 0,
            bmax: 128,
            opacity: 0.1
        },
        tanAngle: 60
    };
    Garden.random = function(min, max) {
        return Math.random() * (max - min) + min;
    };
    Garden.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Garden.circle = 2 * Math.PI;
    Garden.degrad = function(angle) {
        return Garden.circle / 360 * angle;
    };
    Garden.raddeg = function(angle) {
        return angle / Garden.circle * 360;
    };
    Garden.rgba = function(r, g, b, a) {
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    };
    Garden.randomrgba = function(rmin, rmax, gmin, gmax, bmin, bmax, a) {
        var r = Math.round(Garden.random(rmin, rmax));
        var g = Math.round(Garden.random(gmin, gmax));
        var b = Math.round(Garden.random(bmin, bmax));
        var limit = 5;
        if (Math.abs(r - g) <= limit && Math.abs(g - b) <= limit && Math.abs(b - r) <= limit) {
            return Garden.rgba(rmin, rmax, gmin, gmax, bmin, bmax, a);
        } else {
            return Garden.rgba(r, g, b, a);
        }
    };
    return Garden;
});

app.directive('typewrite', ['$timeout',
    function($timeout) {
        function linkFunction(scope, iElement, iAttrs) {
            function getTypeDelay(delay) {
                if (typeof delay === 'string') {
                    return delay.charAt(delay.length - 1) === 's' ? parseInt(delay.substring(0, delay.length - 1), 10) * 1000 : +delay;
                }
            }

            function getAnimationDelay(delay) {
                if (typeof delay === 'string') {
                    return delay.charAt(delay.length - 1) === 's' ? delay : parseInt(delay.substring(0, delay.length - 1), 10) / 1000;
                }
            }
            var timer = null,
                initialDelay = iAttrs.initialDelay ? getTypeDelay(iAttrs.initialDelay) : 200,
                typeDelay = iAttrs.typeDelay ? getTypeDelay(iAttrs.typeDelay) : 200,
                blinkDelay = iAttrs.blinkDelay ? getAnimationDelay(iAttrs.blinkDelay) : false,
                cursor = iAttrs.cursor ? iAttrs.cursor : '|',
                blinkCursor = iAttrs.blinkCursor ? iAttrs.blinkCursor === 'true' : true,
                auxStyle;
            if (iAttrs.text) {
                timer = $timeout(function() {
                    updateIt(iElement, 0, iAttrs.text);
                }, initialDelay);
            }

            function updateIt(element, i, text) {
                if (i <= text.length) {
                    element.html(text.substring(0, i) + cursor);
                    i++;
                    timer = $timeout(function() {
                        updateIt(iElement, i, text);
                    }, typeDelay);
                    return;
                } else {
                    if (blinkCursor) {
                        if (blinkDelay) {
                            auxStyle = '-webkit-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-moz-animation:blink-it steps(1) ' + blinkDelay + ' infinite ' +
                                '-ms-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-o-animation:blink-it steps(1) ' + blinkDelay + ' infinite; ' +
                                'animation:blink-it steps(1) ' + blinkDelay + ' infinite;';
                            element.html(text.substring(0, i) + '<span class="blink" style="' + auxStyle + '">' + cursor + '</span>');
                        } else {
                            element.html(text.substring(0, i) + '<span class="blink">' + cursor + '</span>');
                        }
                    } else {
                        element.html(text.substring(0, i));
                    }
                }
            }

            

            scope.$on('$destroy', function() {
                if (timer) {
                    $timeout.cancel(timer);
                }
            });
        }

        return {
            restrict: 'A',
            link: linkFunction,
            scope: false
        };

    }
]);