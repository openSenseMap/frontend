// code from https://github.com/AustinGil/npm/blob/main/app/components/Pagination.jsx

import React from "react";
import { Link, useSearchParams } from "@remix-run/react";

const Pagination = ({
  totalPages = Number.MAX_SAFE_INTEGER,
  pageParam = "page",
  className = "",
  ...attrs
}) => {
  const [queryParams] = useSearchParams();
  const currentPage = Number(queryParams.get(pageParam) || 1);
  totalPages = Number(totalPages);

  const previousQuery = new URLSearchParams(queryParams);
  previousQuery.set(pageParam, (currentPage - 1).toString());
  const nextQuery = new URLSearchParams(queryParams);
  nextQuery.set(pageParam, (currentPage + 1).toString());

  return (
    <nav
      className={["flex justify-between", className].filter(Boolean).join(" ")}
      {...attrs}
    >
      {currentPage <= 1 && <span>Previous Page</span>}
      {currentPage > 1 && (
        <Link to={`?${previousQuery.toString()}`}>Previous Page</Link>
      )}
      {currentPage >= totalPages && <span>Next Page</span>}
      {currentPage < totalPages && (
        <Link to={`?${nextQuery.toString()}`}>Next Page</Link>
      )}
    </nav>
  );
};

export default Pagination;
