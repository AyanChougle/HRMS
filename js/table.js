/**
 * DIALLO HRMS — REUSABLE TABLE ENGINE
 * Manages search, filtering, sorting, pagination, and bulk/row actions.
 */

class DataTable {
  constructor(config) {
    this.containerId = config.containerId;
    this.columns = config.columns; // [{ key, label, sortable, render }]
    this.data = [...config.data];
    this.filteredData = [...config.data];
    this.pageSize = config.pageSize || 10;
    this.currentPage = 1;
    this.sortKey = config.initialSortKey || null;
    this.sortDirection = 'asc';
    this.searchQuery = '';
    this.filters = {};
    this.filterOptions = config.filterOptions || [];
    this.toolbarActions = config.toolbarActions || '';
    this.emptyMessage = config.emptyMessage || 'No records found';
    this.emptySubtitle = config.emptySubtitle || 'Try adjusting your search query or filters.';

    this.render();
  }

  setData(newData) {
    this.data = [...newData];
    this.applyFiltersAndSearch();
  }

  applyFiltersAndSearch() {
    this.filteredData = this.data.filter(item => {
      // 1. Search Query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch = Object.values(item).some(val => 
          String(val).toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }

      // 2. Select Filters
      for (const [key, value] of Object.entries(this.filters)) {
        if (value && value !== 'ALL') {
          if (String(item[key]) !== String(value)) {
            return false;
          }
        }
      }

      return true;
    });

    // 3. Sorting
    if (this.sortKey) {
      this.filteredData.sort((a, b) => {
        let valA = a[this.sortKey] ?? '';
        let valB = b[this.sortKey] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.currentPage = 1;
    this.renderTableContent();
  }

  handleSort(key) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSearch();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="table-card">
        <!-- Toolbar with search, filters and actions -->
        <div class="table-toolbar">
          <div class="table-search-box">
            <svg class="table-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search records..." class="table-search-input" value="${this.searchQuery}" />
          </div>

          <div class="table-filters-group">
            ${this.filterOptions.map(filter => `
              <select class="filter-select" data-filter-key="${filter.key}">
                <option value="ALL">${filter.label}</option>
                ${filter.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
              </select>
            `).join('')}
          </div>

          <div class="table-actions-group">
            ${this.toolbarActions}
          </div>
        </div>

        <!-- Table Viewport -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr class="table-header-row"></tr>
            </thead>
            <tbody class="table-body"></tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="table-pagination"></div>
      </div>
    `;

    this.bindEvents(container);
    this.renderTableContent();
  }

  bindEvents(container) {
    const searchInput = container.querySelector('.table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.applyFiltersAndSearch();
      });
    }

    const filterSelects = container.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const key = e.target.getAttribute('data-filter-key');
        this.filters[key] = e.target.value;
        this.applyFiltersAndSearch();
      });
    });
  }

  renderTableContent() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const thead = container.querySelector('.table-header-row');
    const tbody = container.querySelector('.table-body');
    const pagination = container.querySelector('.table-pagination');

    // Render Headers
    thead.innerHTML = this.columns.map(col => {
      const isSorted = this.sortKey === col.key;
      const sortIcon = col.sortable ? `
        <span class="sort-icon">${isSorted ? (this.sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
      ` : '';
      return `
        <th class="${col.sortable ? 'sortable' : ''}" data-key="${col.key || ''}">
          ${col.label} ${sortIcon}
        </th>
      `;
    }).join('');

    thead.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-key');
        if (key) this.handleSort(key);
      });
    });

    // Render Body Rows or Empty State
    if (this.filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.columns.length}">
            <div class="empty-state" style="border: none; padding: 40px 10px;">
              <div class="empty-state-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="empty-state-title">${this.emptyMessage}</div>
              <div class="empty-state-desc">${this.emptySubtitle}</div>
            </div>
          </td>
        </tr>
      `;
      pagination.innerHTML = '';
      return;
    }

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, this.filteredData.length);
    const pageItems = this.filteredData.slice(startIdx, endIdx);

    tbody.innerHTML = pageItems.map((item, index) => `
      <tr>
        ${this.columns.map(col => `
          <td>${col.render ? col.render(item, index + startIdx) : (item[col.key] ?? '-')}</td>
        `).join('')}
      </tr>
    `).join('');

    // Render Pagination
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    pagination.innerHTML = `
      <div class="pagination-info">
        Showing <span class="font-semibold text-main">${startIdx + 1}</span> to <span class="font-semibold text-main">${endIdx}</span> of <span class="font-semibold text-main">${this.filteredData.length}</span> results
      </div>
      <div class="pagination-controls">
        <button class="page-num-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>&lt; Prev</button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button class="page-num-btn ${p === this.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
        `).join('')}
        <button class="page-num-btn next-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>Next &gt;</button>
      </div>
    `;

    // Pagination Click Listeners
    pagination.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentPage = Number(e.target.getAttribute('data-page'));
        this.renderTableContent();
      });
    });

    const prevBtn = pagination.querySelector('.prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTableContent();
        }
      });
    }

    const nextBtn = pagination.querySelector('.next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTableContent();
        }
      });
    }
  }
}

window.DataTable = DataTable;
