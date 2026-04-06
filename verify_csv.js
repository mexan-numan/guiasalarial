const Papa = require('papaparse');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHMkLJDKrSNGoA1fzv4Eebt91UnVDgCiNnnXp1rWIKW5nH8q46xvgocjXnYysl9T9OEdTO1unb8cLa/pub?output=csv';
    
    // We can just use fetch then Papa.parse the string to see what PapaParse outputs
    const response = await fetch(url);
    const text = await response.text();

    Papa.parse(text, {
        header: true,
        complete: function(results) {
            console.log("Papa results length:", results.data.length);
            console.log("First row from Papa:", results.data[0]);

            const mockData = {};
            const rows = results.data;
            let invalidRows = 0;

            rows.forEach(row => {
                const cleanRow = {};
                Object.keys(row).forEach(k => {
                    const cleanKey = k.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    cleanRow[cleanKey] = row[k];
                });

                const pais = cleanRow['pais'];
                const tamano = cleanRow['tipo de empresa'] || cleanRow['tamano']; 
                const area = cleanRow['area'];
                const ubicacion = cleanRow['ubicacion'];
                
                if (!pais || !tamano || !area || !ubicacion) {
                    invalidRows++;
                    return;
                }

                if (!mockData[pais]) mockData[pais] = {};
                if (!mockData[pais][tamano]) mockData[pais][tamano] = {};
                if (!mockData[pais][tamano][area]) mockData[pais][tamano][area] = {};
                if (!mockData[pais][tamano][area][ubicacion]) mockData[pais][tamano][area][ubicacion] = [];
                
                let sMinRaw = cleanRow['salario ($) min'] || cleanRow['salario min'] || '0';
                let sMaxRaw = cleanRow['salario ($) max'] || cleanRow['salario max'] || '0';

                let sMin = String(sMinRaw).replace(/[^\d.-]/g, '');
                let sMax = String(sMaxRaw).replace(/[^\d.-]/g, '');
                
                mockData[pais][tamano][area][ubicacion].push({
                    seniority: cleanRow['seniority'],
                    cargo: cleanRow['posicion'] || cleanRow['cargo'],
                    moneda: cleanRow['moneda'],
                    salario_min: parseInt(sMin, 10) || 0,
                    salario_max: parseInt(sMax, 10) || 0
                });
            });

            console.log("MockData created with countries:", Object.keys(mockData));
            console.log("Invalid rows skipped:", invalidRows);
        }
    });

}

run();
