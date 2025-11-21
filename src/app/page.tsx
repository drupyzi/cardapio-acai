"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Plus, Minus, X, Check, User, Phone, MapPin, CreditCard, Banknote, ArrowLeft, Copy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import type { Order, OrderItem } from "@/lib/supabase"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: "acai" | "bebida"
}

type Additional = {
  id: string
  name: string
  price: number
}

type CartItem = {
  product: Product
  quantity: number
  additionals: Additional[]
}

type CheckoutStep = "cart" | "customer-info" | "payment" | "pix-payment" | "confirmed"

type CustomerInfo = {
  name: string
  phone: string
  address: string
}

const products: Product[] = [
  {
    id: "pinheirinho",
    name: "Pinheirinho Açaí 500ml",
    description: "Açaí, leite condensado e leite em pó",
    price: 22.90,
    image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/0c5936fa-1127-4f91-8f85-8a7dfcff54c2.png",
    category: "acai"
  },
  {
    id: "curitiba",
    name: "Curitiba Açaí 500ml",
    description: "Açaí, Nutella, paçoca, leite condensado e leite em pó",
    price: 33.90,
    image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/0abd519b-a0cd-41f5-b289-945a58ff02fd.png",
    category: "acai"
  },
  {
    id: "parana",
    name: "Paraná Açaí 500ml",
    description: "Açaí, morango, banana, Nutella e paçoca",
    price: 34.90,
    image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/0abd519b-a0cd-41f5-b289-945a58ff02fd.png",
    category: "acai"
  },
  {
    id: "coca",
    name: "Coca Cola Lata 350ml",
    description: "Refrigerante gelado",
    price: 6.00,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
    category: "bebida"
  },
  {
    id: "coca-zero",
    name: "Coca Cola Zero Lata 350ml",
    description: "Refrigerante zero açúcar gelado",
    price: 6.00,
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop",
    category: "bebida"
  }
]

const additionals: Additional[] = [
  { id: "morango", name: "Morango", price: 3.00 },
  { id: "banana", name: "Banana", price: 2.00 },
  { id: "nutella", name: "Nutella", price: 5.00 },
  { id: "pacoca", name: "Paçoca", price: 3.00 },
  { id: "leite-condensado", name: "Leite Condensado", price: 2.50 },
  { id: "leite-po", name: "Leite em Pó", price: 2.00 },
  { id: "granola", name: "Granola", price: 2.50 },
  { id: "chocolate", name: "Chocolate Granulado", price: 2.00 }
]

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAdditionals, setSelectedAdditionals] = useState<Additional[]>([])
  const [showCart, setShowCart] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: ""
  })
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro" | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutos em segundos
  const [copied, setCopied] = useState(false)

  // Timer para pagamento PIX
  useEffect(() => {
    if (checkoutStep === "pix-payment" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [checkoutStep, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyPixKey = () => {
    // Verifica se Clipboard API está disponível e permitida
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText("41999320317")
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
          // Se falhar, usa fallback sem mostrar erro
          useFallbackCopy()
        })
    } else {
      // Usa fallback diretamente se API não disponível
      useFallbackCopy()
    }
  }

  const useFallbackCopy = () => {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = "41999320317"
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      // Silenciosamente falha - usuário pode copiar manualmente
      console.log("Copie manualmente: 41999320317")
    }
  }

  const addToCart = () => {
    if (!selectedProduct) return

    const existingItemIndex = cart.findIndex(
      item => item.product.id === selectedProduct.id &&
      JSON.stringify(item.additionals) === JSON.stringify(selectedAdditionals)
    )

    if (existingItemIndex >= 0) {
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, {
        product: selectedProduct,
        quantity: 1,
        additionals: [...selectedAdditionals]
      }])
    }

    setSelectedProduct(null)
    setSelectedAdditionals([])
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    newCart[index].quantity += delta
    if (newCart[index].quantity <= 0) {
      removeFromCart(index)
    } else {
      setCart(newCart)
    }
  }

  const toggleAdditional = (additional: Additional) => {
    if (selectedAdditionals.find(a => a.id === additional.id)) {
      setSelectedAdditionals(selectedAdditionals.filter(a => a.id !== additional.id))
    } else {
      setSelectedAdditionals([...selectedAdditionals, additional])
    }
  }

  const getItemTotal = (item: CartItem) => {
    const additionalsTotal = item.additionals.reduce((sum, add) => sum + add.price, 0)
    return (item.product.price + additionalsTotal) * item.quantity
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleFinalizarPedido = () => {
    setCheckoutStep("customer-info")
  }

  const handleContinueToPayment = () => {
    if (customerInfo.name && customerInfo.phone && customerInfo.address) {
      setCheckoutStep("payment")
    }
  }

  const handleConfirmOrder = async () => {
    if (!paymentMethod) return

    // Se for PIX, vai para tela de pagamento
    if (paymentMethod === "pix") {
      setCheckoutStep("pix-payment")
      setTimeRemaining(300) // Reset timer
      return
    }

    // Se for dinheiro, salva direto no banco
    await saveOrder()
  }

  const saveOrder = async () => {
    const orderItems: OrderItem[] = cart.map(item => ({
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      additionals: item.additionals.map(a => a.name),
      item_total: getItemTotal(item)
    }))

    const order: Order = {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      items: orderItems,
      total: getCartTotal(),
      payment_method: paymentMethod!,
      payment_status: 'pending'
    }

    const { error } = await supabase
      .from('orders')
      .insert([order])

    if (error) {
      console.error('Erro ao salvar pedido:', error)
      alert('Erro ao finalizar pedido. Tente novamente.')
      return
    }

    setCheckoutStep("confirmed")
    setTimeout(() => {
      setCart([])
      setCustomerInfo({ name: "", phone: "", address: "" })
      setPaymentMethod(null)
      setCheckoutStep("cart")
      setShowCart(false)
    }, 3000)
  }

  const handlePixPaymentConfirm = async () => {
    await saveOrder()
  }

  const handleBackToCart = () => {
    setCheckoutStep("cart")
  }

  const handleBackToCustomerInfo = () => {
    setCheckoutStep("customer-info")
  }

  const handleBackToPayment = () => {
    setCheckoutStep("payment")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-lg border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Bonini's Açaí
            </h1>
            <p className="text-purple-300 text-sm">Sabor que conquista</p>
          </div>
          
          <Button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrinho
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white border-2 border-purple-900">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Açaís Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center gap-3">
            <span className="text-4xl">🍇</span>
            Nossos Açaís
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.category === "acai").map(product => (
              <Card
                key={product.id}
                className="overflow-hidden bg-purple-900/30 border-purple-500/30 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-purple-300 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-pink-400">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Bebidas Section */}
        <section>
          <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center gap-3">
            <span className="text-4xl">🥤</span>
            Bebidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.category === "bebida").map(product => (
              <Card
                key={product.id}
                className="overflow-hidden bg-purple-900/30 border-purple-500/30 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 cursor-pointer"
                onClick={() => {
                  setCart([...cart, { product, quantity: 1, additionals: [] }])
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-purple-300 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-pink-400">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Modal de Personalização */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-purple-900 border-purple-500">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                  <p className="text-purple-300">{selectedProduct.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedProduct(null)
                    setSelectedAdditionals([])
                  }}
                  className="text-purple-300 hover:text-white hover:bg-purple-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-purple-300 mb-4">Adicionais</h4>
                <div className="grid grid-cols-2 gap-3">
                  {additionals.map(additional => {
                    const isSelected = selectedAdditionals.find(a => a.id === additional.id)
                    return (
                      <button
                        key={additional.id}
                        onClick={() => toggleAdditional(additional)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? "border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/30"
                            : "border-purple-500/30 bg-purple-800/30 hover:border-purple-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{additional.name}</span>
                          {isSelected && <Check className="w-5 h-5 text-pink-400" />}
                        </div>
                        <span className="text-purple-300 text-sm">
                          + R$ {additional.price.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-purple-500/30">
                <div>
                  <p className="text-purple-300 text-sm mb-1">Total</p>
                  <p className="text-3xl font-bold text-pink-400">
                    R$ {(selectedProduct.price + selectedAdditionals.reduce((sum, a) => sum + a.price, 0)).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={addToCart}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Carrinho Lateral / Checkout */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (checkoutStep === "cart") {
                setShowCart(false)
              }
            }}
          />
          <Card className="relative w-full max-w-md h-full overflow-y-auto bg-purple-900 border-l-2 border-purple-500 rounded-none">
            <div className="p-6">
              {/* Carrinho */}
              {checkoutStep === "cart" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Seu Carrinho</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCart(false)}
                      className="text-purple-300 hover:text-white hover:bg-purple-800"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                      <p className="text-purple-300">Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map((item, index) => (
                          <Card key={index} className="p-4 bg-purple-800/50 border-purple-500/30">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">{item.product.name}</h4>
                                {item.additionals.length > 0 && (
                                  <div className="text-xs text-purple-300 mb-2">
                                    <span className="font-semibold">Adicionais:</span>{" "}
                                    {item.additionals.map(a => a.name).join(", ")}
                                  </div>
                                )}
                                <p className="text-pink-400 font-bold">
                                  R$ {getItemTotal(item).toFixed(2)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(index)}
                                className="text-purple-300 hover:text-red-400 hover:bg-red-500/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, -1)}
                                className="border-purple-500 text-purple-300 hover:bg-purple-800"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-white font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, 1)}
                                className="border-purple-500 text-purple-300 hover:bg-purple-800"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="border-t border-purple-500/30 pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-xl font-semibold text-purple-300">Total</span>
                          <span className="text-3xl font-bold text-pink-400">
                            R$ {getCartTotal().toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={handleFinalizarPedido}
                          size="lg"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 text-lg"
                        >
                          Finalizar Pedido
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Dados do Cliente */}
              {checkoutStep === "customer-info" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToCart}
                      className="text-purple-300 hover:text-white hover:bg-purple-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="text-2xl font-bold text-white">Dados para Entrega</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-purple-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        placeholder="Digite seu nome"
                        className="bg-purple-800/50 border-purple-500/30 text-white placeholder:text-purple-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-purple-300 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="bg-purple-800/50 border-purple-500/30 text-white placeholder:text-purple-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-purple-300 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Endereço Completo
                      </Label>
                      <Input
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        placeholder="Rua, número, bairro, cidade"
                        className="bg-purple-800/50 border-purple-500/30 text-white placeholder:text-purple-400"
                      />
                    </div>

                    <div className="border-t border-purple-500/30 pt-6">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-lg font-semibold text-purple-300">Total do Pedido</span>
                        <span className="text-2xl font-bold text-pink-400">
                          R$ {getCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <Button
                        onClick={handleContinueToPayment}
                        disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continuar para Pagamento
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Forma de Pagamento */}
              {checkoutStep === "payment" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToCustomerInfo}
                      className="text-purple-300 hover:text-white hover:bg-purple-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="text-2xl font-bold text-white">Forma de Pagamento</h3>
                  </div>

                  <div className="space-y-4 mb-8">
                    <button
                      onClick={() => setPaymentMethod("pix")}
                      className={`w-full p-6 rounded-lg border-2 transition-all duration-200 ${
                        paymentMethod === "pix"
                          ? "border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/30"
                          : "border-purple-500/30 bg-purple-800/30 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-purple-700">
                            <CreditCard className="w-6 h-6 text-pink-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-white text-lg">PIX</h4>
                            <p className="text-purple-300 text-sm">Pagamento instantâneo</p>
                          </div>
                        </div>
                        {paymentMethod === "pix" && <Check className="w-6 h-6 text-pink-400" />}
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("dinheiro")}
                      className={`w-full p-6 rounded-lg border-2 transition-all duration-200 ${
                        paymentMethod === "dinheiro"
                          ? "border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/30"
                          : "border-purple-500/30 bg-purple-800/30 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-purple-700">
                            <Banknote className="w-6 h-6 text-pink-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-white text-lg">Dinheiro</h4>
                            <p className="text-purple-300 text-sm">Pagamento na entrega</p>
                          </div>
                        </div>
                        {paymentMethod === "dinheiro" && <Check className="w-6 h-6 text-pink-400" />}
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-purple-500/30 pt-6">
                    <div className="bg-purple-800/50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-white mb-3">Resumo do Pedido</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-purple-300">
                          <span>Nome:</span>
                          <span className="text-white">{customerInfo.name}</span>
                        </div>
                        <div className="flex justify-between text-purple-300">
                          <span>Telefone:</span>
                          <span className="text-white">{customerInfo.phone}</span>
                        </div>
                        <div className="flex justify-between text-purple-300">
                          <span>Endereço:</span>
                          <span className="text-white text-right max-w-[200px]">{customerInfo.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <span className="text-lg font-semibold text-purple-300">Total a Pagar</span>
                      <span className="text-3xl font-bold text-pink-400">
                        R$ {getCartTotal().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={handleConfirmOrder}
                      disabled={!paymentMethod}
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Pedido
                    </Button>
                  </div>
                </>
              )}

              {/* Tela de Pagamento PIX */}
              {checkoutStep === "pix-payment" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToPayment}
                      className="text-purple-300 hover:text-white hover:bg-purple-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="text-2xl font-bold text-white">Pagamento via PIX</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Timer */}
                    <div className="bg-purple-800/50 rounded-lg p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-pink-400" />
                        <span className="text-purple-300 text-sm">Tempo restante para pagamento</span>
                      </div>
                      <div className="text-4xl font-bold text-pink-400">
                        {formatTime(timeRemaining)}
                      </div>
                      {timeRemaining === 0 && (
                        <p className="text-red-400 text-sm mt-2">Tempo expirado! Faça um novo pedido.</p>
                      )}
                    </div>

                    {/* Dados do PIX */}
                    <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/30 rounded-lg p-6 border-2 border-purple-500/30">
                      <h4 className="font-semibold text-white mb-4 text-center">Dados para Pagamento</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-purple-300 text-sm mb-1">Chave PIX (CPF)</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-purple-900/50 rounded-lg p-3">
                              <p className="text-white font-mono text-lg">41999320317</p>
                            </div>
                            <Button
                              onClick={copyPixKey}
                              size="icon"
                              className="bg-purple-700 hover:bg-purple-600"
                            >
                              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </Button>
                          </div>
                          {copied && (
                            <p className="text-green-400 text-xs mt-1">Chave copiada!</p>
                          )}
                        </div>

                        <div>
                          <p className="text-purple-300 text-sm mb-1">Nome do Recebedor</p>
                          <div className="bg-purple-900/50 rounded-lg p-3">
                            <p className="text-white font-semibold">Joao Vitor Boschetti</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-purple-300 text-sm mb-1">Valor a Pagar</p>
                          <div className="bg-purple-900/50 rounded-lg p-3">
                            <p className="text-pink-400 font-bold text-2xl">R$ {getCartTotal().toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instruções */}
                    <div className="bg-purple-800/30 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-2 text-sm">Como pagar:</h5>
                      <ol className="text-purple-300 text-sm space-y-1 list-decimal list-inside">
                        <li>Copie a chave PIX acima</li>
                        <li>Abra o app do seu banco</li>
                        <li>Escolha PIX e cole a chave</li>
                        <li>Confirme o pagamento</li>
                        <li>Clique em "Confirmar Pagamento" abaixo</li>
                      </ol>
                    </div>

                    {/* Botão de Confirmação */}
                    <Button
                      onClick={handlePixPaymentConfirm}
                      disabled={timeRemaining === 0}
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Confirmar Pagamento
                    </Button>

                    <p className="text-purple-300 text-xs text-center">
                      Após realizar o pagamento, clique no botão acima para finalizar seu pedido
                    </p>
                  </div>
                </>
              )}

              {/* Confirmação */}
              {checkoutStep === "confirmed" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-6 animate-pulse">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Pedido Confirmado!</h3>
                  <p className="text-purple-300 mb-2">Seu pedido foi recebido com sucesso.</p>
                  <p className="text-purple-300 mb-6">Em breve entraremos em contato!</p>
                  <div className="bg-purple-800/50 rounded-lg p-4 w-full">
                    <p className="text-sm text-purple-300 mb-2">Total:</p>
                    <p className="text-3xl font-bold text-pink-400">R$ {getCartTotal().toFixed(2)}</p>
                    <p className="text-sm text-purple-300 mt-2">
                      Pagamento: {paymentMethod === "pix" ? "PIX" : "Dinheiro"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
