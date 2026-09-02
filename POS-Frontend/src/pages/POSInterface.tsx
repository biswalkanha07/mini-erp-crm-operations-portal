import React, { useState, useEffect, useRef } from 'react';
import ApplyPromoCode from '../components/ApplyPromoCode';
import { salesAPI, catalogueAPI, invoiceAPI, storeAPI } from '../api';
import PaymentModal from '../components/PaymentModal';

interface CartItem {
  sku: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  gst: number;
  discount: number;
  totalAmount: number;
}

interface CustomerDetails {
  name?: string;
  phone?: string;
  email?: string;
}

interface POSInterfaceProps {
  storeId?: string;
  storeName?: string;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ storeId, storeName }) => {
  // Product gallery state
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  // Load all products and categories for gallery
  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        catalogueAPI.getAll(),
        (await import('../api')).categoryAPI.getAll()
      ]);
      setAllProducts(prodRes.data || []);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    };
    fetchData();
  }, []);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  }, []);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({});
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'UPI'>('cash');
  const [selectedStore, setSelectedStore] = useState<string>(storeId || '');
  const [stores, setStores] = useState<any[]>([]);
  // store-level GST removed; GST is per product
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load stores on component mount
  useEffect(() => {
    if (storeId) {
      setSelectedStore(storeId);
      setStores(storeName ? [{ _id: storeId, storeName }] : []);
      // Fetch store settings (no gstRate)
      storeAPI.getById(storeId).then(res => {
        setDiscountRate(res.data.discountRate || 0);
        setProfitMarginPercent(res.data.profitMarginPercent || 0);
      });
    } else {
      const loadStores = async () => {
        try {
          const response = await storeAPI.getAll();
          setStores(response.data);
        } catch (error) {
          console.error('Failed to load stores:', error);
        }
      };
      loadStores();
    }
  }, [storeId, storeName]);

  // Fetch store settings when store changes
  useEffect(() => {
    if (selectedStore) {
      storeAPI.getById(selectedStore).then(res => {
        setDiscountRate(res.data.discountRate || 0);
        setProfitMarginPercent(res.data.profitMarginPercent || 0);
      });
    }
  }, [selectedStore]);

  // Calculate totals from items (GST per item using product gstRate)
  const subTotal = cart.reduce((sum: number, item: CartItem) => sum + (item.quantity * item.pricePerUnit), 0);
  const totalDiscount = cart.reduce((sum: number, item: CartItem) => sum + (item.discount || 0), 0);
  const totalGST = cart.reduce((sum: number, item: CartItem) => sum + (item.gst || 0), 0);
  const safePromoDiscount = typeof promoDiscount === 'number' && !isNaN(promoDiscount) ? promoDiscount : 0;
  const grandTotal = subTotal - totalDiscount + totalGST - safePromoDiscount;

  // Add item to cart by barcode
  const addItemByBarcode = async () => {
    if (!barcodeInput.trim()) {
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
      return;
    }

    try {
      setLoading(true);
      const response = await catalogueAPI.getByBarcode(barcodeInput);
      const product = response.data;

      if (product) {
        const existingItemIndex = cart.findIndex(item => item.sku === product.sku);
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedCart = [...cart];
          const existing = { ...updatedCart[existingItemIndex] };
          existing.quantity += quantityInput;
          const itemSubTotal = existing.quantity * existing.pricePerUnit;
          const itemDiscount = ((itemSubTotal) * (discountRate || 0)) / 100;
          const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
          const itemGst = ((itemSubTotal - itemDiscount) * productGstRate) / 100;
          existing.gst = itemGst;
          existing.totalAmount = itemSubTotal - itemDiscount + itemGst;
          existing.discount = itemDiscount;
          updatedCart[existingItemIndex] = existing;
          setCart(updatedCart);
        } else {
          // Add new item
          // Determine effective unit price for store
          let unitPrice = product.price;
          if (selectedStore) {
            try {
              const eff = await storeAPI.getEffectivePrice(selectedStore, product.sku);
              unitPrice = eff.data?.effectivePrice ?? product.price;
            } catch {
              unitPrice = product.price + (product.price * (profitMarginPercent || 0) / 100);
            }
          } else {
            unitPrice = product.price + (product.price * (profitMarginPercent || 0) / 100);
          }
          const base = quantityInput * unitPrice;
          const computedDiscount = (base * (discountRate || 0)) / 100;
          const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
          const computedGst = ((base - computedDiscount) * productGstRate) / 100;
          const newItem: CartItem = {
            sku: product.sku,
            itemName: product.itemName,
            quantity: quantityInput,
            pricePerUnit: unitPrice,
            gst: computedGst,
            discount: computedDiscount,
            totalAmount: base - computedDiscount + computedGst
          };
          setCart([...cart, newItem]);
        }
        setBarcodeInput('');
        setQuantityInput(1);
        setMessage(`Added ${product.itemName} to cart`);
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      }
    } catch (error) {
      setMessage('Product not found');
    } finally {
      setLoading(false);
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  // Add item to cart by SKU (or by product object)
  const addItemBySKU = async (sku: string, productObj?: any) => {
    try {
      let product = productObj;
      if (!product) {
        const response = await catalogueAPI.getBySKU(sku);
        product = response.data;
      }
      if (product) {
        const existingItemIndex = cart.findIndex(item => item.sku === product.sku);
        
        if (existingItemIndex >= 0) {
          const updatedCart = [...cart];
          const existing = { ...updatedCart[existingItemIndex] };
          existing.quantity += 1;
          const itemSubTotal = existing.quantity * existing.pricePerUnit;
          const itemDiscount = (itemSubTotal * (discountRate || 0)) / 100;
          const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
          const itemGst = ((itemSubTotal - itemDiscount) * productGstRate) / 100;
          existing.gst = itemGst;
          existing.discount = itemDiscount;
          existing.totalAmount = itemSubTotal - itemDiscount + itemGst;
          updatedCart[existingItemIndex] = existing;
          setCart(updatedCart);
        } else {
          // Determine effective unit price for store
          let unitPrice = product.price;
          if (selectedStore) {
            try {
              const eff = await storeAPI.getEffectivePrice(selectedStore, product.sku);
              unitPrice = eff.data?.effectivePrice ?? product.price;
            } catch {
              unitPrice = product.price + (product.price * (profitMarginPercent || 0) / 100);
            }
          } else {
            unitPrice = product.price + (product.price * (profitMarginPercent || 0) / 100);
          }
          const base = unitPrice;
          const computedDiscount = (base * (discountRate || 0)) / 100;
          const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
          const computedGst = ((base - computedDiscount) * productGstRate) / 100;
          const newItem: CartItem = {
            sku: product.sku,
            itemName: product.itemName,
            quantity: 1,
            pricePerUnit: unitPrice,
            gst: computedGst,
            discount: computedDiscount,
            totalAmount: base - computedDiscount + computedGst
          };
          setCart([...cart, newItem]);
        }
      }
    } catch (error) {
      setMessage('Product not found');
    }
  };

  // Remove item from cart
  const removeItem = (sku: string) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  // Update item quantity
  const updateQuantity = (sku: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(sku);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.sku === sku) {
        const updatedItem = { ...item, quantity: newQuantity };
        const itemSubTotal = updatedItem.quantity * updatedItem.pricePerUnit;
        const itemDiscount = (itemSubTotal * (discountRate || 0)) / 100;
        // Need product GST rate; refetch product for exact rate
        // Note: for performance, we could cache gstRate per sku
        const product = allProducts.find(p => p.sku === item.sku);
        const productGstRate = product && typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
        const itemGst = ((itemSubTotal - itemDiscount) * productGstRate) / 100;
        updatedItem.gst = itemGst;
        updatedItem.discount = itemDiscount;
        updatedItem.totalAmount = itemSubTotal - itemDiscount + itemGst;
        return updatedItem;
      }
      return item;
    });
    setCart(updatedCart);
  };

  // Recompute discount & GST for all cart items when rates change
  useEffect(() => {
    if (cart.length === 0) return;
    const recomputed = cart.map(item => {
      const itemSubTotal = item.quantity * item.pricePerUnit;
      const itemDiscount = (itemSubTotal * (discountRate || 0)) / 100;
      const product = allProducts.find(p => p.sku === item.sku);
      const productGstRate = product && typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
      const itemGst = ((itemSubTotal - itemDiscount) * productGstRate) / 100;
      return {
        ...item,
        gst: itemGst,
        discount: itemDiscount,
        totalAmount: itemSubTotal - itemDiscount + itemGst
      };
    });
    setCart(recomputed);
  }, [allProducts, discountRate]);

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      setMessage('Cart is empty');
      return;
    }

    if (!selectedStore) {
      setMessage('Please select a store');
      return;
    }

    if (!customerDetails.phone) {
      setShowRequiredError(true);
      return;
    }

    setShowRequiredError(false);

    // Check stock for each cart item
    setLoading(true);
    try {
      for (const item of cart) {
        // Fetch latest product info by SKU
        const res = await catalogueAPI.getBySKU(item.sku);
        const product = res.data;
        if (!product || typeof product.stock !== 'number') {
          setMessage(`Unable to verify stock for ${item.itemName}`);
          setLoading(false);
          return;
        }
        if (item.quantity > product.stock) {
          setMessage(`Not enough stock for ${item.itemName}. Available: ${product.stock}`);
          setLoading(false);
          return;
        }
      }
      setShowPaymentModal(true);
    } catch (err) {
      setMessage('Error checking stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment completion from modal
  const handlePaymentComplete = async (paymentMethod: string, transactionId?: string) => {
    try {
      setLoading(true);
      // Create transaction
      const transactionData = {
        storeId: selectedStore,
        items: cart,
        paymentMethod,
        customerDetails: Object.keys(customerDetails).length > 0 ? customerDetails : undefined,
        cashier: localStorage.getItem('userId'), // Get from auth context
        transactionId: transactionId || `TXN${Date.now()}`
      };

      const transactionResponse = await salesAPI.createTransaction(transactionData);
      const transaction = transactionResponse.data.transaction;

      // Generate invoice
      const invoiceResponse = await invoiceAPI.generateInvoice({
        transactionId: transaction._id
      });

      // Set invoice data and show invoice in modal
      setInvoiceData(invoiceResponse.data.invoice);
      setShowInvoice(true);

      setMessage(`Transaction completed! Invoice No: ${invoiceResponse.data.invoiceNo}`);
      setCart([]);
      setCustomerDetails({});
      setBarcodeInput('');
      setQuantityInput(1);
      // Focus barcode input after payment
      setTimeout(() => {
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      }, 100);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Refocus barcode input after closing or printing/downloading invoice
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setShowInvoice(false);
    setInvoiceData(null);
    setTimeout(() => {
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }, 100);
  };

  // Filter products by selected category
  useEffect(() => {
    if (!selectedCategory) {
      setProducts(allProducts);
    } else {
      setProducts(allProducts.filter(p => p.categoryId === selectedCategory || p.category === selectedCategory));
    }
  }, [selectedCategory, allProducts]);

  return (
    <div className="pos-container">
      <div className="pos-left">
  {/* Barcode Scanner Input */}
        {/* Product Gallery
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8, fontSize: 15, fontWeight: 600, color: '#333' }}>Product Gallery</h3>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: 8, background: '#fafafa', borderRadius: 8, border: '1px solid #eee' }}>
            {products.map(product => (
              <div key={product.sku} style={{ minWidth: 110, textAlign: 'center', cursor: 'pointer' }} onClick={() => addItemBySKU(product.sku, product)}>
                <img src={product.images?.[0] || product.image || '/no-image.png'} alt={product.itemName} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.itemName}</div>
                <div style={{ fontSize: 12, color: '#888' }}>₹{product.price}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Click a product image to add to cart, or scan barcode above.
          </div>
        </div> */}
        <h2 style={{ marginBottom: '20px', color: '#333' }}>POS INTERFACE</h2>
        
        {/* Barcode Scanner Input */}
        <div style={{ marginBottom: '25px' }}>
          {/* <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            Barcode Scanner
          </label> */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%' }}>
            <input
              type="text"
              ref={barcodeInputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or enter barcode"
              style={{
                flex: 2,
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '0'
              }}
              onKeyPress={(e) => e.key === 'Enter' && addItemByBarcode()}
            />
            <input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
              min="1"
              style={{
                width: '70px',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                textAlign: 'center'
              }}
            />
            <button
              onClick={addItemByBarcode}
              disabled={loading}
              style={{
                padding: '12px 16px',
                background: '#6c3fc5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                minWidth: '70px',
                whiteSpace: 'nowrap'
              }}
            >
              Add
            </button>
          </div>
        </div>
        {/* Product Gallery with Category Filter inline */}
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: 0 }}>Product Gallery</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="category-filter" style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: 6, fontSize: 12, minWidth: 140 }}
              >
                <option value="">All</option>
                {categories.map(cat => (
                  <option key={cat._id || cat.id || cat.value} value={cat._id || cat.id || cat.value}>{cat.name || cat.categoryName || cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Left Arrow */}
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => {
                const gallery = document.getElementById('product-gallery-scroll');
                if (gallery) gallery.scrollBy({ left: -150, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                left: 0,
                zIndex: 2,
                height: 150,
                width: 20,
                background: 'rgba(40,40,40,0.15)',
                border: 'none',
                borderRadius: '8px 0 0 8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 21,
                color: '#222',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 0,
                fontWeight: 700
              }}
            >
              &#8592;
            </button>
            <div
              id="product-gallery-scroll"
              style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: 8, background: '#fafafa', borderRadius: 8, border: '1px solid #eee', width: '100%', scrollBehavior: 'smooth' }}
            >
              {products.map(product => {
                // Calculate price including profit margin
                const priceWithMargin = product.price + (product.price * (profitMarginPercent || 0) / 100);
                return (
                  <div key={product.sku} style={{ minWidth: 110, textAlign: 'center', cursor: 'pointer' }} onClick={() => addItemBySKU(product.sku, product)}>
                    <img src={product.images?.[0] || product.image || '/no-image.png'} alt={product.itemName} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', whiteSpace: 'normal', minHeight: 32 }}>{product.itemName}</div>
                  </div>
                );
              })}
            </div>
            {/* Right Arrow */}
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => {
                const gallery = document.getElementById('product-gallery-scroll');
                if (gallery) gallery.scrollBy({ left: 150, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                right: 0,
                zIndex: 2,
                height: 150,
                width: 20,
                background: 'rgba(40,40,40,0.15)',
                border: 'none',
                borderRadius: '0 8px 8px 0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 21,
                color: '#222',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 0,
                fontWeight: 700
              }}
            >
              &#8594;
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Click a product image to add to cart, or scan barcode above.
          </div>
        </div>


        {/* Store Selection */}
        <div style={{ marginBottom: '48px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            Store
          </label>
          {storeId ? (
            <input
              type="text"
              value={storeName || 'Store'}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f5f5f5',
                color: '#888',
                boxSizing: 'border-box',
                height: '44px',
                minHeight: '44px',
                maxHeight: '44px'
              }}
            />
          ) : (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#fff',
                boxSizing: 'border-box',
                height: '44px',
                minHeight: '44px',
                maxHeight: '44px',
                appearance: 'none',
                MozAppearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="">Select a store</option>
              {stores.map(store => (
                <option key={store._id} value={store._id}>
                  {store.storeName} - {store.storeLocation}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Customer Details + Promo Code */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Customer Details</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 500, fontSize: '14px', color: '#333', marginBottom: '4px', display: 'block' }}>
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Customer Name (optional)"
                value={customerDetails.name || ''}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 500, fontSize: '14px', color: '#333', marginBottom: '4px', display: 'block' }}>
                Phone Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Phone Number"
                value={customerDetails.phone ? customerDetails.phone.replace('+91', '') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setCustomerDetails({ ...customerDetails, phone: raw ? `+91${raw}` : '' });
                }}
                required
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          {/* Show error if required fields are missing, but only after trying to process payment */}
          {showRequiredError && (
            <div style={{ color: 'red', marginTop: '8px', fontSize: '13px', fontWeight: 500 }}>
              Phone Number is required
            </div>
          )}
          {/* Promo Code Apply - below customer details */}
          <div style={{ marginTop: '19px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter promo code"
              value={appliedPromo || ''}
              onChange={e => setAppliedPromo(e.target.value)}
              disabled={!!promoDiscount}
              style={{ flex: 1, padding: '10px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: promoDiscount ? '#f5f5f5' : undefined }}
            />
            {!promoDiscount ? (
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await (await import('axios')).default.post('/api/promo-codes/apply', { code: appliedPromo, orderTotal: subTotal - totalDiscount + totalGST });
                    const discount = Number(res.data.discountAmount);
                    setPromoDiscount(isNaN(discount) ? 0 : discount);
                    setMessage('Promo code applied!');
                  } catch (err) {
                    setPromoDiscount(0);
                    setMessage('Invalid or expired promo code');
                  }
                  setLoading(false);
                }}
                disabled={loading || !appliedPromo}
                style={{ minWidth: '70px', padding: '12px 16px', background: '#6c3fc5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: loading || !appliedPromo ? 'not-allowed' : 'pointer' }}
              >
                Apply
              </button>
            ) : (
              <button
                onClick={() => {
                  setPromoDiscount(0);
                  setAppliedPromo('');
                  setMessage('Promo code removed.');
                }}
                style={{ minWidth: '70px', padding: '12px 16px', background: '#ff5252', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>


        {message && (
          <div style={{
            padding: '10px',
            background: message.includes('error') || message.includes('failed') ? '#ffebee' : '#e8f5e8',
            color: message.includes('error') || message.includes('failed') ? '#c62828' : '#2f8e55ff',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Right Panel - Cart and Checkout */}
      <div className="pos-right">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>SHOPPING CART</h2>
        
        {/* Cart Items */}
        <div style={{ 
          flex: 1,
          minHeight: '278px',
          maxHeight: '378px', 
          overflowY: 'auto',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          {cart.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666' 
            }}>
              Cart is empty. Scan items to add them.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.sku} style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                    {item.itemName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    SKU: {item.sku} | ₹{item.pricePerUnit} each
                  </div>
                  {/* GST per product */}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    GST: {(() => {
                      const product = allProducts.find(p => p.sku === item.sku);
                      const rate = product && typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
                      return `${rate}%`;
                    })()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '25px', textAlign: 'center', fontSize: '14px' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    +
                  </button>
                  <div style={{ 
                    minWidth: '80px', 
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    ₹{item.totalAmount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.sku)}
                    style={{
                      padding: '5px 10px',
                      background: '#ff5252',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div style={{ 
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Subtotal:</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Discount:</span>
            <span>-₹{totalDiscount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>GST:</span>
            <span>₹{totalGST.toFixed(2)}</span>
          </div>
          {promoDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#388e3c' }}>
              <span>Promo Discount:</span>
              <span>-₹{promoDiscount.toFixed(2)}</span>
            </div>
          )}
          <hr style={{ margin: '8px 0' }} />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            <span>Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>



        {/* Checkout Button */}
        <button
          onClick={processPayment}
          disabled={loading || cart.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background: cart.length === 0 ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Process Payment'}
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        totalAmount={grandTotal}
        onPaymentComplete={handlePaymentComplete}
        customerDetails={customerDetails}
        cartItems={cart}
        invoiceData={invoiceData}
        showInvoice={showInvoice}
      />
    </div>
  );
}

export default POSInterface;