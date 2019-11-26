document.addEventListener('DOMContentLoaded', function () {
    const api_token = (location.search).substr(1);
    const report = [];
    let user = '';
    let minutes = 0;
    if (api_token) {
        start(api_token);
    } else {
        display_result('<b>Укажите API token!</b><br />' + location.protocol + '//' + location.hostname + '/?API_token');
        document.querySelector('.instruction').setAttribute('style', 'display: block');
    }

    function start(api_token) {
        display_result('Получение данных пользователя...', true);
        api({
            action: 'me',
            api_token: api_token
        }).then(function (result) {
            display_result('Получение проектов...', true);
            if (!result.error) {
                return result.id;
            } else {
                throw new Error('User not found');
            }
        }).then(function (result) {
            user = result;
            return api({
                action: 'projects',
                api_token: api_token
            });
        }).then(function (result) {
            if (!result.error) {
                let projects = [];
                for (let i in result.project) {
                    projects.push(result.project[i].id);
                }
                for (let i in projects) {
                    api({
                        action: 'report',
                        id: projects[i],
                        user: user,
                        api_token: api_token
                    }).then(function (result) {
                        if (!result.error) {
                            report.push(result['time_entry']);
                            display_result('Получение отчетов по проектам (' + report.length + ' из ' + projects.length + ')...', true);
                            document.title = 'Worksnaps отчет (' + (report.length / projects.length * 100).toFixed(2) + '%)';
                            if (report.length === projects.length) {
                                for (let i in report) {
                                    if (report[i] !== undefined) {
                                        if (Array.isArray(report[i])) {
                                            for (let j in report[i]) {
                                                minutes += parseInt(report[i][j]['duration_in_minutes']);
                                            }
                                        } else {
                                            minutes += parseInt(report[i]['duration_in_minutes']);
                                        }
                                    }
                                }
                                show_result(minutes);
                            }
                        } else {
                            throw new Error('Report not loading');
                        }
                    });
                }
            } else {
                throw new Error('Projects not loading');
            }
        }).catch(console.log);
    }

    function api(data) {
        return fetch('request.php', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
        }).then(function (response) {
            return response.json();
        });
    }

    function display_result(result, info = false) {
        document.querySelector("#res" + (info ? ' .info' : '')).innerHTML = result;
    }

    function getWorkDays(start) {
        let day;
        let year = (new Date()).getUTCFullYear();
        let month = (new Date()).getMonth();
        let work = 0;
        for (let date = start; date <= (new Date(year, month + 1, 0)).getDate(); date++) {
            day = (new Date(year, month, date)).getDay();
            if (day !== 0 && day !== 6) {
                work++;
            }
        }

        return work;
    }

    function show_result(minutes) {
        let workhours = 8;
        let date = new Date();
        let workdays = getWorkDays(1);
        let workdays_left = getWorkDays(date.getDate()) - date.getHours() / 24;
        let now_workhours = minutes / 60;
        let mid_workhours = (workdays * workhours - now_workhours) / (workdays_left > 1 ? workdays_left : 1);

        display_result([
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
            display_result(document.querySelector("#res").innerHTML + [
                '<b>Осталось отработать часов:</b> ' + (workdays * workhours - now_workhours).toFixed(2),
                '<b>В среднем час./день.:</b> ' + (mid_workhours).toFixed(2)
            ].join("<br />"));
        } else {
            display_result(document.querySelector("#res").innerHTML + [
                '<b>Переработано часов:</b> ' + (now_workhours - workdays * workhours).toFixed(2),
            ].join("<br />"));
        }
    }
});
