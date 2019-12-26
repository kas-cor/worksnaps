document.addEventListener('DOMContentLoaded', function () {
    let count = 0;
    const api_token = (location.search).substr(1);
    if (api_token) {
        start(api_token).then(show_result);
    } else {
        display_text(`<b>Укажите API token!</b><br />${location.protocol}//${location.hostname}/?API_token`);
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
        })));

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
     * @returns {boolean}
     */
    function isHollyDay(date) {
        const hollyDays2020 = {
            '1.1': 'Новый год',
            '1.2': 'Новый год',
            '1.3': 'Новый год',
            '1.4': 'Новый год',
            '1.5': 'Новый год',
            '1.6': 'Новый год',
            '1.7': 'Рождество',
            '23.2': 'День защитника Отечества',
            '8.3': 'Международный женский день',
            '1.5': 'Праздник Весны и Труда',
            '9.5': 'День Победы',
            '12.6': 'День России',
            '4.11': 'День народного единства',
        };

        return hollyDays2020.hasOwnProperty(date);
    }

    /**
     * Рабочие дни
     * @param start
     * @returns {number}
     */
    function getWorkDays(start) {
        let day;
        let year = (new Date()).getUTCFullYear();
        let month = (new Date()).getMonth();
        let work = 0;
        for (let date = start; date <= (new Date(year, month + 1, 0)).getDate(); date++) {
            day = (new Date(year, month, date)).getDay();
            if (day !== 0 && day !== 6 && !isHollyDay(`${date}.${month + 1}`)) {
                work++;
            }
        }

        return work;
    }

    /**
     * Вывод результата
     * @param minutes
     */
    function show_result(minutes) {
        let work_hours = 8;
        let date = new Date();
        let work_days = getWorkDays(1);
        let work_days_left = getWorkDays(date.getDate()) - date.getHours() / 24;
        let now_work_hours = minutes / 60;
        let mid_work_hours = (work_days * work_hours - now_work_hours) / (work_days_left > 1 ? work_days_left : 1);

        display_text([
            `<b>Месяц:</b> ${date.toLocaleString("ru", {month: 'long'})}`,
            `<b>Рабочих дней:</b> ${work_days}`,
            `<b>Необходимо отработать часов:</b> ${(work_days * work_hours).toFixed(2)}`,
            `<b>Отработано часов:</b> ${now_work_hours.toFixed(2)}`,
            `<b>В среднем час./день.:</b> ${(now_work_hours / (work_days - work_days_left)).toFixed(2)}`,
            '========================',
            `<b>Осталось рабочих дней:</b> ${work_days_left.toFixed(2)}`,
            '',
        ].join('<br />'));

        if (now_work_hours < work_days * work_hours) {
            display_text(document.querySelector("#res").innerHTML + [
                `<b>Осталось отработать часов:</b> ${(work_days * work_hours - now_work_hours).toFixed(2)}`,
                `<b>В среднем час./день.:</b> ${mid_work_hours.toFixed(2)}`
            ].join('<br />'));
        } else {
            display_text(document.querySelector("#res").innerHTML + [
                `<b>Переработано часов:</b> ${(now_work_hours - work_days * work_hours).toFixed(2)}`,
            ].join('<br />'));
        }
    }
});
