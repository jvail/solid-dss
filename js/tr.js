var TR = function (context, translation, defaultLang) {

  var t = translation;
  var g = context;
  var regex = [
    new RegExp('%1', 'g'),
    new RegExp('%2', 'g'),
    new RegExp('%3', 'g'),
    new RegExp('%4', 'g'),
    new RegExp('%5', 'g')
  ];
  var str = '';

  g.trLang = defaultLang;

  return function (id, args) {
    str = '';  
    if (!t[id] && t.phrase[id])
      str = t.phrase[id][g.trLang];
    else if (t[id])
      str = t[id][g.trLang];
    
    if (str === undefined || !str.length) {
      if (!t[id] && t.phrase[id])
        str = t.phrase[id][defaultLang];
      else if (t[id])
        str = t[id][defaultLang];
      else
        str = id;
    }
      
    if (args) {
      for (var i = 0, is = args.length; i < is; i++)
        str = str.replace(regex[i], args[i]);
    }
    return str;
  }

};

// test

// var translation = {

//   phrase: {

//     'bla bla': {
//       fr: '%1 je suis %1 et %2',
//       de: '%1 ich bin %1 und %2',
//     }

//   },
//   many: {
//     fr: '%1 je suis %1 et %2',
//     de: '%1 ich bin %1 und %2',
//     en: '%1 i am %1 and %2'
//   },
//   miss: {
//     de: '%1 fehlt',
//     en: '%1 miss'
//   }

// };

// var tr = new TR(this, translation, 'en');
// this.trLang = 'de';

// console.log(tr('many', ['%2', '%3']));
// this.trLang = 'fr';
// console.log(tr('many', [5, 10]));
// this.trLang = 'en';
// console.log(tr('many', [5, 10]));
// this.trLang = 'de';
// console.log(tr('many', [5, 10]));

// console.log(tr('hää?'));

// this.trLang = 'xx';
// console.log(tr('miss', [5, 10]));
// console.log(tr('bla bla', [5, 10]));

