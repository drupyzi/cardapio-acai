import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Order = {
  id?: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderItem[]
  total: number
  payment_method: 'pix' | 'dinheiro'
  payment_status: 'pending' | 'confirmed' | 'cancelled'
  created_at?: string
}

export type OrderItem = {
  product_name: string
  product_price: number
  quantity: number
  additionals: string[]
  item_total: number
}
