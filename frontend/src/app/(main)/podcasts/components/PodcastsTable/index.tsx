'use client';

import { Podcast } from "@/types/podcasts";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { SortingState } from "@tanstack/react-table";
import { use, useState } from "react";
import { podcastsColumns } from "./columns";
import RichTableFooter from "@/components/composites/RichTableFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CreatePodcastDialog from "../CreatePodcastDialog";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { ConfirmationDialog } from "@/components/composites/ConfirmationDialog";
import { deletePodcastAction } from "../../actions";
import { toast } from "sonner";

export const PodcastsTable = ({ podcasts }: { podcasts: Promise<Podcast[]> }) => {
	const [data, setData] = useState(use(podcasts));
	const [sorting, setSorting] = useState<SortingState>([]);
	const [isCreatePodcastDialogOpen, setIsCreatePodcastDialogOpen] = useState(false);
	const [isDeletePodcastDialogOpen, setIsDeletePodcastDialogOpen] = useState(false);
	const [podcastToDelete, setPodcastToDelete] = useState<Podcast | null>(null);

	const handleDelete = (podcast: Podcast) => {
		setPodcastToDelete(podcast);
		setIsDeletePodcastDialogOpen(true);
	};

	const confirmDeletePodcast = async () => {
		if (!podcastToDelete) return;

		try {
			setData((prev) => prev.filter((podcast) => podcast.id !== podcast.id));
			toast.success('ポッドキャストを削除しました');
			await deletePodcastAction(podcastToDelete.id);
		} catch (error) {
			console.error('Failed to delete podcast:', error);
			toast.error('ポッドキャストの削除に失敗しました');
			// Revert optimistic update on failure
			setData((prev) => [...prev, podcastToDelete]);
		} finally {
			setIsDeletePodcastDialogOpen(false);
			setPodcastToDelete(null);
		}
	};

	const table = useReactTable({
		data,
		columns: podcastsColumns(handleDelete),
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const handleCreatePodcastSuccess = (podcast: Podcast) => {
		setIsCreatePodcastDialogOpen(false);
		setData([...data, podcast]);
	};

	return (
		<>
			<div className="flex justify-between items-center mb-4"	>
				<div className="flex">
					<Button variant="outline" onClick={() => console.log('logout')}>ログアウト</Button>
				</div>
				<div className="flex gap-x-2">
					<Button variant="outline" onClick={() => {
						window.location.reload();
					}}>
						<RefreshCcw className="h-4 w-4" />
					</Button>
					<Button onClick={() => setIsCreatePodcastDialogOpen(true)}>ポッドキャストを追加</Button>
				</div>
			</div>
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
							<TableCell colSpan={table.getHeaderGroups().length + 4} className="h-24 text-center">
								ポッドキャストはありません
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* Pagination & count */}
			<RichTableFooter table={table} counterWord="件" />
			<CreatePodcastDialog isOpen={isCreatePodcastDialogOpen} onOpenChange={setIsCreatePodcastDialogOpen} onSuccess={handleCreatePodcastSuccess} />

			{podcastToDelete && (
				<ConfirmationDialog
					title="ポッドキャストを削除しますか？"
					description={`本当に「${podcastToDelete.title}」を削除しますか？`}
					confirmText="削除"
					showDialog={isDeletePodcastDialogOpen}
					setShowDialog={setIsDeletePodcastDialogOpen}
					onConfirm={confirmDeletePodcast}
					confirmButtonVariant="destructive"
				/>
			)}
		</>
	);
};