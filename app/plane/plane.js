'use strict';

angular.module('myApp.plane', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/plane', {
      templateUrl: 'plane/plane.html',
      controller: 'PlaneCtrl'
    });
  }])

  /**
   * The Plane controller handles the interactions within the plane.
   * The plane allows a user to click somewhere in a 2d-plane with perceptual features as x-axis and y-axis,
   * the application will then create a playlist based on where the user clicked.
   */
  .controller('PlaneCtrl', ['$scope', 'ResourcesService', 'SongRequestService', 'PlaneService', '$timeout',
    function ($scope, ResourcesService, SongRequestService, PlaneService, $timeout) {

      /**
       * Set the size of the selection image
       */
      var setImageSize = function () {
        var CSS_plane = $('.plane');
        $scope.imgwidth = CSS_plane.outerWidth() * 1 / (100 / ($scope.feature_variance * 2));
        $scope.imgheight = CSS_plane.outerHeight() * 1 / (100 / ($scope.feature_variance * 2));
      };

      /**
       * Updates the selection image and plays songs based on the current selection after variance is changed
       */
      $scope.varianceChanged = function () {
        var prevPageX = $scope.imgleft + ($scope.imgwidth / 2);
        var prevPageY = $scope.imgtop + ($scope.imgheight / 2);
        setImageSize();

        $scope.imgleft = prevPageX - ($scope.imgwidth / 2);
        $scope.imgtop = prevPageY - ($scope.imgheight / 2);
        PlaneService.saveClick($scope.feature_variance, $scope.firstSelect, $scope.secondSelect, $scope.imgleft, $scope.imgtop, $scope.imgwidth, $scope.imgheight,
          getSelectionXPercent(), getSelectionYPercent(), $scope.xpercent, $scope.ypercent);
        playSongs();
      };

      /**
       * Sets the min and max values for the selected perceptual features based on variance.
       */
      var setFeatureRanges = function () {
        $scope.x_min_value = Math.max($scope.xpercent - $scope.feature_variance, 0);
        $scope.x_max_value = Math.min($scope.xpercent + $scope.feature_variance, 100);

        $scope.y_min_value = Math.max($scope.ypercent - $scope.feature_variance, 0);
        $scope.y_max_value = Math.min($scope.ypercent + $scope.feature_variance, 100);
      };

      /**
       * Fetches and plays songs based on where the user clicked and what the variance is set to
       */
      var playSongs = function () {
        setFeatureRanges();
        var xFeature = {
          feature: {id: $scope.firstSelect.id},
          minvalue: $scope.x_min_value,
          maxvalue: $scope.x_max_value
        };
        var yFeature = {
          feature: {id: $scope.secondSelect.id},
          minvalue: $scope.y_min_value,
          maxvalue: $scope.y_max_value
        };

        SongRequestService.playMatchingSongs([xFeature, yFeature]);
      };

      /**
       * Sets the plane's offsets (used to position selection image)
       * @param offset The plane's offsets
       */
      var setOffsets = function (offset) {
        $scope.leftPlaneOffset = offset.left;
        $scope.topPlaneOffset = offset.top;
      };

      /**
       * planeClick is called whenever a user clicks on the 2d-plane
       * Sets the selection image and plays music based on where the user clicked
       * @param event Event
       */
      $scope.planeClick = function (event) {
        var CSS_plane = $('.plane');
        setImageSize();
        setOffsets(CSS_plane.offset());
        $scope.imgleft = event.pageX - ($scope.imgwidth / 2);
        $scope.imgtop = event.pageY - ($scope.imgheight / 2);

        $scope.xpercent = Math.round(100 * (event.offsetX / CSS_plane.outerWidth()));
        $scope.ypercent = 100 - Math.round(100 * (event.offsetY / (CSS_plane.outerHeight())));

        // Save the current variables used for the click
        PlaneService.saveClick($scope.feature_variance, $scope.firstSelect, $scope.secondSelect, $scope.imgleft, $scope.imgtop, $scope.imgwidth, $scope.imgheight,
          getSelectionXPercent(), getSelectionYPercent(), $scope.xpercent, $scope.ypercent);

        playSongs();
      };

      /**
       * Returns the inner width of the plane
       * @returns {*|jQuery}
       */
      var getPlaneWidth = function () {
        return $('.plane').innerWidth();
      };

      /**
       * Returns the inner height of the plane
       * @returns {*|jQuery}
       */
      var getPlaneHeight = function () {
        return $('.plane').innerHeight();
      };

      /**
       * Return where on the plane's x-axis (width) the selection marker is
       * @returns {number} 0 for the furthest left and 1 for furthest right
       */
      var getSelectionXPercent = function () {
        return ($scope.imgleft - $('.plane').offset().left) / getPlaneWidth();
      };

      /**
       * Return where on the plane's y-axis (height) the selection marker is
       * @returns {number} 0 for the furthest top and 1 for furthest bottom
       */
      var getSelectionYPercent = function () {
        return ($scope.imgtop - $('.plane').offset().top) / getPlaneHeight();
      };

      /**
       * Updates the image position and size and saves it.
       */
      var updateWindow = function () {
        setImageSize();
        var CSS_plane = $('.plane');
        setOffsets(CSS_plane.offset());
        $scope.imgleft = CSS_plane.offset().left + getPlaneWidth() * PlaneService.getSavedValues().selection_img_x_percent;
        $scope.imgtop = CSS_plane.offset().top + getPlaneHeight() * PlaneService.getSavedValues().selection_img_y_percent;
        PlaneService.saveUpdatedWindow($scope.imgleft, $scope.imgwidth, $scope.imgheight, getSelectionXPercent(), getSelectionYPercent());
      };

      /**
       * Initialize the image position and size.
       */
      var initWindow = function () {
        setImageSize();
        var CSS_plane = $('.plane');
        setOffsets(CSS_plane.offset());
        $scope.imgleft = CSS_plane.offset().left + getPlaneWidth() * PlaneService.getSavedValues().selection_img_x_percent;
        $scope.imgtop = CSS_plane.offset().top + getPlaneHeight() * PlaneService.getSavedValues().selection_img_y_percent;
      };

      /**
       * If the user has previously clicked somewhere, load the values for the previous click
       * @param features The features available.
       */
      var loadValues = function (features) {
        var prevValues = PlaneService.getSavedValues();
        if (prevValues.variance) {
          $scope.feature_variance = prevValues.variance;
        }
        else {
          $scope.feature_variance = 13; // Default variance
        }
        $scope.imgwidth = prevValues.imgwidth;
        $scope.imgheight = prevValues.imgheight;
        $scope.imgleft = prevValues.imgleft;
        $scope.imgtop = prevValues.imgtop;

        if (getSelectionXPercent() != prevValues.selection_img_x_percent || getSelectionYPercent() != prevValues.selection_img_y_percent) { // Update the window if required
          initWindow();
        }

        $scope.xpercent = prevValues.xpercent;
        $scope.ypercent = prevValues.ypercent;

        for (var i = 0; i < features.length; i++) { // Existing features should be selected in the select boxes
          if (prevValues.firstSelect && features[i].id == prevValues.firstSelect.id) {
            $scope.firstSelect = features[i];
          }

          if (prevValues.secondSelect && features[i].id == prevValues.secondSelect.id) {
            $scope.secondSelect = features[i];
          }
        }

        setFeatureRanges();
      };

      /**
       * Initializes the handling of window resizing
       */
      var initWindowHandling = function () {
        var oldWidth = getPlaneWidth();

        $(window).on('resize.doResize', function () {
          var newWidth = getPlaneWidth();
          var updateStuffTimer;

          if (newWidth !== oldWidth) {
            $timeout.cancel(updateStuffTimer);
          }

          updateStuffTimer = $timeout(function () {
            updateWindow();
            oldWidth = newWidth;
          }, 100);
        });

        $scope.$on('$destroy', function () {
          $(window).off('resize.doResize'); // remove the handler added earlier
        });
      };


      /* Controller body starts here */

      //Get features and load existing values
      ResourcesService.Features.query().$promise.then(function (data) {
        $scope.features = data;
        loadValues(data);

        if (!$scope.firstSelect) {
          $scope.firstSelect = $scope.features[0];
        }
        if (!$scope.secondSelect) {
          $scope.secondSelect = $scope.features[$scope.features.length - 1];
        }
      }, function (err) {
        throw "No features were returned by query: " + err;
      });

      // Handle window resizing
      initWindowHandling();
    }]);