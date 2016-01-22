'use strict';

angular.module('myApp.sliders', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/sliders', {
      templateUrl: 'sliders/sliders.html',
      controller: 'SlidersCtrl'
    });
  }])

  /**
   * The sliders controller handles the sliders for the /sliders page and allows users full control over the ranges
   * of the perceptual features.
   */
  .controller('SlidersCtrl', ['$scope', 'ResourcesService', 'SongRequestService', 'angularPlayer', 'SlidersService','$timeout',
    function ($scope, ResourcesService, SongRequestService, angularPlayer, SlidersService, $timeout) {
      const ERROR_DURATION = 3000;
      var activeErrors = 0;

      /**
       * Shows the "No songs found"-error
       * @param duration The duration to show the error for
       */
      var showNoSongsFoundError = function (duration) {
        $scope.showError = true;
        activeErrors++;
        var thisError = activeErrors;
        $timeout(function () {
          if (thisError === activeErrors) { // No new errors have been added during the timeout
            $scope.showError = false;
            activeErrors = 0;
          }
        }, duration);
      };

      /**
       * Callback function which gets called when songs are to be added
       * @param res The added songs
       */
      var addedSongs = function (res) {
        if (res.length === 0) {
          showNoSongsFoundError(ERROR_DURATION);
        }
      };

      /**
       * Sets the location of the error
       * @param sliderId The id of the slider used
       */
      var setErrorLocation = function(sliderId){
        var slider = $('.'+sliderId);
        var sliderWrapper = $('.slider-wrapper').offset();
        $scope.errorLeft = slider.offset().left-sliderWrapper.left+10;
        $scope.errorTop = slider.offset().top-sliderWrapper.top+45;
      };

      /**
       * Sends a request to play songs matching the features selected in the sliders
       */
      $scope.sendRequestForClosest = function (sliderId) {
        setErrorLocation(sliderId);
        SlidersService.saveSliders($scope.featureList);
        SongRequestService.playMatchingSongs($scope.featureList,addedSongs,"Closest");
        SlidersService.setLastRequestNumber(SongRequestService.getLastRequestNumber());
      };

      /**
       * Adds a percentage sign after the number on the slider
       */
      $scope.translate = function (value) {
        return value + '%';
      };

      /**
       * Resets all the sliders to the original settings
       */
      $scope.resetSliders = function(){
        for(var i = 0; i < $scope.featureList.length; i++){
          $scope.featureList[i].minValue = 0;
          $scope.featureList[i].maxValue = 100;
        }
      };

      /**
       * Loads existing values
       */
      var loadValues = function () {
        $scope.featureList = SlidersService.getSavedValues().features;
        // Check if another request has been done on another page, if so, reset the sliders
        if(SlidersService.getLastRequestNumber() !== SongRequestService.getLastRequestNumber()){
          $scope.resetSliders();
        }
      };

      /**
       * Sets that the page has fully loaded after 200 ms
       */
      var setPageLoaded = function() {
        $timeout(function () {
          $scope.pageLoaded = true;
        }, 200);
      };

      /* Controller body starts here */

      $scope.featureList = [];

      /**
       * Load the featureList if possible, otherwise build it
       */
      if(SlidersService.hasTransferred()){
        ResourcesService.Features.query().$promise.then(function (data) {
          $scope.featureList = SlidersService.getTransferredValues();
          for (var i = 0; i < data.length; i++){
            $scope.featureList[i].low = data[i].low;
            $scope.featureList[i].high = data[i].high;
          }
          SlidersService.clearTransferredValues();
          SlidersService.saveSliders($scope.featureList);
          setPageLoaded();
        }, function (err) {
          throw "No features were returned by query: " + err;
        });
      }
      else if (!SlidersService.getSavedValues().features) {
        ResourcesService.Features.query().$promise.then(function (data) {
          $scope.featureList = data;
          for (var i = 0; i < $scope.featureList.length; i++) {
            $scope.featureList[i].minValue = 0;
            $scope.featureList[i].maxValue = 100;
          }
          setPageLoaded();
        }, function (err) {
          throw "No features were returned by query: " + err;
        });
      }
      else {
        loadValues();
        setPageLoaded();
      }


    }]);