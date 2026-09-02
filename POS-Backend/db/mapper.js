/**
 * PostgreSQL -> API Entity Mapper
 * Ensures 100% contract fidelity with existing frontend and controllers.
 * Provides _id alongside id, parses JSONB fields, preserves camelCase conventions.
 */

function mapOrganization(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    organizationId: row.organization_id || row.id,
    organizationName: row.organization_name,
    address: typeof row.address === 'string' ? JSON.parse(row.address) : (row.address || {}),
    contactPersonName: row.contact_person_name || '',
    contactNumber: row.contact_number || '',
    email: row.email || '',
    gstNumber: row.gst_number || '',
    panNumber: row.pan_number || '',
    logo: row.logo || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapStore(row) {
  if (!row) return null;
  const address = typeof row.address === 'string' ? JSON.parse(row.address) : (row.address || {});
  return {
    _id: row.id,
    id: row.id,
    storeId: row.store_id || row.id,
    storeName: row.store_name,
    storeLocation: row.store_location || '',
    storeAddress: address.fullAddress || '',
    address: address,
    contactPersonName: row.contact_person_name || '',
    contactNumber: row.contact_number || '',
    email: row.email || '',
    storePicture: row.store_picture || '',
    status: row.status || 'active',
    organizationId: row.organization_id,
    discountRate: Number(row.discount_rate) || 0,
    profitMarginPercent: Number(row.profit_margin_percent) || 0,
    theme: row.theme || 'light',
    gstRate: Number(row.gst_rate) || 0,
    bankDetails: typeof row.bank_details === 'string' ? JSON.parse(row.bank_details) : (row.bank_details || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCategory(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    categoryId: row.category_id || row.id,
    categoryName: row.category_name,
    categoryDescription: row.description || '',
    status: row.status || 'active',
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProduct(row) {
  if (!row) return null;
  const currentStock = Number(row.current_stock) || 0;
  const minimumStock = Number(row.minimum_stock) || 0;
  const isLowStock = minimumStock > 0 && currentStock <= minimumStock;

  return {
    _id: row.id,
    id: row.id,
    itemId: row.item_id || row.id,
    sku: row.sku,
    itemName: row.product_name,
    productName: row.product_name,
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    organizationId: row.organization_id,
    volumeOfMeasurement: row.volume_of_measurement || '1 piece',
    sourceOfOrigin: row.source_of_origin || '',
    nutritionValue: typeof row.nutrition_value === 'string' ? JSON.parse(row.nutrition_value) : (row.nutrition_value || {}),
    certification: row.certification || '',
    cutType: row.cut_type || '',
    certificationImage: row.certification_image || '',
    price: Number(row.unit_price) || 0,
    unitPrice: Number(row.unit_price) || 0,
    stock: currentStock,
    currentStock: currentStock,
    minimumStock: minimumStock,
    warehouseLocation: row.warehouse_location || 'Main Warehouse',
    lowStock: isLowStock,
    isLowStock: isLowStock,
    barcode: row.barcode || '',
    status: row.status || 'active',
    image: row.image || '',
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
    thumbnail: row.thumbnail || '',
    instructions: row.instructions || '',
    expiry: row.expiry || '',
    gstRate: Number(row.gst_rate) || 0,
    cgstRate: Number(row.cgst_rate) || 0,
    igstRate: Number(row.igst_rate) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id || row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    userType: row.user_type,
    role: row.role,
    organizationId: row.organization_id,
    storeId: row.store_id,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []),
    status: row.status,
    resetPasswordToken: row.reset_password_token,
    resetPasswordExpires: row.reset_password_expires,
    signupToken: row.signup_token,
    signupTokenExpires: row.signup_token_expires,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Strips password hashes, reset tokens, and sensitive credentials from user objects
 */
function sanitizeUser(user) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.password;
  delete safe.resetPasswordToken;
  delete safe.resetPasswordExpires;
  delete safe.signupToken;
  delete safe.signupTokenExpires;
  return safe;
}

function mapStorePrice(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    storeId: row.store_id,
    sku: row.sku,
    basePrice: row.base_price !== null && row.base_price !== undefined ? Number(row.base_price) : null,
    marginType: row.margin_type || 'percent',
    marginValue: Number(row.margin_value) || 0,
    overridePrice: row.override_price !== null && row.override_price !== undefined ? Number(row.override_price) : null,
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPromoCode(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    code: row.code,
    description: row.description || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value) || 0,
    expiryDate: row.expiry_date,
    usageLimit: row.usage_limit,
    usedCount: Number(row.used_count) || 0,
    isActive: row.is_active,
    organization: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSale(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    transactionId: row.transaction_id,
    storeId: row.store_id,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subTotal: Number(row.sub_total) || 0,
    gstTotal: Number(row.gst_total) || 0,
    discountTotal: Number(row.discount_total) || 0,
    grandTotal: Number(row.grand_total) || 0,
    paymentMethod: row.payment_method,
    customerDetails: typeof row.customer_details === 'string' ? JSON.parse(row.customer_details) : (row.customer_details || {}),
    cashier: row.cashier_id,
    dateTime: row.date_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapInvoice(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    invoiceNo: row.invoice_no,
    transactionId: row.transaction_id,
    storeId: row.store_id,
    organizationId: row.organization_id,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    totalAmount: Number(row.total_amount) || 0,
    paymentMode: row.payment_mode,
    qrCodeUrl: row.qr_code_url,
    dateTime: row.date_time,
    customerDetails: typeof row.customer_details === 'string' ? JSON.parse(row.customer_details) : (row.customer_details || {}),
    dueDate: row.due_date,
    status: row.status || 'paid',
    notes: row.notes,
    storeName: row.store_name,
    storeAddress: row.store_address,
    organizationName: row.organization_name,
    gstNumber: row.gst_number,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOrder(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    storeId: row.store_id,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    status: row.status || 'pending',
    adminNote: row.admin_note,
    invoiceId: row.invoice_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapStoreOrderInvoice(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    invoiceNo: row.invoice_no,
    storeId: row.store_id,
    organizationId: row.organization_id,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    totalAmount: Number(row.total_amount) || 0,
    dateTime: row.date_time,
    dueDate: row.due_date,
    status: row.status || 'pending',
    notes: row.notes,
    storeName: row.store_name,
    storeAddress: row.store_address,
    organizationName: row.organization_name,
    gstNumber: row.gst_number,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCustomer(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    mobile: row.mobile || row.phone || '',
    phone: row.phone || row.mobile || '',
    email: row.email || '',
    businessName: row.business_name || '',
    gstNumber: row.gst_number || '',
    type: row.customer_type || 'Retail',
    customerType: row.customer_type || 'Retail',
    address: row.address || '',
    status: row.status || 'Active',
    loyaltyPoints: Number(row.loyalty_points) || 0,
    followUpDate: row.follow_up_date ? (row.follow_up_date instanceof Date ? row.follow_up_date.toISOString().split('T')[0] : String(row.follow_up_date).split('T')[0]) : null,
    notes: row.notes || '',
    organizationId: row.organization_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCustomerFollowup(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    customerId: row.customer_id,
    notes: row.notes || row.note || '',
    note: row.notes || row.note || '',
    followUpDate: row.follow_up_date ? (row.follow_up_date instanceof Date ? row.follow_up_date.toISOString().split('T')[0] : String(row.follow_up_date).split('T')[0]) : null,
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || row.user_name || null,
    createdByEmail: row.created_by_email || row.user_email || null,
    createdAt: row.created_at
  };
}

function mapStockMovement(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    productId: row.product_id,
    productName: row.product_name || null,
    sku: row.sku || null,
    quantityChanged: Number(row.quantity_changed) || 0,
    quantity: Number(row.quantity_changed) || 0,
    movementType: row.movement_type,
    reason: row.reason,
    referenceId: row.reference_id || null,
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || row.user_name || null,
    createdByEmail: row.created_by_email || row.user_email || null,
    organizationId: row.organization_id || null,
    currentStock: row.current_stock !== undefined ? Number(row.current_stock) : undefined,
    createdAt: row.created_at
  };
}

function mapChallanItem(row) {
  if (!row) return null;
  const name = row.product_name_snapshot || row.product_name || null;
  const price = Number(row.unit_price_snapshot !== undefined ? row.unit_price_snapshot : row.unit_price) || 0;
  return {
    _id: row.id,
    id: row.id,
    challanId: row.challan_id,
    productId: row.product_id,
    productName: name,
    productNameSnapshot: name,
    sku: row.sku_snapshot || row.sku || null,
    skuSnapshot: row.sku_snapshot || row.sku || null,
    quantity: Number(row.quantity) || 0,
    unitPrice: price,
    unitPriceSnapshot: price,
    totalAmount: Number(row.total_amount) || 0,
    createdAt: row.created_at
  };
}

function safeParse(val) {
  if (!val) return val;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (_) {
    return val;
  }
}

function mapChallan(row) {
  if (!row) return null;
  const statusUpper = (row.status || 'DRAFT').toUpperCase();
  return {
    _id: row.id,
    id: row.id,
    challanNumber: row.challan_number,
    customerId: row.customer_id,
    customerName: row.customer_name || null,
    customerPhone: row.customer_phone || null,
    customerEmail: row.customer_email || null,
    customerCompany: row.customer_company || null,
    customerAddress: safeParse(row.customer_address),
    organizationId: row.organization_id || null,
    status: statusUpper,
    totalAmount: Number(row.total_amount) || 0,
    notes: row.notes || '',
    items: Array.isArray(row.items) ? row.items.map(mapChallanItem) : [],
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || row.user_name || null,
    createdByEmail: row.created_by_email || row.user_email || null,
    confirmedAt: row.confirmed_at || null,
    cancelledAt: row.cancelled_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  mapOrganization,
  mapStore,
  mapCategory,
  mapProduct,
  mapUser,
  sanitizeUser,
  mapStorePrice,
  mapPromoCode,
  mapSale,
  mapInvoice,
  mapOrder,
  mapStoreOrderInvoice,
  mapCustomer,
  mapCustomerFollowup,
  mapStockMovement,
  mapChallan,
  mapChallanItem
};
