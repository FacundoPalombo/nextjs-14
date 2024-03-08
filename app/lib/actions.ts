'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const DeleteInvoice = FormSchema.omit({
  date: true,
  amount: true,
  status: true,
  customerId: true,
});

const CreateInvoiceFormSchema = FormSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  console.log('createInvoice', formData);

  const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  console.log('parameters', customerId, amount, status);

  const amountInCents = amount * 100;
  const [time] = new Date().toISOString().split('T');
  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date) 
  VALUES (${customerId}, ${amountInCents}, ${status}, ${time})
  `;
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice.' };
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}
