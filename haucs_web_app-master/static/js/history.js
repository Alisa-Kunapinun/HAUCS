function initializeCombobox(jsonData) {
    const pondSelector = document.getElementById('pondSelector');
    pondSelector.innerHTML = '<option value="all" selected>All Ponds</option>'; // Default option

    // Extract pond numbers and sort them
    const pondNumbers = jsonData.features.map(feature => feature.properties.number).sort((a, b) => a - b);

    // Append sorted pond numbers to the combobox
    pondNumbers.forEach(pondId => {
        const option = document.createElement('option');
        option.value = pondId;
        option.textContent = `Pond ${pondId}`;
        pondSelector.appendChild(option);
    });
}

function generateTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Clear existing rows
    const now = moment();

    data.forEach(item => {
        const row = tableBody.insertRow();
        const isRecent = moment(item.datetime).isAfter(now.subtract(60, 'seconds'));

        row.innerHTML = `
            <td>${item.datetime.toISOString().slice(0, 19).replace('T', ' ')}</td>
            <td>${item.pond_id}</td>
            <td>${item.avg_do.toFixed(2)}</td>
            <td>${item.avg_temp.toFixed(2)}</td>
            <td>${item.avg_pressure.toFixed(2)}</td>
            <td>${item.lat}</td>
            <td>${item.lng}</td>
            <td>${item.type}</td>
        `;

        if (isRecent) {
            row.style.color = 'red';
        }
    });

    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${Math.ceil(paginatedData.length / rowsPerPage)}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === Math.ceil(paginatedData.length / rowsPerPage);
}


function displayPage(page) {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = page * rowsPerPage;
    const currentData = paginatedData.slice(startIndex, endIndex);

    generateTable(currentData);
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
    }
}

function nextPage() {
    if (currentPage * rowsPerPage < paginatedData.length) {
        currentPage++;
        displayPage(currentPage);
    }
}

function transformData(jsonDatas, pondId) {
    console.log("here2");
    const data = [];
    let i;

    for (i=0;i<jsonDatas.length;i++){
        const jsonData = jsonDatas[i];
        console.log(jsonData);
        if (jsonData === null) {
            console.log("json is null");
            continue;
        }
            
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
            data.push(entry);
        });
    }

    // Sort the data from latest to oldest
    data.sort((a, b) => b.datetime - a.datetime);
    
    if (pondId !== 'all') {
        return data.filter(item => item.pond_id === pondId);
    }
    return data;
}