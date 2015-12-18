exports.sortJsonArrayByProp  = function(objArray, prop, direction) {
  if (arguments.length<2) throw new Error("sortJsonArrayByProp requires 2 arguments");
  var direct = arguments.length>2 ? arguments[2] : 1; //Default to ascending

  if (objArray && objArray.constructor===Array){
      var propPath = (prop.constructor===Array) ? prop : prop.split(".");
      objArray.sort(function(a,b){
          for (var p in propPath){
              if (a[propPath[p]] && b[propPath[p]]){
                  a = a[propPath[p]];
                  b = b[propPath[p]];
              }
          }
          // convert numeric strings to integers
          a = a.match(/^\d+$/) ? +a : a;
          b = b.match(/^\d+$/) ? +b : b;
          return ( (a < b) ? -1*direct : ((a > b) ? 1*direct : 0) );
      });
  }
};

exports.getCurrentWeek = function() {
  return {
    year: 2015,
    week: 15
  };
};

exports.createMessage = function(cntr) {
  if (arguments.length<1) throw new Error("createMessage requires 1 arguments");

  return 'Parsed: ' + cntr.par.toString() + '<br /> Players: ' + cntr.tot.toString() + '<br /> NANs: ' + cntr.nan.toString() + '<br /> Zeros: ' + cntr.zer.toString() + '<br /> Byes: ' + cntr.bye.toString() + '<br />';
};