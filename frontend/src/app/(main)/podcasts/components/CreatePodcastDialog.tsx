'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CreatePodcast, Podcast } from '@/types/podcasts';
import { v4 as uuidv4 } from 'uuid';
import { createPodcastAction } from '../actions';

const podcastFormSchema = z.object({
  id: z.string().optional(),
  url: z.url({ error: '正しいURLを入力してください' }).min(1, { message: 'URLは必須です' }),
});

type PodcastFormValues = z.infer<typeof podcastFormSchema>;

interface CreatePodcastDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (podcast: Podcast) => void;
}

const CreatePodcastDialog = ({ isOpen, onOpenChange, onSuccess }: CreatePodcastDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PodcastFormValues>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      id: '',
      url: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: PodcastFormValues) => {
    try {
      setIsLoading(true);

      const submissionData: CreatePodcast = {
        id: uuidv4(),
        url: data.url,
      };

      toast.success('ポッドキャストを追加しました');
      const createdPodcast = await createPodcastAction(submissionData);
      onSuccess({
        ...createdPodcast,
        status: 'pending...',
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error('ポッドキャストの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle>新規ポッドキャストの追加</DialogTitle>
          <DialogDescription>ポッドキャストの基本情報を入力してください</DialogDescription>
        </DialogHeader>

        {isLoading && <div className="flex flex-col items-center justify-center gap-y-4">
          <Loader2 className="h-15 w-15 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">ポッドキャストを追加しています...</p>
        </div>}

        {!isLoading && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2 pb-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      URL <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例: https://example.com/articles/123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  type="button"
                  disabled={form.formState.isSubmitting}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
                  {form.formState.isSubmitting ? '処理中...' : '追加する'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePodcastDialog;
