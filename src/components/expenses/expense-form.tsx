'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { type Expense, WithId, Category } from '@/lib/types';
import { parseReceipt } from '@/ai/flows/receipt-parser-flow';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  notes: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  date: z.date(),
  categoryId: z.string().min(1, "Please select a category"),
  isRecurring: z.boolean().optional(),
});

type ExpenseFormProps = {
  expense?: WithId<Expense>;
  categories: WithId<Category>[];
  onSave: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export function ExpenseForm({ expense, categories, onSave, onClose }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isParsing, startParsingTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: expense
      ? { ...expense, date: new Date(expense.date), isRecurring: expense.isRecurring || false }
      : {
          title: '',
          notes: '',
          amount: 0,
          date: new Date(),
          categoryId: undefined,
          isRecurring: false,
        },
  });
  
  // When the expense prop changes (i.e., when opening the dialog to edit), reset the form.
  React.useEffect(() => {
    if (expense) {
      form.reset({ ...expense, date: new Date(expense.date), isRecurring: expense.isRecurring || false });
    } else {
      form.reset({
          title: '',
          notes: '',
          amount: 0,
          date: new Date(),
          categoryId: undefined,
          isRecurring: false,
      });
    }
  }, [expense, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({ ...values, id: expense?.id });
    onClose();
  }
  
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      startParsingTransition(async () => {
        try {
          const result = await parseReceipt({ photoDataUri: dataUri });
          form.setValue('title', result.title);
          form.setValue('amount', result.amount);
          form.setValue('date', parseISO(result.date));
          toast({
            title: 'Receipt Scanned!',
            description: "We've filled in the details from your receipt.",
          });
        } catch (error) {
          console.error('Error parsing receipt:', error);
          toast({
            variant: 'destructive',
            title: 'AI Parsing Error',
            description: 'There was a problem parsing your receipt.',
          });
        }
      });
     // Reset file input to allow re-uploading the same file
    if(event.target) event.target.value = '';
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
            <Label>Scan a Receipt</Label>
            <Input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleReceiptUpload}
                disabled={isParsing}
            />
            <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
            >
                {isParsing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isParsing ? 'Scanning...' : 'Upload Receipt Image'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">or enter manually below</p>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Coffee with friends" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional: more details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-1.5">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
               <div className="flex gap-2">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Recurring Expense</FormLabel>
                <FormDescription>
                  Mark this if it's a regular bill or subscription.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit">
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
