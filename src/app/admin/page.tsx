"use client"

import { useEffect, useState } from "react"
import { supabase, Order } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Clock, X, Package, Phone, MapPin, CreditCard, Banknote, RefreshCw } from "lucide-react"

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pedidos:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const updatePaymentStatus = async (orderId: string, status: 'confirmed' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId)

    if (error) {
      console.error('Erro ao atualizar status:', error)
    } else {
      fetchOrders()
    }
  }

  useEffect(() => {
    fetchOrders()

    // Atualização em tempo real
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500 text-white"><Check className="w-3 h-3 mr-1" />Confirmado</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white"><X className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-lg border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <p className="text-purple-300 text-sm">Bonini's Açaí - Gestão de Pedidos</p>
            </div>
            <Button
              onClick={fetchOrders}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-purple-300 mt-4">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center bg-purple-900/30 border-purple-500/30">
            <Package className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum pedido ainda</h3>
            <p className="text-purple-300">Os pedidos aparecerão aqui em tempo real</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 bg-purple-900/30 border-purple-500/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{order.customer_name}</h3>
                      {getStatusBadge(order.payment_status)}
                    </div>
                    <p className="text-purple-300 text-sm">
                      {new Date(order.created_at || '').toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-300 mb-1">Total</p>
                    <p className="text-2xl font-bold text-pink-400">R$ {order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2 text-purple-300">
                    <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{order.customer_phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-purple-300">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{order.customer_address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {order.payment_method === 'pix' ? (
                    <>
                      <CreditCard className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-300">Pagamento via PIX</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-300">Pagamento em Dinheiro</span>
                    </>
                  )}
                </div>

                <div className="bg-purple-800/50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-white mb-3">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="text-purple-300">
                          <span className="font-semibold">{item.quantity}x</span> {item.product_name}
                          {item.additionals.length > 0 && (
                            <span className="text-xs block ml-6">+ {item.additionals.join(', ')}</span>
                          )}
                        </div>
                        <span className="text-white">R$ {item.item_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.payment_status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => updatePaymentStatus(order.id!, 'confirmed')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                    <Button
                      onClick={() => updatePaymentStatus(order.id!, 'cancelled')}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
