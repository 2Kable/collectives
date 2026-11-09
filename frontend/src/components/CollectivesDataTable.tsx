import { apiClient } from "@/api/client";
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
  type DataTableRowGroupHeaderTemplateType,
  type DataTableStateEvent,
  type DataTableValue,
} from "primereact/datatable";
import { type ReactNode, useCallback, useEffect, useState } from "react";

export interface FlaskFilterPayload {
  field: string;
  type: string;
  value: unknown;
}

export interface FlaskPaginatedResponse<T> {
  data: T[];
  last_page: number;
  total_records?: number;
}

export interface CollectivesDataTableProps<T extends DataTableValue> {
  endpoint: string;
  defaultPageSize?: number;
  rowsPerPageOptions?: number[];
  initialFilters?: DataTableFilterMeta;
  staticFilters?: FlaskFilterPayload[];
  extraParams?: Record<string, unknown>;
  className?: string;
  dataKey?: string;
  stripedRows?: boolean;
  rowGroupMode?: "subheader" | "rowspan";
  groupRowsBy?: string;
  rowGroupHeaderTemplate?: DataTableRowGroupHeaderTemplateType<T[]>;
  onRowClick?: (event: DataTableRowClickEvent) => void;
  children?: ReactNode;
}

export function serializeFiltersToFlask(
  filters: DataTableFilterMeta | undefined,
  staticFilters: FlaskFilterPayload[] = [],
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const combined: FlaskFilterPayload[] = [...staticFilters];

  if (filters) {
    for (const [field, meta] of Object.entries(filters)) {
      if (!meta || "operator" in meta) {
        continue;
      }
      const filterMeta = meta as DataTableFilterMetaData;
      if (filterMeta.value === null || filterMeta.value === undefined || filterMeta.value === "") {
        continue;
      }
      const type = filterMeta.matchMode === "equals" ? "=" : "like";
      combined.push({ field, type, value: filterMeta.value });
    }
  }

  combined.forEach((filterItem, index) => {
    params[`filters[${index}][field]`] = filterItem.field;
    params[`filters[${index}][type]`] = filterItem.type;
    params[`filters[${index}][value]`] = filterItem.value;
  });

  return params;
}

export function CollectivesDataTable<T extends DataTableValue>({
  endpoint,
  defaultPageSize = 50,
  rowsPerPageOptions = [25, 50, 100, 200],
  initialFilters,
  staticFilters = [],
  extraParams = {},
  className,
  dataKey,
  stripedRows,
  rowGroupMode,
  groupRowsBy,
  rowGroupHeaderTemplate,
  onRowClick,
  children,
}: CollectivesDataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [lazyState, setLazyState] = useState<{
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder?: 1 | 0 | -1 | null;
    filters?: DataTableFilterMeta;
  }>({
    first: 0,
    rows: defaultPageSize,
    page: 1,
    filters: initialFilters,
  });

  const fetchTableData = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams = serializeFiltersToFlask(lazyState.filters, staticFilters);
      const sortParams: Record<string, unknown> = {};
      if (lazyState.sortField && lazyState.sortOrder) {
        sortParams["sorters[0][field]"] = lazyState.sortField;
        sortParams["sorters[0][dir]"] = lazyState.sortOrder === 1 ? "asc" : "desc";
      }

      const response = await apiClient.get<FlaskPaginatedResponse<T>>(endpoint, {
        params: {
          page: lazyState.page,
          size: lazyState.rows,
          ...extraParams,
          ...filterParams,
          ...sortParams,
        },
      });

      const payload = response.data;
      setRows(payload.data || []);
      const computedTotal = payload.total_records ?? (payload.last_page || 1) * lazyState.rows;
      setTotalRecords(computedTotal);
    } finally {
      setLoading(false);
    }
  }, [endpoint, extraParams, lazyState, staticFilters]);

  useEffect(() => {
    void fetchTableData();
  }, [fetchTableData]);

  const handleStateChange = (event: DataTableStateEvent) => {
    const nextPage = event.page !== undefined ? event.page + 1 : 1;
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: nextPage,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
      filters: event.filters,
    });
  };

  return (
    <DataTable
      value={rows}
      lazy
      paginator
      filterDisplay="row"
      responsiveLayout="scroll"
      first={lazyState.first}
      rows={lazyState.rows}
      totalRecords={totalRecords}
      rowsPerPageOptions={rowsPerPageOptions}
      loading={loading}
      sortField={lazyState.sortField}
      sortOrder={lazyState.sortOrder}
      filters={lazyState.filters}
      onPage={handleStateChange}
      onSort={handleStateChange}
      onFilter={handleStateChange}
      className={className}
      dataKey={dataKey}
      stripedRows={stripedRows}
      rowGroupMode={rowGroupMode}
      groupRowsBy={groupRowsBy}
      rowGroupHeaderTemplate={rowGroupHeaderTemplate}
      onRowClick={onRowClick}
      emptyMessage="Aucun résultat trouvé"
    >
      {children}
    </DataTable>
  );
}
