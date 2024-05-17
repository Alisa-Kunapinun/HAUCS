var chart1 = null;
var chart2 = null;

function toggleTimePeriodSelection() {
    const predefined = document.getElementById('predefined');
    const custom = document.getElementById('custom');
    const timePeriod = document.getElementById('timePeriod');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    if (predefined.checked) {
        timePeriod.disabled = false;
        startDate.disabled = true;
        endDate.disabled = true;
    } else if (custom.checked) {
        timePeriod.disabled = true;
        startDate.disabled = false;
        endDate.disabled = false;
    }
    updateData();
}

function getTimeFormat(timePeriod, isCustom, numofdays) {
    if (isCustom) {
        if (numofdays <= 2){
            return {
                hour: 'YYYY-MM-DD HH:mm',
                minute: 'YYYY-MM-DD HH:mm'
            };
        } else if (numofdays <= 20){
            return {
                day: 'YYYY-MM-DD',
                hour: 'YYYY-MM-DD HH:mm'
            };
        } else if (numofdays <= 360){
            return {
                day: 'YYYY-MM-DD',
                week: 'YYYY-MM-DD'
            };
        } else {
            return {
                month: 'YYYY-MM',
                day: 'YYYY-MM-DD'
            };
        }
    }else if (timePeriod === '24h') {
        return {
            hour: 'YYYY-MM-DD HH:mm',
            minute: 'YYYY-MM-DD HH:mm'
        };
    } else if (timePeriod === '3d' || timePeriod === '7d' || timePeriod === '2w') {
        return {
            day: 'YYYY-MM-DD',
            hour: 'YYYY-MM-DD HH:mm'
        };
    } else if (timePeriod === '1m' || timePeriod === '3m') {
        return {
            day: 'YYYY-MM-DD',
            week: 'YYYY-MM-DD'
        };
    } else if (timePeriod === 'all') {
        return {
            month: 'YYYY-MM',
            day: 'YYYY-MM-DD',
            week: 'YYYY-MM-DD'
        };
    }
    return {};
}

function calculateDateDifference(startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    
    // Ensure both dates are valid
    if (!start.isValid() || !end.isValid()) {
        return -1; // or handle invalid date error
    }
    
    // Calculate the difference in days
    const diffInDays = end.diff(start, 'days');
    return diffInDays;
}


function createchart1(dataPoints, labels, timePeriod, isCustom, startDate, endDate, id){
    const ctx = document.getElementById(id).getContext('2d');
    var yaxistxt = 'Dissolved Oxygen (%)';
    if (id == 'myChart')
    {
        chart = chart1;
        yaxistxt = 'Dissolved Oxygen (%)';
    }
    else
    {
        chart = chart2;
        yaxistxt = 'Temperature (°F)';
    }

    const colorArea = {
        id: 'colorArea',
        beforeDraw(chart, args, plugins) {
            const { ctx, chartArea: { top, bottom, left, right, width, height }, scales: { x }  } = chart;
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255, 1.0)';
            ctx.fillRect(0, 0, width + 54, height + 64);
            ctx.fillStyle = 'rgba(200,200,255, 0.5)';
            ctx.fillRect(left, top, right - left, bottom - top);

            const tickCount = x.ticks.length;

            for (let i = 0; i < tickCount; i++) {
                const tickValue = x.ticks[i].value;
                const xPos = x.getPixelForValue(tickValue);

                ctx.strokeStyle = (i % 5 === 0) ? '#888888' : '#BBBBBB';
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();
            }
            ctx.restore();
        }
    };
    
    let timeUnit = 'day';
    let stepSize = 1;
    const start = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');
    let numofdays = calculateDateDifference(startDate, endDate) + 1;
    let timeFormat = getTimeFormat(timePeriod, isCustom, numofdays);

    var minday = moment().subtract(1, 'days').startOf('hour').toDate();
    var maxday = moment().endOf('hour').toDate();

    if (isCustom) {
        if (numofdays <= 2){
            minday = start.startOf('hour').toDate();
            maxday = end.endOf('hour').toDate();
            timeUnit = 'hour';
            stepSize = 2;
        } else if (numofdays <= 20){
            minday = start.startOf('day').toDate();
            maxday = end.endOf('day').toDate();
            timeUnit = 'day';
            stepSize = 1;
        } else if (numofdays <= 90){
            minday = start.startOf('day').toDate();
            maxday = end.endOf('day').toDate();
            timeUnit = 'day';
            stepSize = 5;
        } else if (numofdays <= 360){
            minday = start.startOf('day').toDate();
            maxday = end.endOf('day').toDate();
            timeUnit = 'day';
            stepSize = 15;
        } else {
            minday = start.startOf('day').toDate();
            maxday = end.endOf('day').toDate();
            timeUnit = 'day';
            stepSize = 30;
        }
    } else if (timePeriod === '24h') {
        minday = moment().subtract(1, 'days').startOf('hour').toDate();
        maxday = moment().endOf('hour').toDate();
        timeUnit = 'hour';
        stepSize = 2;
    } else if (timePeriod === '3d' || timePeriod === '7d' || timePeriod === '2w') {
        if (timePeriod === '3d')
            minday = moment().subtract(3, 'days').startOf('day').toDate();
        else if (timePeriod === '7d')
            minday = moment().subtract(7, 'days').startOf('day').toDate();
            else if (timePeriod === '2w')
            minday = moment().subtract(14, 'days').startOf('day').toDate();
        maxday = moment().endOf('day').toDate();
        timeUnit = 'day';
        stepSize = 1;
    } else if (timePeriod === '1m') {
        minday = moment().subtract(1, 'months').startOf('day').toDate();
        maxday = moment().endOf('day').toDate();
        timeUnit = 'day';
        stepSize = 5;
    } else if (timePeriod === '3m') {
        minday = moment().subtract(3, 'months').startOf('day').toDate();
        maxday = moment().endOf('day').toDate();
        timeUnit = 'day';
        stepSize = 10;
    } else if (timePeriod === 'all') {
        timeUnit = 'day';
        stepSize = 30;
        if (dataPoints.length > 0)
        {
            minday = moment(dataPoints[0].x).startOf('day').toDate();
            maxday = moment(dataPoints[dataPoints.length - 1].x).endOf('day').toDate();
        }
        else
        {
            minday = moment().subtract(1, 'days').startOf('hour').toDate();
            maxday = moment().endOf('hour').toDate();
        }
    }
    
    if (!chart) {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: yaxistxt,
                    data: dataPoints,
                    borderWidth: 1,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                }]
            },
            options: {
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: true,
                            color: '#AAAAAA'
                        },
                        title: {
                            display: true,
                            text: yaxistxt,
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: timeUnit,
                            stepSize: stepSize,
                            tooltipFormat: 'YYYY-MM-DD HH:mm:ss',
                            displayFormats: timeFormat,
                            min: minday,
                            max: maxday,
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false,
                            // drawOnChartArea: true,
                            // drawTicks: true,
                            // color: '#BBBBBB',
                        },
                        ticks: {
                            source: 'auto',
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            major: {
                                enabled: true
                            },
                            callback: function(value, index, values) {
                                return moment(value).format('YYYY-MM-DD HH:mm');
                            }
                        }
                    }
                }
            },
            plugins: [colorArea]
        });
    } else {
        // Chart exists, update data
        chart.data.labels = labels;
        chart.data.datasets.forEach((dataset) => {
            dataset.data = dataPoints;
        });
        chart.options.scales.x.time.unit = timeUnit;
        chart.options.scales.x.time.stepSize = stepSize;
        chart.options.scales.x.time.min = minday;
        chart.options.scales.x.time.max = maxday;
        chart.options.scales.x.time.displayFormats = timeFormat;
        chart.update();
    }
    if (id == 'myChart')
        chart1 = chart;
    else
        chart2 = chart;
}

function transformData(jsonData, timePeriod, isCustom, startDate, endDate) {
    const data = [];
    var lastentry = null;
    Object.keys(jsonData).forEach(key => {
        const [date, time] = key.split('_');
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        const datetime = new Date(`${year}-${month}-${day}T${time}`);

        // Ensure `jsonData[key].do` is an array of floats
        const doValues = Array.isArray(jsonData[key].do) 
        ? jsonData[key].do.map(value => parseFloat(value)) 
        : [parseFloat(jsonData[key].do)];

        const avg_do = doValues.reduce((sum, current) => sum + (isNaN(current) ? 0 : current), 0) / doValues.length;

        const pressureValues = Array.isArray(jsonData[key].pressure) 
            ? jsonData[key].pressure.map(value => parseFloat(value)) 
            : [parseFloat(jsonData[key].pressure)];

        const avg_pressure = pressureValues.reduce((sum, current) => sum + (isNaN(current) ? 0 : current), 0) / pressureValues.length;

        const tempValues = Array.isArray(jsonData[key].temp) 
            ? jsonData[key].temp.map(value => parseFloat(value)) 
            : [parseFloat(jsonData[key].temp)];

        const avg_temp = tempValues.reduce((sum, current) => sum + (isNaN(current) ? 0 : current), 0) / tempValues.length;
        
        const entry = {
            datetime,
            do: doValues,
            avg_do: avg_do,
            drone_id: jsonData[key].drone_id,
            init_do: jsonData[key].init_do,
            init_pressure: jsonData[key].init_pressure,
            lat: jsonData[key].lat,
            lng: jsonData[key].lng,
            pond_id: jsonData[key].pid,
            pressure: pressureValues,
            avg_pressure: avg_pressure,
            temp: tempValues,
            avg_temp: avg_temp,
            type: jsonData[key].type,
        };
        lastentry = entry;
        // Filter data based on the selected time period
        if (isCustom)
        {
            const start = moment(startDate).startOf('day');
            const end = moment(endDate).endOf('day');
            if (moment(datetime).isAfter(start) && moment(datetime).isBefore(end))
            {
                data.push(entry);
            }
        } else {
            const now = moment();
            if (timePeriod === '24h' && moment(datetime).isAfter(now.subtract(24, 'hours'))) {
                data.push(entry);
            } else if (timePeriod === '3d' && moment(datetime).isAfter(now.subtract(3, 'days'))) {
                data.push(entry);
            } else if (timePeriod === '7d' && moment(datetime).isAfter(now.subtract(7, 'days'))) {
                data.push(entry);
            } else if (timePeriod === '2w' && moment(datetime).isAfter(now.subtract(14, 'days'))) {
                data.push(entry);
            } else if (timePeriod === '1m' && moment(datetime).isAfter(now.subtract(1, 'months'))) {
                data.push(entry);
            } else if (timePeriod === '3m' && moment(datetime).isAfter(now.subtract(3, 'months'))) {
                data.push(entry);
            } else if (timePeriod === 'all') {
                data.push(entry);
            }
        }
        
    });

    // Sort the data from latest to oldest
    data.sort((a, b) => a.datetime - b.datetime);

    return { totaldata: data, latest: lastentry };
}

function generateTable(transformedData) {
    const tbody = document.getElementById('data-table-body');
    tbody.innerHTML = ''; // Clear existing table rows

    // Sort the data from latest to oldest
    transformedData.sort((a, b) => b.datetime - a.datetime);

    transformedData.forEach(item => {
        const row = document.createElement('tr');

        // Create cells for each data point
        const timestampCell = document.createElement('td');
        timestampCell.innerText = moment(item.datetime).format('YYYY-MM-DD HH:mm');
        row.appendChild(timestampCell);

        const doCell = document.createElement('td');
        doCell.innerText = item.avg_do.toFixed(3);
        row.appendChild(doCell);

        const tempCell = document.createElement('td');
        tempCell.innerText = item.avg_temp.toFixed(3);
        row.appendChild(tempCell);

        const pressureCell = document.createElement('td');
        pressureCell.innerText = item.avg_pressure.toFixed(3);
        row.appendChild(pressureCell);

        const latCell = document.createElement('td');
        latCell.innerText = item.lat;
        row.appendChild(latCell);

        const lngCell = document.createElement('td');
        lngCell.innerText = item.lng;
        row.appendChild(lngCell);

        const typeCell = document.createElement('td');
        typeCell.innerText = item.type;
        row.appendChild(typeCell);

        // Append the row to the table body
        tbody.appendChild(row);
    });
}

function UpdateChart(timePeriod, deviceType, isCustom, startDate, endDate, json)
{
    let  { totaldata:transformedData, latest: lastentry } = transformData(json, timePeriod, isCustom, startDate, endDate);
    let firstentry = null;
    if (transformData.length > 0)
        firstentry = transformData[0];

    if (deviceType !== 'all') {
        transformedData = transformedData.filter(item => item.type === deviceType);
    }
    const labels = transformedData.map(item => item.datetime.toISOString().slice(0, 19).replace('T', ' '));
    // const doPoints = transformedData.map(item => parseFloat(item.avg_do));
    // const tempPoints = transformedData.map(item => parseFloat(item.avg_temp));

    const dataPoints = transformedData.map(item => ({
        x: moment(item.datetime).toDate(),
        y: parseFloat(item.avg_do)
    }));
    // console.log(dataPoints);

    const dataPoints2 = transformedData.map(item => ({
        x: moment(item.datetime).toDate(),
        y: parseFloat(item.avg_temp)
    }));
    createchart1(dataPoints, labels, timePeriod, isCustom, startDate, endDate, 'myChart');
    createchart1(dataPoints2, labels, timePeriod, isCustom, startDate, endDate, 'myChart2');

    generateTable(transformedData);

    if (lastentry != null)
    {
        document.getElementById('oxygen').innerText  = lastentry.avg_do.toFixed(3);
        document.getElementById('last_time').innerText  = moment(lastentry.datetime).format("HH:mm:ss");
        document.getElementById('last_date').innerText  = moment(lastentry.datetime).format("dddd, MMMM D, YYYY");
        document.getElementById('temperature').innerText  = lastentry.avg_temp.toFixed(3);
        document.getElementById('device').innerText  = lastentry.type;
    }
    else {
        document.getElementById('oxygen').innerText  = "None";
        document.getElementById('last_time').innerText  = "None";
        document.getElementById('last_date').innerText  = "None";
        document.getElementById('temperature').innerText  = "None";
        document.getElementById('device').innerText  = "None";
    }

    document.getElementById('endDate').addEventListener('change', function() {
        const endDate = this.value;
        document.getElementById('startDate').max = endDate;
    });

    // Update the minimum endDate based on startDate
    document.getElementById('startDate').addEventListener('change', function() {
        const startDate = this.value;
        document.getElementById('endDate').min = startDate;
    });
}