/* Weather temperatures are stored in Celsius by Data, independently of the display unit. */
(function () {
  'use strict';
  window.SeasonalSky = {
    pick: function (celsius, month, code) {
      if (typeof celsius !== 'number' || !isFinite(celsius)) return month >= 8 && month <= 10 ? 'autumn' : 'neutral';
      var fahrenheit = celsius * 9 / 5 + 32;
      if (fahrenheit < 33 || [71, 73, 75, 77, 85, 86].indexOf(code) >= 0) return 'snowy';
      if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].indexOf(code) >= 0) return 'rainy';
      return fahrenheit > 60 ? 'sunny' : 'autumn';
    }
  };
})();
