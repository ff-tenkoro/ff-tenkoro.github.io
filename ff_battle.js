var MAX_STRENGTH = (100000 * 10);
var CARD_COUNT = 5;
var DEFAULT_STRENGTH = 19364;
var initialValues = null;

function tag_head(tag_name, parameters) {
    var a = ['<', tag_name ];
    if(parameters) {
        for(var p in parameters) {
            a = a.concat([' ', p, '="', parameters[p], '"']);
        }
    }
    return a;
}

function t(tag_name, parameters, text) {
    return tag_head(tag_name, parameters).concat(['>', text, '</', tag_name, '>', "\n"]).join('');
}

function tc(tag_name, parameters) {
    return tag_head(tag_name, parameters).concat([' />', "\n"]).join('');
}

function options_for_select(options) {
    var result = "";
    $.each(options, function(i, value) {
        result += t('option', { 'value': value[0] }, value[1]);
    });
    return result;
}

function select(id, options) {
    return t('select', { 'id': id }, options_for_select(options));
}
    
function number_with_delimiter(str) {
    var num = new String(str).replace(/,/g, "");
    while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
    return num;
}

function text_right(s) {
    return t('div', { 'class': 'text-right' }, s);
}

function percent_str(v) {
    return (v * 100.0).toFixed(2) + '%';
}

function calc_one_side(deck) {
    var effect_states = [ { 'strength': deck.strength, 'prob': 1.0, 'effect_count': 0 } ];

    $.each(deck.cards, function(i, card) {
        if(card.prob >= 1.0) {
            $.each(effect_states, function(j, state) {
                effect_states[j].strength += (deck.strength * card.effect);
                effect_states[j].effect_count += 1;
            });
        } else if(card.prob <= 0.0) {
        } else {
            var new_effect_states = [];
            $.each(effect_states, function(j, state) {
                new_effect_states.push({
                    'strength': state.strength + (deck.strength * card.effect),
                    'prob': state.prob * card.prob,
                    'effect_count': (state.effect_count + 1)
                    });
                new_effect_states.push({
                    'strength': state.strength,
                    'prob': state.prob * (1.0 - card.prob),
                    'effect_count': state.effect_count
                    });
            });
            effect_states = new_effect_states;
        }
    });

    var result = [];
    for(var i = 0; i < effect_states.length; i++) {
        var j;
        for(j = 0; j < result.length; j++) {
            if(effect_states[i].strength == result[j].strength && effect_states[i].effect_count == result[j].effect_count) {
                result[j].prob += effect_states[i].prob;
                break;
            }
        }
        if(j >= result.length) {
            result.push(effect_states[i]);
        }
    }

    return result;
}

function ranged_value(value, min_value, max_value) {
    if(value < min_value) {
        return min_value;
    } else if(value > max_value) {
        return max_value;
    }
    return value;
}

function read_params(od) {
    var cards = [];
    var strength = 0.0;
    if($('#calc-mode-' + od).prop('checked')) {
        var count = ranged_value(parseInt($('#' + od + '-count').val()), 0, CARD_COUNT);
        var effect = ranged_value(parseFloat($('#' + od + '-effect').val()), 0.0, 99.0);
        var prob = ranged_value(parseFloat($('#' + od + '-prob').val()), 0.0, 1.0);
        strength = ranged_value(parseFloat($('#' + od + '-strength').val()), 1, MAX_STRENGTH);

        var j;
        for(j = 0; j < count; j++) {
            var card = [];
            card.effect = effect;
            card.prob = prob;
            cards.push(card);
        }
        for(j = 0; j < (CARD_COUNT - count); j++) {
            var card = [];
            card.effect = 1.0;
            card.prob = 1.0;
            cards.push(card);
        }
    } else {
        for(var j = 0; j < CARD_COUNT; j++) {
            var card = [];
            strength += ranged_value(parseFloat($('#' + od + '-strength-' + j).val()), 1, MAX_STRENGTH);
            card.effect = ranged_value(parseFloat($('#' + od + '-effect-' + j).val()), 0.0, 99.0);
            card.prob = ranged_value(parseFloat($('#' + od + '-prob-' + j).val()), 0.0, 1.0);
            cards.push(card);
        }
    }

    var result = [];
    result.strength = strength;
    result.cards = cards;

    return result;
}

function calc_win_lose(off_result, def_result) {
    var results = [];
    var prob_off = 0.0;
    var prob_def = 0.0;
    var prob_same = 0.0;

    for(var i = 0; i < off_result.length; i++) {
        for(var j = 0; j < def_result.length; j++) {
            var result = {
                'prob': off_result[i].prob * def_result[j].prob,
                'off_strength': off_result[i].strength,
                'off_effect_count': off_result[i].effect_count,
                'def_strength': def_result[j].strength,
                'def_effect_count': def_result[j].effect_count
            };

            if(result.off_strength == result.def_strength) {
                prob_same += result.prob;
                result.result_str = '？';
                result.result_class = 'warning';
            } else if(result.off_strength > result.def_strength) {
                prob_off += result.prob;
                result.result_str = '攻撃';
                result.result_class = 'success';
            } else {
                prob_def += result.prob;
                result.result_str = '防御';
                result.result_class = 'danger';
            }
            results.push(result);
        }
    }


    return {
        'prob_off': prob_off,
        'prob_def': prob_def,
        'prob_same': prob_same,
        'details': results.sort(function(a, b) {
            if(a.off_effect_count != b.off_effect_count) {
                return a.off_effect_count - b.off_effect_count;
            }
            if(a.off_strength != b.off_strength) {
                return a.off_strength - b.off_strength;
            }
            if(a.def_effect_count != b.def_effect_count) {
                return a.def_effect_count - b.def_effect_count;
            }
            return a.def_strength - b.def_strength;
        }) };
}

function render_summary(result) {
    $('#div-result-summary').html(
        t('h2', null, '計算結果')
        + t('div', { 'class': 'row' },
            t('div', { 'class': 'col-md-6' },
              t('table', { 'class': 'table table-condensed' },
                t('thead', null,
                  t('tr', null,
                    t('th', { 'colspan': '2' }, '攻撃側')
                    + t('th', { 'colspan': '2' }, '防御側')
                    + (function() {
                        if(result.prob_same > 0.0) {
                            return t('th', { 'colspan': '2', 'rowspan': '2' }, '同点?');
                        }
                        return '';
                    })())
                  +t('tr', null,
                     t('th', null, '基礎攻撃力')
                     + t('th', null, '勝率')
                     + t('th', null, '基礎防御力')
                     + t('th', null, '勝率')))
                + t('tbody', null,
                    t('tr', null,
                      t('td', null, text_right(number_with_delimiter(result.off_strength)))
                      + t('td', { 'class': 'success' }, text_right(percent_str(result.prob_off)))
                      + t('td', null, text_right(number_with_delimiter(result.def_strength)))
                      + t('td', { 'class': 'danger' }, text_right(percent_str(result.prob_def)))
                      + (function() {
                          if(result.prob_same > 0.0) {
                              return t('td', null, '') + t('td', null, text_right(percent_str(result.prob_same)));
                          }
                          return '';
                      })()))))));
}

function render_detail(result) {
    $('#div-result-detail').html(
        t('h2', null, '発動数別詳細')
        + t('div', { 'class': 'row' },
            t('div', { 'class': 'col-md-6' },
              t('table', { 'class': 'table table-condensed' },
                t('thead', null,
                  t('tr', null,
                    t('th', { 'colspan': 2 }, '攻撃')
                    + t('th', { 'colspan': 2 }, '防御')
                    + t('th', { 'rowspan': 2 }, '確率')
                    + t('th', { 'rowspan': 2 }, '勝利'))
                  + t('tr', null,
                      t('th', null, '発動数')
                      + t('th', null, '総攻撃力')
                      + t('th', null, '発動数')
                      + t('th', null, '総防御力')))
                + t('tbody', null,
                    (function() {
                        var tmp = '';
                        $.each(result.details, function(i, detail) {
                            tmp += t('tr', { 'class': detail.result_class },
                                     t('td', null, text_right(number_with_delimiter(detail.off_effect_count)))
                                     + t('td', null, text_right(number_with_delimiter(detail.off_strength)))
                                     + t('td', null, text_right(number_with_delimiter(detail.def_effect_count)))
                                     + t('td', null, text_right(number_with_delimiter(detail.def_strength)))
                                     + t('td', null, text_right(percent_str(detail.prob)))
                                     + t('td', null, detail.result_str));
                        });
                        return tmp;
                    })())))));
}

function exec_calc() {
    var cards_off = read_params('off');
    var cards_def = read_params('def');

    var off_result = calc_one_side(cards_off);
    var def_result = calc_one_side(cards_def);

    var result = calc_win_lose(off_result, def_result);
    result.off_strength = cards_off.strength;
    result.def_strength = cards_def.strength;

    render_summary(result);
    render_detail(result);
}

function form_conditions_detail(od, od_str) {
    return t('div', { 'id': 'div-detail-' + od },
             t('table', { 'class': 'table table-condensed' },
               t('thead', null,
                 t('tr', null, t('th', null, '') + t('th', null, '攻防力') + t('th', null, '増加率') + t('th', null, '発動率')))
               + t('tbody', null,
                   (function() {
                       var tmp = '';
                       for(var j = 0; j < CARD_COUNT; j++) {
                           tmp += t('tr', null,
                                    t('td', null, (od_str + (j + 1))) +
                                    t('td', null, tc('input', { 'type': 'text', 'class': 'form-control input-sm', 'id': od + '-strength-' + j, 'value': DEFAULT_STRENGTH })) +
                                    t('td', null, select(od + '-effect-' + j, [["1", "100%"], ["2", "200%"], ["3", "300%"], ["6.5", "650%"]])) +
                                    t('td', null, select(od + '-prob-' + j, [["1", "100%"], ["0.8", "80%"], ["0.3", "30%"], ["0.05", "5%"], ["0", "0%"]])));
                       }
                       return tmp;
                   })())));
}

function form_conditions_summary(od, od_str) {
    return t('div', { 'id': 'div-summary-' + od },
             t('div', { 'class': 'form-group' },
               t('label', null, '総' + od_str + '力') +
               tc('input', { 'type': 'text', 'class': 'form-control input-sm', 'id':  od + '-strength', 'value': (DEFAULT_STRENGTH * CARD_COUNT) })) +
             t('div', { 'class': 'form-group' },
               t('label', null, '上位スキル枚数') +
               select(od + '-count', [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]])) +
             t('div', { 'class': 'form-group' },
               t('label', null, '増加率') +
               select(od + '-effect', [["1", "100%"], ["2", "200%"], ["3", "300%"], ["6.5", "650%"]])) +
             t('div', { 'class': 'form-group' },
               t('label', null, '発動率') +
               select(od + '-prob', [["1", "100%"], ["0.8", "80%"], ["0.3", "30%"], ["0.05", "5%"], ["0", "0%"]])));
}

function form_conditions() {
    return t('h2', null, '条件設定')
        + t('div', { 'class': 'row' },
            t('form', { 'class': 'form' }, (function() {
                var tmp = '';
                $.each(['off', 'def'], function(i, od) {
                    var od_str = i  == 0 ? '攻撃' : '防御';
                    tmp += t('div', { 'class': 'col-md-6' },
                             t('div', null,
                               t('div', null,
                                 t('label', null,
                                   tc('input', { 'type': 'checkbox', 'id': 'calc-mode-' + od, 'class': 'calc-mode-checkbox', 'value': '1',  'checked': null }) + '簡易設定'))
                               + form_conditions_summary(od, od_str)
                               + form_conditions_detail(od, od_str)));
                });
                return tmp;
            })()))
        + t('button',{ 'type': 'button', 'class': 'btn btn-primary', 'id': 'btn-exec' }, '計算!')
        + t('button',{ 'type': 'button', 'class': 'btn', 'onclick': 'saveParams();' }, '保存')
        + t('button',{ 'type': 'button', 'class': 'btn', 'onclick': 'loadParams();' }, '復元')
        + t('button',{ 'type': 'button', 'class': 'btn', 'onclick': 'resetParams();' }, 'リセット');
}

function changed_calc_mode() {
    if($('#calc-mode-off').prop('checked')) {
        $('#div-detail-off').hide();
        $('#div-summary-off').show();
    } else {
        $('#div-detail-off').show();
        $('#div-summary-off').hide();
    }
    if($('#calc-mode-def').prop('checked')) {
        $('#div-detail-def').hide();
        $('#div-summary-def').show();
    } else {
        $('#div-detail-def').show();
        $('#div-summary-def').hide();
    }
}

function saveFormValues() {
    var params = {};
    $(':input').each(function() {
        var element = $(this);
        var id = element.attr("id");
        if(id && id.length > 0) {
            params[id] = { 'v': element.val(), 'c': element.prop('checked') };
        }
    });
    return params;
}

function saveFormValuesToCookie(name) {
    $.cookie(name, JSON.stringify(saveFormValues()));
}

function loadFormValues(params) {
    $.each(params, function(id, v) {
        var element = $('#' + id);
        if(element.attr('type') == 'checkbox') {
            element.prop('checked', params[id].c);
        } else {
            element.val(params[id].v);
        }
    });
}

function loadFormValuesFromCookie(name) {
    var params = JSON.parse($.cookie('ff-battle-save'));
    loadFormValues(params);
}

function saveParams() {
    saveFormValuesToCookie("ff-battle-save");
}

function loadParams() {
    loadFormValuesFromCookie("ff-battle-save");
    changed_calc_mode();
}

function resetParams() {
    loadFormValues(initialValues);
    changed_calc_mode();
}

$(function () {
    $('#form-conditions').html(form_conditions());

    $('.calc-mode-checkbox').change(function() {
        changed_calc_mode();
    });

    $('#btn-exec').click(function() {
        exec_calc();
    });

    changed_calc_mode();
    initialValues = saveFormValues();
});
