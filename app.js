// We use PapaParse from CDN in index.html, so 'Papa' will be available globally.

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const countrySelect = document.getElementById('country');
    const sizeSelect = document.getElementById('company-size');
    const areaSelect = document.getElementById('area');
    const locationSelect = document.getElementById('location');
    const submitBtn = document.getElementById('submit-btn');
    const filterForm = document.getElementById('filter-form');
    const filterCard = document.querySelector('.filter-card');
    const resultsView = document.getElementById('results-view');
    const tableView = document.getElementById('table-view');
    const resetBtn = document.getElementById('reset-btn');
    const navBtn = document.querySelector('.nav-btn');
    const tableSearch = document.getElementById('table-search');
    const entriesSelect = document.getElementById('entries-select');

    // Global State
    let mockData = {};
    let itemsPerPage = 15;
    let currentPage = 1;
    let currentSearchTerm = '';

    // Fetch data from Supabase
    async function fetchSalaries() {
        try {
            const { data, error } = await supabase
                .from('salaries')
                .select('*');

            if (error) throw error;
            
            // Map Supabase layout to the expected format for processData
            const rows = data.map(r => [
                r.country,
                r.company_size,
                r.area,
                r.seniority,
                r.location,
                r.position,
                r.currency,
                r.salary_min,
                r.salary_max
            ]);
            
            // Note: Since we map directly from the DB, we don't need to shift headers
            processData(rows, false); 
            initializeForm();
        } catch (err) {
            console.error("Error loading salaries from Supabase:", err);
            filterCard.innerHTML = "<p>Error al cargar los datos de salario. Verifica la conexión a internet o la configuración de Supabase.</p>";
        }
    }

    fetchSalaries();

    function processData(rows, hasHeaders = true) {
        mockData = {};
        
        // Remove the first row which is the headers if needed
        if (hasHeaders && rows.length > 0) {
            rows.shift(); 
        }

        rows.forEach(row => {
            // Google Sheets CSV order is strict:
            // 0: País
            // 1: Tipo de Empresa
            // 2: Área
            // 3: Seniority
            // 4: Ubicación
            // 5: Posición
            // 6: Moneda
            // 7: Salario MIN
            // 8: Salario MAX
            
            if (row.length < 9) return; // Skip incomplete lines

            const pais = String(row[0]).trim();
            const tamano = String(row[1]).trim(); 
            const area = String(row[2]).trim();
            let seniority = String(row[3]).trim();
            const ubicacion = String(row[4]).trim();
            let cargo = String(row[5]).trim();
            let moneda = String(row[6]).trim();
            let sMinRaw = String(row[7]).trim();
            let sMaxRaw = String(row[8]).trim();
            
            if (!pais || !tamano || !area || !ubicacion) return; // Skip invalid rows 

            if (!mockData[pais]) mockData[pais] = {};
            if (!mockData[pais][tamano]) mockData[pais][tamano] = {};
            if (!mockData[pais][tamano][area]) mockData[pais][tamano][area] = {};
            if (!mockData[pais][tamano][area][ubicacion]) mockData[pais][tamano][area][ubicacion] = [];
            
            let sMin = sMinRaw.replace(/[^\d.-]/g, '');
            let sMax = sMaxRaw.replace(/[^\d.-]/g, '');
            
            sMin = parseInt(sMin, 10) || 0;
            sMax = parseInt(sMax, 10) || 0;

            mockData[pais][tamano][area][ubicacion].push({
                seniority: seniority,
                cargo: cargo || 'N/A',
                moneda: moneda,
                ubicacion: ubicacion, // Save the location for the 'TODOS' view
                salario_min: sMin,
                salario_max: sMax
            });
        });
    }

    function initializeForm() {
        // Populate initial countries
        countrySelect.innerHTML = `<option value="" disabled selected>Selecciona país</option>`;
        Object.keys(mockData).forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        countrySelect.disabled = false;
    }
  
    // State Management
    let currentCountry = '';
    let currentSize = '';
    let currentArea = '';
    let currentLocation = '';
  
    function resetSelect(selectEle, defaultText = "Selecciona") {
      selectEle.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
      selectEle.disabled = true;
    }
  
    function populateSelect(selectEle, options, nextSelect) {
      selectEle.innerHTML = `<option value="" disabled selected>Selecciona</option>`;
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        selectEle.appendChild(option);
      });
      selectEle.disabled = false;
      
      // Disable subsequent selects
      let current = nextSelect;
      while(current) {
        resetSelect(current, "Selecciona antes la opción anterior");
        current = current.dataset.next ? document.getElementById(current.dataset.next) : null;
      }
      submitBtn.disabled = true;
    }
  
    // Link the selections for easier clearing cascade
    countrySelect.dataset.next = 'company-size';
    sizeSelect.dataset.next = 'area';
    areaSelect.dataset.next = 'location';
  
    // Event Listeners for Selects
    countrySelect.addEventListener('change', (e) => {
      currentCountry = e.target.value;
      const sizes = Object.keys(mockData[currentCountry]);
      populateSelect(sizeSelect, sizes, areaSelect);
    });
  
    sizeSelect.addEventListener('change', (e) => {
      currentSize = e.target.value;
      const areas = Object.keys(mockData[currentCountry][currentSize]);
      populateSelect(areaSelect, areas, locationSelect);
    });
  
    areaSelect.addEventListener('change', (e) => {
      currentArea = e.target.value;
      const locations = Object.keys(mockData[currentCountry][currentSize][currentArea]);
      
      // Add 'TODOS' option at the beginning of the locations array
      const locationsWithAll = ['TODOS', ...locations];
      populateSelect(locationSelect, locationsWithAll, null);
    });
  
    locationSelect.addEventListener('change', (e) => {
      currentLocation = e.target.value;
      submitBtn.disabled = false;
    });
  
    // Handle Form Submission
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if(submitBtn.disabled) return;
      currentSearchTerm = ''; // reset search on new query
      if(tableSearch) tableSearch.value = '';
      showResults();
    });
    
    if(tableSearch) {
        tableSearch.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            currentPage = 1; // Reset to first page on search
            renderTable();
        });
    }
    
    if(entriesSelect) {
        entriesSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            itemsPerPage = val === 'Todo' ? Infinity : parseInt(val, 10);
            currentPage = 1; // Reset to first page
            renderTable();
        });
    }
  
    // Handle Return / Reset
    [resetBtn, navBtn].forEach(btn => {
      if(btn) {
          btn.addEventListener('click', (e) => {
              e.preventDefault();
              hideResults();
          });
      }
    });
  
    function showResults() {
      filterCard.style.display = 'none';
      
      let locText = currentLocation === 'TODOS' ? 'todas las ubicaciones' : currentLocation;
      document.getElementById('table-title').textContent = `Resultados en ${locText}, ${currentCountry}`;
      
      // Populate summary grid
      document.getElementById('sum-pais').textContent = currentCountry;
      document.getElementById('sum-area').textContent = currentArea;
      document.getElementById('sum-tamano').textContent = currentSize;
      document.getElementById('sum-ubicacion').textContent = currentLocation === 'TODOS' ? 'Todas' : currentLocation;
      
      renderTable();
  
      resultsView.classList.remove('hidden');
      tableView.classList.remove('hidden');
  
      resultsView.style.opacity = 0;
      tableView.style.opacity = 0;
      setTimeout(() => {
          resultsView.style.transition = 'opacity 0.6s ease';
          tableView.style.transition = 'opacity 0.6s ease';
          resultsView.style.opacity = 1;
          tableView.style.opacity = 1;
      }, 50);
    }
  
    function hideResults() {
      resultsView.classList.add('hidden');
      tableView.classList.add('hidden');
      filterCard.style.display = 'block';
    }
  
    function renderTable() {
      const tbody = document.getElementById('table-body');
      const thUbicacion = document.getElementById('th-ubicacion');
      tbody.innerHTML = '';
      
      let dataRows = [];
      const areaData = mockData[currentCountry][currentSize][currentArea] || {};
      
      const isTodos = currentLocation === 'TODOS';
      
      // Show/Hide Location header based on TODOS selection
      if (isTodos) {
          thUbicacion.classList.remove('hidden');
      } else {
          thUbicacion.classList.add('hidden');
      }

      if (isTodos) {
          // Flatten all locations under this Area
          Object.values(areaData).forEach(locArray => {
              dataRows = dataRows.concat(locArray);
          });
      } else {
          // Get array of objects for the specific combination
          dataRows = areaData[currentLocation] || [];
      }
      
      if (currentSearchTerm) {
          dataRows = dataRows.filter(row => {
              const matchedSeniority = row.seniority.toLowerCase().includes(currentSearchTerm);
              const matchedCargo = row.cargo.toLowerCase().includes(currentSearchTerm);
              const matchedLocation = isTodos ? row.ubicacion.toLowerCase().includes(currentSearchTerm) : false;
              return matchedSeniority || matchedCargo || matchedLocation;
          });
      }
      
      const totalFiltered = dataRows.length;
      
      // Pagination Logic
      const totalPages = itemsPerPage === Infinity ? 1 : Math.ceil(totalFiltered / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      
      const startIndex = (currentPage - 1) * (itemsPerPage === Infinity ? totalFiltered : itemsPerPage);
      const endIndex = itemsPerPage === Infinity ? totalFiltered : Math.min(startIndex + itemsPerPage, totalFiltered);
      
      const paginatedRows = dataRows.slice(startIndex, endIndex);
  
      paginatedRows.forEach(row => {
          const tr = document.createElement('tr');
          
          if (isTodos) {
              const tdLocation = document.createElement('td');
              tdLocation.textContent = row.ubicacion;
              tr.appendChild(tdLocation);
          }
          
          const tdSeniority = document.createElement('td');
          tdSeniority.textContent = row.seniority;
          
          const tdCargo = document.createElement('td');
          tdCargo.textContent = row.cargo;
          
          const tdMoneda = document.createElement('td');
          tdMoneda.textContent = row.moneda;
          
          const tdMin = document.createElement('td');
          tdMin.textContent = row.salario_min.toLocaleString('en-US');
          
          const tdMax = document.createElement('td');
          tdMax.textContent = row.salario_max.toLocaleString('en-US');
  
          tr.appendChild(tdSeniority);
          tr.appendChild(tdCargo);
          tr.appendChild(tdMoneda);
          tr.appendChild(tdMin);
          tr.appendChild(tdMax);
          
          tbody.appendChild(tr);
      });
  
      document.getElementById('total-count').textContent = totalFiltered;
      document.getElementById('showing-start').textContent = totalFiltered === 0 ? 0 : startIndex + 1;
      document.getElementById('showing-end').textContent = endIndex;
      
      renderPaginationControls(totalPages);
    }
    
    function renderPaginationControls(totalPages) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
             if (currentPage > 1) {
                 currentPage--;
                 renderTable();
             }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Page Buttons (Simplified: show all if under 10, otherwise basic approach)
        // For standard UI, we'll just show all available since we don't expect 100 pages
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });
            paginationContainer.appendChild(pageBtn);
        }
        
        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = `page-btn ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
        nextBtn.textContent = 'Siguiente';
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        nextBtn.addEventListener('click', () => {
             if (currentPage < totalPages) {
                 currentPage++;
                 renderTable();
             }
        });
        paginationContainer.appendChild(nextBtn);
    }
  });
