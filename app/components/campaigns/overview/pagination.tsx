// code from https://github.com/AustinGil/npm/blob/main/app/components/Pagination.jsx

import React from "react";
import { Link, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { listPageOptions } from "./list-page-options";

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

  const pageOptions = listPageOptions(currentPage, totalPages);

  return (
    <nav
      className={[
        "inline-flex w-full items-center justify-center gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...attrs}
    >
      {currentPage <= 1 && <span>Previous Page</span>}
      {currentPage > 1 && (
        <Link to={`?${previousQuery.toString()}`}>Previous Page</Link>
      )}
      {pageOptions.map((page) => (
        <Link
          to={`?page=${page.toString()}`}
          key={page}
          className={`${typeof page === "string" ? "pointer-events-none" : ""}`}
          onClick={(e) => {
            if (typeof page === "string") {
              e.preventDefault();
            }
          }}
        >
          <Button
            variant={page === currentPage ? "default" : "outline"}
            disabled={typeof page === "string"}
            size="sm"
          >
            {page}
          </Button>
        </Link>
      ))}
      {currentPage >= totalPages && <span>Next Page</span>}
      {currentPage < totalPages && (
        <Link to={`?${nextQuery.toString()}`}>Next Page</Link>
      )}
    </nav>
  );
};

export default Pagination;
