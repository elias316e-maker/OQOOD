import type {
  Key,
  ReactNode,
} from "react";

export type DataTableTextAlign =
  | "start"
  | "center"
  | "end";

export type DataTableColumn<
  TRow,
> = {
  id: string;
  header: ReactNode;
  accessor?: keyof TRow;
  cell?: (
    row: TRow,
    rowIndex: number,
  ) => ReactNode;
  align?: DataTableTextAlign;
  width?: string;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<
  TRow,
> = {
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  getRowKey: (
    row: TRow,
    rowIndex: number,
  ) => Key;

  caption?: string;
  captionVisible?: boolean;

  isLoading?: boolean;
  loadingRowCount?: number;
  loadingLabel?: string;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  rowActions?: (
    row: TRow,
    rowIndex: number,
  ) => ReactNode;

  rowActionsHeader?: ReactNode;

  className?: string;
  tableClassName?: string;

  onRowClick?: (
    row: TRow,
    rowIndex: number,
  ) => void;

  getRowLabel?: (
    row: TRow,
    rowIndex: number,
  ) => string;
};

function readCellValue<
  TRow,
>(
  row: TRow,
  column: DataTableColumn<TRow>,
  rowIndex: number,
): ReactNode {
  if (column.cell) {
    return column.cell(
      row,
      rowIndex,
    );
  }

  if (!column.accessor) {
    return null;
  }

  const value =
    row[column.accessor];

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (
    typeof value === "boolean"
  ) {
    return value ? "نعم" : "لا";
  }

  return String(value);
}

function DataTableLoadingRows({
  columnCount,
  rowCount,
}: {
  columnCount: number;
  rowCount: number;
}) {
  return (
    <>
      {Array.from({
        length: rowCount,
      }).map((_, rowIndex) => (
        <tr
          aria-hidden="true"
          className="oqDataTableLoadingRow"
          key={rowIndex}
        >
          {Array.from({
            length: columnCount,
          }).map(
            (_, columnIndex) => (
              <td key={columnIndex}>
                <span className="oqDataTableSkeleton" />
              </td>
            ),
          )}
        </tr>
      ))}
    </>
  );
}

export function DataTable<
  TRow,
>({
  columns,
  rows,
  getRowKey,

  caption = "جدول البيانات",
  captionVisible = false,

  isLoading = false,
  loadingRowCount = 5,
  loadingLabel =
    "جارٍ تحميل البيانات...",

  emptyTitle =
    "لا توجد بيانات",
  emptyDescription =
    "لا توجد سجلات متاحة للعرض حاليًا.",
  emptyAction,

  rowActions,
  rowActionsHeader =
    "الإجراءات",

  className,
  tableClassName,

  onRowClick,
  getRowLabel,
}: DataTableProps<TRow>) {
  const totalColumnCount =
    columns.length +
    (rowActions ? 1 : 0);

  const wrapperClassName = [
    "oqDataTable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedTableClassName = [
    "oqDataTableElement",
    tableClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={wrapperClassName}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {isLoading && (
        <span className="srOnly">
          {loadingLabel}
        </span>
      )}

      <div
        className="oqDataTableViewport"
        tabIndex={0}
        role="region"
        aria-label={caption}
      >
        <table
          className={
            resolvedTableClassName
          }
        >
          <caption
            className={
              captionVisible
                ? "oqDataTableCaption"
                : "srOnly"
            }
          >
            {caption}
          </caption>

          <thead>
            <tr>
              {columns.map(
                (column) => (
                  <th
                    className={
                      column
                        .headerClassName
                    }
                    key={column.id}
                    scope="col"
                    style={{
                      inlineSize:
                        column.width,
                      textAlign:
                        column.align ??
                        "start",
                    }}
                  >
                    {column.header}
                  </th>
                ),
              )}

              {rowActions && (
                <th
                  className="oqDataTableActionsHeader"
                  scope="col"
                >
                  {rowActionsHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <DataTableLoadingRows
                columnCount={
                  totalColumnCount
                }
                rowCount={
                  loadingRowCount
                }
              />
            ) : (
              rows.map(
                (row, rowIndex) => {
                  const rowLabel =
                    getRowLabel?.(
                      row,
                      rowIndex,
                    );

                  return (
                    <tr
                      aria-label={
                        rowLabel
                      }
                      className={
                        onRowClick
                          ? "oqDataTableClickableRow"
                          : undefined
                      }
                      key={getRowKey(
                        row,
                        rowIndex,
                      )}
                      onClick={
                        onRowClick
                          ? () =>
                              onRowClick(
                                row,
                                rowIndex,
                              )
                          : undefined
                      }
                    >
                      {columns.map(
                        (column) => (
                          <td
                            className={
                              column.className
                            }
                            key={
                              column.id
                            }
                            style={{
                              textAlign:
                                column.align ??
                                "start",
                            }}
                          >
                            {readCellValue(
                              row,
                              column,
                              rowIndex,
                            )}
                          </td>
                        ),
                      )}

                      {rowActions && (
                        <td className="oqDataTableActionsCell">
                          {rowActions(
                            row,
                            rowIndex,
                          )}
                        </td>
                      )}
                    </tr>
                  );
                },
              )
            )}
          </tbody>
        </table>
      </div>

      {!isLoading &&
        rows.length === 0 && (
          <div
            className="oqDataTableEmptyState"
            role="status"
          >
            <strong>
              {emptyTitle}
            </strong>

            <p>
              {emptyDescription}
            </p>

            {emptyAction && (
              <div className="oqDataTableEmptyAction">
                {emptyAction}
              </div>
            )}
          </div>
        )}
    </section>
  );
}
