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
    var json = JSON.stringify(saveFormValues());
    $.cookie(name, json);
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
    var json = $.cookie(name);
    if(json && json.length > 0) {
        var params = JSON.parse(json);
        loadFormValues(params);
    }
}

function setFormError(element, has_error) {
    var parent = element.parent('div');
    if(parent) {
        if(has_error) {
            parent.addClass('has-error');
        } else {
            parent.removeClass('has-error');
        }
    }
}

function getFormValueInt(element_id, value_min, value_max) {
    var result = null;
    var element = $('#' + element_id);
    var value = parseInt(element.val());

    if(value >= value_min && value <= value_max) {
        result = value;
    }
    setFormError(element, result == null);

    return result;
}

function getFormValueFloat(element_id, value_min, value_max) {
    var result = null;
    var element = $('#' + element_id);
    var value = parseFloat(element.val());

    if(value >= value_min && value <= value_max) {
        result = value;
    }
    setFormError(element, result == null);

    return result;
}
