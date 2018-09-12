$(function () {
    var api_token = (location.search).substr(1);
    if (api_token) {
        start(api_token);
    } else {
        $("#res").html('<b>Укажите API token!</b><br />' + location.protocol + '//' + location.hostname + '/?API_token');
    }

    function start(api_token) {
        var report = [];
        $("#res .info").html('Получение данных пользователя...');
        $.post("request.php", {action: 'me', api_token: api_token}, function (res) {
            var user = JSON.parse(res)['id'];
            $("#res .info").html('Получение проектов...');
            $.post("request.php", {action: 'projects', api_token: api_token}, function (res) {
                var projects = [];
                res = JSON.parse(res);
                for (var i in res['project']) {
                    projects.push(res['project'][i]['id']);
                }
                for (var i in projects) {
                    $.post("request.php", {action: 'report', 'id': projects[i], 'user': user, api_token: api_token}, function (res) {
                        var minutes = 0;
                        res = JSON.parse(res);
                        report.push(res['time_entry']);
                        $("#res .info").html('Получение отчетов по проектам (' + report.length + ' из ' + projects.length + ')...');
                        if (report.length === projects.length) {
                            for (var i in report) {
                                if (report[i] !== undefined) {
                                    if (Array.isArray(report[i])) {
                                        for (var j in report[i]) {
                                            minutes += parseInt(report[i][j]['duration_in_minutes']);
                                        }
                                    } else {
                                        minutes += parseInt(report[i]['duration_in_minutes']);
                                    }
                                }
                            }
                            result(minutes);
                        }
                    });
                }
            });
        });
    }

    function getWorkDays(start) {
        var day;
        var year = (new Date()).getUTCFullYear();
        var month = (new Date()).getMonth();
        var work = 0;
        for (var date = start; date <= (new Date(year, month + 1, 0)).getDate(); date++) {
            day = (new Date(year, month, date)).getDay();
            if (day !== 0 && day !== 6) {
                work++;
            }
        }
        return work;
    }

    function result(minutes) {
        var workhours = 8;
        var date = new Date();
        var workdays = getWorkDays(1);
        var workdays_left = getWorkDays(date.getDate()) - date.getHours() / 24;
        var now_workhours = minutes / 60;
        var mid_workhours = (workdays * workhours - now_workhours) / (workdays_left > 1 ? workdays_left : 1);
        $("#res").html([
            '<b>Месяц:</b> ' + date.toLocaleString("ru", {month: 'long'}),
            '<b>Рабочих дней:</b> ' + workdays,
            '<b>Необходимо отработать часов:</b> ' + (workdays * workhours).toFixed(2),
            '<b>Отработано часов:</b> ' + (now_workhours).toFixed(2),
            '<b>В среднем час./день.:</b> ' + (now_workhours / (workdays - workdays_left)).toFixed(2),
            '========================',
            '<b>Осталось рабочих дней:</b> ' + (workdays_left).toFixed(2),
            '',
        ].join("<br />"));
        if (now_workhours < workdays * workhours) {
            $("#res").append([
                '<b>Осталось отработать часов:</b> ' + (workdays * workhours - now_workhours).toFixed(2),
                '<b>В среднем час./день.:</b> ' + (mid_workhours).toFixed(2)
            ].join("<br />"));
        } else {
            $("#res").append([
                '<b>Переработано часов:</b> ' + (now_workhours - workdays * workhours).toFixed(2),
            ].join("<br />"));
        }
    }
});
