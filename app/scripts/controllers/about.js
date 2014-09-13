'use strict';

/**
 * @ngdoc function
 * @name toZzApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the toZzApp
 */
angular.module('toZzApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
