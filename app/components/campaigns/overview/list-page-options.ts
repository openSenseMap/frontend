//original function here: https://github.com/hotosm/tasking-manager/blob/5136d12ede6c06d87d764085353efbcbd2fe5d2f/frontend/src/components/paginator/index.js#L70
export function listPageOptions(page: number, lastPage: number) {
  let pageOptions: (string | number)[] = [1];
  if (lastPage === 0) {
    return pageOptions;
  }
  if (page === 0 || page > lastPage) {
    return pageOptions.concat([2, "...", lastPage]);
  }
  if (lastPage > 5) {
    if (page < 3) {
      return pageOptions.concat([2, 3, "...", lastPage]);
    }
    if (page === 3) {
      return pageOptions.concat([2, 3, 4, "...", lastPage]);
    }
    if (page === lastPage) {
      return pageOptions.concat(["...", page - 2, page - 1, lastPage]);
    }
    if (page === lastPage - 1) {
      return pageOptions.concat(["...", page - 1, page, lastPage]);
    }
    if (page === lastPage - 2) {
      return pageOptions.concat(["...", page - 1, page, page + 1, lastPage]);
    }
    return pageOptions.concat([
      "...",
      page - 1,
      page,
      page + 1,
      "...",
      lastPage,
    ]);
  } else {
    let range = [];
    for (let i = 1; i <= lastPage; i++) {
      range.push(i);
    }
    return range;
  }
}
