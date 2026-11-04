/* Weather temperatures are stored in Celsius by Data, independently of the display unit. */
(function () {
  'use strict';
  window.SeasonalSky = {
    pick: function (celsius, month) {
      if (typeof celsius !== 'number' || !isFinite(celsius)) return month >= 8 && month <= 10 ? 'autumn' : 'neutral';
      var fahrenheit = celsius * 9 / 5 + 32;
      return fahrenheit < 33 ? 'snowy' : fahrenheit > 60 ? 'sunny' : 'autumn';
    }
  };
})();
