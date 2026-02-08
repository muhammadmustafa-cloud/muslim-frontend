import React, { useState, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"
import { Box } from "@mui/material"
import { Edit, Trash2, Eye } from "lucide-react"
import { IconButton } from "@mui/material"

export function DataTable({
  columns,
  data,
  onEdit,
  onView,
  onDelete,
  loading = false,
  pageSize = 10,
  ...props
}) {
  // Transform columns to MUI format
  const gridColumns = columns.map((col) => ({
    field: col.key,
    headerName: col.label,
    flex: 1,
    minWidth: 100,
    renderCell: col.render
      ? (params) => col.render(params.value, params.row)
      : undefined,
  }))

  // Add actions column if onEdit, onView, or onDelete provided
  if (onEdit || onView || onDelete) {
    gridColumns.push({
      field: "actions",
      headerName: "Actions",
      width: onView && onDelete ? 110 : 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {onView && (
            <IconButton
              size="small"
              onClick={() => onView(params.row)}
              color="primary"
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton
              size="small"
              onClick={() => onEdit(params.row)}
              color="primary"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(params.row)}
              color="error"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </Box>
      ),
    })
  }

  // Transform data to include id field
  const rows = data.map((row, index) => ({
    id: row._id || row.id || index,
    ...row,
  }))

  return (
    <Box sx={{ height: 420, width: "100%", '& .MuiDataGrid-root': { border: 'none' } }}>
      <DataGrid
        rows={rows}
        columns={gridColumns}
        loading={loading}
        pageSize={pageSize}
        rowsPerPageOptions={[10, 25, 50, 100]}
        disableSelectionOnClick
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f3f4f6",
            fontSize: "0.75rem",
            padding: "4px 12px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 600,
            fontSize: "0.7rem",
            minHeight: "36px !important",
          },
          "& .MuiDataGrid-columnHeader": {
            padding: "0 12px",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #e5e7eb",
            minHeight: "40px !important",
          },
          "& .MuiDataGrid-row": {
            minHeight: "36px !important",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f9fafb",
          },
        }}
        {...props}
      />
    </Box>
  )
}
