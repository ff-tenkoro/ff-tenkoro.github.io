var COOKIE_KEY = 'ff-raid-save';
var CARD_COUNT = 9;
var MAX_SAVE_COUNT = 4;
var MAX_STRENGTH = 99999;
var MAX_RATIO = 999.0;
var HEART_RATIO = [ 1.0, 2.0, 2.2, 3.0, 3.2, 3.5 ];
var ELEMENT_NAMES = [ '火', '水', '風', '地' ];

var initialValues;

function form_conditions() {
    return t('h2', null, '条件設定')
        + t('form', { 'class': 'form', 'role': 'form' }, 
           t('table', { 'class': 'table table-condensed' },
              t('thead', null,
                t('tr', null,
                  t('th', { 'class': 'col-md-2' }, '')
                  + t('th', { 'class': 'col-md-2' }, '攻撃力')
                  + t('th', { 'class': 'col-md-2' }, '防御力')
                  + t('th', { 'class': 'col-md-1' }, '属性')
                  + t('th', { 'class': 'col-md-1' }, '特攻倍率')
                  + t('th', { 'class': 'col-md-4' }, 'メモ')))
              + t('tbody', null,
                  (function() {
                      var result = '';
                      for(var i = 0; i < CARD_COUNT; i++) {
                          result += t('tr', null,
                                      t('td', null, 'カード' + (i + 1))
                                      + t('td', null,
                                          t('div', { 'class': 'form-group-sm' },
                                            tc('input', { 'size': '5', 'maxlength': '5', 'type': 'text', 'class': 'form-control', 'id': 'strength-0-' + i, 'value': '' })))
                                      + t('td', null,
                                          t('div', { 'class': 'form-group-sm' },
                                            tc('input', { 'size': '5', 'maxlength': '5', 'type': 'text', 'class': 'form-control', 'id': 'strength-1-' + i, 'value': '' })))
                                      + t('td', null, select('element-' + i, [[0, '火'], [1, '水'], [2, '風'], [3, '地']]))
                                      + t('td', null,
                                          t('div', { 'class': 'form-group-sm' },
                                            tc('input', { 'size': '5', 'maxlength': '5', 'type': 'text', 'class': 'form-control', 'id': 'ratio-' + i, 'value': '1' })))
                                      + t('td', null, tc('input', { 'size': '10', 'maxlength': '40', 'type': 'text', 'class': 'form-control', 'id': 'memo-' + i, 'value': '' })));
                      }
                      return result;
                  })())))
        + t('div', { 'class': 'btn-group' },
            t('button',{ 'type': 'button', 'class': 'btn btn-primary', 'onclick': 'exec_calc();' }, '計算!')
            + t('button',{ 'type': 'button', 'class': 'btn', 'onclick': 'reset_params();' }, 'リセット'))
        + t('div', { 'class': 'btn-group' }, (function() {
            var result = '';
            for(var i = 0; i < MAX_SAVE_COUNT; i++) {
                result += t('button',{ 'type': 'button', 'class': 'btn btn-default', 'onclick': 'save_params(' + i + ');' }, '保存' + (i + 1));
            }
            return result;
        })())
        + t('div', { 'class': 'btn-group' }, (function() {
            var result = '';
            for(var i = 0; i < MAX_SAVE_COUNT; i++) {
                result += t('button',{ 'type': 'button', 'class': 'btn btn-default', 'onclick': 'load_params(' + i + ');' }, '復元' + (i + 1));
            }
            return result;
        })());
}

function save_params(i) {
    saveFormValuesToCookie(COOKIE_KEY + '-' + i);
}

function load_params(i) {
    loadFormValuesFromCookie(COOKIE_KEY + '-' + i);
    exec_calc();
}

function reset_params() {
    loadFormValues(initialValues);
    $('#div-result').html('');
}

function exec_calc() {
    var cards = [];
    for(var i = 0; i < CARD_COUNT; i++) {
        var st0 = getFormValueInt('strength-0-' + i, 0, MAX_STRENGTH);
        var st1 = getFormValueInt('strength-1-' + i, 0, MAX_STRENGTH);
        var elm = getFormValueInt('element-' + i, 0, 3);
        var ratio = getFormValueFloat('ratio-' + i, 1.0, MAX_RATIO);

        if(st0 != null && st1 != null && elm != null && ratio != null) {
            var card = {};
            card['strength'] = st0 + st1;
            card['element'] = elm;
            card['ratio'] = ratio;
            cards.push(card);
        }
    }

    var result_html = t('h2', null, '計算結果');
    if(cards.length == CARD_COUNT) {
        result_html += t('table', {'class': 'table table-condensed table-striped'},
                         t('thead', null,
                           t('tr', null,
                             t('th', {'rowspan': '2'}, '属性')
                             + t('th', {'colspan': HEART_RATIO.length}, 'ハート倍率'))
                           + t('tr', null,
                               (function() {
                                   var result = '';
                                   for(var i = 0; i < HEART_RATIO.length; i++) {
                                       result += t('th', null, text_right(HEART_RATIO[i]));
                                   }
                                   return result;
                               })()))
                         + t('tbody', null, (function() {
                             var result = '';
                             for(var element1 = 0; element1 < 4; element1++) {
                                 for(var element2 = 0; element2 < 4; element2++) {
                                     if(element1 == element2) {
                                         continue;
                                     }

                                     var strength = 0.0;
                                     for(var i = 0; i < CARD_COUNT; i++) {
                                         var element_ratio = 1.0;
                                         if(element1 == cards[i].element) {
                                             element_ratio = 2.0;
                                         } else if(element2 == cards[i].element) {
                                             element_ratio = 0.5;
                                         }
                                         strength += (cards[i].strength * cards[i].ratio * element_ratio);
                                     }
                                     result += t('tr', null,
                                                 t('th', null, ELEMENT_NAMES[element1] + '/' + ELEMENT_NAMES[element2])
                                                 + (function() {
                                                     var result = '';
                                                     for(var i = 0; i < HEART_RATIO.length; i++) {
                                                         result += t('td', null, text_right(number_with_delimiter(Math.round(strength * HEART_RATIO[i]))));
                                                     }
                                                     return result;
                                                 })());
                                 }
                             }
                             return result;
                         })()));
    } else {
        result_html += t('p', null, '（条件が足りないので計算できません。)');
    }

    $('#div-result').html(result_html);
}

$(function () {
    $('#form-conditions').html(form_conditions());
    initialValues = saveFormValues();
});
