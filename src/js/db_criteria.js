const db_criteria = {
  color: {
    regex: new RegExp(/^[a-f\d]{6}$/i),
    sanitation: function(str) {
      if(this.regex.test(str)) {
        var i = parseInt(str, 16);
        return this.from_rgb(
          (i >> 16) & 0xff,
          (i >> 8) & 0xff,
          (i >> 0) & 0xff,
        );

      }
    },
    from_rgb: function(r, g, b) {
      var hsl = rbg_to_hsl(r, g, b);
      hsl[0] = Math.ceil(hsl[0]*255);
      hsl[1] = Math.ceil(hsl[1]*255);
      hsl[2] = Math.ceil(hsl[2]*255);
      return (hsl[0]<<16)+(hsl[1]<<8)+hsl[2];
    },
    to_hsl: function(value) {
      var hsl = [];
      hsl[0] = (value>>16 & 0xff) / 255.0;
      hsl[1] = (value>>8 & 0xff) / 255.0;
      hsl[2] = (value>>0 & 0xff) / 255.0;
      return hsl;
    },
    to_rgb_hex: function(value) {
      var hsl = this.to_hsl(value);
      var rgb = hsl_to_rgb(hsl[0], hsl[1], hsl[2]);
      return ((1<<24)+(rgb[0]<<16)+(rgb[1]<<8)+rgb[2]).toString(16).slice(1);
    },
    print: function(value, node) {
      node.style.backgroundColor = '#'+this.to_rgb_hex(value);
    },
  },
  date: {
    relative_regex: new RegExp(/(\S)(\+|\-)(\d+)/i),
    sanitation: function(str) {
      var relative = this.relative_regex.exec(str);
      if(relative) {
        var add_ms = 1000;
        add_ms *= time_unit(relative[1]);
        if(relative[2]=='-') add_ms *= -1;
        add_ms *= parseFloat(relative[3]);
        return new Date(Date.now()+add_ms);
      } else {
        return new Date(str);
      }
    },
    print: function(value, node) {
      node.innerText = value.toLocaleDateString();
    },
  },
  distance: {
    regex: new RegExp(/([\d\.]+)\s*(\S+)/i),
    units: {
      cm: 0.01,
      feet: 0.3048,
      km: 1000,
      leagues: 5556, // 5.556 kilometres for the english league https://en.wikipedia.org/wiki/League_(unit)
      m: 1,
      meters: 1,
      miles: 1609.344,
    },
    sanitation: function(str) {
      const value_unit = this.regex.exec(str);
      return parseFloat(value_unit[1])*this.units[value_unit[2]];
    },
    print: function(value, node) {
      let unit;
      if(value > 2000) {
        unit = 'km';
        value /= 1000;
      } else if(value > 1) {
        unit = 'm';
      } else if(value > 0.01) {
        unit = 'cm';
        value *= 100;
      }
      node.innerText = value.toFixed() + unit;
    },
  },
  duration: {
    regex: new RegExp(/([\d\.]+)\s*(\S)/i),
    sanitation: function(str) {
      var seconds = 1;
      var dur_parts = this.regex.exec(str);
      if(dur_parts) {
        seconds *= time_unit(dur_parts[2]);
        seconds *= parseFloat(dur_parts[1]);
      }
      return seconds;
    },
    print: function(value, node) {
      node.innerText = value+'s';
    }
  },
  element: {
    sanitation: function(str) {
      return Number(str);
    },
    print: function(value, node) {
      node.innerText = value;
    },
  },
  letter: {
    sanitation: function(value) {
      return value.toUpperCase().charCodeAt(0);
    },
    print: function(value, node) {
      node.innerText = String.fromCharCode(value);
    },
  },
  mass: {
    regex: new RegExp(/([\d\.]+)\s*(\S+)/i),
    units: {
      g: 1,
      kg: 1000,
      lb: 453.5924,
    },
    sanitation: function(str) {
      const value_unit = this.regex.exec(str);
      return parseFloat(value_unit[1])*this.units[value_unit[2]];
    },
    print: function(value, node) {
      let unit;
      if(value > 2000) {
        unit = 'kg';
        value /= 1000;
      } else {
        unit = 'g';
      }
      node.innerText = value.toFixed() + unit;
    },
  },
  number: {
    print: function(value, node) {
      node.innerText = value;
    }
  },
};

for(let entry of db) {
  for(let key in entry) {
    if(db_criteria[key] && db_criteria[key].sanitation) {
      entry[key] = db_criteria[key].sanitation(entry[key]);
    }
  }
}
