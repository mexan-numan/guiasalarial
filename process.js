const fs = require('fs');
const path = require('path');

const rawCsv = fs.readFileSync(path.join(__dirname, 'raw.csv'), 'utf8');
const lines = rawCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('País'));

const mockData = {};
const firebaseFlatData = [];

lines.forEach(line => {
    // País;Tamaño;area;Seniority ;Ubicación;Posición;Moneda;Salario ($) MIN;Salario ($) MAX;;
    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 9) return;
    
    const [pais, tamano, area, seniority, ubicacion, posicion, moneda, min, max] = parts;
    const sMin = parseInt(min, 10) || 0;
    const sMax = parseInt(max, 10) || 0;
    
    // Structure for Frontend mockData:
    // mockData[pais][tamano][area][ubicacion] = [ { seniority, cargo: posicion, moneda, salario_min, salario_max } ]
    
    if (!mockData[pais]) mockData[pais] = {};
    if (!mockData[pais][tamano]) mockData[pais][tamano] = {};
    if (!mockData[pais][tamano][area]) mockData[pais][tamano][area] = {};
    if (!mockData[pais][tamano][area][ubicacion]) mockData[pais][tamano][area][ubicacion] = [];
    
    mockData[pais][tamano][area][ubicacion].push({
        seniority,
        cargo: posicion,
        moneda,
        salario_min: sMin,
        salario_max: sMax
    });

    firebaseFlatData.push({ pais, tamano, area, seniority, ubicacion, posicion, moneda, salario_min: sMin, salario_max: sMax });
});

fs.writeFileSync(path.join(__dirname, 'data.js'), `const mockData = ${JSON.stringify(mockData, null, 2)};\n`);
fs.writeFileSync(path.join(__dirname, 'salary_data.json'), JSON.stringify(firebaseFlatData, null, 2));

console.log('Processing complete. data.js and salary_data.json created.');
