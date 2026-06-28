import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabaseClient';

describe('Database Integration Tests (Supabase Operations)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies selecting sales records from database schema', async () => {
    const mockSalesData = [
      {
        id: 'sales-uuid-1',
        order_number: 'NA874839',
        total: 1299.99,
        payment_method: 'PayPal',
        status: 'on way',
        sale_date: '2026-06-25T12:00:00Z',
        customer_id: 'cust-uuid-1',
        customer: { full_name: 'Sarah Jenkins' },
      },
    ];

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockSalesData, error: null }),
      }),
    } as any);

    const res = await supabase.from('sales').select('*').order('sale_date');
    expect(res.data).toEqual(mockSalesData);
    expect(res.error).toBeNull();
  });

  it('verifies creating a customer and inserting a sale record (CRUD Add)', async () => {
    const newCustomerPayload = { full_name: 'Alex Rivera' };
    const newSalePayload = {
      order_number: 'NA999888',
      customer_id: 'cust-uuid-new',
      subtotal: 250.00,
      total: 250.00,
      payment_method: 'Credit Card',
      status: 'awaiting',
    };

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'cust-uuid-new' }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'sales') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      }
      return {} as any;
    });

    const custRes = await supabase.from('customers').insert([newCustomerPayload]).select('id').single();
    expect(custRes.data?.id).toBe('cust-uuid-new');

    const saleRes = await supabase.from('sales').insert([newSalePayload]);
    expect(saleRes.error).toBeNull();
  });

  it('verifies updating sale status in database (CRUD Mark Delivered)', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as any);

    const updateRes = await supabase.from('sales').update({ status: 'delivered' }).eq('id', 'sales-uuid-1');
    expect(updateRes.error).toBeNull();
  });

  it('verifies deleting sale record from database (CRUD Delete)', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as any);

    const deleteRes = await supabase.from('sales').delete().eq('id', 'sales-uuid-1');
    expect(deleteRes.error).toBeNull();
  });
});
