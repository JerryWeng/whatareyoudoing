class PaginationManager {
  constructor(itemsPerPage = 4) {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.totalPages = 1;
    this.allItems = [];

    this.prevPageBtn = document.getElementById("prevPage");
    this.nextPageBtn = document.getElementById("nextPage");
    this.pageNumberDisplay = document.getElementById("pageNumber");

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.prevPageBtn.addEventListener("click", () => {
      if (this.goToPreviousPage()) {
        this.onPageChange();
      }
    });

    this.nextPageBtn.addEventListener("click", () => {
      if (this.goToNextPage()) {
        this.onPageChange();
      }
    });
  }

  setItems(items) {
    this.allItems = items;
    this.totalPages = Math.max(1, Math.ceil(items.length / this.itemsPerPage));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updateUI();
  }

  getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.allItems.length
    );
    return this.allItems.slice(startIndex, endIndex);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateUI();
      return true;
    }
    return false;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateUI();
      return true;
    }
    return false;
  }

  reset() {
    this.currentPage = 1;
    this.updateUI();
  }

  updateUI() {
    this.pageNumberDisplay.textContent = `${this.currentPage} of ${this.totalPages}`;

    this.prevPageBtn.disabled = this.currentPage <= 1;
    this.nextPageBtn.disabled = this.currentPage >= this.totalPages;

    this.prevPageBtn.classList.toggle("disabled", this.currentPage <= 1);
    this.nextPageBtn.classList.toggle(
      "disabled",
      this.currentPage >= this.totalPages
    );
  }

  onPageChange() {}
}
