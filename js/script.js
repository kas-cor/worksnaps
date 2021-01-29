document.addEventListener('DOMContentLoaded', function () {
    let count = 0;
    let url_parse;
    if ((url_parse = /\?(?=(.*)&hoursperday=(\d+)|(.*))/g.exec(location.search)) !== null) {
        let api_token, hours_per_day;
        if (url_parse[3]) {
            api_token = url_parse[3];
            hours_per_day = 8;
        } else {
            api_token = url_parse[1];
            hours_per_day = url_parse[2];
        }
        start(api_token).then(minutes => show_result(minutes, hours_per_day)).catch(display_text);
    } else {
        display_text(`<b>Укажите API token!</b><br />${location.protocol}//${location.hostname}/?API_token[&hoursperday=8]`);
        document.querySelector('.instruction').setAttribute('style', 'display: block');
    }

    /**
     * Старт приложения
     * @param api_token
     * @returns {Promise<number>}
     */
    async function start(api_token) {
        let minutes = 0;

        display_text('Получение данных пользователя...', true);
        const user = await api({action: 'me', api_token: api_token});
        if (user.error) throw new Error('User not found');
        display_result(`[${user.login}] ${user.first_name} ${user.last_name} (${user.email})`);

        display_text('Получение проектов...', true);
        const projects = await api({action: 'projects', api_token: api_token});
        if (projects.error) throw new Error('Projects not loading');
        display_result(`Получено ${projects.project.length} проектов`);

        await Promise.all(projects.project.map(project => api({
            action: 'report',
            id: project.id,
            user: user.id,
            api_token: api_token
        }).then(report => {
            if (report.error) throw new Error('Time entry error');
            progress(++count, projects.project.length);
            if (report.time_entry) {
                if (Array.isArray(report.time_entry)) {
                    report.time_entry.forEach(duration => {
                        minutes += parseInt(duration.duration_in_minutes);
                        display_result(`Задача "${duration.task_name}" (${duration.duration_in_minutes} минут)`);
                    });
                } else {
                    minutes += parseInt(report.time_entry.duration_in_minutes);
                    display_result(`Задача "${report.time_entry.task_name}" (${report.time_entry.duration_in_minutes} минут)`);
                }
            }
        }).catch(display_text)));

        return minutes;
    }

    /**
     * Вывод прогресса загрузки данных
     * @param count
     * @param length
     */
    function progress(count, length) {
        display_text(`Получение отчетов по проектам (${count} из ${length})...`, true);
        document.title = `Worksnaps отчет (${(count / length * 100).toFixed(2)}%)`;
    }

    /**
     * Получение данных API
     * @param data
     * @returns {Promise<any>}
     */
    async function api(data) {
        const response = await fetch('request.php', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
        });

        return await response.json();
    }

    /**
     * Вывод результатов
     * @param result
     * @param wait
     */
    function display_text(result, wait = false) {
        document.querySelector(`#res${wait ? ' .wait' : ''}`).innerHTML = result;
    }

    /**
     * Вывод результата
     * @param result
     */
    function display_result(result) {
        (Array.from(document.querySelectorAll(".result")).reverse()[0]).innerHTML = [
            '<div>',
            '<img src="/img/ok.png" class="ok" width="24" height="24" alt=""/>',
            `<span class="ok">${result}</span>`,
            '</div>',
            '<div class="result"></div>',
        ].join("\n");
        window.scrollTo(0, document.body.scrollHeight);
    }

    /**
     * Праздничные дни (выходные)
     * @param date
     * @returns {Array}
     */
    function getHollyDay(date) {
        const hollyDays2021 = {
            '1.1': 'Новогодние каникулы',
            '2.1': 'Новогодние каникулы',
            '3.1': 'Новогодние каникулы',
            '4.1': 'Новогодние каникулы',
            '5.1': 'Новогодние каникулы',
            '6.1': 'Новогодние каникулы',
            '7.1': 'Рождество Христово',
            '8.1': 'Новогодние каникулы',
            '9.1': 'Новогодние каникулы',
            '10.1': 'Новогодние каникулы',
            '23.2': 'День защитника Отечества',
            '8.3': 'Международный женский день',
            '1.5': 'Праздник Весны и Труда',
            '9.5': 'День Победы',
            '12.6': 'День России',
            '4.11': 'День народного единства',
            '31.12': 'Новый год',
        };

        return [hollyDays2021.hasOwnProperty(date), hollyDays2021[date]];
    }

    /**
     * Рабочие дни
     * @param start
     * @returns {Array}
     */
    function getWorkDays(start) {
        let day, hollyDay;
        let year = (new Date()).getUTCFullYear();
        let month = (new Date()).getMonth();
        let work = 0;
        let dont_work = 0;
        let hollyDays = [];
        for (let date = start; date <= (new Date(year, month + 1, 0)).getDate(); date++) {
            day = (new Date(year, month, date)).getDay();
            hollyDay = getHollyDay(`${date}.${month + 1}`);
            if (day !== 0 && day !== 6 && !hollyDay[0]) {
                work++;
            } else {
                dont_work++;
                if (hollyDay[1] && hollyDays.indexOf(hollyDay[1])) {
                    hollyDays.push(hollyDay[1]);
                }
            }
        }

        return [work, dont_work, hollyDays];
    }

    /**
     * Вывод результата
     * @param minutes
     */
    function show_result(minutes, hours_per_day) {
        const date = new Date();
        const workDaysAll = getWorkDays(1);
        const workDaysLeft = getWorkDays(date.getDate());
        let work_days = workDaysAll[0];
        let work_days_left = workDaysLeft[0] - date.getHours() / 24;
        let now_work_hours = minutes / 60;
        let mid_work_hours = (work_days * hours_per_day - now_work_hours) / (work_days_left > 1 ? work_days_left : 1);

        display_text([
            `<b>Месяц:</b> ${date.toLocaleString("ru", {month: 'long'})}`,
            `<b>Рабочих дней:</b> ${work_days}`,
            `<b>Выходных дней:</b> ${workDaysAll[1]} - (праздники: ${workDaysAll[2].join(', ')})`,
            `<b>Необходимо отработать часов:</b> ${(work_days * hours_per_day).toFixed(2)} (по ${hours_per_day} час. в день)`,
            `<b>Отработано часов:</b> ${now_work_hours.toFixed(2)}`,
            `<b>В среднем час./день.:</b> ${(now_work_hours / (work_days - work_days_left)).toFixed(2)}`,
            '========================',
            `<b>Осталось рабочих дней:</b> ${work_days_left.toFixed(2)}`,
            '',
        ].join('<br />'));

        if (now_work_hours < work_days * hours_per_day) {
            display_text(document.querySelector("#res").innerHTML + [
                `<b>Осталось отработать часов:</b> ${(work_days * hours_per_day - now_work_hours).toFixed(2)}`,
                `<b>В среднем час./день.:</b> ${mid_work_hours.toFixed(2)}`
            ].join('<br />'));
        } else {
            display_text(document.querySelector("#res").innerHTML + [
                `<b>Переработано часов:</b> ${(now_work_hours - work_days * hours_per_day).toFixed(2)}`,
            ].join('<br />'));
        }
    }
});
