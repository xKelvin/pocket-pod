'use client';

import { Podcast } from "@/types/podcasts";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { SortingState } from "@tanstack/react-table";
import { use, useState } from "react";
import { podcastsColumns } from "./columns";
import RichTableFooter from "@/components/composites/RichTableFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const PodcastsTable = ({ podcasts }: { podcasts: Promise<Podcast[]> }) => {
	const data = use(podcasts);
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns: podcastsColumns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<>
			<Table>
				{/* Header */}
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} className="px-4 py-2 text-xs font-semibold text-gray-600">
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>

				{/* Body */}
				<TableBody>
					{table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="px-4 py-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={podcastsColumns.length} className="h-24 text-center">
								ポッドキャストはありません
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* Pagination & count */}
			<RichTableFooter table={table} counterWord="件" />
		</>
	);
};