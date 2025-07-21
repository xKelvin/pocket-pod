'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle, Clock } from 'lucide-react';
import { Podcast } from '@/types/podcasts';
import { formatDate } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PodcastDeleteButton from '../PodcastDeleteButton';
import PodcastPlayButton from '../PodcastPlayButton';

export const podcastsColumns: (onDelete: (podcast: Podcast) => void) => ColumnDef<Podcast>[] = (
  onDelete: (podcast: Podcast) => void
) => [
    {
      id: 'title',
      header: ({ column }) => {
        return (
          <Button
            className="pl-0 text-xs"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            タイトル
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorFn: (row) => {
        return row.title;
      },
    },
    {
      id: 'url',
      header: () => {
        return "URL";
      },
      accessorFn: (row) => {
        return row.url;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            className="pl-0 text-xs"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ステータス
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === 'completed' ? "default" : "secondary"}
            className={`flex items-center gap-1 text-xs ${status === 'completed'
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
              }`}
          >
            {status === 'completed' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            className="pl-0 text-xs"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            作成日時
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        return (
          <div className="flex items-center gap-1">
            {formatDate(createdAt, true)}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const podcast = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <PodcastDeleteButton onClick={() => onDelete(podcast)} />
            <PodcastPlayButton podcastId={podcast.id} />
          </div>
        );
      },
    },
  ];
