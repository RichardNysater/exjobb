var SongRequestService = angular.module('SongRequestService', ['ngResource']);

/**
 * Handle the sending of requests for songs to the server
 */
SongRequestService.service('SongRequestService', ['$resource', '$http', 'angularPlayer', 'PlayerService',
  function ($resource, $http, angularPlayer, PlayerService) {
    const MUSIC_FORMATS = ["ogg", "mp3"]; // This list should include the available formats for the music files

    var lastRequestNumber = 0;
    var volume = PlayerService.getVolume();
    var lastFeatureList = [];
    var lastRequestType;

    /**
     * Error function which adds a track with a name that tells the user that their browser doesn't support
     * any of the available music formats.
     * TODO: Errors shouldn't be handled this way, the user should receive an error when first loading the site.
     */
    var noPlayableMusicFormats = function () {
      var formats = "";
      if (MUSIC_FORMATS.length > 0) {
        for (var i = 0; i < MUSIC_FORMATS.length - 1; i++) {
          formats += "." + MUSIC_FORMATS[i] + " or ";
        }
        formats += "." + MUSIC_FORMATS[MUSIC_FORMATS.length - 1] + "!";

        angularPlayer.addTrack({
          "title": "Your web browser does not support: " + formats,
          "id": "Your web browser does not support: " + formats,
          "url": null
        });
      }
      else {
        angularPlayer.addTrack({
          "title": "Server music format configuration error!",
          "id": "Server music format configuration error!",
          "url": null
        });
      }
    };

    /**
     * Sends a request to the server for songs matching the input features with the given requestType
     * @param featureList The features to match
     * @param requestType The type of request to make
     * @returns {*} A promise which contains the songs if successful
     */
    this.sendRequest = function (featureList, requestType) {
      var req = {
        method: 'POST',
        url: '/api/songrequest',
        data: {
          features: featureList,
          requestType: requestType
        }
      };
      lastRequestNumber++;
      return $http(req);
    };

    /**
     * Returns the current request number
     * @returns {number} An integer with containing the number of the last request made
     */
    this.getLastRequestNumber = function () {
      return lastRequestNumber;
    };

    /**
     * Sets the current volume
     * @param vol The volume to play music at (0-100)
     */
    this.setVolume = function (vol) {
      volume = vol;
      applyVolume();
    };

    /**
     * Because volume is individually set per song, this function sets the current chosen volume to all songs in playlist
     */
    var applyVolume = function () {
      for (var i = 0; i < window.soundManager.soundIDs.length; i++) {
        var mySound = window.soundManager.getSoundById(window.soundManager.soundIDs[i]);
        mySound.setVolume(volume);
      }
    };

    /**
     * Adds the given songs to the current playlist.
     * Also starts playing the songs unless music is already playing.
     * @param songs The songs to add to the playlist
     */
    var addSongs = function (songs) {
      var key = null;
      for (var i = 0; i < songs.length; i++) {
        var id = songs[i].songID;
        var url = "/api/music/" + id;

        var noPlayableFormat = true;
        for (var format = 0; format < MUSIC_FORMATS.length; format++) {
          if (soundManager.canPlayMIME(MUSIC_FORMATS[format])) {
            url += "." + MUSIC_FORMATS[format];
            noPlayableFormat = false;
            break;
          }
        }
        if (noPlayableFormat) {
          noPlayableMusicFormats();
          return;
        }

        var tmp = angularPlayer.addTrack({
          "title": id,
          "id": id,
          "url": url
        });

        if (key === null) {
          key = tmp;
        }
      }
      applyVolume();
      angularPlayer.playTrack(key);
      if (!PlayerService.getAutoPlay()) {
        angularPlayer.pause();
      }
    };

    /**
     * Checks if a request is the same as the last request made
     * @param featureList The featureList being sent
     * @param requestType The type of request being sent
     * @returns {boolean} True if the request is the same as the last one, false otherwise
     */
    var isSameAsLastRequest = function (featureList, requestType) {
      if (!lastFeatureList || featureList.length != lastFeatureList.length) {
        return false;
      }
      for (var i = 0; i < featureList.length; i++) {
        if (lastFeatureList[i].minValue !== featureList[i].minValue || lastFeatureList[i].maxValue !== featureList[i].maxValue) {
          return false;
        }
      }
      return !requestType === !lastRequestType;
    };

    /**
     * Saves a request as the last request made
     * @param featureList The featureList to save
     * @param requestType The requestType to save
     */
    var saveLastRequest = function (featureList, requestType) {
      lastFeatureList = [];
      lastRequestType = requestType;

      for (var i = 0; i < featureList.length; i++) {
        lastFeatureList.push({
          minValue: featureList[i].minValue,
          maxValue: featureList[i].maxValue,
          feature: featureList[i].feature
        });
      }
    };

    /**
     * Sends a request to the server for all songs matching the input features
     * and adds them to the playlist.
     *
     * @param featureList The features to match
     * @param callback Call the optional callback with the results as parameter
     * @param requestType The request type to give to the server for the query
     */
    this.playMatchingSongs = function (featureList, callback, requestType) {
      if (!isSameAsLastRequest(featureList, requestType)) { // Only send a request if the user has a new selection
        saveLastRequest(featureList, requestType);

        var request = this.sendRequest(featureList, requestType);

        request.then(function successCallback(response) {
          var res = response.data;
          if (res.length > 0) {
            if (angularPlayer.getPlaylist().length > 0) { // Clear the playlist if needed
              angularPlayer.clearPlaylist(function (param) {
                addSongs(res);
              });
            }
            else {
              addSongs(res);
            }
          }
          if (callback) { // Only call the callback if it exists
            callback(res);
          }
        }, function errorCallback() {
          console.log("Failed to query for songs.");
        });
      }
    }

  }
]);

