const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const fetch = require("node-fetch");
const Cart = require("../models/cartModel");
const CartProduct = require("../models/cartProductModel");
const ProductItem = require("../models/productItemModel");
const Product = require("../models/productModel");
const UserAddress = require("../models/userAddressModel");
const Address = require("../models/addressModel");
const Customer = require("../models/customerModel");
const Country = require("../models/countryModel");
const Transaction = require("../models/transactionModel");
const Sale = require("../models/saleModel");
const SaleItem = require("../models/saleItemModel");
const Balance = require("../models/balanceModel");

// checkout process has validations before start process and preparation for paymob data required and save the transaction and sale in the database
// and some other process for us
exports.checkout = catchAsync(async (req, res, next) => {
  const defaultAddress = await UserAddress.findOne({
    where: {
      user_id: req.user.id,
      is_default: true,
    },
  });
  if (!defaultAddress) {
    return next(new AppError("Specify your default address to processed", 400));
  }
  const address = await Address.findOne({
    where: { id: defaultAddress.address_id },
  });
  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  // -) check all products in the cart for the same vendor
  const user_id = req.user.id;
  const customer = await Customer.findOne({ where: { user_id } });
  if (!customer) {
    return next(new AppError("You are not a customer", 401));
  }
  const cart = await Cart.findOne({ where: { customer_id: customer.id } });
  const cartProducts = await CartProduct.findAll({
    where: { cart_id: cart.id },
  });
  if (cartProducts.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  const vendors = new Set();
  const items = [];
  let amount = 0.0;
  const currency = "EGP";
  const payment_methods = [process.env.CARD_ID * 1];
  let vendor_id;
  for (let i = 0; i < cartProducts.length; i++) {
    const productItem = await ProductItem.findOne({
      where: {
        id: cartProducts[i].product_item_id,
      },
    });
    const product = await Product.findOne({
      where: { id: productItem.product_id },
    });
    vendors.add(productItem.vendor_id);
    vendor_id = productItem.vendor_id;
    if (cartProducts[i].quantity > productItem.quantity) {
      return next(
        new AppError("You ask for larger quantity than already exist", 400)
      );
    }
    const item = {
      name: product.name,
      amount: productItem.price * 100.0,
      description: product.description,
      quantity: cartProducts[i].quantity,
    };
    items.push(item);
    amount += productItem.price * 100.0 * cartProducts[i].quantity;
  }

  if (vendors.size !== 1) {
    return next(
      new AppError("You can not checkout products from different vendors", 400)
    );
  }
  const { first_name, last_name, email } = req.user;
  const country = await Country.findOne({ where: { id: address.country_id } });
  const billing_data = {
    first_name,
    last_name,
    email,
    country: country.name,
    street: address.street_name,
    phone_number: "+201234567890",
  };
  const data = {
    amount,
    currency,
    payment_methods,
    items,
    customer: {
      first_name,
      last_name,
      email,
      extras: {
        re: "22",
      },
    },
    billing_data,
    extras: {
      ee: null,
    },
  };
  // paymob needs
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Token ${process.env.SECRET_KEY}`);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify(data);
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://accept.paymob.com/v1/intention/",
    requestOptions
  );
  const result = await response.json();
  const client_secret = result.client_secret;
  const url = `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.PUBLIC_KEY}&clientSecret=${client_secret}`;
  const key = result.payment_keys[0].key;
  const frame = `https://accept.paymob.com/api/acceptance/iframes/838725?payment_token=${key}`;

  amount /= 100.0;

  // now we create our needs
  const transaction = await Transaction.create({
    status: "pending",
  });
  const sale = await Sale.create({
    customer_id: customer.id,
    transaction_id: transaction.id,
    total_price: amount * 1.0,
    status: "pending",
    intent_id: result.id,
    vendor_id,
    address_id: address.id,
  });
  for (let i = 0; i < cartProducts.length; i++) {
    const productItem = await ProductItem.findOne({
      where: {
        id: cartProducts[i].product_item_id,
      },
    });
    productItem.quantity -= cartProducts[i].quantity;
    await productItem.save();
    const saleItem = await SaleItem.create({
      sale_id: sale.id,
      product_item_id: productItem.id,
      quantity: cartProducts[i].quantity,
    });
  }
  res.status(200).json({
    status: "success",
    url,
    frame,
  });
});

// callback
exports.checkoutCallback = catchAsync(async (req, res, next) => {
  // take intent_id as string
  const intent_id = req.body.intention.id;
  const success = req.body.transaction.success;
  if (!success || !intent_id) {
    return next(new AppError("Something went wrong", 400));
  }
  const sale = await Sale.findOne({ where: { intent_id } });
  if (!sale) {
    return next(new AppError("Sale not found", 404));
  }
  const transaction = await Transaction.findOne({
    where: { id: sale.transaction_id },
  });
  const saleItems = await SaleItem.findAll({ where: { sale_id: sale.id } });

  if (success === true) {
    transaction.status = "success";
    await transaction.save();
    // empty cart
    const customer = await Customer.findOne({
      where: { id: sale.customer_id },
    });
    const cart = await Cart.findOne({ where: { customer_id: customer.id } });
    const cartProducts = await CartProduct.findAll({
      where: { cart_id: cart.id },
    });
    cartProducts.forEach(async (cartProduct) => {
      await cartProduct.destroy();
    });
    // add balance
    const balance = await Balance.findOne({
      where: { vendor_id: sale.vendor_id },
    });
    balance.pending_credit =
      balance.pending_credit * 1.0 + sale.total_price * 1.0;
    await balance.save();
  } else {
    transaction.status = "cancelled";
    sale.status = "cancelled";
    await transaction.save();
    await sale.save();
    for (let i = 0; i < saleItems.length; i++) {
      const productItem = await ProductItem.findOne({
        where: {
          id: saleItems[i].product_item_id,
        },
      });
      productItem.quantity += saleItems[i].quantity;
      await productItem.save();
    }
  }
  res.status(200).json({
    status: "success",
  });
});
